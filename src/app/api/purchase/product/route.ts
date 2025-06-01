
// src/app/api/purchase/product/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { User, ProductPricingOption, Product, SiteNotificationSettings, Referral } from '@/types';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { notifyAdminOnProductPurchase } from '@/lib/telegram'; 

const SETTINGS_ROW_ID = 1; 

export async function POST(request: NextRequest) {
  try {
    const { userId, productId, productPricingOptionId } = await request.json();

    if (!userId || !productId || !productPricingOptionId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const usersFound = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (usersFound.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const user: User = usersFound[0];
    const currentBalance = typeof user.balance === 'string' ? parseFloat(user.balance) : user.balance;
    const referredByUserId = user.referred_by_user_id;
    const buyerUsername = user.username; 

    const pricingOptionsResults = await query('SELECT * FROM product_pricing_options WHERE id = ? AND product_id = ?', [productPricingOptionId, productId]);
    if (pricingOptionsResults.length === 0) {
      return NextResponse.json({ message: 'Pricing option not found or does not match product' }, { status: 404 });
    }
    const selectedOption: ProductPricingOption = {
      ...pricingOptionsResults[0],
      price_rub: parseFloat(pricingOptionsResults[0].price_rub),
      price_gh: parseFloat(pricingOptionsResults[0].price_gh),
      mode_label: pricingOptionsResults[0].mode_label, // Include mode_label
    };

    if (currentBalance < selectedOption.price_gh) {
      return NextResponse.json({ message: `Недостаточно средств. Требуется ${selectedOption.price_gh.toFixed(2)} GH.`, currentBalance: currentBalance.toFixed(2) }, { status: 402 });
    }
    
    const productsFound = await query('SELECT name, image_url FROM products WHERE id = ?', [productId]);
    if (productsFound.length === 0) {
        return NextResponse.json({ message: 'Product details not found for inventory logging.' }, { status: 404 });
    }
    const productDetails = productsFound[0] as Pick<Product, 'name' | 'image_url'>;
    const productName = productDetails.name;
    const productImageUrl = productDetails.image_url || null;

    const newBalance = currentBalance - selectedOption.price_gh;
    await query('UPDATE users SET balance = ? WHERE id = ?', [newBalance.toFixed(2), userId]);

    const balanceTransactionResult = await query(
      'INSERT INTO balance_transactions (user_id, transaction_type, amount_gh, description) VALUES (?, ?, ?, ?)',
      [userId, 'purchase_product', -selectedOption.price_gh, `Покупка товара: ${productName} (${selectedOption.duration_days} дн.${selectedOption.mode_label ? `, ${selectedOption.mode_label}` : ''})`]
    );
    const balanceTransactionId = balanceTransactionResult.insertId;

    const purchaseResult = await query(
      'INSERT INTO purchases (user_id, product_id, product_pricing_option_id, amount_paid_gh, status, balance_transaction_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, productId, selectedOption.id, selectedOption.price_gh, 'completed', balanceTransactionId]
    );
    const purchaseId = purchaseResult.insertId; 

    let expiresAt: string | null = null;
    if (selectedOption.duration_days) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + selectedOption.duration_days);
      expiresAt = expiryDate.toISOString().slice(0, 19).replace('T', ' ');
    }
    const activationCode = `GH-PROD-${Date.now().toString().slice(-6)}`; 

    await query(
      'INSERT INTO user_inventory (user_id, related_product_id, product_pricing_option_id, product_name, product_image_url, activation_code, expires_at, acquired_at, is_used, purchase_id) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), FALSE, ?)',
      [userId, productId, productPricingOptionId, productName, productImageUrl, activationCode, expiresAt, purchaseId]
    );
    
    let referralTransactionId: number | null = null;
    if (referredByUserId) {
      const referrerResults = await query('SELECT referral_percentage FROM users WHERE id = ?', [referredByUserId]);
      if (referrerResults.length > 0) {
        const referrerReferralPercentage = parseFloat(referrerResults[0].referral_percentage || '5.00'); 
        const rewardAmountGh = selectedOption.price_gh * (referrerReferralPercentage / 100);

        if (rewardAmountGh > 0) {
          await query(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [rewardAmountGh.toFixed(2), referredByUserId]
          );
          const referralBonusTransactionResult = await query(
            'INSERT INTO balance_transactions (user_id, transaction_type, amount_gh, description) VALUES (?, ?, ?, ?)',
            [referredByUserId, 'referral_bonus', rewardAmountGh.toFixed(2), `Бонус за покупку реферала: ${buyerUsername} (${productName})`]
          );
          referralTransactionId = referralBonusTransactionResult.insertId;

          await query(
            'UPDATE referrals SET status = ?, reward_amount_gh = ?, reward_claimed_at = NOW(), reward_description = ?, related_balance_transaction_id = ? WHERE referred_user_id = ? AND referrer_user_id = ? AND status = ?',
            ['completed', rewardAmountGh.toFixed(2), `Покупка: ${productName} (${selectedOption.duration_days} дн.${selectedOption.mode_label ? `, ${selectedOption.mode_label}` : ''})`, referralTransactionId, userId, referredByUserId, 'pending_purchase']
          );
        }
      }
    }
    
    const updatedUserResponse = await query('SELECT * FROM users WHERE id = ?', [userId]);
    const updatedUser = updatedUserResponse[0];
    if(updatedUser) {
        updatedUser.balance = parseFloat(updatedUser.balance);
        updatedUser.referral_percentage = parseFloat(updatedUser.referral_percentage);
    }

    try {
      const notificationSettingsResults = await query('SELECT notify_on_product_purchase FROM site_notification_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
      if (notificationSettingsResults.length > 0 && Boolean(notificationSettingsResults[0].notify_on_product_purchase)) {
        await sendPurchaseConfirmationEmail(user.email, user.username, productName, selectedOption.duration_days, selectedOption.price_gh);
      }
    } catch (emailError) {
      console.error("Failed to send purchase confirmation email:", emailError);
    }

    try {
        await notifyAdminOnProductPurchase(user.id, user.username, productName, selectedOption.duration_days, selectedOption.price_gh);
    } catch (telegramError) {
        console.error("Failed to send Telegram admin notification for product purchase:", telegramError);
    }

    return NextResponse.json({ 
        message: `Покупка "${productName}" (${selectedOption.duration_days} дн.${selectedOption.mode_label ? `, ${selectedOption.mode_label}` : ''}) успешна!`,
        updatedUser 
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Product Purchase Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

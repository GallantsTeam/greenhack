
// src/app/api/promocode/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { User, PromoCode, Product, ProductPricingOption, SiteNotificationSettings } from '@/types';
import { sendBalanceUpdateEmail } from '@/lib/email';
import { notifyAdminOnBalanceDeposit } from '@/lib/telegram'; // Import Telegram notification

const SETTINGS_ROW_ID = 1; // For notification settings

export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json({ message: 'ID пользователя и код промокода обязательны.' }, { status: 400 });
    }

    const usersFound = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (usersFound.length === 0) {
      return NextResponse.json({ message: 'Пользователь не найден.' }, { status: 404 });
    }
    const user: User = usersFound[0];
    user.balance = parseFloat(user.balance as any);

    const promoCodesFound = await query('SELECT * FROM promo_codes WHERE code = ?', [code]);
    if (promoCodesFound.length === 0) {
      return NextResponse.json({ message: 'Промокод не найден или недействителен.' }, { status: 404 });
    }
    const promoCode: PromoCode = {
      ...promoCodesFound[0],
      is_active: Boolean(promoCodesFound[0].is_active),
      value_gh: promoCodesFound[0].value_gh ? parseFloat(promoCodesFound[0].value_gh) : null,
    };

    if (!promoCode.is_active) {
      return NextResponse.json({ message: 'Промокод больше не активен.' }, { status: 400 });
    }
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json({ message: 'Срок действия промокода истек.' }, { status: 400 });
    }
    if (promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json({ message: 'Лимит использований этого промокода исчерпан (глобально).' }, { status: 400 });
    }

    const existingUserUse = await query(
      'SELECT id FROM user_promo_code_uses WHERE user_id = ? AND promo_code_id = ?',
      [userId, promoCode.id]
    );
    if (Array.isArray(existingUserUse) && existingUserUse.length > 0) {
      return NextResponse.json({ message: 'Вы уже активировали данный промокод.' }, { status: 400 });
    }

    let successMessage = '';
    let newBalanceAfterPromo = user.balance;

    if (promoCode.type === 'balance_gh' && promoCode.value_gh) {
      newBalanceAfterPromo = user.balance + promoCode.value_gh;
      await query('UPDATE users SET balance = ? WHERE id = ?', [newBalanceAfterPromo.toFixed(2), userId]);
      
      await query(
        'INSERT INTO balance_transactions (user_id, transaction_type, amount_gh, description) VALUES (?, ?, ?, ?)',
        [userId, 'deposit', promoCode.value_gh, `Активация промокода: ${promoCode.code} (+${promoCode.value_gh} GH)`]
      );
      successMessage = `Промокод "${promoCode.code}" успешно применен! ${promoCode.value_gh} GH зачислено на ваш баланс.`;

      // Send balance update email
      try {
        const notificationSettingsResults = await query('SELECT notify_on_balance_deposit FROM site_notification_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
        if (notificationSettingsResults.length > 0 && Boolean(notificationSettingsResults[0].notify_on_balance_deposit)) {
          await sendBalanceUpdateEmail(user.email, user.username, promoCode.value_gh, `Промокод: ${promoCode.code}`, newBalanceAfterPromo);
        }
      } catch (emailError) {
        console.error("Failed to send balance update email after promo code:", emailError);
      }
      // Send Telegram notification to admin
      try {
        await notifyAdminOnBalanceDeposit(user.id, user.username, promoCode.value_gh);
      } catch (telegramError) {
        console.error("Failed to send Telegram admin notification for balance deposit (promo):", telegramError);
      }


    } else if (promoCode.type === 'product' && promoCode.related_product_id && promoCode.product_pricing_option_id) {
      const productResults = await query('SELECT name, image_url FROM products WHERE id = ?', [promoCode.related_product_id]);
      if (productResults.length === 0) {
        return NextResponse.json({ message: 'Связанный с промокодом товар не найден.' }, { status: 500 });
      }
      const product: Pick<Product, 'name' | 'image_url'> = productResults[0];
      
      const pricingOptionResults = await query('SELECT duration_days, mode_label FROM product_pricing_options WHERE id = ?', [promoCode.product_pricing_option_id]);
      if (pricingOptionResults.length === 0) {
         return NextResponse.json({ message: 'Связанный с промокодом вариант цены не найден.' }, { status: 500 });
      }
      const pricingOption: Pick<ProductPricingOption, 'duration_days' | 'mode_label'> = pricingOptionResults[0];

      let expiresAt: string | null = null;
      if (pricingOption.duration_days) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + pricingOption.duration_days);
        expiresAt = expiryDate.toISOString().slice(0, 19).replace('T', ' ');
      }
      const activationCode = `GH-PROMO-${Date.now().toString().slice(-5)}-${String(promoCode.id || '0').slice(0,4)}`;

      await query(
        'INSERT INTO user_inventory (user_id, related_product_id, product_pricing_option_id, product_name, product_image_url, activation_code, expires_at, acquired_at, is_used) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), FALSE)',
        [userId, promoCode.related_product_id, promoCode.product_pricing_option_id, product.name, product.image_url, activationCode, expiresAt]
      );
      successMessage = `Промокод "${promoCode.code}" успешно применен! Товар "${product.name}" (${pricingOption.duration_days} дн.${pricingOption.mode_label ? `, ${pricingOption.mode_label}` : ''}) добавлен в ваш инвентарь.`;
    } else {
      return NextResponse.json({ message: 'Неверный тип промокода или отсутствуют необходимые данные.' }, { status: 500 });
    }

    await query('UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ?', [promoCode.id]);
    await query(
      'INSERT INTO user_promo_code_uses (user_id, promo_code_id) VALUES (?, ?)',
      [userId, promoCode.id]
    );
    
    const updatedUserResponse = await query('SELECT * FROM users WHERE id = ?', [userId]);
    const updatedUser = updatedUserResponse[0];
     if(updatedUser) {
        updatedUser.balance = parseFloat(updatedUser.balance); 
        updatedUser.referral_percentage = parseFloat(updatedUser.referral_percentage);
    }

    return NextResponse.json({ message: successMessage, updatedUser }, { status: 200 });

  } catch (error: any) {
    console.error('API PromoCode Apply Error:', error);
    let clientErrorMessage = 'Произошла внутренняя ошибка сервера при применении промокода.';
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage?.includes('uq_user_promo_code')) {
        clientErrorMessage = 'Вы уже активировали данный промокод.';
    }
    return NextResponse.json({ message: clientErrorMessage, error: error.message }, { status: 500 });
  }
}


// src/app/api/prize/claim/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Prize, Product, ProductPricingOption } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { userId, caseOpeningId, prize } = await request.json() as { userId: number, caseOpeningId: number, prize: Prize };

    if (!userId || !caseOpeningId || !prize || !prize.id) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the case opening belongs to the user and is still 'pending'
    const openingResults = await query(
      'SELECT * FROM case_openings_history WHERE id = ? AND user_id = ? AND action_taken = ?',
      [caseOpeningId, userId, 'pending']
    );

    if (openingResults.length === 0) {
      return NextResponse.json({ message: 'Invalid or already processed case opening.' }, { status: 400 });
    }
    const openingRecord = openingResults[0];
    if (openingRecord.won_prize_id !== prize.id) {
        return NextResponse.json({ message: 'Prize mismatch with opening record.' }, { status: 400 });
    }

    // 2. Prepare data for user_inventory
    let expiresAt: string | null = null;
    let activationCode: string | null = null;
    let productNameForInventory = prize.name;
    let productImageUrlForInventory = prize.image_url || prize.imageUrl || null;
    let relatedProductIdForInventory = prize.related_product_id || null;
    let productPricingOptionIdForInventory: number | null = null;
    let durationDaysForInventory: number | null = prize.duration_days || null;


    if (prize.prize_type === 'product_duration' && prize.related_product_id) {
      // For product_duration, we will set expires_at to NULL initially.
      // It will be calculated and set upon "activation" from the inventory.
      expiresAt = null;
      activationCode = `GH-CASE-${Date.now().toString().slice(-5)}-${prize.id.slice(0,4)}`; 

      const productDetailsResult = await query('SELECT name, image_url FROM products WHERE id = ?', [prize.related_product_id]);
      if (productDetailsResult.length > 0) {
        productNameForInventory = productDetailsResult[0].name; // Use actual product name
        productImageUrlForInventory = productDetailsResult[0].image_url || productImageUrlForInventory;
      }
      
      // Try to find a matching product_pricing_option_id based on product and duration
      // This is useful if you want to track which specific "version" of the product (e.g., 7-day license) they won
      if (prize.duration_days) {
        const pricingOptionResult = await query(
          'SELECT id FROM product_pricing_options WHERE product_id = ? AND duration_days = ? LIMIT 1', 
          [prize.related_product_id, prize.duration_days]
        );
        if (pricingOptionResult.length > 0) {
          productPricingOptionIdForInventory = pricingOptionResult[0].id;
        }
      }
    } else if (prize.prize_type === 'balance_gh' && prize.balance_gh_amount) {
        // If it's a balance_gh prize, directly add to user's balance and log it
        await query('UPDATE users SET balance = balance + ? WHERE id = ?', [prize.balance_gh_amount, userId]);
        await query(
          'INSERT INTO balance_transactions (user_id, transaction_type, amount_gh, description, related_case_opening_id) VALUES (?, ?, ?, ?, ?)',
          [userId, 'sell_prize', prize.balance_gh_amount, `Выигрыш GH из кейса: ${prize.name}`, caseOpeningId]
        );
        // Update case opening history to 'sold' as GH is instantly credited
        await query(
          'UPDATE case_openings_history SET action_taken = ?, sold_value_gh = ? WHERE id = ?',
          ['sold', prize.balance_gh_amount, caseOpeningId]
        );
        return NextResponse.json({ message: `${prize.balance_gh_amount} GH успешно зачислено на ваш баланс.` }, { status: 200 });
    }


    // Only insert into inventory if it's not an instant balance_gh prize
    if (prize.prize_type !== 'balance_gh') {
        await query(
          'INSERT INTO user_inventory (user_id, case_prize_id, related_product_id, product_pricing_option_id, product_name, product_image_url, activation_code, expires_at, acquired_at, is_used, case_opening_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), FALSE, ?)',
          [userId, prize.id, relatedProductIdForInventory, productPricingOptionIdForInventory, productNameForInventory, productImageUrlForInventory, activationCode, expiresAt, caseOpeningId]
        );
    }

    // 3. Update case_openings_history action_taken to 'kept' only if not balance_gh type
    if (prize.prize_type !== 'balance_gh') {
        await query(
          'UPDATE case_openings_history SET action_taken = ? WHERE id = ?',
          ['kept', caseOpeningId]
        );
    }
    
    return NextResponse.json({ message: `${prize.name} успешно добавлен в ваш инвентарь.` }, { status: 200 });

  } catch (error: any) {
    console.error('API Prize Claim Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

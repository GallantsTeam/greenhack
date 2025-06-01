
// src/app/api/inventory/activate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { InventoryItemWithDetails } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { userId, inventoryItemId } = await request.json();
    console.log('[API Activate] Received request:', { userId, inventoryItemId });

    if (!userId || !inventoryItemId) {
      console.log('[API Activate] Missing userId or inventoryItemId');
      return NextResponse.json({ message: 'Missing userId or inventoryItemId' }, { status: 400 });
    }

    const inventoryItemResults = await query(
      `SELECT 
         ui.*,
         COALESCE(ppo.duration_days, cp.duration_days) as resolved_duration_days,
         ppo.mode_label as pricing_option_mode_label,
         cp.mode_label as case_prize_mode_label -- If case_prizes table also has mode_label
       FROM user_inventory ui
       LEFT JOIN product_pricing_options ppo ON ui.product_pricing_option_id = ppo.id
       LEFT JOIN case_prizes cp ON ui.case_prize_id = cp.id
       WHERE ui.id = ? AND ui.user_id = ?`,
      [inventoryItemId, userId]
    );

    if (inventoryItemResults.length === 0) {
      console.log(`[API Activate] Item not found for user ${userId}, item ID ${inventoryItemId}`);
      return NextResponse.json({ message: 'Предмет не найден в инвентаре или не принадлежит вам.' }, { status: 404 });
    }
    
    const itemToActivateDb = inventoryItemResults[0];
    console.log('[API Activate] Found item in DB:', itemToActivateDb);

    const itemToActivate: InventoryItemWithDetails = {
        ...itemToActivateDb,
        is_used: Boolean(itemToActivateDb.is_used),
        duration_days: itemToActivateDb.resolved_duration_days ? parseInt(itemToActivateDb.resolved_duration_days, 10) : null,
        mode_label: itemToActivateDb.pricing_option_mode_label || itemToActivateDb.case_prize_mode_label || null,
        activation_status: itemToActivateDb.activation_status || 'available',
    };


    if (itemToActivate.is_used) {
      console.log(`[API Activate] Item ${inventoryItemId} already used.`);
      return NextResponse.json({ message: 'Этот предмет уже был активирован.' }, { status: 400 });
    }

    if (!itemToActivate.related_product_id && itemToActivate.case_prize_id) {
        console.log(`[API Activate] Item ${inventoryItemId} is a non-product prize (e.g., balance), marking as used.`);
        await query(
            'UPDATE user_inventory SET is_used = TRUE, activated_at = NOW() WHERE id = ?',
            [inventoryItemId]
        );
        return NextResponse.json({ message: `${itemToActivate.product_name} помечен как использованный.` }, { status: 200 });
    }
    
    if (!itemToActivate.related_product_id) {
      console.log(`[API Activate] Item ${inventoryItemId} has no related_product_id and is not a direct case_prize_id activation. Cannot determine license type.`);
      return NextResponse.json({ message: 'Невозможно активировать этот тип предмета как лицензию (отсутствует ID продукта).' }, { status: 400 });
    }


    let expiresAt: string | null = null;
    const activatedAt = new Date(); 

    console.log(`[API Activate] Item duration_days: ${itemToActivate.duration_days}`);

    if (itemToActivate.duration_days && itemToActivate.duration_days > 0) {
      const expiryDate = new Date(activatedAt);
      expiryDate.setDate(expiryDate.getDate() + itemToActivate.duration_days);
      expiresAt = expiryDate.toISOString().slice(0, 19).replace('T', ' '); 
      console.log(`[API Activate] Calculated expiresAt: ${expiresAt}`);
    } else {
      console.log(`[API Activate] No duration or duration is 0, expiresAt will be NULL (permanent).`);
    }

    await query(
      'UPDATE user_inventory SET is_used = TRUE, activated_at = ?, expires_at = ? WHERE id = ?',
      [activatedAt.toISOString().slice(0, 19).replace('T', ' '), expiresAt, inventoryItemId]
    );
    console.log(`[API Activate] Item ${inventoryItemId} updated successfully.`);

    return NextResponse.json({ message: `${itemToActivate.product_name} успешно активирован!` }, { status: 200 });

  } catch (error: any) {
    console.error('[API Inventory Activate Error]:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

    


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
         p.name as product_name_from_product_table, 
         p.activation_type, -- Get activation_type from products table
         COALESCE(ppo.duration_days, cp.duration_days) as resolved_duration_days,
         ppo.mode_label as pricing_option_mode_label
       FROM user_inventory ui
       LEFT JOIN products p ON ui.related_product_id = p.id
       LEFT JOIN product_pricing_options ppo ON ui.product_pricing_option_id = ppo.id
       LEFT JOIN case_prizes cp ON ui.case_prize_id = cp.id
       WHERE ui.id = ? AND ui.user_id = ?`,
      [inventoryItemId, userId]
    );

    if (inventoryItemResults.length === 0) {
      console.log(`[API Activate] Item not found for user ${userId}, item ID ${inventoryItemId}`);
      return NextResponse.json({ message: 'Предмет не найден в инвентаре или не принадлежит вам.' }, { status: 404 });
    }
    
    const dbItem = inventoryItemResults[0];
    console.log('[API Activate] Found item in DB:', dbItem);

    const itemToActivate: InventoryItemWithDetails & { activation_type?: 'key_request' | 'info_modal' | 'direct_key' } = {
        ...dbItem,
        product_name: dbItem.product_name || dbItem.product_name_from_product_table || 'Неизвестный продукт',
        is_used: Boolean(dbItem.is_used),
        duration_days: dbItem.resolved_duration_days ? parseInt(dbItem.resolved_duration_days, 10) : null,
        mode_label: dbItem.pricing_option_mode_label || null,
        activation_status: dbItem.activation_status || 'available',
        activation_type: dbItem.activation_type || 'info_modal', // Default to info_modal if not set
    };

    if (itemToActivate.is_used) {
      console.log(`[API Activate] Item ${inventoryItemId} already used.`);
      return NextResponse.json({ message: 'Этот предмет уже был активирован.' }, { status: 400 });
    }

    if (itemToActivate.activation_type === 'key_request') {
        // For key_request, activation means the admin has approved it.
        // This specific endpoint might not be directly called for 'key_request' items if activation is solely admin-driven.
        // However, if a user tries to "activate" it again from inventory after it's pending or rejected:
        if (itemToActivate.activation_status === 'pending_admin_approval') {
            return NextResponse.json({ message: 'Активация этого ключа уже запрошена и ожидает одобрения администратором.' }, { status: 400 });
        }
        if (itemToActivate.activation_status === 'rejected') {
             return NextResponse.json({ message: 'Ваш предыдущий запрос на активацию этого ключа был отклонен. Пожалуйста, свяжитесь с поддержкой.' }, { status: 400 });
        }
        // If somehow 'available' and 'key_request', it means it hasn't gone through the request modal flow.
        // This endpoint should primarily handle 'info_modal' or direct 'balance_gh' type activations.
        // For 'key_request', the user should be prompted to use the "Как активировать?" flow.
        return NextResponse.json({ message: 'Для этого товара требуется запрос на активацию ключа через специальное окно. Используйте кнопку "Как активировать?".' }, { status: 400 });
    }
    
    // For 'info_modal' or balance prizes, proceed with marking as used.
    if (!itemToActivate.related_product_id && itemToActivate.case_prize_id) {
        // This handles non-product prizes like balance that are "activated" by claiming.
        console.log(`[API Activate] Item ${inventoryItemId} is a non-product prize (e.g., balance), marking as used.`);
        await query(
            'UPDATE user_inventory SET is_used = TRUE, activated_at = NOW(), activation_status = ? WHERE id = ?',
            ['active', inventoryItemId]
        );
        return NextResponse.json({ message: `${itemToActivate.product_name} помечен как использованный.` }, { status: 200 });
    }
    
    // This handles 'info_modal' or potentially 'direct_key' (if implemented) product activations
    if (!itemToActivate.related_product_id) {
      console.log(`[API Activate] Item ${inventoryItemId} has no related_product_id. Cannot determine license type for non-key_request items.`);
      return NextResponse.json({ message: 'Невозможно активировать этот тип предмета как лицензию (отсутствует ID продукта).' }, { status: 400 });
    }

    let expiresAt: string | null = null;
    const activatedAt = new Date(); 

    console.log(`[API Activate] Item duration_days for product ID ${itemToActivate.related_product_id}: ${itemToActivate.duration_days}`);

    if (itemToActivate.duration_days && itemToActivate.duration_days > 0) {
      const expiryDate = new Date(activatedAt);
      expiryDate.setDate(expiryDate.getDate() + itemToActivate.duration_days);
      expiresAt = expiryDate.toISOString().slice(0, 19).replace('T', ' '); 
      console.log(`[API Activate] Calculated expiresAt: ${expiresAt}`);
    } else {
      console.log(`[API Activate] No duration or duration is 0, expiresAt will be NULL (permanent).`);
    }

    await query(
      'UPDATE user_inventory SET is_used = TRUE, activated_at = ?, expires_at = ?, activation_status = ? WHERE id = ?',
      [activatedAt.toISOString().slice(0, 19).replace('T', ' '), expiresAt, 'active', inventoryItemId]
    );
    console.log(`[API Activate] Item ${inventoryItemId} updated successfully (status: active).`);

    return NextResponse.json({ message: `${itemToActivate.product_name} успешно активирован!` }, { status: 200 });

  } catch (error: any) {
    console.error('[API Inventory Activate Error]:', error);
    if (error.code && error.sqlMessage) {
        return NextResponse.json({ message: `Ошибка базы данных: ${error.sqlMessage} (Код: ${error.code})` }, { status: 500 });
    }
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

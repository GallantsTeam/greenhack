
// src/app/api/license/request-activation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { InventoryItemWithDetails, User } from '@/types';
import { sendKeyActivationRequestToAdmin } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const { inventoryItemId, userId, enteredKey } = await request.json();
    console.log('[API RequestActivation] Received:', { inventoryItemId, userId, enteredKey });

    if (!inventoryItemId || !userId || !enteredKey) {
      return NextResponse.json({ message: 'Не все поля заполнены (ID предмета, ID пользователя, ключ).' }, { status: 400 });
    }

    const inventoryItemResults = await query(
      `SELECT 
         ui.*,
         p.name as product_name_from_product_table,
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
      return NextResponse.json({ message: 'Предмет не найден в вашем инвентаре.' }, { status: 404 });
    }
    const dbItem = inventoryItemResults[0];
     const inventoryItem: InventoryItemWithDetails = {
      ...dbItem,
      product_name: dbItem.product_name || dbItem.product_name_from_product_table || 'Неизвестный продукт',
      is_used: Boolean(dbItem.is_used),
      duration_days: dbItem.resolved_duration_days ? parseInt(dbItem.resolved_duration_days, 10) : null,
      mode_label: dbItem.pricing_option_mode_label || null,
      activation_status: dbItem.activation_status || 'available',
    };

    if (inventoryItem.activation_status !== 'available' && inventoryItem.activation_status !== 'rejected') {
      return NextResponse.json({ message: `Этот предмет уже ${inventoryItem.activation_status === 'pending_admin_approval' ? 'ожидает одобрения' : 'активирован или истек'}.` }, { status: 400 });
    }
    
    if (inventoryItem.activation_status === 'rejected') {
      console.log(`[API RequestActivation] Re-requesting activation for previously rejected item ID: ${inventoryItemId}. New key: ${enteredKey}`);
    }
    
    const userResults = await query('SELECT id, username FROM users WHERE id = ?', [userId]);
     if (userResults.length === 0) {
      return NextResponse.json({ message: 'Пользователь не найден.' }, { status: 404 });
    }
    const user: Pick<User, 'id' | 'username'> = userResults[0];

    await query(
      'UPDATE user_inventory SET activation_code = ?, activation_status = ? WHERE id = ?',
      [enteredKey, 'pending_admin_approval', inventoryItemId]
    );
    console.log(`[API RequestActivation] Inventory item ${inventoryItemId} status updated to pending_admin_approval with key ${enteredKey}`);

    const notificationItemDetails: InventoryItemWithDetails = {
        ...inventoryItem,
        activation_code: enteredKey,
    };
    
    const telegramResult = await sendKeyActivationRequestToAdmin(notificationItemDetails, user);

    if (!telegramResult.success) {
        console.error("[API RequestActivation] Failed to send Telegram notification to admin for key activation:", telegramResult.error);
        return NextResponse.json({ 
            message: 'Запрос на активацию отправлен! Если активация не произойдет в течение 10-15 минут, пожалуйста, свяжитесь с поддержкой.',
            status: 'pending_with_notification_issue' // Custom status for frontend to interpret
        }, { status: 200 }); // Return 200 OK as the request itself was processed
    }

    console.log('[API RequestActivation] Key activation request sent to admin.');
    return NextResponse.json({ message: 'Запрос на активацию ключа отправлен администратору. Ожидайте подтверждения.' });

  } catch (error: any) {
    console.error('[API RequestActivation] Error:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}
    
    
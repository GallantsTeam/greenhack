
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

    // 1. Fetch inventory item to ensure it exists and belongs to the user
    const inventoryItemResults = await query(
      `SELECT 
         ui.*,
         p.name as product_name_from_product_table, 
         p.retrieval_modal_intro_text, 
         p.retrieval_modal_antivirus_text, 
         p.retrieval_modal_antivirus_link_text,
         p.retrieval_modal_antivirus_link_url,
         p.retrieval_modal_launcher_text,
         p.retrieval_modal_launcher_link_text,
         p.retrieval_modal_launcher_link_url,
         p.retrieval_modal_key_paste_text,
         p.retrieval_modal_support_text,
         p.retrieval_modal_support_link_text,
         p.retrieval_modal_support_link_url,
         COALESCE(ppo.duration_days, cp.duration_days) as resolved_duration_days
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
      product_name: dbItem.product_name || dbItem.product_name_from_product_table, // Use product_name from inventory, fallback to product table
      is_used: Boolean(dbItem.is_used),
      duration_days: dbItem.resolved_duration_days ? parseInt(dbItem.resolved_duration_days, 10) : null,
      activation_status: dbItem.activation_status || 'available',
    };


    if (inventoryItem.activation_status !== 'available' && inventoryItem.activation_status !== 'rejected') {
      return NextResponse.json({ message: `Этот предмет уже ${inventoryItem.activation_status === 'pending_admin_approval' ? 'ожидает одобрения' : 'активирован или истек'}.` }, { status: 400 });
    }
    
    // 2. Fetch user details (username)
    const userResults = await query('SELECT id, username FROM users WHERE id = ?', [userId]);
     if (userResults.length === 0) {
      return NextResponse.json({ message: 'Пользователь не найден.' }, { status: 404 });
    }
    const user: Pick<User, 'id' | 'username'> = userResults[0];

    // 3. Update inventory item status and store the key
    await query(
      'UPDATE user_inventory SET activation_code = ?, activation_status = ?, updated_at = NOW() WHERE id = ?',
      [enteredKey, 'pending_admin_approval', inventoryItemId]
    );
    console.log(`[API RequestActivation] Inventory item ${inventoryItemId} status updated to pending_admin_approval with key ${enteredKey}`);

    // 4. Send notification to admin via Key Bot
    const notificationItemDetails: InventoryItemWithDetails = {
        ...inventoryItem, // Use the already constructed inventoryItem which has product_name and duration_days
        activation_code: enteredKey, // Ensure the entered key is part of the notification
    };
    
    const telegramResult = await sendKeyActivationRequestToAdmin(notificationItemDetails, user);

    if (!telegramResult.success) {
        console.error("[API RequestActivation] Failed to send Telegram notification to admin for key activation:", telegramResult.error);
        // Potentially revert the status update or log this failure more critically
        // For now, we'll proceed and inform the user, but admin might not get notified.
        return NextResponse.json({ 
            message: 'Запрос на активацию отправлен, но произошла ошибка при уведомлении администратора. Пожалуйста, свяжитесь с поддержкой, если активация не произойдет в ближайшее время.',
            warning: telegramResult.message 
        }, { status: 207 }); // 207 Multi-Status
    }

    console.log('[API RequestActivation] Key activation request sent to admin.');
    return NextResponse.json({ message: 'Запрос на активацию ключа отправлен администратору. Ожидайте подтверждения.' });

  } catch (error: any) {
    console.error('[API RequestActivation] Error:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}

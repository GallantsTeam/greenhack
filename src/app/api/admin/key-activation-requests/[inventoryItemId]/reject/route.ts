
// src/app/api/admin/key-activation-requests/[inventoryItemId]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { OkPacket } from 'mysql2';
import type { InventoryItemWithDetails } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { inventoryItemId: string } }
) {
  // TODO: Add admin authentication check
  const inventoryItemId = parseInt(params.inventoryItemId, 10);
  if (isNaN(inventoryItemId)) {
    return NextResponse.json({ message: 'Invalid inventory item ID' }, { status: 400 });
  }

  try {
    const { rejection_reason } = await request.json().catch(() => ({ rejection_reason: 'Отклонено администратором без указания причины.' }));

    // First, fetch the inventory item details to get user_id and product_name
    const itemResults = await query(
      `SELECT ui.user_id, p.name as product_name 
       FROM user_inventory ui 
       LEFT JOIN products p ON ui.related_product_id = p.id
       WHERE ui.id = ?`,
      [inventoryItemId]
    );

    if (!itemResults || itemResults.length === 0) {
      return NextResponse.json({ message: 'Предмет инвентаря не найден.' }, { status: 404 });
    }
    const itemDetails: { user_id: number; product_name: string | null } = itemResults[0];
    const userIdToNotify = itemDetails.user_id;
    const productName = itemDetails.product_name || 'Неизвестный товар';


    const result = await query(
      'UPDATE user_inventory SET activation_status = ?, activation_status_reason = ?, updated_at = NOW() WHERE id = ? AND activation_status = ?',
      ['rejected', rejection_reason, inventoryItemId, 'pending_admin_approval']
    ) as OkPacket;

    if (result.affectedRows > 0) {
      // Create a notification for the user
      const notificationMessage = `Ваш запрос на активацию ключа для "${productName}" был отклонен. Причина: ${rejection_reason || 'не указана'}. Пожалуйста, проверьте ключ или обратитесь в поддержку.`;
      await query(
        'INSERT INTO user_notifications (user_id, message, link_url) VALUES (?, ?, ?)',
        [userIdToNotify, notificationMessage, '/account/inventory']
      );
      
      return NextResponse.json({ message: 'Запрос на активацию ключа успешно отклонен и пользователь уведомлен.' });
    } else {
      // Check current status if no rows affected
      const currentStatusResult = await query('SELECT activation_status FROM user_inventory WHERE id = ?', [inventoryItemId]);
      let currentStatus = 'unknown';
      if (currentStatusResult.length > 0) {
        currentStatus = currentStatusResult[0].activation_status;
      }
      if (currentStatus === 'rejected') {
        return NextResponse.json({ message: 'Запрос уже был отклонен ранее.' }, { status: 200 });
      }
      return NextResponse.json({ message: 'Запрос не найден в статусе ожидания или уже обработан.', current_status: currentStatus }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Reject Key Activation (ID: ${inventoryItemId}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

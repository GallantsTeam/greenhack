
// src/app/api/admin/key-activation-requests/[inventoryItemId]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { OkPacket } from 'mysql2';
import type { InventoryItemWithDetails, User, SiteTelegramSettings, SiteNotificationSettings } from '@/types';
import { sendTelegramMessage, getTelegramSettingsFromDb } from '@/lib/telegram';
// import { sendEmail } from '@/lib/email'; // Placeholder for email notification

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
    const itemDetailsResults = await query(
      `SELECT 
         ui.*, 
         p.name as product_name_from_product_table,
         COALESCE(ppo.duration_days, cp.duration_days) as resolved_duration_days,
         ppo.mode_label as pricing_option_mode_label,
         u.id as user_db_id, u.username as user_db_username, u.email as user_email, u.telegram_id as user_telegram_id
       FROM user_inventory ui
       LEFT JOIN products p ON ui.related_product_id = p.id
       LEFT JOIN product_pricing_options ppo ON ui.product_pricing_option_id = ppo.id
       LEFT JOIN case_prizes cp ON ui.case_prize_id = cp.id
       LEFT JOIN users u ON ui.user_id = u.id
       WHERE ui.id = ?`,
      [inventoryItemId]
    );

    if (itemDetailsResults.length === 0) {
      return NextResponse.json({ message: 'Предмет инвентаря не найден.' }, { status: 404 });
    }
    const item: InventoryItemWithDetails & { user_db_id: number, user_db_username: string, user_email?: string, user_telegram_id?: string, product_name_from_product_table?: string, pricing_option_mode_label?: string | null } = itemDetailsResults[0];
    item.product_name = item.product_name || item.product_name_from_product_table || 'Неизвестный продукт';
    item.duration_days = item.resolved_duration_days ? parseInt(item.resolved_duration_days as any, 10) : null;
    item.mode_label = item.pricing_option_mode_label || null;

    const activatedAt = new Date();
    let expiresAt: string | null = null;

    if (item.duration_days && item.duration_days > 0) {
      const expiryDate = new Date(activatedAt);
      expiryDate.setDate(expiryDate.getDate() + item.duration_days);
      expiresAt = expiryDate.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    console.log(`Approving item ${inventoryItemId}. Duration: ${item.duration_days}, Calculated Expires At: ${expiresAt}`);

    const result = await query(
      'UPDATE user_inventory SET activation_status = ?, is_used = TRUE, activated_at = ?, expires_at = ?, updated_at = NOW() WHERE id = ? AND activation_status = ?',
      ['active', activatedAt.toISOString().slice(0, 19).replace('T', ' '), expiresAt, inventoryItemId, 'pending_admin_approval']
    ) as OkPacket;

    if (result.affectedRows > 0) {
      const { telegramSettings, siteNotificationSettings } = await getTelegramSettingsFromDb();
      const clientBotToken = telegramSettings?.client_bot_token;

      const userMessage = `Уважаемый пользователь, ваш ключ для "${item.product_name}"${item.duration_days ? ` на ${item.duration_days} дн.` : ''}${item.mode_label ? ` [${item.mode_label}]` : ''} был успешно активирован! Если вы не знаете как запустить софт, воспользуйтесь кнопкой "Как запускать?" в личном кабинете или напишите в техническую поддержку. Приятной игры!`;
      
      if (item.user_telegram_id && clientBotToken) {
        console.log(`[ApproveKeyActivation] Sending Telegram notification to user ${item.user_telegram_id}...`);
        await sendTelegramMessage(clientBotToken, item.user_telegram_id, userMessage, 'HTML');
      } else {
        console.log(`[ApproveKeyActivation] User ${item.user_telegram_id} Telegram ID or Client Bot Token not available. Skipping Telegram notification.`);
      }

      await query(
        'INSERT INTO user_notifications (user_id, message, link_url) VALUES (?, ?, ?)',
        [item.user_db_id, userMessage, '/account/inventory']
      );
      console.log(`[ApproveKeyActivation] Added notification to user_notifications for user ${item.user_db_id}.`);
      
      // if (siteNotificationSettings?.notify_on_software_activation && item.user_email) {
      //   await sendEmail({
      //     to: item.user_email,
      //     subject: `Ваш ключ для ${item.product_name} активирован!`,
      //     text: userMessage,
      //     html: `<p>${userMessage.replace(/\n/g, "<br>")}</p>`
      //   });
      // }
      
      return NextResponse.json({ message: 'Запрос на активацию ключа успешно одобрен. Пользователь уведомлен.' });
    } else {
      const currentStatusResult = await query('SELECT activation_status FROM user_inventory WHERE id = ?', [inventoryItemId]);
      let currentStatus = 'unknown';
      if (currentStatusResult.length > 0) {
        currentStatus = currentStatusResult[0].activation_status;
      }
      if (currentStatus === 'active') {
        return NextResponse.json({ message: 'Запрос уже был одобрен ранее.' }, { status: 200 });
      }
      return NextResponse.json({ message: 'Запрос не найден в статусе ожидания или уже обработан.', current_status: currentStatus }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Approve Key Activation (ID: ${inventoryItemId}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    
    
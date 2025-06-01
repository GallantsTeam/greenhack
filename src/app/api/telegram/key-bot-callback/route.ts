
// src/app/api/telegram/key-bot-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { InventoryItemWithDetails, User, SiteTelegramSettings, SiteNotificationSettings } from '@/types';
import { sendTelegramMessage } from '@/lib/telegram'; 
import { sendEmail } from '@/lib/email'; // Assuming you might want to email user on activation/rejection

const SETTINGS_ROW_ID = 1; // For site_telegram_settings and site_notification_settings

async function getClientBotToken(): Promise<string | null> {
  try {
    const results = await query('SELECT client_bot_token FROM site_telegram_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    if (results.length > 0 && results[0].client_bot_token) {
      return results[0].client_bot_token;
    }
    return null;
  } catch (error) {
    console.error("[KeyBot Callback] Error fetching client bot token:", error);
    return null;
  }
}

async function getNotificationSettings(): Promise<SiteNotificationSettings | null> {
  try {
    const results = await query('SELECT notify_on_software_activation FROM site_notification_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    if (results.length > 0) {
      return {
        ...results[0], // spread other settings if they exist in the type, or just this one
        notify_on_software_activation: Boolean(results[0].notify_on_software_activation)
      };
    }
    return null;
  } catch (error) {
    console.error("[KeyBot Callback] Error fetching notification settings:", error);
    return null;
  }
}


export async function POST(request: NextRequest) {
  // IMPORTANT: In a real-world scenario, you MUST verify that this request comes from Telegram.
  // This can be done by checking a secret token in the URL, or by verifying the IP address
  // from which the request originated against Telegram's known IP ranges.
  // For simplicity, this example omits that security step.

  try {
    const body = await request.json();
    console.log('[API KeyBot Callback] Received callback data:', body);

    const callbackQuery = body.callback_query;
    if (!callbackQuery || !callbackQuery.data || !callbackQuery.message || !callbackQuery.message.chat || !callbackQuery.from) {
      console.error('[API KeyBot Callback] Invalid callback_query structure');
      return NextResponse.json({ message: 'Invalid callback query structure.' }, { status: 200 }); // Acknowledge Telegram
    }

    const adminWhoClickedId = callbackQuery.from.id;
    const adminWhoClickedUsername = callbackQuery.from.username || callbackQuery.from.first_name || 'Администратор';

    const [action, inventoryItemIdStr] = callbackQuery.data.split(':');
    const inventoryItemId = parseInt(inventoryItemIdStr, 10);
    const adminChatId = callbackQuery.message.chat.id; 
    const keyBotToken = process.env.TELEGRAM_KEY_BOT_TOKEN; // Use the key bot token from env

    if (!keyBotToken) {
        console.error('[API KeyBot Callback] TELEGRAM_KEY_BOT_TOKEN is not set in environment variables.');
        // Do not try to respond to Telegram if token is missing, as it will fail.
        return NextResponse.json({ message: 'Server configuration error for key bot.' }, { status: 200 });
    }

    if (isNaN(inventoryItemId) || (action !== 'activate_key' && action !== 'reject_key')) {
      console.error(`[API KeyBot Callback] Invalid action or inventoryItemId: ${callbackQuery.data}`);
       await sendTelegramMessage(keyBotToken, adminChatId.toString(), "Ошибка: Неверные данные в callback.", 'MarkdownV2');
      return NextResponse.json({ message: 'Invalid action or item ID.' }, { status: 200 });
    }

    const inventoryItemResults = await query(
      `SELECT 
         ui.*, 
         p.name as product_name_from_product, 
         COALESCE(ppo.duration_days, cp.duration_days) as resolved_duration_days,
         u.id as user_db_id, u.username as user_db_username, u.email as user_email, u.telegram_id as user_telegram_id
       FROM user_inventory ui
       LEFT JOIN products p ON ui.related_product_id = p.id
       LEFT JOIN product_pricing_options ppo ON ui.product_pricing_option_id = ppo.id
       LEFT JOIN case_prizes cp ON ui.case_prize_id = cp.id
       LEFT JOIN users u ON ui.user_id = u.id
       WHERE ui.id = ?`, [inventoryItemId]);

    if (inventoryItemResults.length === 0) {
      console.error(`[API KeyBot Callback] Inventory item ${inventoryItemId} not found.`);
      await sendTelegramMessage(keyBotToken, adminChatId.toString(), `Ошибка: Предмет инвентаря с ID ${inventoryItemId} не найден.`, 'MarkdownV2');
      return NextResponse.json({ message: 'Inventory item not found.' }, { status: 200 });
    }
    const item: InventoryItemWithDetails & { user_db_id: number, user_db_username: string, user_email?: string, user_telegram_id?: string, product_name_from_product?: string } = inventoryItemResults[0];
    item.product_name = item.product_name || item.product_name_from_product || 'Неизвестный продукт';
    item.duration_days = item.resolved_duration_days ? parseInt(item.resolved_duration_days as any, 10) : null;


    let newStatus: InventoryItemWithDetails['activation_status'] = item.activation_status;
    let userMessage = '';
    let adminResponseMessage = '';

    if (item.activation_status !== 'pending_admin_approval') {
        adminResponseMessage = `Заявка для предмета \`${escapeTelegramMarkdownV2(item.product_name)}\` \\(ID: ${inventoryItemId}\\) уже была обработана админом @${escapeTelegramMarkdownV2(callbackQuery.from.username || callbackQuery.from.first_name)}\\. Статус: \`${item.activation_status}\``;
    } else if (action === 'activate_key') {
        newStatus = 'active';
        let expiresAt: string | null = null;
        const activatedAt = new Date();
        if (item.duration_days && item.duration_days > 0) {
            const expiryDate = new Date(activatedAt);
            expiryDate.setDate(expiryDate.getDate() + item.duration_days);
            expiresAt = expiryDate.toISOString().slice(0, 19).replace('T', ' ');
        }
        await query(
            'UPDATE user_inventory SET activation_status = ?, is_used = TRUE, activated_at = ?, expires_at = ?, updated_at = NOW() WHERE id = ?',
            [newStatus, activatedAt.toISOString().slice(0, 19).replace('T', ' '), expiresAt, inventoryItemId]
        );
        userMessage = `✅ Ваш ключ для "${item.product_name}"${item.duration_days ? ` на ${item.duration_days} дн.` : ''} успешно активирован!`;
        if (expiresAt) userMessage += `\nИстекает: ${new Date(expiresAt).toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})}`;
        adminResponseMessage = `✅ Ключ для \`${escapeTelegramMarkdownV2(item.product_name)}\` \\(Инв\\. ID: ${inventoryItemId}\\) активирован админом @${escapeTelegramMarkdownV2(adminWhoClickedUsername)}\\.`;
    } else if (action === 'reject_key') {
        newStatus = 'rejected';
        await query(
            'UPDATE user_inventory SET activation_status = ?, updated_at = NOW() WHERE id = ?',
            [newStatus, inventoryItemId]
        );
        userMessage = `❌ Ваш запрос на активацию ключа для "${item.product_name}" был отклонен. Пожалуйста, проверьте ключ или обратитесь в поддержку.`;
        adminResponseMessage = `❌ Запрос на активацию ключа для \`${escapeTelegramMarkdownV2(item.product_name)}\` \\(Инв\\. ID: ${inventoryItemId}\\) отклонен админом @${escapeTelegramMarkdownV2(adminWhoClickedUsername)}\\.`;
    }
    
    // Edit the original message in admin chat to show it's processed
    const originalMessageText = callbackQuery.message.text; // Get the original message text
    const processedMessageText = `${originalMessageText}\n\n---\n*${adminResponseMessage}*`;
    
    await fetch(`https://api.telegram.org/bot${keyBotToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            text: processedMessageText,
            parse_mode: 'MarkdownV2',
            reply_markup: { inline_keyboard: [] } 
        })
    });
    
    // Notify user via Client Bot if configured and user has telegram_id
    if (userMessage && item.user_telegram_id) {
        const clientBotSettingsResult = await getTelegramSettings(); 
        const clientBotToken = clientBotSettingsResult?.telegramSettings?.client_bot_token;
        if (clientBotToken) {
            await sendTelegramMessage(clientBotToken, item.user_telegram_id, userMessage, 'MarkdownV2');
        } else {
            console.warn(`[API KeyBot Callback] Client Bot token not configured. Cannot send notification to user ${item.user_id}.`);
        }
    } else if (userMessage && !item.user_telegram_id && item.user_email) {
        console.log(`[API KeyBot Callback] User ${item.user_id} does not have a Telegram ID. Activation status: ${newStatus}. Attempting email notification.`);
        // Optionally send email
        // const notificationSettings = await getNotificationSettings();
        // if (notificationSettings?.notify_on_software_activation) { // Or a more specific setting
        //     await sendEmail({
        //         to: item.user_email,
        //         subject: `Статус активации ключа: ${item.product_name}`,
        //         text: userMessage,
        //         html: `<p>${userMessage.replace(/\n/g, '<br>')}</p>`
        //     });
        // }
    }

    return NextResponse.json({ message: 'Callback processed.' }, { status: 200 });

  } catch (error: any) {
    console.error('[API KeyBot Callback] Error:', error);
    return NextResponse.json({ message: 'Error processing callback.' }, { status: 200 }); // Always return 200 to Telegram
  }
}

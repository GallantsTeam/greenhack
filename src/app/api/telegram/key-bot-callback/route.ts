
// src/app/api/telegram/key-bot-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { InventoryItemWithDetails, User, SiteTelegramSettings, SiteNotificationSettings } from '@/types';
import { sendTelegramMessage } from '@/lib/telegram';
// import { sendEmail } from '@/lib/email'; // Uncomment if email notifications are desired

const SETTINGS_ROW_ID = 1; // For site_telegram_settings and site_notification_settings

async function getTelegramSettingsFromDb(): Promise<{
  telegramSettings: SiteTelegramSettings | null;
  notificationPrefs: SiteNotificationSettings | null; // Using SiteNotificationSettings for consistency
}> {
  console.log("[KeyBot Callback][getTelegramSettingsFromDb] Fetching Telegram configuration...");
  try {
    const [tgSettingsResults, notificationSettingsResults] = await Promise.all([
      query('SELECT client_bot_token, key_bot_token, key_bot_admin_chat_ids FROM site_telegram_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]),
      query('SELECT notify_on_software_activation FROM site_notification_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID])
    ]);

    const telegramSettings: SiteTelegramSettings | null =
      (Array.isArray(tgSettingsResults) && tgSettingsResults.length > 0) ? tgSettingsResults[0] : null;
    
    const notificationSettingsDb = (Array.isArray(notificationSettingsResults) && notificationSettingsResults.length > 0) ? notificationSettingsResults[0] : null;
    
    const notificationPrefs: SiteNotificationSettings | null = notificationSettingsDb ? {
        id: notificationSettingsDb.id || SETTINGS_ROW_ID, // Fallback id if not present
        notify_on_registration: Boolean(notificationSettingsDb.notify_on_registration), // Default to false if not present
        notify_on_balance_deposit: Boolean(notificationSettingsDb.notify_on_balance_deposit),
        notify_on_product_purchase: Boolean(notificationSettingsDb.notify_on_product_purchase),
        notify_on_support_reply: Boolean(notificationSettingsDb.notify_on_support_reply),
        notify_on_software_activation: Boolean(notificationSettingsDb.notify_on_software_activation),
        notify_on_license_expiry_soon: Boolean(notificationSettingsDb.notify_on_license_expiry_soon),
        notify_on_promotions: Boolean(notificationSettingsDb.notify_on_promotions),
        updated_at: notificationSettingsDb.updated_at,
    } : null;

    console.log("[KeyBot Callback][getTelegramSettingsFromDb] Fetched Telegram Settings (tokens hidden):", telegramSettings ? { ...telegramSettings, client_bot_token: '***', key_bot_token: '***'} : null);
    console.log("[KeyBot Callback][getTelegramSettingsFromDb] Fetched Notification Settings:", notificationPrefs);

    return { telegramSettings, notificationPrefs };
  } catch (error) {
    console.error("[KeyBot Callback][getTelegramSettingsFromDb] Error fetching configuration:", error);
    return { telegramSettings: null, notificationPrefs: null };
  }
}


function escapeTelegramMarkdownV2(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  const textStr = String(text);
  const escapeChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  return textStr.split('').map(char => escapeChars.includes(char) ? `\\${char}` : char).join('');
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API KeyBot Callback] Received callback data:', JSON.stringify(body, null, 2));

    const callbackQuery = body.callback_query;
    if (!callbackQuery || !callbackQuery.data || !callbackQuery.message || !callbackQuery.message.chat || !callbackQuery.from) {
      console.error('[API KeyBot Callback] Invalid callback_query structure');
      return NextResponse.json({ message: 'Invalid callback query structure.' }, { status: 200 });
    }

    const adminWhoClickedId = callbackQuery.from.id;
    const adminWhoClickedUsername = callbackQuery.from.username || callbackQuery.from.first_name || 'Администратор';
    const originalMessageId = callbackQuery.message.message_id;
    const adminChatId = callbackQuery.message.chat.id.toString();

    const [action, inventoryItemIdStr] = callbackQuery.data.split(':');
    const inventoryItemId = parseInt(inventoryItemIdStr, 10);

    const { telegramSettings: currentTelegramSettings } = await getTelegramSettingsFromDb();
    const keyBotToken = currentTelegramSettings?.key_bot_token;

    if (!keyBotToken) {
        console.error('[API KeyBot Callback] Key Bot Token is not configured in site_telegram_settings.');
        // Cannot respond to Telegram without a token, so just log and return.
        return NextResponse.json({ message: 'Server configuration error for Key Bot token.' }, { status: 200 });
    }
    
    // Attempt to answer the callback query immediately to remove the "loading" state on the button in Telegram
    try {
        await fetch(`https://api.telegram.org/bot${keyBotToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQuery.id }),
        });
    } catch (answerError) {
        console.warn("[API KeyBot Callback] Failed to answer callback query (non-critical):", answerError);
    }


    if (isNaN(inventoryItemId) || (action !== 'activate_key' && action !== 'reject_key')) {
      console.error(`[API KeyBot Callback] Invalid action or inventoryItemId: ${callbackQuery.data}`);
      await sendTelegramMessage(keyBotToken, adminChatId, "Ошибка: Неверные данные в callback.", 'MarkdownV2');
      return NextResponse.json({ message: 'Invalid action or item ID.' }, { status: 200 });
    }

    const inventoryItemResults = await query(
      `SELECT 
         ui.*, 
         p.name as product_name_from_product, 
         COALESCE(ppo.duration_days, cp.duration_days) as resolved_duration_days,
         ppo.mode_label as pricing_option_mode_label,
         u.id as user_db_id, u.username as user_db_username, u.email as user_email, u.telegram_id as user_telegram_id
       FROM user_inventory ui
       LEFT JOIN products p ON ui.related_product_id = p.id
       LEFT JOIN product_pricing_options ppo ON ui.product_pricing_option_id = ppo.id
       LEFT JOIN case_prizes cp ON ui.case_prize_id = cp.id
       LEFT JOIN users u ON ui.user_id = u.id
       WHERE ui.id = ?`, [inventoryItemId]);

    if (inventoryItemResults.length === 0) {
      console.error(`[API KeyBot Callback] Inventory item ${inventoryItemId} not found.`);
      await sendTelegramMessage(keyBotToken, adminChatId, `Ошибка: Предмет инвентаря с ID ${inventoryItemId} не найден.`, 'MarkdownV2');
      return NextResponse.json({ message: 'Inventory item not found.' }, { status: 200 });
    }
    const item: InventoryItemWithDetails & { user_db_id: number, user_db_username: string, user_email?: string, user_telegram_id?: string, product_name_from_product?: string, pricing_option_mode_label?: string | null } = inventoryItemResults[0];
    item.product_name = item.product_name || item.product_name_from_product || 'Неизвестный продукт';
    item.duration_days = item.resolved_duration_days ? parseInt(item.resolved_duration_days as any, 10) : null;
    item.mode_label = item.pricing_option_mode_label || null;


    let newStatus: InventoryItemWithDetails['activation_status'] = item.activation_status;
    let userMessage = '';
    let adminResponseMessage = '';

    if (item.activation_status !== 'pending_admin_approval') {
        adminResponseMessage = `Заявка для предмета \`${escapeTelegramMarkdownV2(item.product_name)}\` \\(Инв\\. ID: ${inventoryItemId}\\) уже была обработана ранее\\. Текущий статус: \`${item.activation_status}\`\\. Обработал: @${escapeTelegramMarkdownV2(adminWhoClickedUsername)}\\.`;
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
        userMessage = `✅ Ваш ключ для "${item.product_name}"${item.duration_days ? ` на ${item.duration_days} дн.` : ''}${item.mode_label ? ` [${item.mode_label}]` : ''} успешно активирован!`;
        if (expiresAt) userMessage += `\nИстекает: ${new Date(expiresAt).toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})}`;
        adminResponseMessage = `✅ Ключ для \`${escapeTelegramMarkdownV2(item.product_name)}\` \\(Инв\\. ID: ${inventoryItemId}\\) активирован админом @${escapeTelegramMarkdownV2(adminWhoClickedUsername)}\\.`;
    } else if (action === 'reject_key') {
        newStatus = 'rejected';
        await query(
            'UPDATE user_inventory SET activation_status = ?, updated_at = NOW() WHERE id = ?',
            [newStatus, inventoryItemId]
        );
        userMessage = `❌ Ваш запрос на активацию ключа для "${item.product_name}"${item.duration_days ? ` на ${item.duration_days} дн.` : ''}${item.mode_label ? ` [${item.mode_label}]` : ''} был отклонен. Пожалуйста, проверьте ключ или обратитесь в поддержку.`;
        adminResponseMessage = `❌ Запрос на активацию ключа для \`${escapeTelegramMarkdownV2(item.product_name)}\` \\(Инв\\. ID: ${inventoryItemId}\\) отклонен админом @${escapeTelegramMarkdownV2(adminWhoClickedUsername)}\\.`;
    }
    
    const originalMessageTextLines = callbackQuery.message.text.split('\n');
    // Keep original request details, append new status line
    let processedMessageText = originalMessageTextLines.slice(0, 5).join('\n'); // Get first 5 lines (original request)
    processedMessageText += `\n\n---\n*${adminResponseMessage}*`;
    
    await fetch(`https://api.telegram.org/bot${keyBotToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: adminChatId,
            message_id: originalMessageId,
            text: processedMessageText,
            parse_mode: 'MarkdownV2',
            reply_markup: { inline_keyboard: [] } 
        })
    });
    
    if (userMessage && item.user_telegram_id) {
        const { telegramSettings: currentSettingsForClientBot } = await getTelegramSettingsFromDb();
        const clientBotToken = currentSettingsForClientBot?.client_bot_token;
        if (clientBotToken) {
            await sendTelegramMessage(clientBotToken, item.user_telegram_id, userMessage, 'HTML'); // Using HTML for user messages for simplicity in this example
        } else {
            console.warn(`[API KeyBot Callback] Client Bot token not configured. Cannot send notification to user ${item.user_db_id}.`);
        }
    } else if (userMessage && !item.user_telegram_id && item.user_email) {
        console.log(`[API KeyBot Callback] User ${item.user_db_id} does not have a Telegram ID. Activation status: ${newStatus}. Email notification could be sent here.`);
        // const { notificationPrefs } = await getTelegramSettingsFromDb(); // Re-fetch because it might be different
        // if (notificationPrefs?.notify_on_software_activation) {
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
    // Try to inform admin about the error if possible, but be careful not to loop
    const { telegramSettings: currentTelegramSettings } = await getTelegramSettingsFromDb();
    const keyBotToken = currentTelegramSettings?.key_bot_token;
    const adminChatId = body?.callback_query?.message?.chat?.id?.toString();

    if (keyBotToken && adminChatId) {
        try {
            await sendTelegramMessage(keyBotToken, adminChatId, `⚠️ Произошла ошибка при обработке callback: ${escapeTelegramMarkdownV2(error.message)}`, 'MarkdownV2');
        } catch (e) {
            console.error("[API KeyBot Callback] Failed to send error message to admin chat:", e);
        }
    }
    return NextResponse.json({ message: 'Error processing callback.' }, { status: 200 }); // Always return 200 to Telegram
  }
}


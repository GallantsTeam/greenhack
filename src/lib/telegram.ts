
// src/lib/telegram.ts
import { query } from '@/lib/mysql';
import type { SiteTelegramSettings, AdminTelegramNotificationPrefs, Product, ProductPricingOption, InventoryItemWithDetails, User } from '@/types';

const SETTINGS_ROW_ID = 1; // Assuming settings are in a single row with id=1

async function getTelegramSettings(): Promise<{
  telegramSettings: SiteTelegramSettings | null;
  notificationPrefs: AdminTelegramNotificationPrefs | null;
}> {
  console.log("[TelegramLib] Fetching Telegram configuration from DB...");
  try {
    const [tgSettingsResults, adminPrefsResults] = await Promise.all([
      query('SELECT * FROM site_telegram_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]),
      query('SELECT * FROM admin_telegram_notification_prefs WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]) // Changed table name
    ]);

    const telegramSettings: SiteTelegramSettings | null =
      (Array.isArray(tgSettingsResults) && tgSettingsResults.length > 0) ? tgSettingsResults[0] : null;

    const adminPrefsDb = (Array.isArray(adminPrefsResults) && adminPrefsResults.length > 0) ? adminPrefsResults[0] : null;

    const notificationPrefs: AdminTelegramNotificationPrefs | null = adminPrefsDb ? {
        id: adminPrefsDb.id,
        notify_admin_on_balance_deposit: Boolean(adminPrefsDb.notify_admin_on_balance_deposit),
        notify_admin_on_product_purchase: Boolean(adminPrefsDb.notify_admin_on_product_purchase),
        notify_admin_on_promo_code_creation: Boolean(adminPrefsDb.notify_admin_on_promo_code_creation),
        notify_admin_on_admin_login: Boolean(adminPrefsDb.notify_admin_on_admin_login),
        notify_admin_on_key_activation_request: adminPrefsDb.notify_admin_on_key_activation_request === undefined ? true : Boolean(adminPrefsDb.notify_admin_on_key_activation_request),
        updated_at: adminPrefsDb.updated_at,
    } : null;
    
    console.log("[TelegramLib] Fetched Telegram Settings:", telegramSettings ? { ...telegramSettings, client_bot_token: '***', admin_bot_token: '***', key_bot_token: '***'} : null);
    console.log("[TelegramLib] Fetched Admin Notification Prefs:", notificationPrefs);
    return { telegramSettings, notificationPrefs };
  } catch (error) {
    console.error("[TelegramLib] Error fetching Telegram configuration:", error);
    return { telegramSettings: null, notificationPrefs: null };
  }
}


export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string,
  parseMode: 'MarkdownV2' | 'HTML' = 'MarkdownV2',
  replyMarkup?: object // For inline keyboards
): Promise<{ success: boolean; message?: string; error?: any }> {
  if (!botToken || !chatId || !message) {
    const errorMsg = "[TelegramLib] Send Error: Missing botToken, chatId, or message for Telegram.";
    console.error(errorMsg);
    return { success: false, message: errorMsg };
  }

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  console.log(`[TelegramLib] Attempting to send message to ${chatId} via URL: ${telegramApiUrl.replace(botToken, '***TOKEN***')}`);
  
  const bodyPayload: any = {
    chat_id: chatId,
    text: message,
    parse_mode: parseMode,
  };
  if (replyMarkup) {
    bodyPayload.reply_markup = replyMarkup;
  }

  try {
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });
    const data = await response.json();
    console.log(`[TelegramLib] Response from Telegram API for chat_id ${chatId}:`, data);

    if (data.ok) {
      console.log(`[TelegramLib] Message sent successfully to chat_id ${chatId}.`);
      return { success: true, message: `Message sent to ${chatId}` };
    } else {
      console.error('[TelegramLib] Telegram API Error:', data);
      return { success: false, message: `Telegram API Error: ${data.description}`, error: data };
    }
  } catch (error: any) {
    console.error('[TelegramLib] Error sending Telegram message via fetch:', error);
    return { success: false, message: `Network or parsing error: ${error.message}`, error };
  }
}

function escapeTelegramMarkdownV2(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  const textStr = String(text);
  const escapeChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  return textStr.split('').map(char => escapeChars.includes(char) ? `\\${char}` : char).join('');
}

export async function notifyAdminOnBalanceDeposit(userId: number, username: string, amountGh: number, reason?: string) {
  console.log(`[TelegramLib] notifyAdminOnBalanceDeposit called for user: ${username} (ID: ${userId}), amount: ${amountGh}, reason: ${reason}`);
  const { telegramSettings, notificationPrefs } = await getTelegramSettings();

  if (!telegramSettings?.admin_bot_token) {
    console.log("[TelegramLib] notifyAdminOnBalanceDeposit check failed: Admin bot token not configured.");
    return;
  }
  if (!telegramSettings.admin_bot_chat_ids) {
    console.log("[TelegramLib] notifyAdminOnBalanceDeposit check failed: Admin bot chat IDs not configured.");
    return;
  }
  if (!notificationPrefs?.notify_admin_on_balance_deposit) {
    console.log("[TelegramLib] notifyAdminOnBalanceDeposit check failed: Notification type is disabled in settings.");
    return;
  }

  const reasonText = reason ? `\nПричина: \`${escapeTelegramMarkdownV2(reason)}\`` : '';
  const message = `💰 *Пополнение баланса*
Пользователь: \`${escapeTelegramMarkdownV2(username)}\` (ID: \`${userId}\`)
Сумма: \`+${escapeTelegramMarkdownV2(amountGh.toFixed(2))}\` GH${reasonText}`;
  
  const chatIds = telegramSettings.admin_bot_chat_ids.split(',').map(id => id.trim()).filter(id => id);
  console.log(`[TelegramLib] Prepared balance deposit notification. Admin chat IDs: ${chatIds.join(', ')}`);
  for (const chatId of chatIds) {
    try {
      console.log(`[TelegramLib] Attempting to send balance deposit notification to admin chat ID: ${chatId}`);
      const result = await sendTelegramMessage(telegramSettings.admin_bot_token, chatId, message);
      if (!result.success) {
          console.error(`[TelegramLib] Failed to send balance deposit notification to ${chatId}:`, result.message, result.error);
      }
    } catch (e) {
        console.error(`[TelegramLib] CRITICAL ERROR sending balance deposit notification to ${chatId}:`, e);
    }
  }
}

export async function notifyAdminOnProductPurchase(userId: number, username: string, productName: string, durationDays: number | null, amountGh: number) {
  console.log(`[TelegramLib] notifyAdminOnProductPurchase called for user: ${username}, product: ${productName}, amount: ${amountGh}`);
  const { telegramSettings, notificationPrefs } = await getTelegramSettings();
  if (!telegramSettings?.admin_bot_token || !telegramSettings.admin_bot_chat_ids || !notificationPrefs?.notify_admin_on_product_purchase) {
    console.log("[TelegramLib] notifyAdminOnProductPurchase check failed: Bot token, chat IDs, or setting disabled.");
    return;
  }
  const durationText = durationDays ? ` (${escapeTelegramMarkdownV2(durationDays)} дн\\.)` : '';
  const message = `🛍️ *Новая покупка товара*
Пользователь: \`${escapeTelegramMarkdownV2(username)}\` (ID: \`${userId}\`)
Товар: \`${escapeTelegramMarkdownV2(productName)}\`${durationText}
Сумма: \`${escapeTelegramMarkdownV2(amountGh.toFixed(2))}\` GH`;

  const chatIds = telegramSettings.admin_bot_chat_ids.split(',').map(id => id.trim()).filter(id => id);
  console.log(`[TelegramLib] Prepared product purchase notification. Admin chat IDs: ${chatIds.join(', ')}`);
  for (const chatId of chatIds) {
     try {
        console.log(`[TelegramLib] Attempting to send product purchase notification to admin chat ID: ${chatId}`);
        const result = await sendTelegramMessage(telegramSettings.admin_bot_token, chatId, message);
        if (!result.success) {
            console.error(`[TelegramLib] Failed to send product purchase notification to ${chatId}:`, result.message, result.error);
        }
    } catch (e) {
        console.error(`[TelegramLib] CRITICAL ERROR sending product purchase notification to ${chatId}:`, e);
    }
  }
}

export async function notifyAdminOnPromoCodeCreation(
  adminUsername: string | null, 
  promoCode: { code: string; type: string; value_gh?: number | null; product_name?: string; duration_days?: number | null; mode_label?: string | null; max_uses: number; expires_at?: string | null }
) {
  console.log(`[TelegramLib] notifyAdminOnPromoCodeCreation called for code: ${promoCode.code}, created by: ${adminUsername || 'System'}`);
  const { telegramSettings, notificationPrefs } = await getTelegramSettings();
  if (!telegramSettings?.admin_bot_token || !telegramSettings.admin_bot_chat_ids || !notificationPrefs?.notify_admin_on_promo_code_creation) {
    console.log("[TelegramLib] notifyAdminOnPromoCodeCreation check failed: Bot token, chat IDs, or setting disabled.");
    return;
  }
  
  let rewardText = '';
  if (promoCode.type === 'balance_gh' && promoCode.value_gh) {
    rewardText = `Баланс: \`${escapeTelegramMarkdownV2(promoCode.value_gh.toFixed(2))}\` GH`;
  } else if (promoCode.type === 'product' && promoCode.product_name) {
    const duration = promoCode.duration_days ? ` (${escapeTelegramMarkdownV2(promoCode.duration_days)} дн\\.)` : '';
    const mode = promoCode.mode_label ? ` [${escapeTelegramMarkdownV2(promoCode.mode_label)}]` : '';
    rewardText = `Товар: \`${escapeTelegramMarkdownV2(promoCode.product_name)}\`${duration}${mode}`;
  }

  const message = `🎁 *Создан новый промокод*
Код: \`${escapeTelegramMarkdownV2(promoCode.code)}\`
Тип: \`${escapeTelegramMarkdownV2(promoCode.type)}\`
Награда: ${rewardText}
Макс\\. использований: \`${promoCode.max_uses}\`
Истекает: \`${promoCode.expires_at ? escapeTelegramMarkdownV2(new Date(promoCode.expires_at).toLocaleString('ru-RU')) : 'Бессрочно'}\`
${adminUsername ? `Создал: \`${escapeTelegramMarkdownV2(adminUsername)}\`` : 'Создан системой'}`;

  const chatIds = telegramSettings.admin_bot_chat_ids.split(',').map(id => id.trim()).filter(id => id);
  console.log(`[TelegramLib] Prepared promo code creation notification. Admin chat IDs: ${chatIds.join(', ')}`);
  for (const chatId of chatIds) {
    try {
        console.log(`[TelegramLib] Attempting to send promo code creation notification to admin chat ID: ${chatId}`);
        const result = await sendTelegramMessage(telegramSettings.admin_bot_token, chatId, message);
        if (!result.success) {
            console.error(`[TelegramLib] Failed to send promo code creation notification to ${chatId}:`, result.message, result.error);
        }
    } catch (e) {
        console.error(`[TelegramLib] CRITICAL ERROR sending promo code creation notification to ${chatId}:`, e);
    }
  }
}

export async function notifyAdminOnAdminLogin(adminUsername: string, ipAddress?: string) {
    console.log(`[TelegramLib] notifyAdminOnAdminLogin called for admin: ${adminUsername}, IP: ${ipAddress}`);
    const { telegramSettings, notificationPrefs } = await getTelegramSettings();
    if (!telegramSettings?.admin_bot_token || !telegramSettings.admin_bot_chat_ids || !notificationPrefs?.notify_admin_on_admin_login) {
        console.log("[TelegramLib] notifyAdminOnAdminLogin check failed: Bot token, chat IDs, or setting disabled.");
        return;
    }
    const ipText = ipAddress ? `IP: \`${escapeTelegramMarkdownV2(ipAddress)}\`` : 'IP не определен';
    const message = `🛡️ *Вход в Админ-панель*
Пользователь: \`${escapeTelegramMarkdownV2(adminUsername)}\`
${ipText}
Время: \`${escapeTelegramMarkdownV2(new Date().toLocaleString('ru-RU'))}\``;

    const chatIds = telegramSettings.admin_bot_chat_ids.split(',').map(id => id.trim()).filter(id => id);
    console.log(`[TelegramLib] Prepared admin login notification. Admin chat IDs: ${chatIds.join(', ')}`);
    for (const chatId of chatIds) {
        try {
            console.log(`[TelegramLib] Attempting to send admin login notification to admin chat ID: ${chatId}`);
            const result = await sendTelegramMessage(telegramSettings.admin_bot_token, chatId, message);
            if (!result.success) {
                console.error(`[TelegramLib] Failed to send admin login notification to ${chatId}:`, result.message, result.error);
            }
        } catch (e) {
            console.error(`[TelegramLib] CRITICAL ERROR sending admin login notification to ${chatId}:`, e);
        }
    }
}

export async function sendKeyActivationRequestToAdmin(
  item: InventoryItemWithDetails,
  user: Pick<User, 'id' | 'username'>
): Promise<{ success: boolean; message?: string; error?: any }> {
  console.log(`[TelegramLib] sendKeyActivationRequestToAdmin called for item ID: ${item.id}, user: ${user.username}`);
  const { telegramSettings, notificationPrefs } = await getTelegramSettings();
  
  const keyBotToken = telegramSettings?.key_bot_token; // Removed fallback to process.env
  const adminChatIdsString = telegramSettings?.key_bot_admin_chat_ids; // Removed fallback to process.env

  if (!keyBotToken) {
    const errorMsg = "[TelegramLib] Key Bot token not configured in site_telegram_settings.";
    console.error(errorMsg);
    return { success: false, message: errorMsg };
  }
  if (!adminChatIdsString) {
    const errorMsg = "[TelegramLib] Key Bot admin chat IDs not configured in site_telegram_settings.";
    console.error(errorMsg);
    return { success: false, message: errorMsg };
  }
  
  // Check if this specific notification type is enabled
  if (!notificationPrefs?.notify_admin_on_key_activation_request) {
    const logMsg = "[TelegramLib] sendKeyActivationRequestToAdmin check failed: Notification type 'notify_admin_on_key_activation_request' is disabled in admin_telegram_notification_prefs.";
    console.log(logMsg);
    // Return success because the system is configured not to send, not an error.
    return { success: true, message: "Key activation request notification type disabled in settings."}; 
  }

  const productName = item.product_name || 'Неизвестный товар';
  const duration = item.duration_days ? ` (${item.duration_days} дн.)` : '';
  const mode = item.mode_label ? ` [${item.mode_label}]` : '';
  const userKey = item.activation_code || 'Ключ не указан';

  const message = `🔑 *Запрос на активацию ключа*
Пользователь: \`${escapeTelegramMarkdownV2(user.username)}\` (ID: \`${user.id}\`)
Товар: \`${escapeTelegramMarkdownV2(productName)}${escapeTelegramMarkdownV2(duration)}${escapeTelegramMarkdownV2(mode)}\`
Инвентарь ID: \`${item.id}\`
Предоставленный ключ: \`${escapeTelegramMarkdownV2(userKey)}\``;

  const inline_keyboard = [[
    { text: '✅ Активировать', callback_data: `activate_key:${item.id}` },
    { text: '❌ Отклонить', callback_data: `reject_key:${item.id}` },
  ]];

  const chatIds = adminChatIdsString.split(',').map(id => id.trim()).filter(id => id);
  let allSentSuccessfully = true;
  let firstErrorResult: { success: boolean; message?: string; error?: any } | null = null;

  console.log(`[TelegramLib] Prepared key activation request notification. Key Bot Admin chat IDs: ${chatIds.join(', ')}`);

  for (const chatId of chatIds) {
    try {
      console.log(`[TelegramLib] Attempting to send key activation request to admin chat ID: ${chatId} using Key Bot`);
      const result = await sendTelegramMessage(keyBotToken, chatId, message, 'MarkdownV2', { inline_keyboard });
      
      if (!result.success) {
        allSentSuccessfully = false;
        if (!firstErrorResult) {
          firstErrorResult = result;
        }
        console.error(`[TelegramLib] Failed to send key activation request to ${chatId}:`, result.message, result.error);
      } else {
         console.log(`[TelegramLib] Key activation request sent successfully to ${chatId}.`);
      }
    } catch (e: any) {
        allSentSuccessfully = false;
        if (!firstErrorResult) {
            firstErrorResult = { success: false, message: `Network or parsing error for key activation: ${e.message}`, error: e };
        }
        console.error(`[TelegramLib] CRITICAL ERROR sending key activation request to ${chatId}:`, e);
    }
  }
  return allSentSuccessfully ? { success: true, message: "Уведомление администратору отправлено."} : (firstErrorResult || { success: false, message: "Неизвестная ошибка при отправке уведомлений администратору."});
}

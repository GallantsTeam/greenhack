
// src/lib/telegram.ts
import { query } from '@/lib/mysql';
import type { SiteTelegramSettings, AdminTelegramNotificationPrefs, Product, ProductPricingOption, InventoryItemWithDetails, User, SiteNotificationSettings } from '@/types';

const SETTINGS_ROW_ID = 1; // Assuming settings are in a single row with id=1

async function getTelegramSettingsFromDb(): Promise<{
  telegramSettings: SiteTelegramSettings | null;
  notificationPrefs: AdminTelegramNotificationPrefs | null;
  siteNotificationSettings: SiteNotificationSettings | null; 
}> {
  // console.log("[TelegramLib][getTelegramSettingsFromDb] Fetching Telegram configuration from DB...");
  try {
    const [tgSettingsResults, adminPrefsResults, siteNotificationSettingsResults] = await Promise.all([
      query('SELECT * FROM site_telegram_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]),
      query('SELECT * FROM admin_telegram_notification_prefs WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]),
      query('SELECT * FROM site_notification_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID])
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
    
    const siteNotificationSettingsDb = (Array.isArray(siteNotificationSettingsResults) && siteNotificationSettingsResults.length > 0) ? siteNotificationSettingsResults[0] : null;
    const siteNotificationSettings: SiteNotificationSettings | null = siteNotificationSettingsDb ? {
        id: siteNotificationSettingsDb.id || SETTINGS_ROW_ID, // Fallback id if not present
        notify_on_registration: Boolean(siteNotificationSettingsDb.notify_on_registration), 
        notify_on_balance_deposit: Boolean(siteNotificationSettingsDb.notify_on_balance_deposit),
        notify_on_product_purchase: Boolean(siteNotificationSettingsDb.notify_on_product_purchase),
        notify_on_support_reply: Boolean(siteNotificationSettingsDb.notify_on_support_reply),
        notify_on_software_activation: Boolean(siteNotificationSettingsDb.notify_on_software_activation),
        notify_on_license_expiry_soon: Boolean(siteNotificationSettingsDb.notify_on_license_expiry_soon),
        notify_on_promotions: Boolean(siteNotificationSettingsDb.notify_on_promotions),
        updated_at: siteNotificationSettingsDb.updated_at,
    } : null;
    
    return { telegramSettings, notificationPrefs, siteNotificationSettings };
  } catch (error) {
    console.error("[TelegramLib][getTelegramSettingsFromDb] Error fetching Telegram configuration:", error);
    return { telegramSettings: null, notificationPrefs: null, siteNotificationSettings: null };
  }
}


export async function sendTelegramMessage(
  botToken: string,
  chatId: string, 
  message: string,
  parseMode: 'MarkdownV2' | 'HTML' = 'MarkdownV2',
  replyMarkup?: object 
): Promise<{ success: boolean; message?: string; error?: any }> {
  if (!botToken || !chatId || !message) {
    const errorMsg = "[TelegramLib] Send Error: Missing botToken, chatId, or message for Telegram.";
    console.error(errorMsg);
    return { success: false, message: errorMsg };
  }

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const bodyPayload: any = {
    chat_id: chatId, 
    text: message,
    parse_mode: parseMode,
  };
  if (replyMarkup) {
    bodyPayload.reply_markup = replyMarkup;
  }

  console.log(`[TelegramLib] Preparing to send. Token (partial): '${botToken.substring(0,10)}...', Final chat_id type: ${typeof bodyPayload.chat_id}, value: '${bodyPayload.chat_id}', message: "${message.substring(0,50)}..."`);
  console.log(`[TelegramLib] EXACT PAYLOAD TO TELEGRAM (token excluded):`, JSON.stringify({ ...bodyPayload, bot_token_info: `Token ending with ...${botToken.slice(-6)}` }, null, 2));


  try {
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });
    const data = await response.json();

    if (data.ok) {
      console.log(`[TelegramLib] Message sent successfully to chat_id ${chatId}.`);
      return { success: true, message: `Message sent to ${chatId}` };
    } else {
      console.error('[TelegramLib] Telegram API Error response data:', data);
      let detailedMessage = `Telegram API Error: ${data.description || 'Unknown error from Telegram API'}`;
      if (data.description && data.description.toLowerCase().includes("chat not found")) {
        detailedMessage = `Telegram API Error for Chat ID '${chatId}': ${data.description} (Hint: Ensure bot has access to this specific Chat ID. If it's a user ID, the user must have started the bot. If it's a group/channel ID, the bot must be a member/admin and the ID should typically be negative for groups/supergroups.)`;
      }
      return { success: false, message: detailedMessage, error: data };
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
  const { telegramSettings, notificationPrefs } = await getTelegramSettingsFromDb();

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
  for (const chatId of chatIds) {
    try {
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
  const { telegramSettings, notificationPrefs } = await getTelegramSettingsFromDb();
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
  for (const chatId of chatIds) {
     try {
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
  const { telegramSettings, notificationPrefs } = await getTelegramSettingsFromDb();
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
  for (const chatId of chatIds) {
    try {
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
    const { telegramSettings, notificationPrefs } = await getTelegramSettingsFromDb();
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
    for (const chatId of chatIds) {
        try {
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
  const { telegramSettings, notificationPrefs } = await getTelegramSettingsFromDb();

  const keyBotToken = telegramSettings?.key_bot_token;
  const adminChatIdsString = telegramSettings?.key_bot_admin_chat_ids;

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

  if (!notificationPrefs?.notify_admin_on_key_activation_request) {
    const logMsg = "[TelegramLib] sendKeyActivationRequestToAdmin check failed: Notification type 'notify_admin_on_key_activation_request' is disabled.";
    console.log(logMsg);
    return { success: true, message: "Key activation request notification type disabled."};
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

  for (const chatId of chatIds) {
    try {
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

export { getTelegramSettingsFromDb };


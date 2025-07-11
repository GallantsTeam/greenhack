
// src/app/api/admin/site-settings/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SiteTelegramSettings, AdminTelegramNotificationPrefs } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

const TELEGRAM_SETTINGS_ROW_ID = 1;
const ADMIN_PREFS_ROW_ID = 1;

export async function GET(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const telegramSettingsResults = await query('SELECT * FROM site_telegram_settings WHERE id = ? LIMIT 1', [TELEGRAM_SETTINGS_ROW_ID]);
    const adminNotificationPrefsResults = await query('SELECT * FROM admin_telegram_notification_prefs WHERE id = ? LIMIT 1', [ADMIN_PREFS_ROW_ID]);

    const defaultTelegramSettings: SiteTelegramSettings = {
        id: TELEGRAM_SETTINGS_ROW_ID,
        client_bot_token: null,
        client_bot_chat_id: null,
        admin_bot_token: null,
        admin_bot_chat_ids: null,
        key_bot_token: null,
        key_bot_admin_chat_ids: null,
    };
     const defaultAdminNotificationPrefs: AdminTelegramNotificationPrefs = {
        id: ADMIN_PREFS_ROW_ID,
        notify_admin_on_balance_deposit: false,
        notify_admin_on_product_purchase: false,
        notify_admin_on_promo_code_creation: false,
        notify_admin_on_admin_login: false,
        notify_admin_on_key_activation_request: true, // Default to true for new setting
    };

    const telegramSettings = (Array.isArray(telegramSettingsResults) && telegramSettingsResults.length > 0) 
        ? telegramSettingsResults[0] 
        : defaultTelegramSettings;
        
    const adminPrefsDb = (Array.isArray(adminNotificationPrefsResults) && adminNotificationPrefsResults.length > 0)
        ? adminNotificationPrefsResults[0]
        : defaultAdminNotificationPrefs;

    const notificationPrefs: AdminTelegramNotificationPrefs = {
        id: adminPrefsDb.id,
        notify_admin_on_balance_deposit: Boolean(adminPrefsDb.notify_admin_on_balance_deposit),
        notify_admin_on_product_purchase: Boolean(adminPrefsDb.notify_admin_on_product_purchase),
        notify_admin_on_promo_code_creation: Boolean(adminPrefsDb.notify_admin_on_promo_code_creation),
        notify_admin_on_admin_login: Boolean(adminPrefsDb.notify_admin_on_admin_login),
        notify_admin_on_key_activation_request: adminPrefsDb.notify_admin_on_key_activation_request === undefined ? true : Boolean(adminPrefsDb.notify_admin_on_key_activation_request),
        updated_at: adminPrefsDb.updated_at,
    };


    return NextResponse.json({ telegramSettings, notificationPrefs });
  } catch (error: any) {
    console.error('API Admin Telegram Settings GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const body = await request.json();
    const { 
      client_bot_token, client_bot_chat_id, admin_bot_token, admin_bot_chat_ids,
      key_bot_token, key_bot_admin_chat_ids, // New key bot fields
      notify_admin_on_balance_deposit, notify_admin_on_product_purchase, 
      notify_admin_on_promo_code_creation, notify_admin_on_admin_login,
      notify_admin_on_key_activation_request // New notification pref
    } = body;

    // Update site_telegram_settings
    const updateTelegramSettingsQuery = `
      INSERT INTO site_telegram_settings (id, client_bot_token, client_bot_chat_id, admin_bot_token, admin_bot_chat_ids, key_bot_token, key_bot_admin_chat_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        client_bot_token = VALUES(client_bot_token),
        client_bot_chat_id = VALUES(client_bot_chat_id),
        admin_bot_token = VALUES(admin_bot_token),
        admin_bot_chat_ids = VALUES(admin_bot_chat_ids),
        key_bot_token = VALUES(key_bot_token),
        key_bot_admin_chat_ids = VALUES(key_bot_admin_chat_ids),
        updated_at = NOW()
    `;
    await query(updateTelegramSettingsQuery, [
      TELEGRAM_SETTINGS_ROW_ID,
      client_bot_token || null,
      client_bot_chat_id || null,
      admin_bot_token || null,
      admin_bot_chat_ids || null,
      key_bot_token || null,
      key_bot_admin_chat_ids || null,
    ]);

    // Update admin_telegram_notification_prefs
    const updateAdminPrefsQuery = `
      INSERT INTO admin_telegram_notification_prefs (id, notify_admin_on_balance_deposit, notify_admin_on_product_purchase, notify_admin_on_promo_code_creation, notify_admin_on_admin_login, notify_admin_on_key_activation_request)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        notify_admin_on_balance_deposit = VALUES(notify_admin_on_balance_deposit),
        notify_admin_on_product_purchase = VALUES(notify_admin_on_product_purchase),
        notify_admin_on_promo_code_creation = VALUES(notify_admin_on_promo_code_creation),
        notify_admin_on_admin_login = VALUES(notify_admin_on_admin_login),
        notify_admin_on_key_activation_request = VALUES(notify_admin_on_key_activation_request),
        updated_at = NOW()
    `;
    await query(updateAdminPrefsQuery, [
      ADMIN_PREFS_ROW_ID,
      Boolean(notify_admin_on_balance_deposit),
      Boolean(notify_admin_on_product_purchase),
      Boolean(notify_admin_on_promo_code_creation),
      Boolean(notify_admin_on_admin_login),
      Boolean(notify_admin_on_key_activation_request),
    ]);
    
    const updatedTelegramSettingsResults = await query('SELECT * FROM site_telegram_settings WHERE id = ? LIMIT 1', [TELEGRAM_SETTINGS_ROW_ID]);
    const updatedAdminNotificationPrefsResults = await query('SELECT * FROM admin_telegram_notification_prefs WHERE id = ? LIMIT 1', [ADMIN_PREFS_ROW_ID]);


    return NextResponse.json({ 
        message: 'Настройки Telegram успешно обновлены.',
        settings: {
            telegramSettings: updatedTelegramSettingsResults[0] || null,
            notificationPrefs: updatedAdminNotificationPrefsResults[0] ? {
                ...updatedAdminNotificationPrefsResults[0],
                notify_admin_on_balance_deposit: Boolean(updatedAdminNotificationPrefsResults[0].notify_admin_on_balance_deposit),
                notify_admin_on_product_purchase: Boolean(updatedAdminNotificationPrefsResults[0].notify_admin_on_product_purchase),
                notify_admin_on_promo_code_creation: Boolean(updatedAdminNotificationPrefsResults[0].notify_admin_on_promo_code_creation),
                notify_admin_on_admin_login: Boolean(updatedAdminNotificationPrefsResults[0].notify_admin_on_admin_login),
                notify_admin_on_key_activation_request: updatedAdminNotificationPrefsResults[0].notify_admin_on_key_activation_request === undefined ? true : Boolean(updatedAdminNotificationPrefsResults[0].notify_admin_on_key_activation_request),
            } : null
        }
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Admin Telegram Settings PUT Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    

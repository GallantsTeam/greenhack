
// src/app/api/admin/site-settings/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SiteNotificationSettings } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

const SETTINGS_ROW_ID = 1; // All notification settings are in a single row with id=1

export async function GET(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const results = await query('SELECT * FROM site_notification_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    
    if (!Array.isArray(results) || results.length === 0) {
      // If no settings row exists, return default values
      const defaultSettings: SiteNotificationSettings = {
        id: SETTINGS_ROW_ID,
        notify_on_registration: true,
        notify_on_balance_deposit: true,
        notify_on_product_purchase: true,
        notify_on_support_reply: false,
        notify_on_software_activation: false,
        notify_on_license_expiry_soon: false,
        notify_on_promotions: false,
      };
      // Optionally, insert these defaults into the DB here if the table is empty and you prefer that
      // await query('INSERT IGNORE INTO site_notification_settings (id) VALUES (?)', [SETTINGS_ROW_ID]);
      return NextResponse.json(defaultSettings);
    }
    
    const settingsFromDb = results[0];
    const processedSettings: SiteNotificationSettings = {
        id: settingsFromDb.id,
        notify_on_registration: Boolean(settingsFromDb.notify_on_registration),
        notify_on_balance_deposit: Boolean(settingsFromDb.notify_on_balance_deposit),
        notify_on_product_purchase: Boolean(settingsFromDb.notify_on_product_purchase),
        notify_on_support_reply: Boolean(settingsFromDb.notify_on_support_reply),
        notify_on_software_activation: Boolean(settingsFromDb.notify_on_software_activation),
        notify_on_license_expiry_soon: Boolean(settingsFromDb.notify_on_license_expiry_soon),
        notify_on_promotions: Boolean(settingsFromDb.notify_on_promotions),
        updated_at: settingsFromDb.updated_at,
    };

    return NextResponse.json(processedSettings);
  } catch (error: any) {
    console.error('API Admin Notification Settings GET Error:', error);
     if (error.code === 'ER_NO_SUCH_TABLE') {
        console.warn('site_notification_settings table does not exist. Returning default settings.');
        const defaultSettings: SiteNotificationSettings = {
            id: SETTINGS_ROW_ID,
            notify_on_registration: true,
            notify_on_balance_deposit: true,
            notify_on_product_purchase: true,
            notify_on_support_reply: false,
            notify_on_software_activation: false,
            notify_on_license_expiry_soon: false,
            notify_on_promotions: false,
        };
        return NextResponse.json(defaultSettings, { status: 200 }); // Return defaults if table not found, admin UI can still function
    }
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const body = await request.json();
    const { 
      notify_on_registration, notify_on_balance_deposit, notify_on_product_purchase,
      notify_on_support_reply, notify_on_software_activation, notify_on_license_expiry_soon,
      notify_on_promotions 
    } = body;

    const updateQuery = `
      UPDATE site_notification_settings SET
        notify_on_registration = ?, 
        notify_on_balance_deposit = ?, 
        notify_on_product_purchase = ?, 
        notify_on_support_reply = ?, 
        notify_on_software_activation = ?, 
        notify_on_license_expiry_soon = ?, 
        notify_on_promotions = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    const queryParams = [
      Boolean(notify_on_registration),
      Boolean(notify_on_balance_deposit),
      Boolean(notify_on_product_purchase),
      Boolean(notify_on_support_reply),
      Boolean(notify_on_software_activation),
      Boolean(notify_on_license_expiry_soon),
      Boolean(notify_on_promotions),
      SETTINGS_ROW_ID,
    ];
    
    const result = await query(updateQuery, queryParams) as OkPacket | ResultSetHeader | any[];

    let affectedRows = 0;
    if (result && ('affectedRows' in result)) {
        affectedRows = (result as OkPacket).affectedRows;
    } else if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    }
    
    if (affectedRows === 0) {
      // If no rows were updated, it might mean the row with id=1 doesn't exist. Try inserting.
      const insertQuery = `
        INSERT INTO site_notification_settings (
            id, notify_on_registration, notify_on_balance_deposit, notify_on_product_purchase, 
            notify_on_support_reply, notify_on_software_activation, notify_on_license_expiry_soon, 
            notify_on_promotions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            notify_on_registration=VALUES(notify_on_registration), notify_on_balance_deposit=VALUES(notify_on_balance_deposit),
            notify_on_product_purchase=VALUES(notify_on_product_purchase), notify_on_support_reply=VALUES(notify_on_support_reply),
            notify_on_software_activation=VALUES(notify_on_software_activation), notify_on_license_expiry_soon=VALUES(notify_on_license_expiry_soon),
            notify_on_promotions=VALUES(notify_on_promotions), updated_at=NOW()`;
      await query(insertQuery, [
            SETTINGS_ROW_ID, Boolean(notify_on_registration), Boolean(notify_on_balance_deposit), Boolean(notify_on_product_purchase),
            Boolean(notify_on_support_reply), Boolean(notify_on_software_activation), Boolean(notify_on_license_expiry_soon),
            Boolean(notify_on_promotions)
        ]);
    }

    const updatedSettingsResults = await query('SELECT * FROM site_notification_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    if (!Array.isArray(updatedSettingsResults) || updatedSettingsResults.length === 0) {
        return NextResponse.json({ message: 'Настройки сохранены, но не удалось получить обновленные данные.' }, { status: 500 });
    }
    const settingsToReturn: SiteNotificationSettings = {
        id: updatedSettingsResults[0].id,
        notify_on_registration: Boolean(updatedSettingsResults[0].notify_on_registration),
        notify_on_balance_deposit: Boolean(updatedSettingsResults[0].notify_on_balance_deposit),
        notify_on_product_purchase: Boolean(updatedSettingsResults[0].notify_on_product_purchase),
        notify_on_support_reply: Boolean(updatedSettingsResults[0].notify_on_support_reply),
        notify_on_software_activation: Boolean(updatedSettingsResults[0].notify_on_software_activation),
        notify_on_license_expiry_soon: Boolean(updatedSettingsResults[0].notify_on_license_expiry_soon),
        notify_on_promotions: Boolean(updatedSettingsResults[0].notify_on_promotions),
        updated_at: updatedSettingsResults[0].updated_at,
    };
    return NextResponse.json({ message: 'Настройки уведомлений успешно обновлены.', settings: settingsToReturn }, { status: 200 });

  } catch (error: any) {
    console.error('API Admin Notification Settings PUT Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    

    
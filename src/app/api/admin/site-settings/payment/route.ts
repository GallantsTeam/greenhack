
// src/app/api/admin/site-settings/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SitePaymentGatewaySettings } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

const SETTINGS_ROW_ID = 1;

export async function GET(request: NextRequest) {
  try {
    const results = await query('SELECT * FROM site_payment_gateway_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    
    if (!Array.isArray(results) || results.length === 0) {
      // If no settings row exists, attempt to insert default and then fetch again or return defaults
      await query('INSERT IGNORE INTO site_payment_gateway_settings (id, gateway_name, yoomoney_webhook_url, is_test_mode_active, yoomoney_notify_payment_succeeded, yoomoney_notify_payment_waiting_for_capture, yoomoney_notify_payment_canceled, yoomoney_notify_refund_succeeded) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [SETTINGS_ROW_ID, 'yoomoney', '/api/payment/yoomoney-webhook', true, true, false, true, true]);
      
      const newResults = await query('SELECT * FROM site_payment_gateway_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
      if (!Array.isArray(newResults) || newResults.length === 0){
         return NextResponse.json({ message: "Failed to initialize and fetch payment settings" }, { status: 500 });
      }
      const settingsFromDb = newResults[0];
      const { yoomoney_secret_key: _, ...settingsToReturn } = settingsFromDb;
      return NextResponse.json({
        ...settingsToReturn,
        is_test_mode_active: Boolean(settingsToReturn.is_test_mode_active),
        yoomoney_notify_payment_succeeded: Boolean(settingsToReturn.yoomoney_notify_payment_succeeded),
        yoomoney_notify_payment_waiting_for_capture: Boolean(settingsToReturn.yoomoney_notify_payment_waiting_for_capture),
        yoomoney_notify_payment_canceled: Boolean(settingsToReturn.yoomoney_notify_payment_canceled),
        yoomoney_notify_refund_succeeded: Boolean(settingsToReturn.yoomoney_notify_refund_succeeded),
      });
    }
    
    const settingsFromDb = results[0];
    const { yoomoney_secret_key, ...settingsToReturn } = settingsFromDb; 
    
    const processedSettings: Partial<SitePaymentGatewaySettings> = { 
        ...settingsToReturn,
        is_test_mode_active: Boolean(settingsToReturn.is_test_mode_active),
        yoomoney_notify_payment_succeeded: Boolean(settingsToReturn.yoomoney_notify_payment_succeeded),
        yoomoney_notify_payment_waiting_for_capture: Boolean(settingsToReturn.yoomoney_notify_payment_waiting_for_capture),
        yoomoney_notify_payment_canceled: Boolean(settingsToReturn.yoomoney_notify_payment_canceled),
        yoomoney_notify_refund_succeeded: Boolean(settingsToReturn.yoomoney_notify_refund_succeeded),
    };

    return NextResponse.json(processedSettings);
  } catch (error: any) {
    console.error('API Admin Payment Settings GET Error:', error);
    if (error.code === 'ER_NO_SUCH_TABLE') {
        try {
            // Attempt to create and insert default if table doesn't exist
            await query(`
                CREATE TABLE IF NOT EXISTS site_payment_gateway_settings (
                    id INT NOT NULL DEFAULT 1, gateway_name VARCHAR(50) DEFAULT 'yoomoney',
                    yoomoney_shop_id VARCHAR(255) NULL, yoomoney_secret_key VARCHAR(255) NULL,
                    yoomoney_webhook_url VARCHAR(255) NULL DEFAULT '/api/payment/yoomoney-webhook',
                    yoomoney_notify_payment_succeeded BOOLEAN NOT NULL DEFAULT TRUE,
                    yoomoney_notify_payment_waiting_for_capture BOOLEAN NOT NULL DEFAULT FALSE,
                    yoomoney_notify_payment_canceled BOOLEAN NOT NULL DEFAULT TRUE,
                    yoomoney_notify_refund_succeeded BOOLEAN NOT NULL DEFAULT TRUE,
                    is_test_mode_active BOOLEAN NOT NULL DEFAULT TRUE,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id), CONSTRAINT pk_site_payment_gateway_settings_id_is_1 CHECK (id = 1)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
            `);
            await query('INSERT IGNORE INTO site_payment_gateway_settings (id, is_test_mode_active) VALUES (1, TRUE)');
            const defaultSettings: SitePaymentGatewaySettings = {
                id: SETTINGS_ROW_ID, gateway_name: 'yoomoney', yoomoney_shop_id: null, yoomoney_secret_key: null,
                yoomoney_webhook_url: '/api/payment/yoomoney-webhook', yoomoney_notify_payment_succeeded: true,
                yoomoney_notify_payment_waiting_for_capture: false, yoomoney_notify_payment_canceled: true,
                yoomoney_notify_refund_succeeded: true, is_test_mode_active: true,
            };
            return NextResponse.json(defaultSettings, { status: 200 });
        } catch (dbCreateError) {
             console.error('API Admin Payment Settings DB Create Error:', dbCreateError);
             return NextResponse.json({ message: `Internal Server Error: Failed to create settings table.` }, { status: 500 });
        }
    }
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      yoomoney_shop_id, yoomoney_secret_key, 
      yoomoney_notify_payment_succeeded, yoomoney_notify_payment_waiting_for_capture,
      yoomoney_notify_payment_canceled, yoomoney_notify_refund_succeeded,
      is_test_mode_active 
    } = body;

    const updateFields: string[] = [];
    const queryParams: any[] = [];

    const addField = (fieldValue: any, fieldName: string) => {
      if (fieldValue !== undefined) { // Allow false values for booleans
        updateFields.push(`${fieldName} = ?`);
        queryParams.push(fieldValue === '' ? null : fieldValue);
      }
    };
    
    console.log("Received is_test_mode_active in PUT:", is_test_mode_active, typeof is_test_mode_active);


    addField(yoomoney_shop_id, 'yoomoney_shop_id');
    if (yoomoney_secret_key !== undefined) { // Allow clearing the secret key
        if (yoomoney_secret_key && yoomoney_secret_key.trim() !== '') {
            addField(yoomoney_secret_key, 'yoomoney_secret_key');
        } else if (yoomoney_secret_key === ''){ // If explicitly empty string, set to NULL
             addField(null, 'yoomoney_secret_key');
        }
        // If yoomoney_secret_key is undefined, it won't be added to updateFields
    }
    addField(Boolean(yoomoney_notify_payment_succeeded), 'yoomoney_notify_payment_succeeded');
    addField(Boolean(yoomoney_notify_payment_waiting_for_capture), 'yoomoney_notify_payment_waiting_for_capture');
    addField(Boolean(yoomoney_notify_payment_canceled), 'yoomoney_notify_payment_canceled');
    addField(Boolean(yoomoney_notify_refund_succeeded), 'yoomoney_notify_refund_succeeded');
    addField(Boolean(is_test_mode_active), 'is_test_mode_active'); // Ensure boolean conversion
    
    if (updateFields.length === 0) {
      return NextResponse.json({ message: 'Настройки не изменены (нет данных для обновления).' }, { status: 200 });
    }

    // Ensure the row exists with id=1 before updating
    await query('INSERT IGNORE INTO site_payment_gateway_settings (id) VALUES (?)', [SETTINGS_ROW_ID]);

    const updateQuery = `
      UPDATE site_payment_gateway_settings 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;
    queryParams.push(SETTINGS_ROW_ID);
    
    console.log("Executing SQL:", updateQuery, queryParams);
    await query(updateQuery, queryParams);

    const updatedSettingsResults = await query('SELECT * FROM site_payment_gateway_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    const { yoomoney_secret_key: _, ...settingsToReturn } = updatedSettingsResults[0]; 

    return NextResponse.json({ message: 'Настройки платежного шлюза успешно обновлены.', settings: {
        ...settingsToReturn,
        is_test_mode_active: Boolean(settingsToReturn.is_test_mode_active)
    } }, { status: 200 });

  } catch (error: any) {
    console.error('API Admin Payment Settings PUT Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    
    
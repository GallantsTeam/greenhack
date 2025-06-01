
// src/app/api/admin/site-settings/smtp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SmtpSettings } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

const SETTINGS_ROW_ID = 1; // All SMTP settings are in a single row with id=1

export async function GET(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const results = await query('SELECT * FROM site_smtp_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    
    if (!Array.isArray(results) || results.length === 0) {
      // Return default/empty if no settings found, but the row should exist due to INSERT IGNORE
      const defaultSmtpSettings: SmtpSettings = {
        id: SETTINGS_ROW_ID,
        smtp_host: null,
        smtp_port: 587, // Common default
        smtp_username: null,
        smtp_password: null, // Never send password to client
        smtp_encryption: 'tls', // Common default
        from_email: null,
        from_name: null,
      };
      return NextResponse.json(defaultSmtpSettings);
    }
    
    const settingsFromDb = results[0];
    // Exclude password when sending to client
    const { smtp_password, ...settingsToReturn } = settingsFromDb;
    
    const processedSettings: SmtpSettings = {
        ...settingsToReturn,
        smtp_port: settingsToReturn.smtp_port !== null ? parseInt(settingsToReturn.smtp_port, 10) : null,
        // smtp_encryption should already be of the correct enum type
    };

    return NextResponse.json(processedSettings);
  } catch (error: any) {
    console.error('API Admin SMTP Settings GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const body = await request.json();
    const { 
      smtp_host, smtp_port, smtp_username, smtp_password, 
      smtp_encryption, from_email, from_name 
    } = body;

    // Prepare fields and params for update
    const updateFields: string[] = [];
    const queryParams: any[] = [];

    const addField = (fieldValue: any, fieldName: string) => {
      if (fieldValue !== undefined) {
        updateFields.push(`${fieldName} = ?`);
        queryParams.push(fieldValue === '' ? null : fieldValue); // Allow clearing fields
      }
    };

    addField(smtp_host, 'smtp_host');
    addField(smtp_port, 'smtp_port');
    addField(smtp_username, 'smtp_username');
    // Only update password if a new one is provided
    if (smtp_password && smtp_password.trim() !== '') {
        // In a real app, you'd encrypt this before storing or store in a secure vault
        updateFields.push('smtp_password = ?');
        queryParams.push(smtp_password); 
    }
    addField(smtp_encryption, 'smtp_encryption');
    addField(from_email, 'from_email');
    addField(from_name, 'from_name');

    if (updateFields.length === 0 && !(smtp_password && smtp_password.trim() !== '')) {
        // If no fields are to be updated and password is also not being updated
        const currentSettings = await query('SELECT * FROM site_smtp_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
        if (currentSettings.length > 0) {
            const { smtp_password: _, ...settingsToReturn } = currentSettings[0];
            return NextResponse.json({ message: 'Настройки SMTP не изменены.', settings: settingsToReturn }, { status: 200 });
        }
        return NextResponse.json({ message: 'Настройки SMTP не найдены для обновления.' }, { status: 404 });
    }


    const updateQuery = `
      UPDATE site_smtp_settings 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    queryParams.push(SETTINGS_ROW_ID);
    
    const result = await query(updateQuery, queryParams) as OkPacket | ResultSetHeader | any[];

    let affectedRows = 0;
    if (result && ('affectedRows' in result)) {
        affectedRows = (result as OkPacket).affectedRows;
    } else if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    }
    
    const updatedSettingsResults = await query('SELECT * FROM site_smtp_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    const { smtp_password: _, ...settingsToReturn } = updatedSettingsResults[0];


    return NextResponse.json({ message: 'SMTP настройки успешно обновлены.', settings: settingsToReturn }, { status: 200 });

  } catch (error: any) {
    console.error('API Admin SMTP Settings PUT Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

    
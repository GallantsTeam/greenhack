
// src/app/api/admin/site-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SiteSettings } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

const SETTINGS_ROW_ID = 1; 

// Эта функция теперь включает ВСЕ поля из SiteSettings, включая новые для marketplace
const getDefaultSettings = (): SiteSettings => ({
  id: SETTINGS_ROW_ID,
  site_name: 'Green Hack',
  site_description: 'Лучшие читы для ваших любимых игр!',
  logo_url: null,
  footer_text: `© ${new Date().getFullYear()} Green Hack. Все права защищены.`,
  contact_vk_label: 'Наша беседа VK',
  contact_vk_url: '#',
  contact_telegram_bot_label: 'Наш Telegram Бот',
  contact_telegram_bot_url: '#',
  contact_email_label: 'Email поддержки',
  contact_email_address: 'support@example.com',
  footer_marketplace_text: 'Мы продаем на:',
  footer_marketplace_logo_url: 'https://yougame.biz/images/rlm/logo/logoconcept4.png',
  footer_marketplace_link_url: 'https://yougame.biz/members/263428/',
  footer_marketplace_is_visible: true,
  faq_page_main_title: 'Часто Задаваемые Вопросы',
  faq_page_contact_prompt_text: 'Не нашли ответ на свой вопрос? Напишите в поддержку',
  rules_page_content: '<p>Начальный текст для правил сайта...</p>',
  offer_page_content: '<p>Начальный текст для публичной оферты...</p>',
});

export async function GET(request: NextRequest) {
  console.log('[API GET /admin/site-settings] Attempting to fetch settings...');
  let settingsFromDb: Partial<SiteSettings> = {};
  
  try {
    const results = await query('SELECT * FROM site_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    if (Array.isArray(results) && results.length > 0) {
      settingsFromDb = results[0];
      console.log('[API GET /admin/site-settings] Successfully fetched settings from DB:', settingsFromDb);
    } else {
      console.log(`[API GET /admin/site-settings] Settings row with id=${SETTINGS_ROW_ID} not found. Attempting to create minimal row.`);
      try {
        await query('INSERT IGNORE INTO site_settings (id, site_name, site_description, footer_text, faq_page_main_title, faq_page_contact_prompt_text, rules_page_content, offer_page_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        [SETTINGS_ROW_ID, 
         getDefaultSettings().site_name, 
         getDefaultSettings().site_description,
         getDefaultSettings().footer_text,
         getDefaultSettings().faq_page_main_title,
         getDefaultSettings().faq_page_contact_prompt_text,
         getDefaultSettings().rules_page_content,
         getDefaultSettings().offer_page_content
        ]);
        const newResults = await query('SELECT * FROM site_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
        if (Array.isArray(newResults) && newResults.length > 0) {
          settingsFromDb = newResults[0];
           console.log('[API GET /admin/site-settings] Minimal row created and fetched:', settingsFromDb);
        } else {
          console.log('[API GET /admin/site-settings] Minimal row still not found after insert attempt.');
        }
      } catch (insertError: any) {
         console.error('[API GET /admin/site-settings] Error inserting minimal default settings row:', insertError.message);
      }
    }
  } catch (fetchError: any) {
      if (fetchError.code === 'ER_NO_SUCH_TABLE') {
          console.warn('[API GET /admin/site-settings] site_settings table does not exist. This is expected on first run or if migrations are pending. Returning hardcoded defaults.');
          try {
            // Attempt to create the table with all fields
             await query(`
                CREATE TABLE IF NOT EXISTS site_settings (
                    id INT NOT NULL DEFAULT 1,
                    site_name VARCHAR(255) NULL,
                    site_description TEXT NULL,
                    logo_url VARCHAR(512) NULL,
                    footer_text TEXT NULL,
                    contact_vk_label VARCHAR(255) NULL,
                    contact_vk_url VARCHAR(512) NULL,
                    contact_telegram_bot_label VARCHAR(255) NULL,
                    contact_telegram_bot_url VARCHAR(512) NULL,
                    contact_email_label VARCHAR(255) NULL,
                    contact_email_address VARCHAR(255) NULL,
                    footer_marketplace_text VARCHAR(255) NULL,
                    footer_marketplace_logo_url VARCHAR(512) NULL,
                    footer_marketplace_link_url VARCHAR(512) NULL,
                    footer_marketplace_is_visible BOOLEAN DEFAULT TRUE,
                    faq_page_main_title VARCHAR(255) NULL,
                    faq_page_contact_prompt_text VARCHAR(500) NULL,
                    rules_page_content LONGTEXT NULL,
                    offer_page_content LONGTEXT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    CONSTRAINT pk_site_settings_id_is_1 CHECK (id = 1)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            // Insert default row
            await query('INSERT IGNORE INTO site_settings (id, site_name, site_description, footer_text, faq_page_main_title, faq_page_contact_prompt_text, rules_page_content, offer_page_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
            [SETTINGS_ROW_ID, 
             getDefaultSettings().site_name, 
             getDefaultSettings().site_description,
             getDefaultSettings().footer_text,
             getDefaultSettings().faq_page_main_title,
             getDefaultSettings().faq_page_contact_prompt_text,
             getDefaultSettings().rules_page_content,
             getDefaultSettings().offer_page_content
            ]);
            console.log('[API GET /admin/site-settings] site_settings table created and default row inserted.');
          } catch (createTableError: any) {
            console.error('[API GET /admin/site-settings] CRITICAL: Failed to create site_settings table:', createTableError.message);
          }
      } else {
          console.error('[API GET /admin/site-settings] Error fetching site_settings:', fetchError.message);
      }
  }
  
  const defaults = getDefaultSettings();
  const mergedSettings: SiteSettings = {
      ...defaults,
      ...settingsFromDb,
      id: SETTINGS_ROW_ID,
      footer_marketplace_is_visible: settingsFromDb.footer_marketplace_is_visible !== undefined ? Boolean(settingsFromDb.footer_marketplace_is_visible) : defaults.footer_marketplace_is_visible,
      faq_page_main_title: settingsFromDb.faq_page_main_title || defaults.faq_page_main_title,
      faq_page_contact_prompt_text: settingsFromDb.faq_page_contact_prompt_text || defaults.faq_page_contact_prompt_text,
      rules_page_content: settingsFromDb.rules_page_content || defaults.rules_page_content,
      offer_page_content: settingsFromDb.offer_page_content || defaults.offer_page_content,
  };
  console.log('[API GET /admin/site-settings] Returning merged settings:', mergedSettings);
  return NextResponse.json(mergedSettings);
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API PUT /admin/site-settings] Received body for update:', body);

    await query('INSERT IGNORE INTO site_settings (id) VALUES (?)', [SETTINGS_ROW_ID]);
    console.log('[API PUT /admin/site-settings] Ensured settings row with id=1 exists.');

    const updateFields: string[] = [];
    const queryParams: any[] = [];
    
    const editableFields: (keyof SiteSettings)[] = [
        'site_name', 'site_description', 'logo_url', 'footer_text',
        'contact_vk_label', 'contact_vk_url',
        'contact_telegram_bot_label', 'contact_telegram_bot_url',
        'contact_email_label', 'contact_email_address',
        'footer_marketplace_text', 'footer_marketplace_logo_url', 
        'footer_marketplace_link_url', 'footer_marketplace_is_visible',
        'faq_page_main_title', 'faq_page_contact_prompt_text',
        'rules_page_content', 'offer_page_content'
    ];

    editableFields.forEach(key => {
      if (body[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        let valueToPush = body[key];
        if (key === 'footer_marketplace_is_visible') {
            valueToPush = Boolean(body[key]);
        } else if (valueToPush === '' && key !== 'rules_page_content' && key !== 'offer_page_content') { // Allow empty string for content
            valueToPush = null;
        }
        queryParams.push(valueToPush);
      }
    });

    if (updateFields.length === 0) {
      const currentSettingsResult = await query('SELECT * FROM site_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
      let currentSettings = getDefaultSettings();
      if (Array.isArray(currentSettingsResult) && currentSettingsResult.length > 0) {
          currentSettings = { 
            ...currentSettings, 
            ...currentSettingsResult[0], 
            footer_marketplace_is_visible: Boolean(currentSettingsResult[0].footer_marketplace_is_visible),
            faq_page_main_title: currentSettingsResult[0].faq_page_main_title || currentSettings.faq_page_main_title,
            faq_page_contact_prompt_text: currentSettingsResult[0].faq_page_contact_prompt_text || currentSettings.faq_page_contact_prompt_text,
            rules_page_content: currentSettingsResult[0].rules_page_content || currentSettings.rules_page_content,
            offer_page_content: currentSettingsResult[0].offer_page_content || currentSettings.offer_page_content,
          };
      }
      console.log('[API PUT /admin/site-settings] No fields to update. Returning current settings.');
      return NextResponse.json({ message: 'No settings provided to update.', settings: currentSettings }, { status: 200 });
    }

    updateFields.push('updated_at = NOW()');
    queryParams.push(SETTINGS_ROW_ID);

    const updateQuery = `UPDATE site_settings SET ${updateFields.join(', ')} WHERE id = ?`;
    
    console.log('[API PUT /admin/site-settings] Executing SQL update:', updateQuery);
    console.log('[API PUT /admin/site-settings] Update Parameters:', queryParams);
    
    await query(updateQuery, queryParams);
    
    const updatedSettingsResult = await query('SELECT * FROM site_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    let finalSettings = getDefaultSettings();
    if (Array.isArray(updatedSettingsResult) && updatedSettingsResult.length > 0) {
        finalSettings = { 
            ...finalSettings, 
            ...updatedSettingsResult[0], 
            footer_marketplace_is_visible: Boolean(updatedSettingsResult[0].footer_marketplace_is_visible),
            faq_page_main_title: updatedSettingsResult[0].faq_page_main_title || finalSettings.faq_page_main_title,
            faq_page_contact_prompt_text: updatedSettingsResult[0].faq_page_contact_prompt_text || finalSettings.faq_page_contact_prompt_text,
            rules_page_content: updatedSettingsResult[0].rules_page_content || finalSettings.rules_page_content,
            offer_page_content: updatedSettingsResult[0].offer_page_content || finalSettings.offer_page_content,
        };
    }
    console.log('[API PUT /admin/site-settings] Returning updated settings:', finalSettings);
    return NextResponse.json({ message: 'Настройки сайта успешно обновлены.', settings: finalSettings }, { status: 200 });

  } catch (error: any) {
    console.error('[API PUT /admin/site-settings] Error:', error.message);
    if (error.code === 'ER_BAD_FIELD_ERROR' || error.message.includes('Unknown column')) {
        return NextResponse.json({ message: `Ошибка обновления: одна из колонок не существует в таблице 'site_settings'. Проверьте структуру таблицы или выполните предоставленный SQL-запрос для ее обновления. Детали: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    


// src/app/api/site-settings-public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SiteSettings } from '@/types';

const SETTINGS_ROW_ID = 1; // Assuming settings are stored in a single row with id=1

export async function GET(request: NextRequest) {
  try {
    const results = await query(
        'SELECT site_name, site_description, logo_url, footer_text, ' +
        'contact_vk_label, contact_vk_url, ' +
        'contact_telegram_bot_label, contact_telegram_bot_url, ' +
        'contact_email_label, contact_email_address, ' +
        'footer_marketplace_text, footer_marketplace_logo_url, footer_marketplace_link_url, footer_marketplace_is_visible ' +
        'FROM site_settings WHERE id = ? LIMIT 1', 
        [SETTINGS_ROW_ID]
    );
    
    const defaults: Partial<SiteSettings> = {
      site_name: 'Green Hack',
      site_description: 'Лучшие читы для ваших любимых игр!',
      logo_url: null,
      footer_text: `© ${new Date().getFullYear()} Green Hack. Все права защищены.`,
      contact_vk_label: 'Наша беседа VK',
      contact_vk_url: 'https://vk.me/join/N50c5_sVvoiYHfL5cGe5/Vc2bvcEWGBGzAw=',
      contact_telegram_bot_label: 'Наш Telegram Бот',
      contact_telegram_bot_url: 'https://t.me/NetUnitOfficial_Bot',
      contact_email_label: 'Email поддержки',
      contact_email_address: 'support@greenhacks.ru',
      footer_marketplace_text: 'Мы продаем на:',
      footer_marketplace_logo_url: 'https://yougame.biz/images/rlm/logo/logoconcept4.png',
      footer_marketplace_link_url: 'https://yougame.biz/members/263428/',
      footer_marketplace_is_visible: true,
    };
    
    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(defaults);
    }
    
    const dbSettings = results[0];
    const settings: Partial<SiteSettings> = {
        site_name: dbSettings.site_name || defaults.site_name,
        site_description: dbSettings.site_description || defaults.site_description,
        logo_url: dbSettings.logo_url || defaults.logo_url,
        footer_text: dbSettings.footer_text || defaults.footer_text,
        contact_vk_label: dbSettings.contact_vk_label || defaults.contact_vk_label,
        contact_vk_url: dbSettings.contact_vk_url || defaults.contact_vk_url,
        contact_telegram_bot_label: dbSettings.contact_telegram_bot_label || defaults.contact_telegram_bot_label,
        contact_telegram_bot_url: dbSettings.contact_telegram_bot_url || defaults.contact_telegram_bot_url,
        contact_email_label: dbSettings.contact_email_label || defaults.contact_email_label,
        contact_email_address: dbSettings.contact_email_address || defaults.contact_email_address,
        footer_marketplace_text: dbSettings.footer_marketplace_text || defaults.footer_marketplace_text,
        footer_marketplace_logo_url: dbSettings.footer_marketplace_logo_url || defaults.footer_marketplace_logo_url,
        footer_marketplace_link_url: dbSettings.footer_marketplace_link_url || defaults.footer_marketplace_link_url,
        footer_marketplace_is_visible: dbSettings.footer_marketplace_is_visible !== undefined ? Boolean(dbSettings.footer_marketplace_is_visible) : defaults.footer_marketplace_is_visible,
    };
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('API Public Site Settings GET Error:', error);
    const defaultSettingsOnError: Partial<SiteSettings> = {
        site_name: 'Green Hack (Error)',
        footer_text: `© ${new Date().getFullYear()} Green Hack.`,
        contact_vk_label: 'VK', contact_vk_url: '#',
        contact_telegram_bot_label: 'Telegram', contact_telegram_bot_url: '#',
        contact_email_label: 'Email', contact_email_address: 'error@example.com',
        footer_marketplace_text: 'Мы продаем на:', footer_marketplace_logo_url: 'https://yougame.biz/images/rlm/logo/logoconcept4.png',
        footer_marketplace_link_url: 'https://yougame.biz/members/263428/', footer_marketplace_is_visible: true,
    };
    return NextResponse.json(defaultSettingsOnError, { status: 500 }); 
  }
}


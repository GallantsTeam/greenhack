
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
        'footer_marketplace_text, footer_marketplace_logo_url, footer_marketplace_link_url, footer_marketplace_is_visible, ' +
        'faq_page_main_title, faq_page_contact_prompt_text, ' + // Added FAQ fields
        'rules_page_content, offer_page_content, ' + // Added Rules and Offer content
        'homepage_popular_categories_title, homepage_advantages, homepage_show_case_opening_block, ' +
        'homepage_case_opening_title, homepage_case_opening_subtitle ' +
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
      faq_page_main_title: 'Часто Задаваемые Вопросы',
      faq_page_contact_prompt_text: 'Не нашли ответ на свой вопрос? Напишите в поддержку',
      rules_page_content: '<p>Правила сайта еще не опубликованы.</p>',
      offer_page_content: '<p>Текст публичной оферты еще не опубликован.</p>',
      homepage_popular_categories_title: 'ПОПУЛЯРНЫЕ КАТЕГОРИИ',
      homepage_advantages: [
        {"icon": "DollarSign", "text": "Доступные цены"},
        {"icon": "Headphones", "text": "Отзывчивая поддержка"},
        {"icon": "Dices", "text": "Большой выбор игр"},
        {"icon": "ThumbsUp", "text": "Хорошие отзывы"}
      ],
      homepage_show_case_opening_block: true,
      homepage_case_opening_title: 'ИСПЫТАЙ УДАЧУ!',
      homepage_case_opening_subtitle: 'Откройте кейс и получите шанс выиграть ценный приз'
    };
    
    let dbSettings = {};
    if (Array.isArray(results) && results.length > 0) {
      dbSettings = results[0];
    }
    
    const settings: SiteSettings = {
        id: SETTINGS_ROW_ID,
        site_name: (dbSettings as any).site_name || defaults.site_name,
        site_description: (dbSettings as any).site_description || defaults.site_description,
        logo_url: (dbSettings as any).logo_url || defaults.logo_url,
        footer_text: (dbSettings as any).footer_text || defaults.footer_text,
        contact_vk_label: (dbSettings as any).contact_vk_label || defaults.contact_vk_label,
        contact_vk_url: (dbSettings as any).contact_vk_url || defaults.contact_vk_url,
        contact_telegram_bot_label: (dbSettings as any).contact_telegram_bot_label || defaults.contact_telegram_bot_label,
        contact_telegram_bot_url: (dbSettings as any).contact_telegram_bot_url || defaults.contact_telegram_bot_url,
        contact_email_label: (dbSettings as any).contact_email_label || defaults.contact_email_label,
        contact_email_address: (dbSettings as any).contact_email_address || defaults.contact_email_address,
        footer_marketplace_text: (dbSettings as any).footer_marketplace_text || defaults.footer_marketplace_text,
        footer_marketplace_logo_url: (dbSettings as any).footer_marketplace_logo_url || defaults.footer_marketplace_logo_url,
        footer_marketplace_link_url: (dbSettings as any).footer_marketplace_link_url || defaults.footer_marketplace_link_url,
        footer_marketplace_is_visible: (dbSettings as any).footer_marketplace_is_visible !== undefined ? Boolean((dbSettings as any).footer_marketplace_is_visible) : defaults.footer_marketplace_is_visible,
        faq_page_main_title: (dbSettings as any).faq_page_main_title || defaults.faq_page_main_title,
        faq_page_contact_prompt_text: (dbSettings as any).faq_page_contact_prompt_text || defaults.faq_page_contact_prompt_text,
        rules_page_content: (dbSettings as any).rules_page_content || defaults.rules_page_content,
        offer_page_content: (dbSettings as any).offer_page_content || defaults.offer_page_content,
        homepage_popular_categories_title: (dbSettings as any).homepage_popular_categories_title || defaults.homepage_popular_categories_title,
        homepage_advantages: (dbSettings as any).homepage_advantages ? (typeof (dbSettings as any).homepage_advantages === 'string' ? JSON.parse((dbSettings as any).homepage_advantages) : (dbSettings as any).homepage_advantages) : defaults.homepage_advantages,
        homepage_show_case_opening_block: (dbSettings as any).homepage_show_case_opening_block !== undefined ? Boolean((dbSettings as any).homepage_show_case_opening_block) : defaults.homepage_show_case_opening_block,
        homepage_case_opening_title: (dbSettings as any).homepage_case_opening_title || defaults.homepage_case_opening_title,
        homepage_case_opening_subtitle: (dbSettings as any).homepage_case_opening_subtitle || defaults.homepage_case_opening_subtitle,
    };
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('API Public Site Settings GET Error:', error);
    // Fallback to defaults in case of any error
    const defaultSettingsOnError: SiteSettings = {
        id: SETTINGS_ROW_ID,
        site_name: 'Green Hack (Error)',
        site_description: 'Site description error.',
        logo_url: null,
        footer_text: `© ${new Date().getFullYear()} Green Hack.`,
        contact_vk_label: 'VK', contact_vk_url: '#',
        contact_telegram_bot_label: 'Telegram', contact_telegram_bot_url: '#',
        contact_email_label: 'Email', contact_email_address: 'error@example.com',
        footer_marketplace_text: 'Мы продаем на:', footer_marketplace_logo_url: 'https://yougame.biz/images/rlm/logo/logoconcept4.png',
        footer_marketplace_link_url: 'https://yougame.biz/members/263428/', footer_marketplace_is_visible: true,
        faq_page_main_title: 'Часто Задаваемые Вопросы (Ошибка)',
        faq_page_contact_prompt_text: 'Свяжитесь с поддержкой (Ошибка).',
        rules_page_content: '<p>Ошибка загрузки правил сайта.</p>',
        offer_page_content: '<p>Ошибка загрузки публичной оферты.</p>',
        homepage_popular_categories_title: 'ПОПУЛЯРНЫЕ КАТЕГОРИИ (Ошибка)',
        homepage_advantages: [],
        homepage_show_case_opening_block: true,
        homepage_case_opening_title: 'ИСПЫТАЙ УДАЧУ! (Ошибка)',
        homepage_case_opening_subtitle: 'Ошибка загрузки описания кейса.',
    };
    return NextResponse.json(defaultSettingsOnError, { status: 500 });
  }
}

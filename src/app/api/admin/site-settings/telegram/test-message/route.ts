
// src/app/api/admin/site-settings/telegram/test-message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { sendTelegramMessage } from '@/lib/telegram'; 
import type { SiteTelegramSettings } from '@/types';

const SETTINGS_ROW_ID = 1;

export async function POST(request: NextRequest) {
  try {
    // TODO: Add proper admin authentication check here
    const { botType, message } = await request.json();

    if (!botType || !message || !['client', 'admin', 'key'].includes(botType)) {
      return NextResponse.json({ message: 'Некорректный тип бота или отсутствует сообщение.' }, { status: 400 });
    }

    const settingsResults = await query('SELECT * FROM site_telegram_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    if (!Array.isArray(settingsResults) || settingsResults.length === 0) {
      return NextResponse.json({ message: 'Настройки Telegram не найдены.' }, { status: 404 });
    }
    const config: SiteTelegramSettings = settingsResults[0];

    let token: string | null | undefined;
    let chatIdInput: string | null | undefined;

    switch(botType) {
        case 'client':
            token = config.client_bot_token;
            chatIdInput = config.client_bot_chat_id;
            break;
        case 'admin':
            token = config.admin_bot_token;
            chatIdInput = config.admin_bot_chat_ids;
            break;
        case 'key': 
            token = config.key_bot_token;
            chatIdInput = config.key_bot_admin_chat_ids;
            break;
        default:
            return NextResponse.json({ message: 'Неизвестный тип бота.' }, { status: 400 });
    }


    if (!token) {
      return NextResponse.json({ message: `Токен для ${botType} бота не настроен.` }, { status: 400 });
    }
    if (!chatIdInput) {
        return NextResponse.json({ message: `ID чата(ов) для ${botType} бота не настроен.` }, { status: 400 });
    }
    
    const chatIds = chatIdInput.split(',').map(id => id.trim()).filter(id => id);
    if (chatIds.length === 0) {
        return NextResponse.json({ message: `Не указаны корректные ID чата(ов) для ${botType} бота.` }, { status: 400 });
    }

    let allSentSuccessfully = true;
    let firstErrorResult: { success: boolean; message?: string; error?: any } | null = null;

    for (const chatId of chatIds) {
        const result = await sendTelegramMessage(token, chatId, message);
        if (!result.success) {
            allSentSuccessfully = false;
            if (!firstErrorResult) firstErrorResult = result;
            console.error(`Failed to send test message to ${chatId} for ${botType} bot:`, result.error);
        }
    }

    if (allSentSuccessfully) {
      return NextResponse.json({ message: `Тестовое сообщение успешно отправлено на ${chatIds.join(', ')} через ${botType} бота.` });
    } else {
      const errorMessageDetail = firstErrorResult?.message || firstErrorResult?.error?.description || 'Неизвестная ошибка отправки.';
      return NextResponse.json({ message: `Не удалось отправить тестовое сообщение на один или несколько чатов. Первая ошибка: ${errorMessageDetail}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Send Test Telegram Error:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}

    

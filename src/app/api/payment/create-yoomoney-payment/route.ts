
// src/app/api/payment/create-yoomoney-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SitePaymentGatewaySettings, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import type { OkPacket } from 'mysql2';
import { notifyAdminOnBalanceDeposit } from '@/lib/telegram';
// import { sendBalanceUpdateEmail } from '@/lib/email'; // You can re-enable if SMTP is configured

export async function POST(request: NextRequest) {
  console.log('[API Create YooMoney Payment] Received request');
  try {
    const { userId, amountGh } = await request.json();
    console.log('[API Create YooMoney Payment] Request Body:', { userId, amountGh });

    if (!userId || typeof amountGh !== 'number' || amountGh <= 0) {
      return NextResponse.json({ message: 'Неверный ID пользователя или сумма.' }, { status: 400 });
    }

    const usersFound = await query('SELECT id, username, email FROM users WHERE id = ?', [userId]);
    if (!Array.isArray(usersFound) || usersFound.length === 0) {
      return NextResponse.json({ message: 'Пользователь не найден.' }, { status: 404 });
    }
    const user: User = usersFound[0];

    const settingsResults = await query('SELECT yoomoney_shop_id, yoomoney_secret_key FROM site_payment_gateway_settings WHERE id = 1 LIMIT 1');
    if (!Array.isArray(settingsResults) || settingsResults.length === 0 || !settingsResults[0].yoomoney_shop_id || !settingsResults[0].yoomoney_secret_key) {
      console.error('[API Create YooMoney Payment] YooMoney settings not configured in the database (Shop ID or Secret Key missing).');
      return NextResponse.json({ message: 'Настройки YooMoney не полностью сконфигурированы в системе (Shop ID или Secret Key отсутствует).' }, { status: 500 });
    }
    const yoomoneySettings: SitePaymentGatewaySettings = settingsResults[0];

    const idempotencyKey = uuidv4();
    const paymentDescription = `Пополнение баланса GreenHacks для ${user.username} на ${amountGh} GH`;
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
        console.error("[API Create YooMoney Payment] CRITICAL: NEXT_PUBLIC_SITE_URL is not defined in environment variables! Payment URLs will be incorrect. Please set this variable in your .env.local file (e.g., NEXT_PUBLIC_SITE_URL=http://localhost:3000 for local development, or your actual production URL).");
        return NextResponse.json({ message: "Ошибка конфигурации сервера: URL сайта (NEXT_PUBLIC_SITE_URL) не определен в переменных окружения. Пожалуйста, настройте его в файле .env.local и перезапустите сервер." }, { status: 500 });
    }
    console.log(`[API Create YooMoney Payment] Using NEXT_PUBLIC_SITE_URL: ${siteUrl}`);

    const paymentRecordResult = await query(
      'INSERT INTO payment_requests (user_id, username, amount_gh, status, payment_method_details, external_payment_id, payment_gateway) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, user.username, amountGh, 'pending_yoomoney', `YooMoney Касса (Сумма: ${amountGh} GH)`, idempotencyKey, 'yoomoney']
    ) as OkPacket;
    const paymentRequestId = paymentRecordResult.insertId;

    // --- ВАЖНО: Это симуляция. Здесь должен быть реальный вызов к API ЮMoney ---
    console.log(`[API Create YooMoney Payment] SIMULATING YooMoney API call for Request ID: ${paymentRequestId}, External ID: ${idempotencyKey}`);
    // const yooMoneyPayload = {
    //   amount: { value: amountGh.toFixed(2), currency: 'RUB' },
    //   capture: true,
    //   confirmation: {
    //     type: 'redirect',
    //     return_url: new URL(`/payment/success?orderId=${paymentRequestId}&provider=yoomoney`, siteUrl).toString(),
    //   },
    //   description: paymentDescription,
    //   metadata: { paymentRequestId: paymentRequestId.toString(), userId: userId.toString() },
    // };
    // const authHeader = `Basic ${Buffer.from(`${yoomoneySettings.yoomoney_shop_id}:${yoomoneySettings.yoomoney_secret_key}`).toString('base64')}`;
    // try {
    //   const yooMoneyResponse = await fetch('https://api.yookassa.ru/v3/payments', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Idempotence-Key': idempotencyKey,
    //       'Authorization': authHeader,
    //     },
    //     body: JSON.stringify(yooMoneyPayload),
    //   });
    //   const yooMoneyData = await yooMoneyResponse.json();
    //   if (!yooMoneyResponse.ok || !yooMoneyData.confirmation || !yooMoneyData.confirmation.confirmation_url) {
    //     console.error('[API Create YooMoney Payment] YooMoney API Error:', yooMoneyData);
    //     await query('UPDATE payment_requests SET status = ?, admin_notes = ? WHERE id = ?', ['failed', `Ошибка API ЮMoney: ${yooMoneyData.type} - ${yooMoneyData.description || 'Unknown error'}`, paymentRequestId]);
    //     throw new Error(yooMoneyData.description || 'Failed to create YooMoney payment');
    //   }
    //   // Если реальный вызов, то confirmation_url будет от ЮMoney
    //   const confirmationUrl = yooMoneyData.confirmation.confirmation_url;
    //   // Можно обновить external_payment_id на реальный ID от ЮMoney, если он отличается от idempotencyKey
    //   // await query('UPDATE payment_requests SET external_payment_id = ? WHERE id = ?', [yooMoneyData.id, paymentRequestId]);
    //   console.log(`[API Create YooMoney Payment] YooMoney payment created. ID: ${yooMoneyData.id}, Confirmation URL: ${confirmationUrl}`);
    //   return NextResponse.json({ confirmation_url: confirmationUrl, paymentRequestId, externalPaymentId: yooMoneyData.id });
    // } catch (apiError: any) {
    //   console.error('[API Create YooMoney Payment] Error calling YooMoney API:', apiError);
    //   await query('UPDATE payment_requests SET status = ?, admin_notes = ? WHERE id = ?', ['failed', `Ошибка API: ${apiError.message}`, paymentRequestId]);
    //   return NextResponse.json({ message: `Ошибка при создании платежа через ЮMoney: ${apiError.message}` }, { status: 502 });
    // }
    // --- Конец симуляции ---

    // Для симуляции используем наш success URL
    let simulatedConfirmationUrl = '';
    try {
        simulatedConfirmationUrl = new URL(`/payment/success?orderId=${paymentRequestId}&sim_yoo_id=${idempotencyKey}&amount=${amountGh}`, siteUrl).toString();
    } catch (e) {
        console.error(`[API Create YooMoney Payment] Error constructing fallback URL:`, e);
        // Fallback to a relative path or a more generic error if URL construction fails.
        // This state shouldn't be reached if siteUrl is validated correctly.
        return NextResponse.json({ message: "Критическая ошибка конфигурации URL. Уведомите администратора." }, { status: 500 });
    }

    console.log(`[API Create YooMoney Payment] Simulated. User: ${user.username}, Amount: ${amountGh} GH, Request ID: ${paymentRequestId}, External ID (sim): ${idempotencyKey}, Conf URL (sim): ${simulatedConfirmationUrl}`);

    return NextResponse.json({ 
      message: 'Запрос на оплату через YooMoney (симуляция) создан.',
      confirmation_url: simulatedConfirmationUrl, 
      paymentRequestId: paymentRequestId,
      externalPaymentId: idempotencyKey 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API Create YooMoney Payment] Outer Error:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}

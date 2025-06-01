
// src/app/api/payment/yoomoney-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { PaymentRequest, User, SitePaymentGatewaySettings, SiteNotificationSettings } from '@/types';
import { sendBalanceUpdateEmail } from '@/lib/email';
import { notifyAdminOnBalanceDeposit } from '@/lib/telegram';

const SETTINGS_ROW_ID = 1;

export async function POST(request: NextRequest) {
  const rawBody = await request.text(); // Get raw body for potential signature verification
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    console.error('[YooMoney Webhook] Invalid JSON body:', rawBody);
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }
  
  console.log('[YooMoney Webhook] Received notification:', JSON.stringify(body, null, 2));

  // TODO: Implement robust signature verification from YooMoney if they provide one.
  // For IP verification, get gateway settings if they list allowed IPs.

  const eventType = body.event;
  const paymentObject = body.object;

  if (!eventType || !paymentObject || !paymentObject.id) {
    console.error('[YooMoney Webhook] Invalid notification structure:', body);
    return NextResponse.json({ message: 'Invalid notification structure' }, { status: 400 });
  }

  const externalPaymentId = paymentObject.id;
  const paymentRequestId = paymentObject.metadata?.paymentRequestId; // Our internal ID

  try {
    const settingsResults = await query('SELECT * FROM site_payment_gateway_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    if (!settingsResults || settingsResults.length === 0) {
        console.error('[YooMoney Webhook] Site payment gateway settings not found.');
        return NextResponse.json({ message: 'Internal configuration error.' }, { status: 500 });
    }
    const paymentSettings: SitePaymentGatewaySettings = {
        ...settingsResults[0],
        is_test_mode_active: Boolean(settingsResults[0].is_test_mode_active)
    };

    if (paymentSettings.is_test_mode_active) {
        console.log('[YooMoney Webhook] Test mode is active. Webhook processing skipped for live payment simulation logic.');
        // In test mode, we might still want to log or process specific simulated webhooks if needed.
        // For now, we just acknowledge and return.
        return NextResponse.json({ message: 'Webhook received in test mode. No balance updated.' }, { status: 200 });
    }


    const requestResults = await query('SELECT * FROM payment_requests WHERE id = ? AND external_payment_id = ?', [paymentRequestId, externalPaymentId]);
    if (requestResults.length === 0) {
      console.error(`[YooMoney Webhook] PaymentRequest not found for ID: ${paymentRequestId} and External ID: ${externalPaymentId}`);
      return NextResponse.json({ message: 'Original payment request not found or ID mismatch.' }, { status: 404 });
    }
    const paymentRequest: PaymentRequest = requestResults[0];

    if (eventType === 'payment.succeeded') {
      if (!paymentSettings.yoomoney_notify_payment_succeeded) {
        console.log('[YooMoney Webhook] payment.succeeded notification type is disabled in settings. Skipping.');
        return NextResponse.json({ message: 'Notification type disabled.' }, { status: 200 });
      }

      if (paymentRequest.status === 'approved') {
        console.log(`[YooMoney Webhook] PaymentRequest ID ${paymentRequestId} already approved. Idempotency.`);
        return NextResponse.json({ message: 'Payment already processed.' }, { status: 200 });
      }
      if (paymentRequest.status !== 'pending_yoomoney') {
        console.warn(`[YooMoney Webhook] PaymentRequest ID ${paymentRequestId} has unexpected status: ${paymentRequest.status}`);
        // Decide if this should be an error or just a log.
      }

      const amountFromYooMoney = parseFloat(paymentObject.amount.value);
      const amountFromRequest = parseFloat(paymentRequest.amount_gh as any);

      if (amountFromYooMoney !== amountFromRequest) {
        console.error(`[YooMoney Webhook] Amount mismatch for PaymentRequest ID ${paymentRequestId}. YooMoney: ${amountFromYooMoney}, DB: ${amountFromRequest}`);
        await query('UPDATE payment_requests SET status = ?, admin_notes = ? WHERE id = ?', ['failed', `Сумма не совпадает. YooMoney: ${amountFromYooMoney}, Ожидалось: ${amountFromRequest}`, paymentRequestId]);
        return NextResponse.json({ message: 'Amount mismatch.' }, { status: 400 });
      }
      
      // --- Database Transaction Start (Conceptual) ---
      try {
        const userResults = await query('SELECT * FROM users WHERE id = ?', [paymentRequest.user_id]);
        if (userResults.length === 0) throw new Error(`User ${paymentRequest.user_id} not found for payment.`);
        const user: User = userResults[0];
        const currentBalance = parseFloat(user.balance as any || '0');
        const newBalance = currentBalance + amountFromYooMoney;

        await query('UPDATE users SET balance = ? WHERE id = ?', [newBalance.toFixed(2), paymentRequest.user_id]);

        const transactionDescription = `Пополнение через YooMoney. ID платежа: ${externalPaymentId}. Заявка #${paymentRequestId}.`;
        await query(
          'INSERT INTO balance_transactions (user_id, transaction_type, amount_gh, description, related_payment_request_id) VALUES (?, ?, ?, ?, ?)',
          [paymentRequest.user_id, 'deposit', amountFromYooMoney, transactionDescription, paymentRequestId]
        );
        
        await query('UPDATE payment_requests SET status = ?, updated_at = NOW() WHERE id = ?', ['approved', paymentRequestId]);
        // --- Database Transaction Commit (Conceptual) ---

        // Send Notifications (Email & Telegram)
        try {
            const notificationSettingsResults = await query('SELECT notify_on_balance_deposit FROM site_notification_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
            if (notificationSettingsResults.length > 0 && Boolean(notificationSettingsResults[0].notify_on_balance_deposit)) {
                await sendBalanceUpdateEmail(user.email, user.username, amountFromYooMoney, `YooMoney: ${externalPaymentId}`, newBalance);
            }
        } catch (emailError) { console.error("[YooMoney Webhook] Failed to send email notification:", emailError); }
        
        try {
            await notifyAdminOnBalanceDeposit(user.id, user.username, amountFromYooMoney, `YooMoney: ${externalPaymentId}`);
        } catch (telegramError) { console.error("[YooMoney Webhook] Failed to send Telegram admin notification:", telegramError); }


      } catch (dbError: any) {
        // --- Database Transaction Rollback (Conceptual) ---
        console.error('[YooMoney Webhook] DB Error during payment.succeeded processing:', dbError);
        return NextResponse.json({ message: `DB error processing webhook: ${dbError.message}` }, { status: 500 });
      }

    } else if (eventType === 'payment.canceled') {
      if (!paymentSettings.yoomoney_notify_payment_canceled) {
        console.log('[YooMoney Webhook] payment.canceled notification type is disabled in settings. Skipping.');
        return NextResponse.json({ message: 'Notification type disabled.' }, { status: 200 });
      }
      if (paymentRequest.status === 'pending_yoomoney') {
        await query('UPDATE payment_requests SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?', ['rejected', 'Платеж отменен или не прошел в YooMoney.', paymentRequestId]);
      }
    } else if (eventType === 'refund.succeeded') {
       if (!paymentSettings.yoomoney_notify_refund_succeeded) {
        console.log('[YooMoney Webhook] refund.succeeded notification type is disabled in settings. Skipping.');
        return NextResponse.json({ message: 'Notification type disabled.' }, { status: 200 });
      }
      // Handle refund logic: update payment_request, deduct from user balance, add balance_transaction
      console.log(`[YooMoney Webhook] Refund succeeded for YooMoney payment ID: ${externalPaymentId}, our request ID: ${paymentRequestId}`);
       const refundAmount = parseFloat(paymentObject.amount.value);
       await query('UPDATE payment_requests SET status = ?, admin_notes = CONCAT(COALESCE(admin_notes, \'\'), ?, "Возврат через YooMoney на сумму ", ?) WHERE id = ?', 
        ['refunded', paymentObject.description ? `Причина возврата: ${paymentObject.description}. ` : '', refundAmount.toFixed(2), paymentRequestId]);
       // Note: You might need to create a negative balance transaction here for the user.
    } else if (eventType === 'payment.waiting_for_capture') {
        if (!paymentSettings.yoomoney_notify_payment_waiting_for_capture) {
            console.log('[YooMoney Webhook] payment.waiting_for_capture notification type is disabled in settings. Skipping.');
            return NextResponse.json({ message: 'Notification type disabled.' }, { status: 200 });
        }
        console.log(`[YooMoney Webhook] Payment waiting for capture for YooMoney payment ID: ${externalPaymentId}, our request ID: ${paymentRequestId}`);
        // Typically, you'd update your payment_request status to something like 'waiting_for_capture'
        // if (paymentRequest.status === 'pending_yoomoney') {
        //   await query('UPDATE payment_requests SET status = ?, updated_at = NOW() WHERE id = ?', ['waiting_for_capture', paymentRequestId]);
        // }
    } else {
      console.log(`[YooMoney Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });

  } catch (error: any) {
    console.error('[YooMoney Webhook] Outer Error:', error);
    return NextResponse.json({ message: `Webhook processing error: ${error.message}` }, { status: 500 });
  }
}
    
    
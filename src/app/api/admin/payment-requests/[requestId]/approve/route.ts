
// src/app/api/admin/payment-requests/[requestId]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { PaymentRequest, User } from '@/types';
import { OkPacket } from 'mysql2';
import { notifyAdminOnBalanceDeposit } from '@/lib/telegram';
// import { sendBalanceUpdateEmail } from '@/lib/email'; // Assuming email notifications might be re-enabled later

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const requestId = parseInt(params.requestId, 10);
  if (isNaN(requestId)) {
    return NextResponse.json({ message: 'Invalid request ID' }, { status: 400 });
  }
  console.log(`[API ApprovePayment] Approving request ID: ${requestId}`);

  try {
    const requestResults = await query('SELECT * FROM payment_requests WHERE id = ? AND status = ?', [requestId, 'pending']);
    if (!Array.isArray(requestResults) || requestResults.length === 0) {
      console.log(`[API ApprovePayment] Request ${requestId} not found or not pending.`);
      return NextResponse.json({ message: 'Заявка не найдена или уже обработана.' }, { status: 404 });
    }
    const paymentRequest: PaymentRequest = requestResults[0];
    console.log(`[API ApprovePayment] Found payment request:`, paymentRequest);

    const userResults = await query('SELECT id, username, email, balance FROM users WHERE id = ?', [paymentRequest.user_id]);
    if (!Array.isArray(userResults) || userResults.length === 0) {
        console.log(`[API ApprovePayment] User ${paymentRequest.user_id} not found for request ${requestId}. Rejecting request.`);
        await query('UPDATE payment_requests SET status = ?, admin_notes = ? WHERE id = ?', ['rejected', 'Пользователь не найден при попытке одобрения.', requestId]);
        return NextResponse.json({ message: 'Пользователь для этой заявки не найден.' }, { status: 404 });
    }
    const user: User = userResults[0];
    const currentBalance = parseFloat(user.balance as any || '0');
    const newBalance = currentBalance + parseFloat(paymentRequest.amount_gh as any);
    console.log(`[API ApprovePayment] User ${user.username} current balance: ${currentBalance}, amount to add: ${paymentRequest.amount_gh}, new balance: ${newBalance}`);

    // --- Start Transaction (conceptually) ---
    try {
      console.log(`[API ApprovePayment] Updating user ${user.id} balance to ${newBalance.toFixed(2)}`);
      await query('UPDATE users SET balance = ? WHERE id = ?', [newBalance.toFixed(2), paymentRequest.user_id]);

      const transactionDescription = `Пополнение через одобренную заявку #${requestId} (${paymentRequest.payment_method_details || 'Card'})`;
      console.log(`[API ApprovePayment] Inserting balance transaction: ${transactionDescription}`);
      await query(
        'INSERT INTO balance_transactions (user_id, transaction_type, amount_gh, description, related_payment_request_id) VALUES (?, ?, ?, ?, ?)',
        [paymentRequest.user_id, 'deposit', paymentRequest.amount_gh, transactionDescription, requestId]
      );

      console.log(`[API ApprovePayment] Updating payment request ${requestId} status to approved.`);
      await query('UPDATE payment_requests SET status = ?, updated_at = NOW() WHERE id = ?', ['approved', requestId]);
      // --- Commit Transaction (conceptually) ---

      try {
        console.log(`[API ApprovePayment] Attempting to send admin notification for balance deposit for user ID: ${user.id}`);
        await notifyAdminOnBalanceDeposit(user.id, user.username || 'N/A', parseFloat(paymentRequest.amount_gh as any), `Заявка #${requestId} одобрена (Тест. режим)`);
      } catch (notificationError) {
        console.error("[API ApprovePayment] Failed to send Telegram notification after approving payment:", notificationError);
      }
      
      // try {
      //   const notificationSettingsResults = await query('SELECT notify_on_balance_deposit FROM site_notification_settings WHERE id = 1 LIMIT 1');
      //   if (notificationSettingsResults.length > 0 && Boolean(notificationSettingsResults[0].notify_on_balance_deposit)) {
      //      await sendBalanceUpdateEmail(user.email, user.username, parseFloat(paymentRequest.amount_gh as any), transactionDescription, newBalance);
      //   }
      // } catch (emailError) {
      //    console.error("[API ApprovePayment] Failed to send email notification:", emailError);
      // }


      return NextResponse.json({ message: `Заявка #${requestId} одобрена. Баланс пользователя ${user.username || 'ID: ' + user.id} пополнен на ${paymentRequest.amount_gh} GH.` });

    } catch (dbError: any) {
      // --- Rollback Transaction (conceptually) ---
      console.error('[API ApprovePayment] Error during database operations:', dbError);
      return NextResponse.json({ message: `Ошибка базы данных при одобрении: ${dbError.message}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[API ApprovePayment] Outer Error:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}

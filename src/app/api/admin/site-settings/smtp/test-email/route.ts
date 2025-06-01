
// src/app/api/admin/site-settings/smtp/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SmtpSettings } from '@/types';
import nodemailer from 'nodemailer';

const SETTINGS_ROW_ID = 1;

export async function POST(request: NextRequest) {
  console.log('[API SMTP Test] Received request');
  try {
    // TODO: Add proper admin authentication check here
    const { recipientEmail } = await request.json();
    console.log('[API SMTP Test] Recipient Email:', recipientEmail);

    if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
      console.log('[API SMTP Test] Invalid recipient email provided');
      return NextResponse.json({ message: 'Необходимо указать корректный Email получателя.' }, { status: 400 });
    }

    let smtpConfig: SmtpSettings & { smtp_password?: string | null };
    try {
      const settingsResults = await query('SELECT * FROM site_smtp_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
      if (!Array.isArray(settingsResults) || settingsResults.length === 0) {
        console.log('[API SMTP Test] SMTP settings not found in DB');
        return NextResponse.json({ message: 'SMTP настройки не найдены. Пожалуйста, сначала сохраните их.' }, { status: 404 });
      }
      smtpConfig = settingsResults[0];
      console.log('[API SMTP Test] Fetched SMTP config (password excluded from log):', { ...smtpConfig, smtp_password: '***' });
    } catch (dbError: any) {
      console.error('[API SMTP Test] Error fetching SMTP settings from DB:', dbError);
      return NextResponse.json({ message: `Ошибка доступа к настройкам SMTP: ${dbError.message}` }, { status: 500 });
    }

    if (!smtpConfig.smtp_host || !smtpConfig.smtp_port || !smtpConfig.from_email) {
      console.log('[API SMTP Test] Core SMTP settings missing from fetched config');
      return NextResponse.json({ message: 'Основные SMTP настройки (Хост, Порт, Email отправителя) не заданы.' }, { status: 400 });
    }

    const transporterOptions: nodemailer.TransportOptions = {
        host: smtpConfig.smtp_host,
        port: Number(smtpConfig.smtp_port),
        secure: Number(smtpConfig.smtp_port) === 465 || smtpConfig.smtp_encryption === 'ssl', // Use SSL for port 465
        auth: (smtpConfig.smtp_username && smtpConfig.smtp_password) ? {
            user: smtpConfig.smtp_username,
            pass: smtpConfig.smtp_password,
        } : undefined,
    };
    
    // Explicitly handle TLS/None for non-465 ports
    if (smtpConfig.smtp_encryption === 'tls' && Number(smtpConfig.smtp_port) !== 465) {
        transporterOptions.secure = false; // TLS usually starts on non-secure port then upgrades
        transporterOptions.requireTLS = true;
    } else if (smtpConfig.smtp_encryption === 'none' && Number(smtpConfig.smtp_port) !== 465) {
        transporterOptions.secure = false;
        transporterOptions.ignoreTLS = true; // Explicitly ignore TLS for 'none'
    }

    console.log('[API SMTP Test] Nodemailer transporter options prepared:', { 
        ...transporterOptions, 
        auth: transporterOptions.auth ? { user: transporterOptions.auth.user, pass: '***' } : undefined 
    });

    const transporter = nodemailer.createTransport(transporterOptions as any);

    try {
      console.log('[API SMTP Test] Verifying transporter...');
      await transporter.verify();
      console.log('[API SMTP Test] Nodemailer transporter verified successfully.');
    } catch (verifyError: any) {
      console.error('[API SMTP Test] Nodemailer transporter verification failed:', verifyError);
      return NextResponse.json({ message: `Ошибка верификации SMTP сервера: ${verifyError.message}. Проверьте настройки (хост, порт, шифрование, учетные данные).` }, { status: 500 });
    }
    
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${smtpConfig.from_name || 'Green Hack Test'}" <${smtpConfig.from_email}>`,
      to: recipientEmail,
      subject: 'Green Hack - Тестовое письмо SMTP ✔',
      text: 'Это тестовое письмо, отправленное из настроек SMTP вашего сайта Green Hack.',
      html: '<p>Это тестовое письмо, отправленное из <strong>настроек SMTP</strong> вашего сайта Green Hack.</p>',
    };
    console.log('[API SMTP Test] Mail options prepared (recipient hidden for log):', { ...mailOptions, to: '***' });

    try {
      console.log('[API SMTP Test] Sending email...');
      let info = await transporter.sendMail(mailOptions);
      console.log('[API SMTP Test] Message sent successfully: %s', info.messageId);
      return NextResponse.json({ message: `Тестовое письмо успешно отправлено на ${recipientEmail}. Message ID: ${info.messageId}` }, { status: 200 });
    } catch (emailError: any) {
      console.error('[API SMTP Test] Error sending email via nodemailer:', emailError);
      return NextResponse.json({ message: `Ошибка отправки тестового письма: ${emailError.message}. Проверьте настройки SMTP и учетные данные. Также убедитесь, что ваш SMTP-сервер доступен.` }, { status: 500 });
    }

  } catch (error: any) {
    // Catch any other unexpected errors in the main try block
    console.error('[API SMTP Test] Unhandled error in POST handler:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}

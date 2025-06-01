
// src/lib/email.ts
import nodemailer from 'nodemailer';
import { query } from '@/lib/mysql';
import type { SmtpSettings, SiteNotificationSettings } from '@/types';

const SETTINGS_ROW_ID = 1;

async function getSmtpSettings(): Promise<(SmtpSettings & { smtp_password?: string | null }) | null> {
  try {
    const results = await query('SELECT * FROM site_smtp_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    if (results.length > 0) {
      return results[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching SMTP settings for email:", error);
    return null;
  }
}

async function getNotificationSettings(): Promise<SiteNotificationSettings | null> {
  try {
    const results = await query('SELECT * FROM site_notification_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
    if (results.length > 0) {
      const settings = results[0];
      return {
        id: settings.id,
        notify_on_registration: Boolean(settings.notify_on_registration),
        notify_on_balance_deposit: Boolean(settings.notify_on_balance_deposit),
        notify_on_product_purchase: Boolean(settings.notify_on_product_purchase),
        notify_on_support_reply: Boolean(settings.notify_on_support_reply),
        notify_on_software_activation: Boolean(settings.notify_on_software_activation),
        notify_on_license_expiry_soon: Boolean(settings.notify_on_license_expiry_soon),
        notify_on_promotions: Boolean(settings.notify_on_promotions),
        updated_at: settings.updated_at,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching notification settings for email:", error);
    return null;
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string; error?: any }> {
  const smtpConfig = await getSmtpSettings();

  if (!smtpConfig || !smtpConfig.smtp_host || !smtpConfig.smtp_port || !smtpConfig.from_email) {
    console.error("Email Service: SMTP settings are incomplete or not found.");
    return { success: false, message: "SMTP settings are incomplete." };
  }

  const transporterOptions: nodemailer.TransportOptions = {
    host: smtpConfig.smtp_host,
    port: Number(smtpConfig.smtp_port),
    secure: Number(smtpConfig.smtp_port) === 465 || smtpConfig.smtp_encryption === 'ssl',
    auth: (smtpConfig.smtp_username && smtpConfig.smtp_password) ? {
      user: smtpConfig.smtp_username,
      pass: smtpConfig.smtp_password,
    } : undefined,
  };

  if (smtpConfig.smtp_encryption === 'tls' && Number(smtpConfig.smtp_port) !== 465) {
    transporterOptions.secure = false;
    transporterOptions.requireTLS = true;
  } else if (smtpConfig.smtp_encryption === 'none' && Number(smtpConfig.smtp_port) !== 465) {
    transporterOptions.secure = false;
    transporterOptions.ignoreTLS = true;
  }

  const transporter = nodemailer.createTransport(transporterOptions as any);

  try {
    await transporter.verify(); // Verify connection configuration
    console.log(`Email Service: Sending email to ${options.to} with subject "${options.subject}"`);
    await transporter.sendMail({
      from: `"${smtpConfig.from_name || 'Green Hack'}" <${smtpConfig.from_email}>`,
      ...options,
    });
    return { success: true, message: `Email sent successfully to ${options.to}` };
  } catch (error: any) {
    console.error("Email Service: Error sending email:", error);
    return { success: false, message: `Failed to send email: ${error.message}`, error };
  }
}

export async function sendRegistrationWelcomeEmail(to: string, username: string) {
  const notificationSettings = await getNotificationSettings();
  if (!notificationSettings?.notify_on_registration) {
    console.log("Email Service: Registration notifications are disabled.");
    return;
  }

  await sendEmail({
    to,
    subject: `Добро пожаловать на Green Hacks, ${username}!`,
    text: `Привет, ${username}!\n\nСпасибо за регистрацию на Green Hacks. Ваш аккаунт успешно создан.\n\nС уважением,\nКоманда Green Hacks`,
    html: `<p>Привет, ${username}!</p><p>Спасибо за регистрацию на <strong>Green Hacks</strong>. Ваш аккаунт успешно создан.</p><p>С уважением,<br/>Команда Green Hacks</p>`,
  });
}

export async function sendPurchaseConfirmationEmail(to: string, username: string, productName: string, durationDays: number | null, amountPaidGh: number) {
  const notificationSettings = await getNotificationSettings();
  if (!notificationSettings?.notify_on_product_purchase) {
    console.log("Email Service: Product purchase notifications are disabled.");
    return;
  }

  const durationText = durationDays ? ` (на ${durationDays} дн.)` : '';
  await sendEmail({
    to,
    subject: 'Подтверждение покупки на Green Hacks',
    text: `Привет, ${username}!\n\nВы успешно приобрели "${productName}${durationText}" за ${amountPaidGh.toFixed(2)} GH.\n\nТовар добавлен в ваш инвентарь.\n\nС уважением,\nКоманда Green Hacks`,
    html: `<p>Привет, ${username}!</p><p>Вы успешно приобрели "<strong>${productName}${durationText}</strong>" за <strong>${amountPaidGh.toFixed(2)} GH</strong>.</p><p>Товар добавлен в ваш инвентарь.</p><p>С уважением,<br/>Команда Green Hacks</p>`,
  });
}

export async function sendBalanceUpdateEmail(to: string, username: string, amountGh: number, reason: string, newBalance: number) {
  const notificationSettings = await getNotificationSettings();
  if (!notificationSettings?.notify_on_balance_deposit) { 
    console.log("Email Service: Balance update notifications are disabled.");
    return;
  }

  const actionText = amountGh > 0 ? "пополнен" : "изменен";
  const amountText = amountGh > 0 ? `+${amountGh.toFixed(2)} GH` : `${amountGh.toFixed(2)} GH`;

  await sendEmail({
    to,
    subject: `Обновление баланса на Green Hacks`,
    text: `Привет, ${username}!\n\nВаш баланс был ${actionText} на ${amountText}. Причина: ${reason}.\nНовый баланс: ${newBalance.toFixed(2)} GH.\n\nС уважением,\nКоманда Green Hacks`,
    html: `<p>Привет, ${username}!</p><p>Ваш баланс был ${actionText} на <strong>${amountText}</strong>. Причина: ${reason}.</p><p>Новый баланс: <strong>${newBalance.toFixed(2)} GH</strong>.</p><p>С уважением,<br/>Команда Green Hacks</p>`,
  });
}
    
    
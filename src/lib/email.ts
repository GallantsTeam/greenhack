
// src/lib/email.ts
import nodemailer from 'nodemailer';
import { query } from '@/lib/mysql';
import type { SmtpSettings, SiteNotificationSettings } from '@/types';
import fs from 'fs/promises';
import path from 'path';

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

async function renderEmailTemplate(templateName: string, data: Record<string, any>): Promise<string> {
  try {
    const baseTemplatePath = path.join(process.cwd(), 'src', 'emails', 'base-email-template.html');
    const specificTemplatePath = path.join(process.cwd(), 'src', 'emails', `${templateName}.html`);

    let baseTemplateContent = await fs.readFile(baseTemplatePath, 'utf-8');
    let specificTemplateContent = await fs.readFile(specificTemplatePath, 'utf-8');

    // Populate specific template
    for (const key in data) {
      specificTemplateContent = specificTemplateContent.replace(new RegExp(`{{${key}}}`, 'g'), String(data[key] === null || data[key] === undefined ? '' : data[key]));
    }

    // Populate base template
    baseTemplateContent = baseTemplateContent.replace(new RegExp(`{{emailBody}}`, 'g'), specificTemplateContent);
    baseTemplateContent = baseTemplateContent.replace(new RegExp(`{{emailTitle}}`, 'g'), String(data.emailTitle || data.subject || 'Уведомление от ' + (data.siteName || 'сайта')));
    baseTemplateContent = baseTemplateContent.replace(new RegExp(`{{siteName}}`, 'g'), String(data.siteName || 'Green Hacks'));
    baseTemplateContent = baseTemplateContent.replace(new RegExp(`{{currentYear}}`, 'g'), String(new Date().getFullYear()));
    baseTemplateContent = baseTemplateContent.replace(new RegExp(`{{siteUrl}}`, 'g'), String(data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || '#'));
    
    return baseTemplateContent;
  } catch (error) {
    console.error(`Error rendering email template ${templateName}:`, error);
    throw new Error(`Failed to render email template ${templateName}.`);
  }
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
    await transporter.verify(); 
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

  const smtpConfig = await getSmtpSettings();
  const siteName = smtpConfig?.from_name || process.env.NEXT_PUBLIC_SITE_NAME || 'Green Hacks';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '#';
  const subject = `Добро пожаловать на ${siteName}, ${username}!`;

  try {
    const htmlBody = await renderEmailTemplate('registration', {
      username: username,
      siteName: siteName,
      loginLink: `${siteUrl}/auth/login`,
      emailTitle: subject,
      subject: subject, // For placeholders if emailTitle is not directly used in specific template
      siteUrl: siteUrl,
    });

    await sendEmail({
      to,
      subject: subject,
      text: `Привет, ${username}!\n\nСпасибо за регистрацию на ${siteName}. Ваш аккаунт успешно создан.\n\nВаш логин: ${username}\n\nПерейти на сайт: ${siteUrl}\nВойти в аккаунт: ${siteUrl}/auth/login\n\nС уважением,\nКоманда ${siteName}`,
      html: htmlBody,
    });
  } catch (error) {
    console.error("Error preparing or sending registration welcome email:", error);
  }
}

export async function sendPurchaseConfirmationEmail(to: string, username: string, productName: string, durationDays: number | null, amountPaidGh: number) {
  const notificationSettings = await getNotificationSettings();
  if (!notificationSettings?.notify_on_product_purchase) {
    console.log("Email Service: Product purchase notifications are disabled.");
    return;
  }

  const smtpConfig = await getSmtpSettings();
  const siteName = smtpConfig?.from_name || process.env.NEXT_PUBLIC_SITE_NAME || 'Green Hacks';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '#';
  const subject = `Подтверждение покупки на ${siteName}`;
  const durationText = durationDays ? `${durationDays} дн.` : '';

  try {
    const htmlBody = await renderEmailTemplate('purchase-confirmation', {
      username: username,
      siteName: siteName,
      productName: productName,
      productDuration: durationText,
      // productMode: '', // Placeholder, add if needed
      amountPaidGh: amountPaidGh.toFixed(2),
      purchaseDate: new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      inventoryLink: `${siteUrl}/account/inventory`,
      emailTitle: subject,
      subject: subject,
      siteUrl: siteUrl,
    });

    await sendEmail({
      to,
      subject: subject,
      text: `Привет, ${username}!\n\nВы успешно приобрели "${productName}"${durationText ? ` (${durationText})` : ''} за ${amountPaidGh.toFixed(2)} GH.\n\nТовар добавлен в ваш инвентарь: ${siteUrl}/account/inventory\n\nС уважением,\nКоманда ${siteName}`,
      html: htmlBody,
    });
  } catch (error) {
    console.error("Error preparing or sending purchase confirmation email:", error);
  }
}

export async function sendBalanceUpdateEmail(to: string, username: string, amountGh: number, reason: string, newBalance: number) {
  const notificationSettings = await getNotificationSettings();
  if (!notificationSettings?.notify_on_balance_deposit) { 
    console.log("Email Service: Balance update notifications are disabled.");
    return;
  }
  
  const smtpConfig = await getSmtpSettings();
  const siteName = smtpConfig?.from_name || process.env.NEXT_PUBLIC_SITE_NAME || 'Green Hacks';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '#';
  const subject = `Обновление баланса на ${siteName}`;
  const actionText = amountGh > 0 ? "пополнен" : "изменен";
  const amountText = amountGh > 0 ? `+${amountGh.toFixed(2)} GH` : `${amountGh.toFixed(2)} GH`;

  try {
    const htmlBody = await renderEmailTemplate('balance-topup', {
        username: username,
        siteName: siteName,
        topUpAmountGh: amountText,
        paymentMethod: reason, // Using reason as payment method for simplicity
        topUpDate: new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        newBalanceGh: newBalance.toFixed(2),
        accountBalanceLink: `${siteUrl}/account/balance`,
        emailTitle: subject,
        subject: subject,
        siteUrl: siteUrl,
    });

    await sendEmail({
      to,
      subject: subject,
      text: `Привет, ${username}!\n\nВаш баланс был ${actionText} на ${amountText}. Причина: ${reason}.\nНовый баланс: ${newBalance.toFixed(2)} GH.\n\nС уважением,\nКоманда ${siteName}`,
      html: htmlBody,
    });
  } catch (error) {
    console.error("Error preparing or sending balance update email:", error);
  }
}

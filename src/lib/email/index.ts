/**
 * TAPTCH TRANSACTIONAL EMAIL & SMTP DELIVERY ENGINE
 *
 * Implements standard SMTP transport (Nodemailer), configuration parsing,
 * connection verification, and responsive branded email templates (Obsidian Luxury).
 */

import nodemailer, { type Transporter, type SendMailOptions } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { brandConfig } from '@/config/brand';
import { logger } from '@/lib/logger';

export interface EmailConfig {
  provider: 'smtp' | 'mailpit' | 'console';
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  channel: 'smtp' | 'console';
  error?: string;
}

/**
 * Resolves current email configuration from environment variables.
 */
export function getEmailConfig(): EmailConfig {
  const providerEnv = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();
  const provider: 'smtp' | 'mailpit' | 'console' =
    providerEnv === 'console' ? 'console' : providerEnv === 'mailpit' ? 'mailpit' : 'smtp';

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    process.env.SMTP_SECURE === '1' ||
    port === 465;

  return {
    provider,
    host: process.env.SMTP_HOST || 'localhost',
    port: isNaN(port) ? 587 : port,
    secure,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || `noreply@${brandConfig.name.toLowerCase()}.com`,
    fromName: process.env.EMAIL_FROM_NAME || brandConfig.name,
  };
}

let cachedTransporter: Transporter | null = null;

/**
 * Creates or retrieves the singleton Nodemailer transporter.
 */
export function getSmtpTransporter(overrideConfig?: Partial<EmailConfig>): Transporter {
  if (cachedTransporter && !overrideConfig) {
    return cachedTransporter;
  }

  const config = { ...getEmailConfig(), ...overrideConfig };

  const transportOptions: SMTPTransport.Options = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.user && config.pass
      ? {
        auth: {
          user: config.user,
          pass: config.pass,
        },
      }
      : {}),
  };

  const transporter = nodemailer.createTransport(transportOptions);

  if (!overrideConfig) {
    cachedTransporter = transporter;
  }

  return transporter;
}

/**
 * Verifies SMTP connectivity and credentials.
 */
export async function verifySmtpConnection(): Promise<{ ok: boolean; message: string }> {
  const config = getEmailConfig();
  if (config.provider === 'console') {
    return { ok: true, message: 'Console provider active (dry run).' };
  }

  try {
    const transporter = getSmtpTransporter();
    await transporter.verify();
    return { ok: true, message: `Connected successfully to SMTP server at ${config.host}:${config.port}` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error({ err, host: config.host, port: config.port }, 'SMTP connection verification failed');
    return { ok: false, message: errorMsg };
  }
}

/**
 * Sends a transactional email via SMTP (or fallback console in dev/test).
 */
export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const fromAddress = payload.from || `"${config.fromName}" <${config.from}>`;

  // Safe dry-run when explicitly configured for console
  if (config.provider === 'console') {
    logger.info(
      {
        to: payload.to,
        subject: payload.subject,
        channel: 'console',
      },
      '[CONSOLE EMAIL DISPATCH]'
    );
    console.log('\n========================================');
    console.log(`[EMAIL DISPATCH - CONSOLE]`);
    console.log(`To:      ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}`);
    console.log(`From:    ${fromAddress}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Content:`);
    console.log(payload.text);
    console.log('========================================\n');
    return {
      success: true,
      channel: 'console',
      messageId: `console-${Date.now()}`,
    };
  }

  try {
    const transporter = getSmtpTransporter();
    const mailOptions: SendMailOptions = {
      from: fromAddress,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, to: payload.to }, 'Email sent successfully via SMTP');

    return {
      success: true,
      channel: 'smtp',
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error({ err, to: payload.to, subject: payload.subject }, 'SMTP email dispatch failed');

    // If in non-production, fall back to console output so development continues uninterrupted
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Non-production environment: falling back to stdout log after SMTP failure');
      console.log('\n========================================');
      console.log(`[FALLBACK EMAIL LOG - SMTP FAILED]`);
      console.log(`To:      ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}`);
      console.log(`Subject: ${payload.subject}`);
      console.log(`Body:    ${payload.text}`);
      console.log('========================================\n');
      return {
        success: true,
        channel: 'console',
        messageId: `fallback-${Date.now()}`,
        error: errorMsg,
      };
    }

    return {
      success: false,
      channel: 'smtp',
      error: errorMsg,
    };
  }
}

/**
 * Branded Responsive Email Templates (Obsidian Luxury aesthetic)
 */

export function renderOtpEmailTemplate(otp: string, type: string = 'verification'): { html: string; text: string } {
  const brandName = brandConfig.name;
  const goldColor = brandConfig.theme.primaryColor;
  const obsidianColor = '#0A0A0C';
  const typeLabel = type === 'sign-in' ? 'Sign In' : type === 'two-factor' ? 'Two-Factor Authentication' : 'Verification';

  const text = `${brandName} ${typeLabel} Code\n\nYour one-time verification code is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this code, please ignore this email.\n\n© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} ${typeLabel}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0A0A0C; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #121216; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px; text-align: center; }
    .brand { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: ${goldColor}; margin-bottom: 24px; text-transform: uppercase; }
    .title { font-size: 20px; font-weight: 600; letter-spacing: -0.015em; color: #FFFFFF; margin-bottom: 12px; }
    .desc { font-size: 14px; color: #A1A1AA; line-height: 1.6; margin-bottom: 32px; }
    .otp-box { background: #18181D; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 32px; }
    .otp-code { font-family: 'Geist Mono', 'SF Mono', Consolas, Monaco, monospace; font-size: 32px; font-weight: 600; letter-spacing: 0.25em; color: ${goldColor}; padding-left: 0.25em; }
    .validity { font-size: 13px; color: #71717A; margin-bottom: 24px; }
    .footer { font-size: 12px; color: #52525B; line-height: 1.5; margin-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 24px; }
  </style>
</head>
<body style="background-color: ${obsidianColor};">
  <div class="wrapper">
    <div class="card">
      <div class="brand">${brandName}</div>
      <div class="title">${typeLabel} Code</div>
      <div class="desc">Enter the verification code below to securely authenticate your account.</div>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <div class="validity">This code is valid for 10 minutes. Never share this code with anyone.</div>
      <div class="footer">
        If you did not make this request, you can safely ignore this email.<br>
        &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>`;

  return { html, text };
}

export function renderWelcomeEmailTemplate(userName?: string): { html: string; text: string } {
  const brandName = brandConfig.name;
  const goldColor = brandConfig.theme.primaryColor;
  const nameGreeting = userName ? `Hello ${userName},` : 'Hello,';

  const text = `${nameGreeting}\n\nWelcome to ${brandName}!\n\nYour digital profile platform is ready. Create and customize your personal or business digital card to start networking effortlessly.\n\n© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${brandName}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0A0A0C; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #121216; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px; }
    .brand { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: ${goldColor}; margin-bottom: 24px; text-transform: uppercase; }
    .title { font-size: 20px; font-weight: 600; letter-spacing: -0.015em; color: #FFFFFF; margin-bottom: 16px; }
    .desc { font-size: 14px; color: #A1A1AA; line-height: 1.6; margin-bottom: 24px; }
    .footer { font-size: 12px; color: #52525B; line-height: 1.5; margin-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 24px; text-align: center; }
  </style>
</head>
<body style="background-color: #0A0A0C;">
  <div class="wrapper">
    <div class="card">
      <div class="brand">${brandName}</div>
      <div class="title">Welcome to Next-Generation Identity</div>
      <div class="desc">${nameGreeting}</div>
      <div class="desc">Thank you for joining ${brandName}. Your account has been created, giving you access to craft luxury digital profiles, dynamic NFC connections, and streamlined lead capture.</div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>`;

  return { html, text };
}

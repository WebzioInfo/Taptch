import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getEmailConfig,
  getSmtpTransporter,
  renderOtpEmailTemplate,
  renderWelcomeEmailTemplate,
  sendEmail,
} from '@/lib/email';
import { brandConfig } from '@/config/brand';

describe('Transactional Email & SMTP Engine', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('correctly parses SMTP configuration from environment variables', () => {
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = 'smtp.sendgrid.net';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'apikey';
    process.env.SMTP_PASS = 'SG.secret';
    process.env.EMAIL_FROM = 'support@example.com';
    process.env.EMAIL_FROM_NAME = 'Custom Support';

    const config = getEmailConfig();

    expect(config.provider).toBe('smtp');
    expect(config.host).toBe('smtp.sendgrid.net');
    expect(config.port).toBe(465);
    expect(config.secure).toBe(true);
    expect(config.user).toBe('apikey');
    expect(config.pass).toBe('SG.secret');
    expect(config.from).toBe('support@example.com');
    expect(config.fromName).toBe('Custom Support');
  });

  it('renders responsive OTP email template deriving brand from config without hardcoded brand literals', () => {
    const otp = '984512';
    const { html, text } = renderOtpEmailTemplate(otp, 'verification');

    expect(text).toContain(otp);
    expect(text).toContain(brandConfig.name);
    expect(text).toContain('Verification Code');

    expect(html).toContain(otp);
    expect(html).toContain(brandConfig.name);
    expect(html).toContain(brandConfig.theme.primaryColor);
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('renders welcome email template deriving brand from config', () => {
    const { html, text } = renderWelcomeEmailTemplate('Alex');

    expect(text).toContain('Alex');
    expect(text).toContain(brandConfig.name);
    expect(html).toContain('Alex');
    expect(html).toContain(brandConfig.name);
  });

  it('safely dispatches email via console provider when configured for dry-run', async () => {
    process.env.EMAIL_PROVIDER = 'console';

    const result = await sendEmail({
      to: 'tester@example.com',
      subject: 'Test Email Verification',
      text: 'Your verification code is 123456',
      html: '<p>Your verification code is 123456</p>',
    });

    expect(result.success).toBe(true);
    expect(result.channel).toBe('console');
    expect(result.messageId).toBeDefined();
  });

  it('initializes SMTP transporter with host and port', () => {
    const transporter = getSmtpTransporter({
      host: 'mail.testserver.local',
      port: 2525,
      secure: false,
    });

    expect(transporter).toBeDefined();
  });
});

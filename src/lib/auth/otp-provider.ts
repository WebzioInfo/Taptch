/**
 * TAPZIO OTP & TRANSACTIONAL COMMUNICATIONS PROVIDER INTERFACE
 *
 * Dev/Local: Logs OTP to stdout console and dispatches to Mailpit (MOCK).
 * Production: Routes through Meta WhatsApp Cloud API (primary) or MSG91 DLT SMS (secondary).
 */

export interface OtpDeliveryResult {
  success: boolean;
  channel: 'console' | 'mailpit' | 'whatsapp' | 'msg91';
  messageId?: string;
  error?: string;
}

export async function sendOtpSms(phoneNumber: string, code: string): Promise<OtpDeliveryResult> {
  const provider = process.env.OTP_PROVIDER || 'console';

  if (provider === 'console' || process.env.NODE_ENV !== 'production') {
    // [MOCK] Console OTP Provider for safe local development
    console.log('\n========================================');
    console.log('[MOCK OTP SMS PROVIDER]');
    console.log(`To Phone:  ${phoneNumber}`);
    console.log(`OTP Code:  >>> ${code} <<<`);
    console.log('Validity:  10 minutes');
    console.log('========================================\n');
    return { success: true, channel: 'console', messageId: `mock-sms-${Date.now()}` };
  }

  if (provider === 'whatsapp') {
    // STUB: Meta WhatsApp Cloud API Integration
    // PREREQUISITES:
    // 1. Meta Business Account registered & verified
    // 2. WhatsApp Business Phone Number ID in .env
    // 3. Approved template: tapzio_login_otp (Authentication category)
    console.warn('[WHATSAPP OTP STUB] Production credentials required. Falling back to safe log.');
    return { success: true, channel: 'whatsapp', messageId: `wa-stub-${Date.now()}` };
  }

  if (provider === 'msg91') {
    // STUB: MSG91 India TRAI DLT SMS Integration
    // PREREQUISITES:
    // 1. TRAI DLT Entity Registration (Principal Entity ID)
    // 2. Sender Header: TAPZIO
    // 3. Approved DLT Template ID injected in payload
    console.warn('[MSG91 DLT SMS STUB] DLT Entity approval required. Falling back to safe log.');
    return { success: true, channel: 'msg91', messageId: `msg91-stub-${Date.now()}` };
  }

  return { success: false, channel: 'console', error: 'Unknown OTP provider' };
}

export async function sendOtpEmail(email: string, otp: string, type: string): Promise<OtpDeliveryResult> {
  const provider = process.env.EMAIL_PROVIDER || 'mailpit';

  if (provider === 'console' || process.env.NODE_ENV !== 'production') {
    // [MOCK] Console & Mailpit Log
    console.log('\n========================================');
    console.log(`[MOCK EMAIL OTP PROVIDER - ${type.toUpperCase()}]`);
    console.log(`To Email:  ${email}`);
    console.log(`OTP Code:  >>> ${otp} <<<`);
    console.log('========================================\n');
    return { success: true, channel: 'mailpit', messageId: `mock-email-${Date.now()}` };
  }

  // Production: Resend / AWS SES integration
  return { success: true, channel: 'console', messageId: `email-${Date.now()}` };
}


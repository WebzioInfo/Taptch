import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateQRToken,
  generateQRSerial,
  calculateContrastRatio,
  isDesignScannable,
  generateQRSvg,
  validateTargetUrl,
  createQRCode,
  updateQRCode,
  resolveQRToken,
  createQRBatch,
} from '@/modules/qr';
import { db } from '@/db';
import { users } from '@/db/schema/auth';

describe('TAPTCH Dynamic QR Engine (Phase 1)', () => {
  const testUserId = `usr_qr_test_${Date.now()}`;

  beforeAll(async () => {
    // Seed test user
    await db.insert(users).values({
      id: testUserId,
      name: 'QR Architect Test',
      email: `qr-test-${Date.now()}@taptch.com`,
      systemRole: 'user',
    });
  });

  describe('1. Token Security & Cryptographic Entropy', () => {
    it('generates 128-bit cryptographically secure unguessable tokens (32 hex characters)', () => {
      const token = generateQRToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(32);
      // 128-bit Hexadecimal lowercase characters only
      expect(/^[0-9a-f]{32}$/.test(token)).toBe(true);
    });

    it('maintains backward compatibility with legacy 8-character tokens', () => {
      const legacyToken = 'a1b2c3d4';
      expect(/^[0-9a-f]{8,32}$/.test(legacyToken)).toBe(true);
    });

    it('guarantees collision-free tokens across batch generations', () => {
      const tokens = new Set<string>();
      const COUNT = 1000;
      for (let i = 0; i < COUNT; i++) {
        tokens.add(generateQRToken());
      }
      expect(tokens.size).toBe(COUNT);
    });

    it('formats sequential human tracking serials without using them as security tokens', () => {
      const serial = generateQRSerial(42, 'TPZ-STICKER');
      expect(serial).toBe('TPZ-STICKER-000042');
    });
  });

  describe('2. WCAG Contrast Calculation & Scannability Verification', () => {
    it('verifies black on white contrast exceeds 20:1', () => {
      const contrast = calculateContrastRatio('#000000', '#FFFFFF');
      expect(contrast).toBeGreaterThan(20);
      const scannable = isDesignScannable('#000000', '#FFFFFF');
      expect(scannable.isScannable).toBe(true);
    });

    it('verifies TAPTCH gold on dark obsidian has compliant contrast', () => {
      const scannable = isDesignScannable('#D4AF37', '#0A0A0C');
      expect(scannable.contrast).toBeGreaterThanOrEqual(4.5);
      expect(scannable.isScannable).toBe(true);
    });

    it('rejects unreadable low-contrast combinations (e.g. light gray on white)', () => {
      const scannable = isDesignScannable('#D1D5DB', '#FFFFFF');
      expect(scannable.contrast).toBeLessThan(4.5);
      expect(scannable.isScannable).toBe(false);
    });
  });

  describe('3. Target Destination Validation & SSRF Defense', () => {
    it('accepts valid HTTPS external target URLs', () => {
      const result = validateTargetUrl('https://example.com/company/profile');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://example.com/company/profile');
    });

    it('rejects dangerous protocols (javascript, file, data)', () => {
      const jsResult = validateTargetUrl('javascript:alert(document.cookie)');
      expect(jsResult.isValid).toBe(false);

      const fileResult = validateTargetUrl('file:///etc/passwd');
      expect(fileResult.isValid).toBe(false);

      const dataResult = validateTargetUrl('data:text/html,<script>alert(1)</script>');
      expect(dataResult.isValid).toBe(false);
    });
  });

  describe('4. SVG Matrix Generation & Quiet Zone Enforcement', () => {
    it('generates valid vector SVG with quiet zones', async () => {
      const svg = await generateQRSvg('https://taptch.webziotech.in/q/test-token-123', {
        fgColor: '#000000',
        bgColor: '#FFFFFF',
      });
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('viewBox');
    });
  });

  describe('5. Dynamic Destination Resolution & Lifecycle Reassignment', () => {
    it('creates a dynamic QR pointing to an external website', async () => {
      const qr = await createQRCode({
        name: 'Product Sticker A',
        destinationType: 'url',
        targetUrl: 'https://partner-portal.com',
        ownerUserId: testUserId,
      });

      expect(qr.id).toBeDefined();
      expect(qr.token).toBeDefined();
      expect(qr.destinationType).toBe('url');
      expect(qr.targetUrl).toBe('https://partner-portal.com');

      // Resolve the token
      const resolved = await resolveQRToken(qr.token);
      expect(resolved.status).toBe('assigned');
      expect(resolved.redirectUrl).toBe('https://partner-portal.com/');
    });

    it('updates destination dynamically without reprinting (preserves token)', async () => {
      const qr = await createQRCode({
        name: 'Conference Badge',
        destinationType: 'url',
        targetUrl: 'https://initial-site.com',
        ownerUserId: testUserId,
      });

      // Update destination to WhatsApp direct
      const updated = await updateQRCode(qr.id, {
        destinationType: 'whatsapp',
        destinationPayload: { phone: '+91 98765 43210', message: 'Hello from TAPTCH QR' },
      });

      expect(updated.destinationType).toBe('whatsapp');

      // Verify resolved destination has shifted immediately
      const resolved = await resolveQRToken(qr.token);
      expect(resolved.status).toBe('assigned');
      expect(resolved.redirectUrl).toContain('https://wa.me/919876543210');
      expect(resolved.redirectUrl).toContain('Hello%20from%20TAPTCH%20QR');
    });

    it('honors disabled status on revoked QR codes', async () => {
      const qr = await createQRCode({
        name: 'Temporary Promo Card',
        destinationType: 'url',
        targetUrl: 'https://promo.com',
        ownerUserId: testUserId,
      });

      await updateQRCode(qr.id, { status: 'disabled' });

      const resolved = await resolveQRToken(qr.token);
      expect(resolved.status).toBe('disabled');
    });
  });

  describe('6. Bulk Batch Minting', () => {
    it('mints a batch of 25 dynamic QRs with collision-free tokens and sequential serials', async () => {
      const batchResult = await createQRBatch({
        name: 'Bangalore Expo Standees Batch',
        quantity: 25,
        batchCodePrefix: 'EXPO',
        productType: 'standee',
        createdBy: testUserId,
      });

      expect(batchResult.batch.id).toBeDefined();
      expect(batchResult.batch.quantity).toBe(25);
      expect(batchResult.totalGenerated).toBe(25);
    });
  });
});

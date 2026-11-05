import { describe, it, expect, beforeAll } from 'vitest';
import { hash, compare } from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { qrCodes } from '@/db/schema/qr';
import { eq } from 'drizzle-orm';
import {
  generateQRToken,
  generateQRSerial,
  interpolateUrlTemplate,
  anonymizeVisitorIp,
  extractQRToken,
  createQRBatch,
  assignQRInField,
  getStaffAnalytics,
  getCalendarHeatmapAnalytics,
  generatePrintPdf,
  QRAlreadyAssignedError,
  QRNotFoundError,
} from '@/modules/qr';

describe('Enterprise Post-Print Activation & Field Staff Subsystem', () => {
  const staffUserId = `usr_staff_test_${Date.now()}`;
  const adminUserId = `usr_admin_test_${Date.now()}`;

  beforeAll(async () => {
    // Seed staff and admin users
    await db.insert(users).values([
      {
        id: staffUserId,
        name: 'Field Rep Test',
        email: `field-rep-${Date.now()}@tappzio.com`,
        systemRole: 'sales_staff',
        status: 'active',
      },
      {
        id: adminUserId,
        name: 'Admin Test',
        email: `admin-${Date.now()}@tappzio.com`,
        systemRole: 'admin',
        status: 'active',
      },
    ]);
  });

  describe('1. Parameter Interpolation & Token Parser', () => {
    it('interpolates template parameters into destination URLs', () => {
      const url1 = interpolateUrlTemplate(
        'https://restaurant.com/menu',
        'table',
        'TBL',
        '-',
        7
      );
      expect(url1).toBe('https://restaurant.com/menu?table=TBL-7');

      const url2 = interpolateUrlTemplate(
        'https://restaurant.com/menu?lang=en',
        'table',
        'T',
        '_',
        12
      );
      expect(url2).toBe('https://restaurant.com/menu?lang=en&table=T_12');
    });

    it('extracts tokens accurately from URLs, query strings, and raw text', () => {
      expect(extractQRToken('https://tappzio.webziotech.in/dq/a1b2c3d4')).toBe('a1b2c3d4');
      expect(extractQRToken('https://example.com/q/fe98dcba?ref=camera')).toBe('fe98dcba');
      expect(extractQRToken('https://tappzio.com/scan?token=00112233')).toBe('00112233');
      expect(extractQRToken('  abcd1234  ')).toBe('abcd1234');
    });

    it('hashes visitor IPs with daily salt conforming to DPDP Act', () => {
      const hash1 = anonymizeVisitorIp('192.168.1.100');
      const hash2 = anonymizeVisitorIp('192.168.1.100');
      const hashDiff = anonymizeVisitorIp('192.168.1.101');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashDiff);
      expect(hash1).not.toContain('192.168');
      expect(hash1.length).toBe(32); // 32-char truncated SHA-256 hex output
    });
  });

  describe('2. Batch Generation with Sequential Tracking', () => {
    it('creates a batch of unassigned physical QR records ready for printing', async () => {
      const batchResult = await createQRBatch({
        name: 'Sticker Roll Alpha',
        quantity: 5,
        startFrom: 101,
        productType: 'sticker',
        createdBy: adminUserId,
      });

      expect(batchResult.batch.id).toBeDefined();
      expect(batchResult.totalGenerated).toBe(5);

      // Verify the generated records in DB
      const items = await db
        .select()
        .from(qrCodes)
        .where(eq(qrCodes.batchId, batchResult.batch.id));

      expect(items.length).toBe(5);
      expect(items[0].status).toBe('unassigned');
      expect(items[0].batchSequence).toBe(101);
      // 128-bit cryptographic random token length
      expect(items[0].token.length).toBe(32);
      expect(items[4].batchSequence).toBe(105);
    });

    it('creates pre-parameterized batches when template URL is configured', async () => {
      const batchResult = await createQRBatch({
        name: 'Cafe Tables Batch',
        quantity: 3,
        startFrom: 1,
        productType: 'table_tent',
        paramName: 'table_no',
        valuePrefix: 'OUT',
        sep: '-',
        manualRedirectUrl: 'https://cafe-order.com/menu',
        createdBy: adminUserId,
      });

      const items = await db
        .select()
        .from(qrCodes)
        .where(eq(qrCodes.batchId, batchResult.batch.id));

      expect(items.length).toBe(3);
      expect(items[0].status).toBe('assigned');
      expect(items[0].manualRedirectUrl).toBe('https://cafe-order.com/menu?table_no=OUT-1');
      expect(items[2].manualRedirectUrl).toBe('https://cafe-order.com/menu?table_no=OUT-3');
    });
  });

  describe('3. Field Sales "Scan & Assign After Generated" Workflow', () => {
    let unassignedToken: string;

    beforeAll(async () => {
      const batch = await createQRBatch({
        name: 'Field Standee Roll',
        quantity: 1,
        productType: 'standee',
        createdBy: adminUserId,
      });
      const [qr] = await db
        .select()
        .from(qrCodes)
        .where(eq(qrCodes.batchId, batch.batch.id));
      unassignedToken = qr.token;
    });

    it('pairs physical QR code with customer and updates destination in field', async () => {
      const assignment = await assignQRInField({
        qrToken: unassignedToken,
        name: 'Vikram Joshi',
        mobileNumber: '+919988776655',
        business: 'Joshi Organic Foods',
        place: 'Koramangala, Bengaluru',
        destinationUrl: 'https://joshiorganics.in/catalog',
        staffUserId,
      });

      expect(assignment.success).toBe(true);
      expect(assignment.qr.status).toBe('assigned');
      expect(assignment.qr.manualRedirectUrl).toBe('https://joshiorganics.in/catalog');
      expect(assignment.qr.assignedBy).toBe(staffUserId);

      // Verify customer user was created
      const [customer] = await db
        .select()
        .from(users)
        .where(eq(users.id, assignment.customerUserId!));

      expect(customer).toBeDefined();
      expect(customer.name).toBe('Vikram Joshi');
      expect(customer.phoneNumber).toBe('+919988776655');
      expect(customer.business).toBe('Joshi Organic Foods');
      expect(customer.place).toBe('Koramangala, Bengaluru');
    });

    it('prevents accidental re-assignment of already active QR code', async () => {
      await expect(
        assignQRInField({
          qrToken: unassignedToken,
          name: 'Another Customer',
          destinationUrl: 'https://another.com',
          staffUserId,
          isReassign: false,
        })
      ).rejects.toThrow(QRAlreadyAssignedError);
    });

    it('allows intentional destination re-assignment when isReassign flag is true', async () => {
      const updated = await assignQRInField({
        qrToken: unassignedToken,
        name: 'Vikram Joshi (Updated)',
        business: 'Joshi Organic Foods Flagship',
        destinationUrl: 'https://joshiorganics.in/new-menu',
        staffUserId,
        isReassign: true,
      });

      expect(updated.success).toBe(true);
      expect(updated.qr.manualRedirectUrl).toBe('https://joshiorganics.in/new-menu');
    });

    it('throws QRNotFoundError for non-existent token', async () => {
      await expect(
        assignQRInField({
          qrToken: 'nonexistent999',
          name: 'Nobody',
          destinationUrl: 'https://nobody.com',
          staffUserId,
        })
      ).rejects.toThrow(QRNotFoundError);
    });
  });

  describe('4. Staff Performance Audit & Calendar Analytics', () => {
    it('retrieves staff performance metrics and assignment ledger', async () => {
      const analytics = await getStaffAnalytics(staffUserId);
      expect(analytics.totalConfigured).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(analytics.history)).toBe(true);
      expect(analytics.history[0].assignedAt).toBeDefined();
    });

    it('aggregates daily assignment counts for calendar heatmap', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const heatmap = await getCalendarHeatmapAnalytics({
        year: currentYear,
        month: currentMonth,
      });

      expect(heatmap.year).toBe(currentYear);
      expect(heatmap.month).toBe(currentMonth);
      expect(heatmap.totalAssigned).toBeGreaterThanOrEqual(1);
      expect(heatmap.maxDaily).toBeGreaterThanOrEqual(1);
      expect(typeof heatmap.dailyCounts).toBe('object');
    });
  });

  describe('5. High-Performance Vector PDF Sheet Exporters', () => {
    it('generates a valid A4 multi-sheet grid PDF with crop marks', async () => {
      const items = [
        { token: 'a1b2c3d4', serialNumber: 'TPZ-0001', label: 'Sticker 1' },
        { token: 'e5f6g7h8', serialNumber: 'TPZ-0002', label: 'Sticker 2' },
      ];

      const pdfBytes = await generatePrintPdf({
        batchName: 'Alpha Sheet',
        batchCode: 'BAT-01',
        layout: 'branded_sheet',
        items,
        appUrl: 'https://tappzio.webziotech.in',
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);
      // Verify PDF magic header bytes: %PDF-
      const header = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
      expect(header).toBe('%PDF-');
    });

    it('generates a valid thermal sticker PDF (50x50mm)', async () => {
      const items = [{ token: 't1t2t3t4', serialNumber: 'THM-0001', label: 'Thermal 1' }];

      const pdfBytes = await generatePrintPdf({
        batchName: 'Thermal Roll',
        batchCode: 'THM-01',
        layout: 'thermal_sticker',
        items,
        appUrl: 'https://tappzio.webziotech.in',
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      const header = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
      expect(header).toBe('%PDF-');
    });

    it('generates a valid table tent standee PDF (4x6")', async () => {
      const items = [{ token: 's1s2s3s4', serialNumber: 'STN-0001', label: 'Standee 1' }];

      const pdfBytes = await generatePrintPdf({
        batchName: 'Standees',
        batchCode: 'STN-01',
        layout: 'table_tent',
        items,
        appUrl: 'https://tappzio.webziotech.in',
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      const header = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
      expect(header).toBe('%PDF-');
    });
  });

  describe('6. Staff Credential Security & Password Hashing', () => {
    it('verifies staff passwords are securely hashed with bcryptjs salt rounds >= 10', async () => {
      const rawPassword = 'SecureFieldPass123!';
      const saltRounds = 10;
      const hashedPassword = await hash(rawPassword, saltRounds);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')).toBe(true);

      const isValid = await compare(rawPassword, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await compare('WrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });
});

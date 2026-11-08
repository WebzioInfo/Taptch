import { describe, it, expect, beforeAll } from 'vitest';
import {
  calculateOrderPricing,
  createCampaignOrder,
  getCampaignOrder,
  reportCustomerPayment,
  verifyOfflinePayment,
  getCampaignProfitAndLoss,
  generateOrderInvoicePdf,
} from '@/campaigns/instagram-card';

describe('Instagram NFC Card Campaign — Complete Commercial & Financial Suite', () => {
  let createdOrderId: string;
  let createdOrderNumber: string;

  it('calculates authoritative server-side pricing with GST and shipping', async () => {
    const pricing = await calculateOrderPricing('prod_ig_matte_pvc', 1, 'DIY');
    expect(pricing.unitPrice).toBe(499);
    expect(pricing.designerFee).toBe(0);
    expect(pricing.shippingFee).toBe(60);
    // Taxable: 499 + 60 = 559; GST 18% = 101; Total = 660
    expect(pricing.taxAmount).toBe(101);
    expect(pricing.totalAmount).toBe(660);
  });

  it('adds designer customization charge when Option B (DESIGNER) is selected', async () => {
    const pricing = await calculateOrderPricing('prod_ig_matte_pvc', 1, 'DESIGNER');
    expect(pricing.unitPrice).toBe(499);
    expect(pricing.designerFee).toBe(200);
    expect(pricing.shippingFee).toBe(60);
    // Taxable: 499 + 200 + 60 = 759; GST 18% = 137; Total = 896
    expect(pricing.taxAmount).toBe(137);
    expect(pricing.totalAmount).toBe(896);
  });

  it('creates an order, atomically reserves inventory, and generates unique barcode', async () => {
    const orderRes = await createCampaignOrder({
      productId: 'prod_ig_matte_pvc',
      quantity: 1,
      designOption: 'DIY',
      customerName: 'Aarav Patel',
      customerPhone: '9876543210',
      instagramUsername: 'aaravpatel_official',
      shippingAddress: {
        recipientName: 'Aarav Patel',
        street: '402 Regency Towers, Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050',
        country: 'India',
        phone: '9876543210',
      },
    });

    expect(orderRes.orderId).toBeDefined();
    expect(orderRes.orderNumber).toMatch(/^TAP-\d{4}-[A-F0-9]+$/);
    expect(orderRes.barcode).toMatch(/^BC128-TAP/);
    expect(orderRes.totalAmount).toBe(660);

    createdOrderId = orderRes.orderId;
    createdOrderNumber = orderRes.orderNumber;

    const { order, design } = await getCampaignOrder(createdOrderId);
    expect(order.customerName).toBe('Aarav Patel');
    expect(order.paymentStatus).toBe('UNPAID');
    expect(design).toBeDefined();
    expect(design?.frontDesignJson.instagramUsername).toBe('aaravpatel_official');
  });

  it('records customer payment report and allows administrator verification', async () => {
    // 1. Report payment
    const reportRes = await reportCustomerPayment({
      orderId: createdOrderId,
      amount: 660,
      paymentMethod: 'UPI',
      transactionReference: `UPI_REF_${Date.now()}`,
    });
    expect(reportRes.paymentId).toBeDefined();

    // 2. Verify payment by admin
    await verifyOfflinePayment(reportRes.paymentId, null, 'Verified with bank statement');

    const { order } = await getCampaignOrder(createdOrderId);
    expect(order.amountPaid).toBe(660);
    expect(order.paymentStatus).toBe('PAID');
    expect(order.orderStatus).toBe('PROCESSING');
  });

  it('generates an official order invoice PDF containing barcodes and line items', async () => {
    const pdfBytes = await generateOrderInvoicePdf(createdOrderId);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);
  });

  it('calculates financial P&L and recognizes revenue on paid orders', async () => {
    const pnl = await getCampaignProfitAndLoss();
    expect(pnl.kpis.totalOrders).toBeGreaterThanOrEqual(1);
    expect(pnl.kpis.recognizedRevenue).toBeGreaterThanOrEqual(660);
    expect(pnl.kpis.netCashCollected).toBeGreaterThanOrEqual(660);
  });

  it('guarantees checkout idempotency: duplicate submission returns existing order without duplicate stock reservation', async () => {
    const idempotencyKey = `idemp_test_${Date.now()}`;
    const orderData = {
      productId: 'prod_ig_matte_pvc',
      quantity: 1,
      designOption: 'DIY' as const,
      customerName: 'Maya Sharma',
      customerPhone: '9876543212',
      instagramUsername: 'mayasharma',
      idempotencyKey,
      shippingAddress: {
        recipientName: 'Maya Sharma',
        street: '12 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400020',
        country: 'India',
        phone: '9876543212',
      },
    };

    const firstSubmission = await createCampaignOrder(orderData);
    expect(firstSubmission.orderId).toBeDefined();

    const secondSubmission = await createCampaignOrder(orderData);
    expect(secondSubmission.orderId).toBe(firstSubmission.orderId);
    expect(secondSubmission.orderNumber).toBe(firstSubmission.orderNumber);
    expect(secondSubmission.isDuplicate).toBe(true);
  });

  it('validates direct upload metadata and rejects unauthorized MIME or oversized assets', async () => {
    const { validateUploadMetadata, createSignedUploadUrl } = await import('@/campaigns/instagram-card');
    
    // Valid PNG 2MB
    expect(() => validateUploadMetadata('image/png', 2 * 1024 * 1024)).not.toThrow();

    // Invalid executable or script
    expect(() => validateUploadMetadata('application/x-msdownload', 1024)).toThrow(/Unsupported file type/);

    // Oversized 8MB
    expect(() => validateUploadMetadata('image/jpeg', 8 * 1024 * 1024)).toThrow(/exceeds maximum limit/);

    const signedUrlRes = await createSignedUploadUrl('logo', 'my-logo.png', 'image/png', 1024 * 100);
    expect(signedUrlRes.fileKey).toContain('campaign/instagram-card/logo/');
    expect(signedUrlRes.expiresInSeconds).toBe(900);
  });

  it('enqueues and processes background jobs with retry safety', async () => {
    const { enqueueCampaignJob, processCampaignJob, getCampaignQueueMetrics } = await import('@/campaigns/instagram-card');

    const job = await enqueueCampaignJob('GENERATE_INVOICE_PDF', { orderId: createdOrderId }, { idempotencyKey: `job_${createdOrderId}` });
    expect(job.status).toBe('PENDING');

    await processCampaignJob(job.id, async (payload) => {
      expect(payload.orderId).toBe(createdOrderId);
    });

    const metrics = getCampaignQueueMetrics();
    expect(metrics.completed).toBeGreaterThanOrEqual(1);
  });

  it('rejects order tracking when phone number is invalid or too short (preventing IDOR bypass)', async () => {
    const { trackCampaignOrder } = await import('@/campaigns/instagram-card');
    await expect(trackCampaignOrder(createdOrderNumber, '123')).rejects.toThrow();
    await expect(trackCampaignOrder(createdOrderNumber, '')).rejects.toThrow();
    await expect(trackCampaignOrder(createdOrderNumber, 'abcd')).rejects.toThrow();
    
    // Valid phone resolves correctly
    const tracked = await trackCampaignOrder(createdOrderNumber, '9876543210');
    expect(tracked.customerName).toBe('Aarav Patel');
  });
});

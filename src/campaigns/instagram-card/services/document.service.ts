import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { db } from '@/db';
import { campaignDocuments } from '@/db/schema';
import { getCampaignOrder } from './order.service';
import { campaignBrandConfig } from '../config/brand.config';

/**
 * Generates an official Order Confirmation / Invoice PDF using pdf-lib
 */
export async function generateOrderInvoicePdf(orderId: string): Promise<Uint8Array> {
  const { order, design } = await getCampaignOrder(orderId);

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 Portrait (points)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const primaryBlue = rgb(0.145, 0.388, 0.921); // #2563EB
  const darkText = rgb(0.067, 0.094, 0.153);    // #111827
  const mutedText = rgb(0.392, 0.455, 0.545);   // #64748B
  const borderGrey = rgb(0.898, 0.906, 0.922);  // #E5E7EB

  let y = 800;

  // 1. Header Banner & Brand Identity
  page.drawText(campaignBrandConfig.name.toUpperCase(), {
    x: 50,
    y,
    size: 20,
    font: fontBold,
    color: primaryBlue,
  });

  page.drawText('TAX INVOICE / ORDER CONFIRMATION', {
    x: 320,
    y: y + 4,
    size: 11,
    font: fontBold,
    color: darkText,
  });

  y -= 20;
  page.drawText(campaignBrandConfig.legalEntity, { x: 50, y, size: 9, font: fontRegular, color: mutedText });
  page.drawText(`Invoice No: INV-${order.orderNumber}`, { x: 320, y, size: 9, font: fontBold, color: darkText });

  y -= 14;
  page.drawText(`Email: ${campaignBrandConfig.supportEmail} | GSTIN: ${campaignBrandConfig.gstin}`, { x: 50, y, size: 9, font: fontRegular, color: mutedText });
  page.drawText(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, { x: 320, y, size: 9, font: fontRegular, color: mutedText });

  y -= 24;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: borderGrey });

  // 2. Customer & Shipping Info
  y -= 25;
  page.drawText('BILL TO & SHIP TO:', { x: 50, y, size: 10, font: fontBold, color: darkText });
  page.drawText('ORDER STATUS & BARCODE:', { x: 320, y, size: 10, font: fontBold, color: darkText });

  y -= 16;
  page.drawText(order.customerName, { x: 50, y, size: 10, font: fontBold, color: darkText });
  page.drawText(`Payment Status: ${order.paymentStatus}`, { x: 320, y, size: 9, font: fontBold, color: order.paymentStatus === 'PAID' ? rgb(0.06, 0.6, 0.3) : rgb(0.8, 0.2, 0.2) });

  y -= 14;
  page.drawText(`Phone: ${order.customerPhone}`, { x: 50, y, size: 9, font: fontRegular, color: mutedText });
  page.drawText(`Barcode: ${order.barcode}`, { x: 320, y, size: 9, font: fontRegular, color: mutedText });

  y -= 14;
  page.drawText(`Instagram: @${order.instagramUsername}`, { x: 50, y, size: 9, font: fontRegular, color: primaryBlue });
  page.drawText(`Design Option: ${order.designOption === 'DIY' ? 'Customer Self-Designed' : 'Assigned In-House Designer'}`, { x: 320, y, size: 9, font: fontRegular, color: mutedText });

  y -= 14;
  const addr = order.shippingAddress;
  page.drawText(`${addr.street}, ${addr.city}, ${addr.state} - ${addr.postalCode}`, { x: 50, y, size: 9, font: fontRegular, color: mutedText });

  y -= 30;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: borderGrey });

  // 3. Line Items Table Header
  y -= 25;
  page.drawRectangle({ x: 50, y: y - 6, width: 495, height: 22, color: rgb(0.97, 0.98, 0.99) });
  page.drawText('ITEM DESCRIPTION', { x: 60, y, size: 9, font: fontBold, color: darkText });
  page.drawText('QTY', { x: 350, y, size: 9, font: fontBold, color: darkText });
  page.drawText('RATE (INR)', { x: 410, y, size: 9, font: fontBold, color: darkText });
  page.drawText('AMOUNT (INR)', { x: 480, y, size: 9, font: fontBold, color: darkText });

  // Item 1: Card Base Product
  y -= 24;
  page.drawText(`${order.productName} (${order.material})`, { x: 60, y, size: 9, font: fontRegular, color: darkText });
  page.drawText(String(order.quantity), { x: 355, y, size: 9, font: fontRegular, color: darkText });
  page.drawText(`Rs. ${order.unitPrice}`, { x: 415, y, size: 9, font: fontRegular, color: darkText });
  page.drawText(`Rs. ${order.unitPrice * order.quantity}`, { x: 485, y, size: 9, font: fontRegular, color: darkText });

  // Item 2: Designer Fee if applicable
  if (order.designerFee > 0) {
    y -= 18;
    page.drawText('Professional Designer Customization & Preview Service', { x: 60, y, size: 9, font: fontRegular, color: darkText });
    page.drawText('1', { x: 355, y, size: 9, font: fontRegular, color: darkText });
    page.drawText(`Rs. ${order.designerFee}`, { x: 415, y, size: 9, font: fontRegular, color: darkText });
    page.drawText(`Rs. ${order.designerFee}`, { x: 485, y, size: 9, font: fontRegular, color: darkText });
  }

  // Item 3: Shipping
  y -= 18;
  page.drawText('Surface Courier Shipping & Protected Packaging', { x: 60, y, size: 9, font: fontRegular, color: darkText });
  page.drawText('1', { x: 355, y, size: 9, font: fontRegular, color: darkText });
  page.drawText(`Rs. ${order.shippingFee}`, { x: 415, y, size: 9, font: fontRegular, color: darkText });
  page.drawText(`Rs. ${order.shippingFee}`, { x: 485, y, size: 9, font: fontRegular, color: darkText });

  // 4. Financial Totals
  y -= 30;
  page.drawLine({ start: { x: 340, y }, end: { x: 545, y }, thickness: 1, color: borderGrey });

  y -= 16;
  page.drawText('Tax (GST 18%):', { x: 350, y, size: 9, font: fontRegular, color: mutedText });
  page.drawText(`Rs. ${order.taxAmount}`, { x: 485, y, size: 9, font: fontRegular, color: darkText });

  y -= 18;
  page.drawText('TOTAL INVOICE AMOUNT:', { x: 350, y, size: 9, font: fontBold, color: darkText });
  page.drawText(`Rs. ${order.totalAmount}`, { x: 485, y, size: 10, font: fontBold, color: primaryBlue });

  y -= 18;
  page.drawText('Amount Paid (Verified):', { x: 350, y, size: 9, font: fontBold, color: darkText });
  page.drawText(`Rs. ${order.amountPaid}`, { x: 485, y, size: 9, font: fontBold, color: darkText });

  const balance = Math.max(0, order.totalAmount - order.amountPaid);
  y -= 16;
  page.drawText('Balance Outstanding:', { x: 350, y, size: 9, font: fontBold, color: darkText });
  page.drawText(`Rs. ${balance}`, { x: 485, y, size: 9, font: fontBold, color: balance > 0 ? rgb(0.8, 0.2, 0.2) : rgb(0.06, 0.6, 0.3) });

  // 5. Payment Coordination Footer
  y = 120;
  page.drawRectangle({ x: 50, y: y - 20, width: 495, height: 60, color: rgb(0.97, 0.98, 0.99), borderColor: borderGrey, borderWidth: 1 });
  page.drawText('OFFLINE SETTLEMENT INSTRUCTIONS:', { x: 65, y: y + 25, size: 9, font: fontBold, color: darkText });
  page.drawText('1. Complete UPI or Bank Transfer using the shared coordinates.', { x: 65, y: y + 10, size: 8, font: fontRegular, color: mutedText });
  page.drawText('2. Share payment receipt / UTR via WhatsApp for instant administrative verification.', { x: 65, y: y - 2, size: 8, font: fontRegular, color: mutedText });
  page.drawText('3. For designer assistance, your designer will coordinate artwork approvals via WhatsApp.', { x: 65, y: y - 14, size: 8, font: fontRegular, color: mutedText });

  // 6. Security & Legal Notice
  page.drawText(`Generated electronically by ${campaignBrandConfig.name}. This is a computer-verified commercial document.`, {
    x: 50,
    y: 40,
    size: 8,
    font: fontRegular,
    color: mutedText,
  });

  return await doc.save();
}

/**
 * Generates a Packing Slip PDF for dispatch
 */
export async function generatePackingSlipPdf(orderId: string): Promise<Uint8Array> {
  const { order } = await getCampaignOrder(orderId);

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const primaryBlue = rgb(0.145, 0.388, 0.921);
  const darkText = rgb(0.067, 0.094, 0.153);
  const mutedText = rgb(0.392, 0.455, 0.545);

  let y = 800;
  page.drawText(`${campaignBrandConfig.name.toUpperCase()} PACKING SLIP & DISPATCH MANIFEST`, { x: 50, y, size: 15, font: fontBold, color: primaryBlue });
  y -= 18;
  page.drawText(`Order No: ${order.orderNumber}  |  Barcode: ${order.barcode}`, { x: 50, y, size: 10, font: fontBold, color: darkText });

  y -= 30;
  page.drawText('DESTINATION ADDRESS:', { x: 50, y, size: 10, font: fontBold, color: darkText });
  const a = order.shippingAddress;
  y -= 14;
  page.drawText(a.recipientName, { x: 50, y, size: 10, font: fontBold, color: darkText });
  y -= 12;
  page.drawText(`${a.street}, ${a.city}`, { x: 50, y, size: 9, font: fontRegular, color: darkText });
  y -= 12;
  page.drawText(`${a.state} - ${a.postalCode}, ${a.country}`, { x: 50, y, size: 9, font: fontRegular, color: darkText });
  y -= 12;
  page.drawText(`Contact: ${a.phone}`, { x: 50, y, size: 9, font: fontRegular, color: darkText });

  y -= 35;
  page.drawText('PACKAGE CONTENT & QUALITY CHECKLIST:', { x: 50, y, size: 10, font: fontBold, color: darkText });
  y -= 18;
  page.drawText(`[ ] 1x ${order.productName} (NFC NTAG216 Chip Programmed to ${order.instagramUrl})`, { x: 50, y, size: 9, font: fontRegular, color: darkText });
  y -= 16;
  page.drawText('[ ] Protective Card Sleeve & Welcome Instruction Card Included', { x: 50, y, size: 9, font: fontRegular, color: darkText });
  y -= 16;
  page.drawText('[ ] Tap-to-Phone NFC Signal Verification Tested', { x: 50, y, size: 9, font: fontRegular, color: darkText });
  y -= 16;
  page.drawText('[ ] Visual Print Surface Quality & Scratch Inspection Passed', { x: 50, y, size: 9, font: fontRegular, color: darkText });

  return await doc.save();
}


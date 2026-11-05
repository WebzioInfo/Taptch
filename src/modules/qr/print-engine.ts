import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateQRPngDataUrl } from './generator';

export interface PrintSheetItem {
  token: string;
  serialNumber: string;
  label?: string;
  sequenceNumber?: number;
}

export type PrintLayoutType = 'branded_sheet' | 'thermal_sticker' | 'table_tent';

export interface GeneratePdfOptions {
  layout: PrintLayoutType;
  items: PrintSheetItem[];
  companyName?: string;
  batchName?: string;
  batchCode?: string;
  baseUrl?: string;
  appUrl?: string;
}

/**
 * Generates print-ready multi-page PDF documents for physical QR manufacturing.
 */
export async function generatePrintPdf(options: GeneratePdfOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const baseUrl = options.baseUrl || (options.appUrl ? `${options.appUrl}/dq` : 'https://tappzio.webziotech.in/dq');

  if (options.layout === 'thermal_sticker') {
    // Single compact sticker per page (e.g. 50mm x 50mm => 141.7 x 141.7 pt)
    const size = 142; // pt
    for (const item of options.items) {
      const page = pdfDoc.addPage([size, size]);
      const qrDataUrl = await generateQRPngDataUrl(`${baseUrl}/${item.token}`, undefined, 400);
      const pngImage = await pdfDoc.embedPng(qrDataUrl);

      // Draw QR centered
      const qrSize = 100;
      const x = (size - qrSize) / 2;
      const y = size - qrSize - 16;
      page.drawImage(pngImage, { x, y, width: qrSize, height: qrSize });

      // Serial Number below QR
      const serialText = item.serialNumber || item.token;
      const textWidth = fontBold.widthOfTextAtSize(serialText, 7);
      page.drawText(serialText, {
        x: (size - textWidth) / 2,
        y: 10,
        size: 7,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
    }
  } else if (options.layout === 'table_tent') {
    // 4x6 inch table tent (288 x 432 pt)
    const width = 288;
    const height = 432;
    for (const item of options.items) {
      const page = pdfDoc.addPage([width, height]);
      const qrDataUrl = await generateQRPngDataUrl(`${baseUrl}/${item.token}`, undefined, 600);
      const pngImage = await pdfDoc.embedPng(qrDataUrl);

      // Header branding
      const header = options.companyName || 'TAPPZIO CONNECT';
      const headerWidth = fontBold.widthOfTextAtSize(header, 12);
      page.drawText(header, {
        x: (width - headerWidth) / 2,
        y: height - 40,
        size: 12,
        font: fontBold,
        color: rgb(0.05, 0.05, 0.05),
      });

      // Call to action
      const cta = 'SCAN TO CONNECT';
      const ctaWidth = font.widthOfTextAtSize(cta, 9);
      page.drawText(cta, {
        x: (width - ctaWidth) / 2,
        y: height - 56,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Big QR in Center
      const qrSize = 180;
      page.drawImage(pngImage, {
        x: (width - qrSize) / 2,
        y: (height - qrSize) / 2 - 10,
        width: qrSize,
        height: qrSize,
      });

      // Item label or table identifier
      const label = item.label || `Table #${item.sequenceNumber || 1}`;
      const labelWidth = fontBold.widthOfTextAtSize(label, 14);
      page.drawText(label, {
        x: (width - labelWidth) / 2,
        y: 60,
        size: 14,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Serial
      const serial = item.serialNumber;
      const serialWidth = font.widthOfTextAtSize(serial, 8);
      page.drawText(serial, {
        x: (width - serialWidth) / 2,
        y: 35,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  } else {
    // Default: 'branded_sheet' (Standard A4: 595.28 x 841.89 pt, 3x4 grid = 12 items per page)
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const cols = 3;
    const rows = 4;
    const itemsPerPage = cols * rows;

    const cellWidth = (pageWidth - 60) / cols;
    const cellHeight = (pageHeight - 80) / rows;
    const qrSize = 90;

    for (let i = 0; i < options.items.length; i += itemsPerPage) {
      const pageItems = options.items.slice(i, i + itemsPerPage);
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Sheet Header
      page.drawText(`${options.companyName || 'Tappzio'} — Dynamic QR Production Sheet`, {
        x: 30,
        y: pageHeight - 30,
        size: 10,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      for (let j = 0; j < pageItems.length; j++) {
        const item = pageItems[j];
        const col = j % cols;
        const row = Math.floor(j / cols);

        const x = 30 + col * cellWidth;
        const y = pageHeight - 50 - (row + 1) * cellHeight;

        // Cut marks (corners)
        const markLen = 6;
        page.drawLine({ start: { x, y }, end: { x: x + markLen, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
        page.drawLine({ start: { x, y }, end: { x, y: y + markLen }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });

        // QR Image
        const qrDataUrl = await generateQRPngDataUrl(`${baseUrl}/${item.token}`, undefined, 300);
        const pngImage = await pdfDoc.embedPng(qrDataUrl);

        const qrX = x + (cellWidth - qrSize) / 2;
        const qrY = y + cellHeight - qrSize - 20;
        page.drawImage(pngImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

        // Text & Serial
        const labelText = item.label || `Item #${item.sequenceNumber || j + 1}`;
        const lWidth = fontBold.widthOfTextAtSize(labelText, 8);
        page.drawText(labelText, {
          x: x + (cellWidth - lWidth) / 2,
          y: qrY - 14,
          size: 8,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        const sText = item.serialNumber;
        const sWidth = font.widthOfTextAtSize(sText, 7);
        page.drawText(sText, {
          x: x + (cellWidth - sWidth) / 2,
          y: qrY - 26,
          size: 7,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      }
    }
  }

  return await pdfDoc.save();
}

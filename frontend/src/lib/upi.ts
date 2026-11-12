/**
 * TAPTCH CENTRALIZED UPI PAYMENT & QR CODE UTILITIES
 * Standard NPCI UPI URI generation and validation.
 */

import QRCode from 'qrcode';

export interface UpiPaymentConfig {
  upiId: string;
  payeeName?: string;
  description?: string;
  defaultAmount?: string | number;
  note?: string;
  isEnabled?: boolean;
}

/**
 * Strict regex for Indian Unified Payments Interface (UPI) Virtual Payment Address (VPA).
 * e.g. merchant@upi, user@okhdfcbank, name@icici
 */
export const UPI_VPA_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

/**
 * Validates whether a given string is a syntactically valid UPI VPA.
 */
export function isValidUpiId(upiId: string): boolean {
  if (!upiId) return false;
  return UPI_VPA_REGEX.test(upiId.trim());
}

/**
 * Formats standard NPCI `upi://pay` URI intent string.
 */
export function buildUpiPaymentUri(params: {
  upiId: string;
  payeeName?: string;
  amount?: string | number;
  note?: string;
  transactionRef?: string;
}): string {
  const cleanUpi = params.upiId.trim();
  const searchParams = new URLSearchParams();

  searchParams.set('pa', cleanUpi);
  if (params.payeeName?.trim()) {
    searchParams.set('pn', params.payeeName.trim());
  }
  searchParams.set('cu', 'INR');

  if (params.amount) {
    const num = Number(params.amount);
    if (!isNaN(num) && num > 0) {
      searchParams.set('am', num.toFixed(2));
    }
  }

  if (params.note?.trim()) {
    searchParams.set('tn', params.note.trim());
  }

  if (params.transactionRef?.trim()) {
    searchParams.set('tr', params.transactionRef.trim());
  }

  return `upi://pay?${searchParams.toString()}`;
}

/**
 * Generates a high-contrast Data URL image for a UPI URI.
 */
export async function generateUpiQrDataUrl(
  uri: string,
  options: { width?: number; margin?: number; color?: { dark?: string; light?: string } } = {}
): Promise<string> {
  return QRCode.toDataURL(uri, {
    width: options.width ?? 320,
    margin: options.margin ?? 2,
    color: {
      dark: options.color?.dark ?? '#000000',
      light: options.color?.light ?? '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Generates an SVG string for a UPI URI.
 */
export async function generateUpiQrSvg(
  uri: string,
  options: { width?: number; margin?: number } = {}
): Promise<string> {
  return QRCode.toString(uri, {
    type: 'svg',
    width: options.width ?? 320,
    margin: options.margin ?? 2,
    errorCorrectionLevel: 'M',
  });
}


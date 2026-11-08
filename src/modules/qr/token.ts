import { randomBytes, createHash } from 'node:crypto';

/**
 * Generates a 32-character lowercase URL-safe cryptographic token (128 bits entropy, 3.4 x 10^38 space).
 * Generated via crypto.randomBytes(16).toString('hex').
 * Upgraded from legacy 32-bit (8-char) tokens to full 128-bit cryptographically secure entropy.
 * Backward-compatible: database schema varchar(32) accommodates both 8-char legacy and 32-char new tokens.
 */
export function generateQRToken(): string {
  return randomBytes(16).toString('hex').toLowerCase();
}

/**
 * Generates an internal human-readable sequential tracking serial number.
 */
export function generateQRSerial(sequenceNumber: number, prefix: string = 'TPZ-QR'): string {
  const padded = String(sequenceNumber).padStart(6, '0');
  return `${prefix}-${padded}`;
}

/**
 * Interpolates template tokens into destination URL.
 * e.g., base="https://menu.com", param="table", prefix="T", sep="-", seq=1
 * Result => "https://menu.com?table=T-1" (or &table=T-1 if query already exists)
 */
export function interpolateUrlTemplate(
  baseUrl: string,
  paramName?: string | null,
  valuePrefix?: string | null,
  sep: string = '-',
  sequence: number = 1
): string {
  if (!paramName) return baseUrl;
  const paramVal = valuePrefix ? `${valuePrefix}${sep}${sequence}` : String(sequence);
  try {
    const parsed = new URL(baseUrl);
    parsed.searchParams.set(paramName, paramVal);
    return parsed.toString();
  } catch {
    const hasQuery = baseUrl.includes('?');
    return `${baseUrl}${hasQuery ? '&' : '?'}${encodeURIComponent(paramName)}=${encodeURIComponent(paramVal)}`;
  }
}

/**
 * Anonymize visitor IP with a daily rotating salt to comply with DPDP Act 2023.
 */
export function anonymizeVisitorIp(ip?: string): string {
  const dayString = new Date().toISOString().slice(0, 10);
  const salt = process.env.VISITOR_SALT_SECRET || 'taptch-visitor-salt-2026';
  return createHash('sha256')
    .update(`${ip || '127.0.0.1'}-${dayString}-${salt}`)
    .digest('hex')
    .slice(0, 32);
}

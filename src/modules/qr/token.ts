import { randomBytes, createHash } from 'node:crypto';

/**
 * Generates a cryptographically unguessable public QR token with >= 72 bits entropy.
 * Format: 12 bytes encoded in Base64URL (16 characters, URL-safe: A-Z, a-z, 0-9, -, _)
 */
export function generateQRToken(): string {
  return randomBytes(12)
    .toString('base64url')
    .replace(/[+/=]/g, '');
}

/**
 * Generates an internal human-readable sequential tracking serial number.
 * Note: Never used as a security identifier in public redirect paths.
 */
export function generateQRSerial(sequenceNumber: number, prefix: string = 'TPZ-QR'): string {
  const padded = String(sequenceNumber).padStart(6, '0');
  return `${prefix}-${padded}`;
}

/**
 * Anonymize visitor IP with a daily rotating salt to comply with DPDP Act 2023.
 */
export function anonymizeVisitorIp(ip?: string): string {
  const dayString = new Date().toISOString().slice(0, 10);
  const salt = process.env.VISITOR_SALT_SECRET || 'tappzio-visitor-salt-2026';
  return createHash('sha256')
    .update(`${ip || '127.0.0.1'}-${dayString}-${salt}`)
    .digest('hex')
    .slice(0, 32);
}


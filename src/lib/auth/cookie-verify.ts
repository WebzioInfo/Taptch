/**
 * Cryptographic Session Cookie Signature Verification for Next.js Edge Middleware
 * Validates Better Auth HMAC-SHA-256 signed session cookies.
 */

const algorithm = {
  name: 'HMAC',
  hash: 'SHA-256',
};

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const secretBuf = new TextEncoder().encode(secret);
  return await crypto.subtle.importKey('raw', secretBuf, algorithm, false, ['verify']);
}

/**
 * Cryptographically verifies that a cookie value was signed by this server with BETTER_AUTH_SECRET.
 * Cookie format from Better Auth: `<raw_token>.<base64_hmac_signature>`
 */
export async function verifySignedSessionCookie(
  rawCookieValue: string,
  secret?: string
): Promise<boolean> {
  if (!rawCookieValue) return false;

  const authSecret =
    secret ||
    process.env.BETTER_AUTH_SECRET ||
    'tappzio-development-better-auth-secret-min-32-chars-long';

  // Decode URI component if percent-encoded
  let decoded = rawCookieValue;
  try {
    decoded = decodeURIComponent(rawCookieValue);
  } catch {
    // If decoding fails, keep raw
  }

  const dotPos = decoded.lastIndexOf('.');
  if (dotPos < 1) {
    // Unsigned or forged cookie without signature
    return false;
  }

  const value = decoded.substring(0, dotPos);
  const signatureBase64 = decoded.substring(dotPos + 1);

  if (signatureBase64.length !== 44 || !signatureBase64.endsWith('=')) {
    return false;
  }

  try {
    const signatureBinStr = atob(signatureBase64);
    const signature = new Uint8Array(signatureBinStr.length);
    for (let i = 0; i < signatureBinStr.length; i++) {
      signature[i] = signatureBinStr.charCodeAt(i);
    }

    const key = await getCryptoKey(authSecret);
    const isValid = await crypto.subtle.verify(
      algorithm,
      key,
      signature,
      new TextEncoder().encode(value)
    );

    return isValid;
  } catch {
    return false;
  }
}


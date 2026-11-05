/**
 * Universal client & server safe QR token extractor.
 * Parses raw text from camera viewfinders, pasted strings, or redirect URLs.
 */
export function extractQRToken(rawText: string): string {
  const trimmed = rawText.trim();
  // Case 1: Full URL e.g. https://site.com/dq/abcd1234 or /q/abcd1234
  const urlMatch = trimmed.match(/(?:dq|q)\/([a-zA-Z0-9_-]{6,32})/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toLowerCase();
  }
  // Case 2: Query param e.g. ?token=abcd1234
  const queryMatch = trimmed.match(/[?&]token=([a-zA-Z0-9_-]{6,32})/i);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1].toLowerCase();
  }
  // Case 3: Raw token itself (6 to 32 alphanumeric chars)
  const tokenOnlyMatch = trimmed.match(/^[a-zA-Z0-9_-]{6,32}$/);
  if (tokenOnlyMatch) {
    return tokenOnlyMatch[0].toLowerCase();
  }
  return trimmed;
}

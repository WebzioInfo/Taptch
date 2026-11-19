/**
 * Address lookup utilities for India postal codes.
 * Geolocation / GPS tracking has been completely removed.
 */

const pinCache = new Map<string, { city: string; state: string }>();

/**
 * Looks up city and state from official India Post PIN code database.
 * Debounced and cached per 6-digit PIN.
 */
export async function lookupPinCode(pin: string): Promise<{ city: string; state: string } | null> {
  const cleanPin = pin.replace(/\D/g, '');
  if (cleanPin.length !== 6) return null;

  if (pinCache.has(cleanPin)) {
    return pinCache.get(cleanPin)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();

    if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0].PostOffice)) {
      const firstPo = data[0].PostOffice[0];
      const city = firstPo.District || firstPo.Division || firstPo.Name || '';
      const state = firstPo.State || '';

      if (city || state) {
        const result = { city, state };
        pinCache.set(cleanPin, result);
        return result;
      }
    }
    return null;
  } catch {
    // Fail silently without blocking manual user input
    return null;
  }
}

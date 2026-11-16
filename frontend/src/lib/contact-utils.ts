/**
 * Direct Contact Coordinates Utilities
 * Normalization & URL generation for Phone, WhatsApp, Email, Website, and Address.
 * Guaranteed safe: never throws on null, undefined, objects, or non-string inputs.
 */

import { safeTrim } from './data-normalization';

export function formatTelLink(phone?: string | null): string | null {
  const clean = safeTrim(phone);
  if (!clean) return null;
  return `tel:${clean}`;
}

export function formatWhatsAppLink(whatsapp?: string | null, fallbackPhone?: string | null): string | null {
  const target = safeTrim(whatsapp) || safeTrim(fallbackPhone);
  if (!target) return null;

  // Direct wa.me or api.whatsapp.com URL handling
  if (/^(https?:\/\/)?(www\.)?(wa\.me|api\.whatsapp\.com)/i.test(target)) {
    return target.startsWith('http') ? target : `https://${target}`;
  }

  // Strip all non-numeric characters (spaces, dashes, parentheses, plus)
  const digits = target.replace(/\D/g, '');

  // E.164 phone numbers require at least 7 digits (smallest national/international number) up to 15 digits.
  // Numbers with fewer than 7 digits are incomplete and cannot initiate a WhatsApp chat session.
  if (digits.length < 7 || digits.length > 15) {
    return null;
  }

  return `https://wa.me/${digits}`;
}

export function formatMailtoLink(email?: string | null): string | null {
  const clean = safeTrim(email);
  if (!clean) return null;
  return `mailto:${clean}`;
}

export function formatWebsiteUrl(website?: string | null): string | null {
  const clean = safeTrim(website);
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }
  return `https://${clean}`;
}

export function formatWebsiteDisplay(website?: string | null): string | null {
  const clean = safeTrim(website);
  if (!clean) return null;
  return clean.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export function formatMapsLink(address?: string | null): string | null {
  const clean = safeTrim(address);
  if (!clean) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean)}`;
}

export function hasAnyContactCoordinates(profile: {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
}): boolean {
  if (!profile || typeof profile !== 'object') return false;
  return Boolean(
    safeTrim(profile.phone) ||
    safeTrim(profile.whatsapp) ||
    safeTrim(profile.email) ||
    safeTrim(profile.website) ||
    safeTrim(profile.address)
  );
}

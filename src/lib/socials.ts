/**
 * TAPTCH CENTRALIZED SOCIAL MEDIA CONFIGURATION & NORMALIZATION
 * Supports both Username mode (@handle) and Full URL mode across 13 major platforms.
 */

export interface SocialPlatformConfig {
  id: string;
  name: string;
  placeholder: string;
  prefixUrl: string;
  domain: string;
  sanitizeUsername: (input: string) => string;
  buildUrl: (usernameOrUrl: string) => string;
  validate: (input: string) => boolean;
}

const defaultSanitizer = (input: string): string => {
  return input.trim().replace(/^@/, '').replace(/\/+$/, '');
};

export const SOCIAL_PLATFORMS: Record<string, SocialPlatformConfig> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    placeholder: '@username or profile URL',
    prefixUrl: 'https://instagram.com/',
    domain: 'instagram.com',
    sanitizeUsername: defaultSanitizer,
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://instagram.com/${clean}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    placeholder: 'username or in/profile URL',
    prefixUrl: 'https://linkedin.com/in/',
    domain: 'linkedin.com',
    sanitizeUsername: (val) => {
      const clean = defaultSanitizer(val);
      return clean.replace(/^in\//, '');
    },
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      const slug = clean.replace(/^in\//, '');
      return `https://linkedin.com/in/${slug}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    placeholder: '@username or profile URL',
    prefixUrl: 'https://x.com/',
    domain: 'x.com',
    sanitizeUsername: defaultSanitizer,
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://x.com/${clean}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    placeholder: '@channel or channel URL',
    prefixUrl: 'https://youtube.com/@',
    domain: 'youtube.com',
    sanitizeUsername: defaultSanitizer,
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      const channel = clean.startsWith('@') ? clean : `@${clean}`;
      return `https://youtube.com/${channel}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    placeholder: 'username or profile URL',
    prefixUrl: 'https://facebook.com/',
    domain: 'facebook.com',
    sanitizeUsername: defaultSanitizer,
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://facebook.com/${clean}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    placeholder: 'Phone number with country code (+91...)',
    prefixUrl: 'https://wa.me/',
    domain: 'wa.me',
    sanitizeUsername: (val) => val.trim().replace(/[^0-9]/g, ''),
    buildUrl: (val) => {
      const clean = val.trim();
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      const digits = clean.replace(/[^0-9]/g, '');
      return `https://wa.me/${digits}`;
    },
    validate: (val) => val.replace(/[^0-9]/g, '').length >= 10,
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    placeholder: '@username or t.me URL',
    prefixUrl: 'https://t.me/',
    domain: 't.me',
    sanitizeUsername: defaultSanitizer,
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://t.me/${clean}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
  github: {
    id: 'github',
    name: 'GitHub',
    placeholder: 'username or profile URL',
    prefixUrl: 'https://github.com/',
    domain: 'github.com',
    sanitizeUsername: defaultSanitizer,
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://github.com/${clean}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    placeholder: '@username or profile URL',
    prefixUrl: 'https://tiktok.com/@',
    domain: 'tiktok.com',
    sanitizeUsername: defaultSanitizer,
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      const handle = clean.startsWith('@') ? clean : `@${clean}`;
      return `https://tiktok.com/${handle}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
  behance: {
    id: 'behance',
    name: 'Behance',
    placeholder: 'username or profile URL',
    prefixUrl: 'https://behance.net/',
    domain: 'behance.net',
    sanitizeUsername: defaultSanitizer,
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://behance.net/${clean}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
  dribbble: {
    id: 'dribbble',
    name: 'Dribbble',
    placeholder: 'username or profile URL',
    prefixUrl: 'https://dribbble.com/',
    domain: 'dribbble.com',
    sanitizeUsername: defaultSanitizer,
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://dribbble.com/${clean}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    placeholder: 'username or profile URL',
    prefixUrl: 'https://pinterest.com/',
    domain: 'pinterest.com',
    sanitizeUsername: defaultSanitizer,
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://pinterest.com/${clean}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
  snapchat: {
    id: 'snapchat',
    name: 'Snapchat',
    placeholder: 'username or add URL',
    prefixUrl: 'https://snapchat.com/add/',
    domain: 'snapchat.com',
    sanitizeUsername: defaultSanitizer,
    buildUrl: (val) => {
      const clean = defaultSanitizer(val);
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://snapchat.com/add/${clean}`;
    },
    validate: (val) => Boolean(val.trim()),
  },
};

/**
 * Normalizes any social platform input (username or full URL) into a canonical destination URL.
 */
export function normalizeSocialUrl(platformId: string, input: string): string {
  const platform = SOCIAL_PLATFORMS[platformId.toLowerCase()];
  if (!platform) {
    if (input.startsWith('http://') || input.startsWith('https://')) return input;
    return `https://${input}`;
  }
  return platform.buildUrl(input);
}

/**
 * Extracts a displayable username/handle from a full URL or raw username.
 */
export function extractSocialHandle(platformId: string, urlOrHandle: string): string {
  if (!urlOrHandle) return '';
  const clean = urlOrHandle.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    return clean.startsWith('@') ? clean : `@${clean}`;
  }

  try {
    const parsed = new URL(clean);
    const pathname = parsed.pathname.replace(/^\/+|\/+$/g, '');
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart ? `@${lastPart.replace(/^@/, '')}` : clean;
  } catch {
    return clean;
  }
}

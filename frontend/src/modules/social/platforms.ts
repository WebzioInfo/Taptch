export type SocialPlatformId =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'github'
  | 'tiktok'
  | 'snapchat'
  | 'pinterest'
  | 'threads'
  | 'telegram'
  | 'twitch'
  | 'medium'
  | 'behance'
  | 'dribbble'
  | 'reddit';

export interface SocialPlatformConfig {
  id: SocialPlatformId;
  name: string;
  urlPrefix: string;
  urlSuffix: string;
  displayAtPrefix: boolean;
  domains: string[];
  pathPrefixRegex?: RegExp;
  usernameRegex: RegExp;
}

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    urlPrefix: 'https://www.instagram.com/',
    urlSuffix: '/',
    displayAtPrefix: true,
    domains: ['instagram.com', 'www.instagram.com'],
    usernameRegex: /^[a-zA-Z0-9._]{1,30}$/,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    urlPrefix: 'https://www.facebook.com/',
    urlSuffix: '',
    displayAtPrefix: false,
    domains: ['facebook.com', 'www.facebook.com', 'fb.com'],
    usernameRegex: /^[a-zA-Z0-9.]{3,50}$/,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    urlPrefix: 'https://www.linkedin.com/in/',
    urlSuffix: '/',
    displayAtPrefix: false,
    domains: ['linkedin.com', 'www.linkedin.com'],
    pathPrefixRegex: /^\/in\//i,
    usernameRegex: /^[a-zA-Z0-9-]{3,100}$/,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    urlPrefix: 'https://x.com/',
    urlSuffix: '',
    displayAtPrefix: true,
    domains: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
    usernameRegex: /^[a-zA-Z0-9_]{1,15}$/,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    urlPrefix: 'https://www.youtube.com/@',
    urlSuffix: '',
    displayAtPrefix: true,
    domains: ['youtube.com', 'www.youtube.com'],
    usernameRegex: /^[a-zA-Z0-9._-]{3,30}$/,
  },
  {
    id: 'github',
    name: 'GitHub',
    urlPrefix: 'https://github.com/',
    urlSuffix: '',
    displayAtPrefix: true,
    domains: ['github.com', 'www.github.com'],
    usernameRegex: /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    urlPrefix: 'https://www.tiktok.com/@',
    urlSuffix: '',
    displayAtPrefix: true,
    domains: ['tiktok.com', 'www.tiktok.com'],
    usernameRegex: /^[a-zA-Z0-9._]{2,24}$/,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    urlPrefix: 'https://www.snapchat.com/add/',
    urlSuffix: '',
    displayAtPrefix: false,
    domains: ['snapchat.com', 'www.snapchat.com'],
    pathPrefixRegex: /^\/add\//i,
    usernameRegex: /^[a-zA-Z0-9._-]{3,15}$/,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    urlPrefix: 'https://www.pinterest.com/',
    urlSuffix: '/',
    displayAtPrefix: true,
    domains: ['pinterest.com', 'www.pinterest.com'],
    usernameRegex: /^[a-zA-Z0-9_]{3,30}$/,
  },
  {
    id: 'threads',
    name: 'Threads',
    urlPrefix: 'https://www.threads.net/@',
    urlSuffix: '',
    displayAtPrefix: true,
    domains: ['threads.net', 'www.threads.net'],
    usernameRegex: /^[a-zA-Z0-9._]{1,30}$/,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    urlPrefix: 'https://t.me/',
    urlSuffix: '',
    displayAtPrefix: true,
    domains: ['t.me', 'telegram.me'],
    usernameRegex: /^[a-zA-Z0-9_]{5,32}$/,
  },
  {
    id: 'twitch',
    name: 'Twitch',
    urlPrefix: 'https://www.twitch.tv/',
    urlSuffix: '',
    displayAtPrefix: false,
    domains: ['twitch.tv', 'www.twitch.tv'],
    usernameRegex: /^[a-zA-Z0-9_]{4,25}$/,
  },
  {
    id: 'medium',
    name: 'Medium',
    urlPrefix: 'https://medium.com/@',
    urlSuffix: '',
    displayAtPrefix: true,
    domains: ['medium.com', 'www.medium.com'],
    usernameRegex: /^[a-zA-Z0-9._-]{2,30}$/,
  },
  {
    id: 'behance',
    name: 'Behance',
    urlPrefix: 'https://www.behance.net/',
    urlSuffix: '',
    displayAtPrefix: false,
    domains: ['behance.net', 'www.behance.net'],
    usernameRegex: /^[a-zA-Z0-9_-]{2,50}$/,
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    urlPrefix: 'https://dribbble.com/',
    urlSuffix: '',
    displayAtPrefix: false,
    domains: ['dribbble.com', 'www.dribbble.com'],
    usernameRegex: /^[a-zA-Z0-9_-]{2,40}$/,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    urlPrefix: 'https://www.reddit.com/user/',
    urlSuffix: '/',
    displayAtPrefix: false,
    domains: ['reddit.com', 'www.reddit.com'],
    pathPrefixRegex: /^\/(?:user|u)\//i,
    usernameRegex: /^[a-zA-Z0-9_-]{3,20}$/,
  },
];

export const SOCIAL_PLATFORM_MAP: Record<string, SocialPlatformConfig> = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.id, p]),
);

export function getSocialPlatform(platformId?: string | null): SocialPlatformConfig | null {
  if (!platformId) return null;
  const norm = platformId.toLowerCase().trim();
  return SOCIAL_PLATFORM_MAP[norm] || null;
}

/**
 * Extracts a clean username from either a raw handle (with or without @)
 * or a pasted profile URL belonging to the selected platform.
 */
export function extractSocialUsername(platformId: string, rawInput?: string | null): string {
  if (!rawInput) return '';
  let value = rawInput.trim();
  if (!value) return '';

  const platform = getSocialPlatform(platformId);

  // Reject unsafe protocols
  if (/^(javascript|data|vbscript):/i.test(value)) {
    return '';
  }

  // If user pasted a URL, extract the username segment
  if (/^https?:\/\//i.test(value) || (platform && platform.domains.some((d) => value.toLowerCase().startsWith(d)))) {
    try {
      const normalizedUrl = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      const parsed = new URL(normalizedUrl);
      let pathname = parsed.pathname;
      if (platform?.pathPrefixRegex) {
        pathname = pathname.replace(platform.pathPrefixRegex, '/');
      }
      const segments = pathname.split('/').filter(Boolean);
      value = segments[0] || '';
    } catch {
      return '';
    }
  }

  // Strip any leading @ symbols
  value = value.replace(/^@+/, '').trim();
  return value;
}

export function validateSocialUsername(
  platformId: string,
  rawInput?: string | null,
): { valid: boolean; username: string; error?: string } {
  const platform = getSocialPlatform(platformId);
  if (!platform) {
    return { valid: false, username: '', error: 'Unsupported social platform.' };
  }

  const username = extractSocialUsername(platformId, rawInput);
  if (!username) {
    return { valid: false, username: '', error: `Enter your ${platform.name} username.` };
  }

  if (/\s/.test(username) || /[/?#\\]/.test(username)) {
    return {
      valid: false,
      username,
      error: `${platform.name} username cannot contain spaces or URL characters.`,
    };
  }

  if (!platform.usernameRegex.test(username)) {
    return {
      valid: false,
      username,
      error: `Invalid ${platform.name} username format.`,
    };
  }

  return { valid: true, username };
}

export function buildSocialProfileUrl(
  platformId: string,
  rawInput?: string | null,
): { url: string; username: string; displayHandle: string; platform: SocialPlatformConfig } | null {
  const platform = getSocialPlatform(platformId);
  if (!platform) return null;

  const { valid, username } = validateSocialUsername(platformId, rawInput);
  if (!valid || !username) return null;

  const url = `${platform.urlPrefix}${encodeURIComponent(username)}${platform.urlSuffix}`;
  const displayHandle = platform.displayAtPrefix ? `@${username}` : username;

  return {
    url,
    username,
    displayHandle,
    platform,
  };
}

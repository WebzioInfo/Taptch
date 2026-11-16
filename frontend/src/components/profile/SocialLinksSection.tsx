import React from 'react';
import {
  filterValidSocialLinks,
  normalizeSocialUrl,
  extractSocialHandle,
  SOCIAL_PLATFORMS,
} from '@/lib/socials';
import { getSocialPlatformIcon } from '@/lib/social-icons';
import { ExternalLink } from 'lucide-react';

export interface SocialLinksSectionProps {
  socialLinks?: Array<{ id?: string; platform: string; url: string }> | null;
  title?: string;
  className?: string;
  themeStyle?: {
    accentColor?: string;
    cardBg?: string;
    borderColor?: string;
    textColor?: string;
    headingColor?: string;
  };
  variant?:
    | 'obsidian'
    | 'corporate'
    | 'dark'
    | 'soft'
    | 'editorial'
    | 'industrial'
    | 'modern'
    | 'ivory'
    | 'retail'
    | 'restaurant'
    | 'creative'
    | 'apex';
}

export function SocialLinksSection({
  socialLinks,
  title = 'Connect & Follow',
  className = '',
  themeStyle,
  variant = 'obsidian',
}: SocialLinksSectionProps) {
  const validLinks = filterValidSocialLinks(socialLinks);

  if (validLinks.length === 0) {
    return null;
  }

  // Fallback styling tokens based on theme variant
  const accent = themeStyle?.accentColor || (variant === 'editorial' ? '#000000' : '#D4AF37');
  const cardBg = themeStyle?.cardBg || '#121216';
  const border = themeStyle?.borderColor || 'rgba(255, 255, 255, 0.1)';
  const text = themeStyle?.textColor || '#EDEDED';
  const heading = themeStyle?.headingColor || '#FFFFFF';

  // 1. Bold Editorial Variant
  if (variant === 'editorial') {
    return (
      <section className={`index-section ${className}`} aria-label={title}>
        <div className="index-header" style={{ marginBottom: '12px' }}>
          <h2 className="index-title font-mono font-bold text-xs uppercase tracking-widest" style={{ color: heading }}>
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2 font-mono">
          {validLinks.map((link, idx) => {
            const platformCfg = SOCIAL_PLATFORMS[link.platform.toLowerCase()];
            const platformName = platformCfg?.name || link.platform;
            const targetUrl = normalizeSocialUrl(link.platform, link.url);
            const handle = extractSocialHandle(link.platform, link.url);

            return (
              <a
                key={link.id || `social-${idx}`}
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 border flex items-center justify-between text-xs transition-colors hover:bg-black/5"
                style={{ backgroundColor: cardBg, borderColor: border, color: text }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0" style={{ color: accent }}>
                    {getSocialPlatformIcon(link.platform, 'w-4 h-4')}
                  </span>
                  <div className="truncate">
                    <span className="font-bold block text-[11px] truncate">{platformName}</span>
                    <span className="text-[9px] text-neutral-400 block truncate">{handle}</span>
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
              </a>
            );
          })}
        </div>
      </section>
    );
  }

  // 2. Soft Modern Variant
  if (variant === 'soft') {
    return (
      <section className={`rounded-2xl p-4 border transition-colors ${className}`} style={{ backgroundColor: cardBg, borderColor: border }} aria-label={title}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold tracking-wider uppercase font-serif" style={{ color: heading }}>
            {title}
          </h2>
          <span className="text-[10px] opacity-60 font-medium">{validLinks.length} Channels</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {validLinks.map((link, idx) => {
            const platformCfg = SOCIAL_PLATFORMS[link.platform.toLowerCase()];
            const platformName = platformCfg?.name || link.platform;
            const targetUrl = normalizeSocialUrl(link.platform, link.url);

            return (
              <a
                key={link.id || `social-${idx}`}
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-full border flex items-center gap-2 text-xs font-medium transition-all hover:scale-[1.02] shadow-xs"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  borderColor: border,
                  color: text,
                }}
              >
                <span className="shrink-0" style={{ color: accent }}>
                  {getSocialPlatformIcon(link.platform, 'w-3.5 h-3.5')}
                </span>
                <span className="text-[11px] font-medium">{platformName}</span>
              </a>
            );
          })}
        </div>
      </section>
    );
  }

  // 3. Creative Agency Variant
  if (variant === 'creative') {
    return (
      <section className={`rounded-2xl p-4 border transition-colors ${className}`} style={{ backgroundColor: cardBg, borderColor: border }} aria-label={title}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold tracking-wider uppercase text-purple-300" style={{ color: heading }}>
            {title}
          </h2>
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {validLinks.map((link, idx) => {
            const platformCfg = SOCIAL_PLATFORMS[link.platform.toLowerCase()];
            const platformName = platformCfg?.name || link.platform;
            const targetUrl = normalizeSocialUrl(link.platform, link.url);
            const handle = extractSocialHandle(link.platform, link.url);

            return (
              <a
                key={link.id || `social-${idx}`}
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all hover:border-purple-400/50 hover:bg-purple-950/30 group"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: border, color: text }}
              >
                <div className="p-2 rounded-lg bg-purple-900/40 text-purple-300 border border-purple-500/20 group-hover:scale-110 transition-transform shrink-0">
                  {getSocialPlatformIcon(link.platform, 'w-3.5 h-3.5')}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold block text-white text-[11px] truncate">{platformName}</span>
                  <span className="text-[9px] text-purple-200/70 block truncate">{handle}</span>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    );
  }

  // 4. Default Master Luxury / Obsidian / Corporate / Industrial / Apex / Retail Variant
  return (
    <section
      className={`rounded-3xl p-5 border shadow-lg transition-colors ${className}`}
      style={{ backgroundColor: cardBg, borderColor: border }}
      aria-label={title}
    >
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-xs font-bold tracking-wider uppercase" style={{ color: heading }}>
          {title}
        </h2>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
          style={{ borderColor: border, color: accent, backgroundColor: `${accent}15` }}
        >
          {validLinks.length} {validLinks.length === 1 ? 'Channel' : 'Channels'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {validLinks.map((link, idx) => {
          const platformCfg = SOCIAL_PLATFORMS[link.platform.toLowerCase()];
          const platformName = platformCfg?.name || link.platform;
          const targetUrl = normalizeSocialUrl(link.platform, link.url);
          const handle = extractSocialHandle(link.platform, link.url);

          return (
            <a
              key={link.id || `social-${idx}`}
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border flex items-center gap-2.5 transition-all hover:scale-[1.01] hover:border-white/30 group"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: border,
                color: text,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: `${accent}18`,
                  borderColor: `${accent}40`,
                  color: accent,
                }}
              >
                {getSocialPlatformIcon(link.platform, 'w-4 h-4')}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-semibold block text-xs truncate" style={{ color: heading }}>
                  {platformName}
                </span>
                <span className="text-[10px] opacity-70 block truncate">
                  {handle || 'View Channel'}
                </span>
              </div>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-40 group-hover:opacity-90 transition-opacity" style={{ color: accent }} />
            </a>
          );
        })}
      </div>
    </section>
  );
}

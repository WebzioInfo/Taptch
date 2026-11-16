import React from 'react';
import { Building2, Globe, MapPin, ExternalLink } from 'lucide-react';
import { safeTrim } from '@/lib/data-normalization';

export interface BusinessItemData {
  id?: string;
  companyName?: string | null;
  name?: string | null;
  roleTitle?: string | null;
  tagline?: string | null;
  websiteUrl?: string | null;
  businessWebsite?: string | null;
  address?: string | null;
  businessAddress?: string | null;
  logoUrl?: string | null;
  industry?: string | null;
  description?: string | null;
}

export interface VenturesSectionProps {
  businesses?: BusinessItemData[] | null;
  title?: string;
  className?: string;
  themeStyle?: {
    accentColor?: string;
    cardBg?: string;
    borderColor?: string;
    textColor?: string;
    headingColor?: string;
    mutedColor?: string;
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

export function VenturesSection({
  businesses,
  title = 'Our Companies & Business Units',
  className = '',
  themeStyle,
  variant = 'obsidian',
}: VenturesSectionProps) {
  const activeBusinesses = (businesses || [])
    .map((b, idx) => ({
      id: b.id || `biz-${idx}`,
      companyName: safeTrim(b.companyName || b.name),
      roleTitle: safeTrim(b.roleTitle || b.tagline),
      websiteUrl: safeTrim(b.websiteUrl || b.businessWebsite),
      address: safeTrim(b.address || b.businessAddress),
      industry: safeTrim(b.industry),
      description: safeTrim(b.description),
      logoUrl: safeTrim(b.logoUrl),
    }))
    .filter((b) => Boolean(b.companyName));

  if (activeBusinesses.length === 0) {
    return null;
  }

  const accent = themeStyle?.accentColor || (variant === 'editorial' ? '#000000' : '#D4AF37');
  const cardBg = themeStyle?.cardBg || '#121216';
  const border = themeStyle?.borderColor || 'rgba(255, 255, 255, 0.12)';
  const text = themeStyle?.textColor || '#EDEDED';
  const heading = themeStyle?.headingColor || '#FFFFFF';

  if (variant === 'editorial') {
    return (
      <section className={`index-section ${className}`} aria-labelledby="ventures-editorial-title">
        <div className="index-header" style={{ marginBottom: '12px' }}>
          <div className="flex items-center justify-between">
            <h2 id="ventures-editorial-title" className="index-title font-mono font-bold text-xs uppercase tracking-widest text-black">
              COMPANIES &amp; POSITIONS
            </h2>
            <span className="font-mono text-[10px] font-bold border border-black px-1.5 py-0.5">
              [ {activeBusinesses.length < 10 ? `0${activeBusinesses.length}` : activeBusinesses.length} ]
            </span>
          </div>
        </div>
        <div className="border border-black divide-y divide-black font-mono">
          {activeBusinesses.map((biz) => {
            const webLink = biz.websiteUrl
              ? biz.websiteUrl.startsWith('http')
                ? biz.websiteUrl
                : `https://${biz.websiteUrl}`
              : null;

            return (
              <div key={biz.id} className="p-3 bg-white space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                      [ ENTITY ]
                    </span>
                    <h3 className="font-bold text-sm text-black uppercase tracking-tight break-words">
                      {biz.companyName}
                    </h3>
                    {biz.roleTitle && (
                      <p className="text-xs text-neutral-700 mt-0.5 font-medium break-words">
                        {biz.roleTitle}
                      </p>
                    )}
                  </div>
                  {webLink && (
                    <a
                      href={webLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold underline text-black hover:opacity-75 uppercase shrink-0 pt-1"
                    >
                      [ SITE ]
                    </a>
                  )}
                </div>
                {biz.address && (
                  <div className="text-[10px] text-neutral-600 flex items-center gap-1 pt-1 border-t border-black/10">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{biz.address}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div
      className={`rounded-2xl p-5 space-y-4 shadow-xl transition-all ${className}`}
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${border}`,
        color: text,
      }}
    >
      <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: border }}>
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: heading }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />
          <span>{title}</span>
        </h3>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0"
          style={{ borderColor: border, color: accent }}
        >
          {activeBusinesses.length} {activeBusinesses.length === 1 ? 'Entity' : 'Entities'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full">
        {activeBusinesses.map((biz) => {
          const webLink = biz.websiteUrl
            ? biz.websiteUrl.startsWith('http')
              ? biz.websiteUrl
              : `https://${biz.websiteUrl}`
            : null;

          return (
            <div
              key={biz.id}
              className="p-3.5 rounded-xl border space-y-2 transition-all hover:scale-[1.01]"
              style={{
                borderColor: border,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5"
                    style={{ borderColor: border, backgroundColor: `${accent}15`, color: accent }}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold leading-snug break-words" style={{ color: heading }}>
                      {biz.companyName}
                    </h4>
                    {biz.roleTitle && (
                      <p className="text-xs font-medium opacity-85 mt-0.5 break-words" style={{ color: text }}>
                        {biz.roleTitle}
                      </p>
                    )}
                  </div>
                </div>
                {webLink && (
                  <a
                    href={webLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity shrink-0"
                    style={{ borderColor: border, color: accent }}
                    title="Visit Official Website"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {biz.description && (
                <p className="text-xs opacity-75 leading-relaxed pt-1" style={{ color: text }}>
                  {biz.description}
                </p>
              )}

              {biz.address && (
                <div
                  className="flex items-center gap-1.5 pt-2 border-t text-[11px] opacity-70"
                  style={{ borderColor: `${border}66`, color: text }}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
                  <span className="truncate">{biz.address}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

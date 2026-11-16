import React from 'react';
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { WhatsAppIcon } from '@/lib/social-icons';
import { safeTrim } from '@/lib/data-normalization';
import {
  formatTelLink,
  formatWhatsAppLink,
  formatMailtoLink,
  formatWebsiteUrl,
  formatWebsiteDisplay,
  formatMapsLink,
  hasAnyContactCoordinates,
} from '@/lib/contact-utils';

export interface DirectContactSectionProps {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  title?: string;
  className?: string;
  themeStyle?: {
    accentColor?: string;
    cardBg?: string;
    borderColor?: string;
    textColor?: string;
    headingColor?: string;
    pillBg?: string;
  };
  variant?: 'obsidian' | 'corporate' | 'dark' | 'soft' | 'editorial' | 'industrial' | 'modern' | 'ivory' | 'retail' | 'restaurant' | 'creative' | 'apex';
}

export function DirectContactSection({
  phone,
  whatsapp,
  email,
  website,
  address,
  title = 'Direct Contact Coordinates',
  className = '',
  themeStyle,
  variant = 'obsidian',
}: DirectContactSectionProps) {
    const cleanPhone = safeTrim(phone);
    const cleanWhatsapp = safeTrim(whatsapp);
    const cleanEmail = safeTrim(email);
    const cleanWebsite = safeTrim(website);
    const cleanAddress = safeTrim(address);

    if (!hasAnyContactCoordinates({ phone: cleanPhone, whatsapp: cleanWhatsapp, email: cleanEmail, website: cleanWebsite, address: cleanAddress })) {
      return null;
    }

    const telLink = formatTelLink(cleanPhone);
    const waLink = formatWhatsAppLink(cleanWhatsapp);
    const mailLink = formatMailtoLink(cleanEmail);
    const webUrl = formatWebsiteUrl(cleanWebsite);
    const webDisplay = formatWebsiteDisplay(cleanWebsite);
    const mapLink = formatMapsLink(cleanAddress);

    // Default color palette according to variant if not explicitly provided
    const accent = themeStyle?.accentColor || (variant === 'editorial' ? '#000000' : '#D4AF37');
    const cardBg = themeStyle?.cardBg || '#121216';
    const border = themeStyle?.borderColor || 'rgba(255, 255, 255, 0.1)';
    const text = themeStyle?.textColor || '#EDEDED';
    const heading = themeStyle?.headingColor || '#FFFFFF';

    if (variant === 'editorial') {
      return (
        <section className={`index-section ${className}`} aria-labelledby="coords-editorial-title">
          <div className="index-header" style={{ marginBottom: '12px' }}>
            <h2 id="coords-editorial-title" className="index-title font-mono font-bold text-xs uppercase tracking-widest" style={{ color: heading }}>
              {title}
            </h2>
          </div>
          <div className="border font-mono divide-y" style={{ borderColor: border }}>
              { cleanPhone && (
                <div className="p-3 flex items-center justify-between text-xs" style={{ backgroundColor: cardBg }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">[ TEL ]</span>
                    {telLink ? (
                      <a href={telLink} className="font-bold underline hover:opacity-80" style={{ color: text }}>
                        {cleanPhone}
                      </a>
                    ) : (
                      <span className="font-bold" style={{ color: text }}>{cleanPhone}</span>
                    )}
                  </div>
                  {telLink ? (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 border" style={{ borderColor: border }}>Direct</span>
                  ) : (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 border opacity-40 cursor-not-allowed" style={{ borderColor: border }}>Direct</span>
                  )}
                </div>
              )}
              { cleanWhatsapp && (
            <div className="p-3 flex items-center justify-between text-xs" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">[ WA ]</span>
                <span className="font-bold truncate" style={{ color: text }}>
                  {cleanWhatsapp}
                </span>
              </div>
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] uppercase px-1.5 py-0.5 border font-bold hover:bg-black hover:text-white transition-colors"
                  style={{ borderColor: border, color: text }}
                >
                  Chat
                </a>
              ) : (
            <span
              className="text-[9px] uppercase px-1.5 py-0.5 border opacity-40 cursor-not-allowed select-none"
              style={{ borderColor: border, color: text }}
              title="Incomplete WhatsApp number (include country code)"
            >
              Chat
            </span>
              )}
          </div>
          )}
            { cleanEmail && (
              <div className="p-3 flex items-center justify-between text-xs" style={{ backgroundColor: cardBg }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">[ MAIL ]</span>
                  {mailLink ? (
                    <a href={mailLink} className="font-bold underline hover:opacity-80 truncate max-w-[200px]" style={{ color: text }}>
                      {cleanEmail}
                    </a>
                  ) : (
                    <span className="font-bold truncate max-w-[200px]" style={{ color: text }}>{cleanEmail}</span>
                  )}
                </div>
                <span className="text-[9px] uppercase px-1.5 py-0.5 border" style={{ borderColor: border }}>Official</span>
              </div>
            )}
            { cleanWebsite && (
              <div className="p-3 flex items-center justify-between text-xs" style={{ backgroundColor: cardBg }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">[ WEB ]</span>
                  {webUrl ? (
                    <a href={webUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:opacity-80 truncate max-w-[200px]" style={{ color: text }}>
                      {webDisplay}
                    </a>
                  ) : (
                    <span className="font-bold truncate max-w-[200px]" style={{ color: text }}>{cleanWebsite}</span>
                  )}
                </div>
                <span className="text-[9px] uppercase px-1.5 py-0.5 border" style={{ borderColor: border }}>Portal</span>
              </div>
            )}
            { cleanAddress && (
              <div className="p-3 flex items-center justify-between text-xs" style={{ backgroundColor: cardBg }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 shrink-0">[ BASE ]</span>
                  {mapLink ? (
                    <a href={mapLink} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 truncate" style={{ color: text }}>
                      {cleanAddress}
                    </a>
                  ) : (
                  <span className="truncate" style={{ color: text }}>{cleanAddress}</span>
                  )}
                </div>
                <span className="text-[9px] uppercase px-1.5 py-0.5 border shrink-0" style={{ borderColor: border }}>HQ</span>
              </div>
            )}
        </div>
      </section >
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
          <span className="text-[10px] opacity-60 font-mono">Verified Card</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* 1. Phone */}
              {cleanPhone && (
                <div
                  className="flex items-center justify-between p-2.5 rounded-xl border transition-all"
                  style={{ borderColor: border, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{ borderColor: border, backgroundColor: `${accent}15`, color: accent }}
                    >
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider block opacity-60 font-semibold">Direct Phone</span>
                        <span className="text-xs font-semibold truncate block" style={{ color: text }}>
                          {cleanPhone}
                        </span>
                    </div>
                  </div>
            {telLink ? (
                <a
                  href={telLink}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 hover:scale-105 transition-transform"
                  style={{ borderColor: border, color: accent }}
                >
                  Call
                </a>
              ) : (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 opacity-40 cursor-not-allowed"
                  style={{ borderColor: border, color: accent }}
                >
                  Call
                </span>
              )}
          </div>
        )}

            {/* 2. WhatsApp Direct Number */}
            {cleanWhatsapp && (
              <div
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${waLink ? 'hover:scale-[1.01]' : 'opacity-90'
                  }`}
                style={{ borderColor: border, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider block opacity-60 font-semibold">WhatsApp Direct</span>
                      <span className="text-xs font-semibold truncate block" style={{ color: text }}>
                        {cleanWhatsapp}
                      </span>
                  </div>
                </div>
            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors shrink-0"
              >
                Chat
              </a>
            ) : (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-neutral-400 border border-white/10 shrink-0 cursor-not-allowed select-none"
                title="Enter complete number with country code (e.g. +91 98765 43210)"
              >
                Chat
              </span>
            )}
          </div>
    )
  }

  {/* 3. Business Email */ }
        {cleanEmail && (
          <div
            className="flex items-center justify-between p-2.5 rounded-xl border transition-all"
            style={{ borderColor: border, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                style={{ borderColor: border, backgroundColor: `${accent}15`, color: accent }}
              >
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider block opacity-60 font-semibold">Business Email</span>
                  <span className="text-xs font-semibold truncate block" style={{ color: text }}>
                    {cleanEmail}
                  </span>
              </div>
            </div>
            {mailLink ? (
          <a
            href={mailLink}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 hover:scale-105 transition-transform"
            style={{ borderColor: border, color: accent }}
          >
            Send
          </a>
        ) : (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 opacity-40 cursor-not-allowed"
            style={{ borderColor: border, color: accent }}
          >
            Send
          </span>
        )}
          </ div>
        )}

        {/* 4. Official Website */}
            {cleanWebsite && (
              <div
                className="flex items-center justify-between p-2.5 rounded-xl border transition-all"
                style={{ borderColor: border, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{ borderColor: border, backgroundColor: `${accent}15`, color: accent }}
                  >
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider block opacity-60 font-semibold">Official Website</span>
                      <span className="text-xs font-semibold truncate block" style={{ color: text }}>
                        {webDisplay}
                      </span>
                  </div>
                </div>
            {webUrl && (
              <a
                href={webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-muted-foreground hover:text-white transition-colors shrink-0"
                title="Open Website"
              >
                <ExternalLink className="w-3.5 h-3.5" style={{ color: accent }} />
              </a>
            )}
          </div>
    )
  }

  {/* 5. Office / Physical Address */ }
      { cleanAddress && (
        <div
          className="flex items-center justify-between p-2.5 rounded-xl border transition-all"
          style={{ borderColor: border, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
              style={{ borderColor: border, backgroundColor: `${accent}15`, color: accent }}
            >
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider block opacity-60 font-semibold">Office Address</span>
              <span className="text-xs font-medium leading-relaxed block" style={{ color: text }}>
                {cleanAddress}
              </span>
            </div>
          </div>
          {mapLink && (
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold px-2 py-0.5 rounded-md border hover:bg-white/5 transition-colors shrink-0 ml-2"
              style={{ borderColor: border, color: accent }}
            >
              Directions
            </a>
          )}
        </div>
      )}
      </div >
    </div >
  );
}

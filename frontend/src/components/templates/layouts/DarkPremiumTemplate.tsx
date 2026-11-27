import * as React from 'react';
import { MapPin, Phone, MessageSquare, Bookmark, ExternalLink } from 'lucide-react';
import type { TemplateLayoutProps } from './types';
import { resolveMediaUrl } from '@/lib/media-url';
import { formatTelLink, formatWhatsAppLink } from '@/lib/contact-utils';
import { buildSocialProfileUrl } from '@/modules/social/platforms';
import './dark-premium.css';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function normalizeUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || /^(javascript|data|vbscript):/i.test(trimmed)) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname.includes('.')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function DarkPremiumTemplate({ profile, onDownloadVCard }: TemplateLayoutProps) {
  const isEmbedded = Boolean(profile.isEmbedded || profile.isDemo);
  const isBusiness = (profile.profileType || '').toLowerCase().trim() === 'business';
  const custom = (profile.customFields || {}) as Record<string, unknown>;
  const businesses = (profile.businesses || []).filter((b) =>
    Boolean((b.companyName || b.name || '').trim()),
  );
  const catalogue = profile.catalogue || [];
  const socialLinks = (profile.socialLinks || []).filter((l) => l && l.url?.trim());

  // Hero & profile-level fields strictly from profile props (never overwritten by ventures/businesses)
  const primaryName = profile.displayName?.trim() || '';
  const heroTagline = profile.headline?.trim() || '';
  const locationText =
    profile.location?.trim() ||
    profile.address?.trim() ||
    (typeof custom.location === 'string' ? custom.location.trim() : '');

  const resolvedAvatar = resolveMediaUrl(profile.avatarUrl);
  const bioText = profile.bio?.trim() || '';
  const showVentures = custom.showVentures !== false;

  const phone = profile.phone?.trim() || '';
  const whatsapp = profile.whatsapp?.trim() || '';
  const email = profile.email?.trim() || '';
  const website = profile.website?.trim() || '';
  const normalizedWebsite = normalizeUrl(website);
  const address = profile.address?.trim() || '';

  const telHref = phone ? formatTelLink(phone) : '';
  const waHref = whatsapp ? formatWhatsAppLink(whatsapp) : '';

  const contactRows: Array<{ key: string; value: string; href?: string; external?: boolean }> = [];
  if (address || (!isBusiness && locationText)) {
    contactRows.push({
      key: isBusiness ? 'Address' : 'Location',
      value: address || locationText,
    });
  }
  if (phone && telHref) {
    contactRows.push({
      key: 'Direct Line',
      value: phone,
      href: telHref,
    });
  }
  if (email) {
    contactRows.push({
      key: 'Email',
      value: email,
      href: `mailto:${email}`,
    });
  }
  if (normalizedWebsite) {
    contactRows.push({
      key: 'Website',
      value: website.replace(/^https?:\/\//i, '').replace(/\/+$/, ''),
      href: normalizedWebsite,
      external: true,
    });
  }

  const showQuickGrid = Boolean((phone && telHref) || (whatsapp && waHref));

  return (
    <div className={`tpl-dark-premium${isEmbedded ? ' is-embedded' : ''}`} data-template="dark-premium">
      <div className="page-wrapper">
        <main className="card-container" role="main">
          {/* Hero / Identity Block */}
          <header className="profile-hero">
            <div className="avatar-frame">
              {resolvedAvatar ? (
                <img
                  src={resolvedAvatar}
                  alt={primaryName || 'Profile'}
                  className="avatar-img"
                  width={104}
                  height={104}
                />
              ) : (
                <span className="avatar-initials" aria-hidden="true">
                  {getInitials(primaryName || 'P')}
                </span>
              )}
            </div>

            <div className="hero-text">
              {primaryName && <h1 className="hero-name">{primaryName}</h1>}
              {heroTagline && <p className="hero-tagline">{heroTagline}</p>}
              {locationText && (
                <div className="meta-row">
                  <span className="meta-item">
                    <MapPin className="icon-sm" aria-hidden="true" />
                    <span>{locationText}</span>
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* Primary & Secondary CTA Buttons */}
          <section className="actions-section" aria-label="Quick Actions">
            <button type="button" onClick={onDownloadVCard} className="btn btn-primary">
              <Bookmark className="icon" aria-hidden="true" />
              <span>Save Contact</span>
            </button>

            {showQuickGrid && (
              <div className="actions-grid">
                {phone && telHref && (
                  <a href={telHref} className="btn btn-secondary">
                    <Phone className="icon" aria-hidden="true" />
                    <span>Call</span>
                  </a>
                )}
                {whatsapp && waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    <MessageSquare className="icon" aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            )}
          </section>

          {/* About / Bio */}
          {bioText && (
            <section className="content-block" aria-labelledby="dp-about-title">
              <div className="block-header">
                <h2 id="dp-about-title" className="block-label">
                  About
                </h2>
              </div>
              <p className="bio-text">{bioText}</p>
            </section>
          )}

          {/* Contact Rows */}
          {contactRows.length > 0 && (
            <section className="content-block" aria-labelledby="dp-coords-title">
              <div className="block-header">
                <h2 id="dp-coords-title" className="block-label">
                  Direct Coordinates
                </h2>
              </div>
              <div className="data-rows">
                {contactRows.map((row) => (
                  <div key={row.key} className="data-row">
                    <span className="data-key">{row.key}</span>
                    {row.href ? (
                      <a
                        href={row.href}
                        target={row.external ? '_blank' : undefined}
                        rel={row.external ? 'noopener noreferrer' : undefined}
                        className="data-val data-link"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <span className="data-val">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Portfolio & Companies (placed below Direct Coordinates) */}
          {showVentures && businesses.length > 0 && (
            <section className="content-block" aria-labelledby="dp-ventures-title">
              <div className="block-header">
                <h2 id="dp-ventures-title" className="block-label">
                  Portfolio &amp; Companies
                </h2>
              </div>
              <div className="venture-cards">
                {businesses.map((biz, idx) => {
                  const bizName = (biz.companyName || biz.name || '').trim();
                  const bizUrl = normalizeUrl(biz.websiteUrl);
                  const bizLogo = resolveMediaUrl(biz.logoUrl);
                  const rolePart = biz.roleTitle?.trim() || '';
                  const taglinePart = biz.tagline?.trim() || '';
                  const subtitleParts = [rolePart];
                  if (taglinePart && taglinePart.toLowerCase() !== rolePart.toLowerCase()) {
                    subtitleParts.push(taglinePart);
                  }
                  const subtitle = subtitleParts.filter(Boolean).join(' · ');
                  const statusLabel = biz.status?.trim() || '';
                  const cardContent = (
                    <>
                      <div className={`venture-mono${idx === 0 ? ' accent-border' : ''}`}>
                        {bizLogo ? (
                          <img src={bizLogo} alt={bizName} />
                        ) : (
                          <span>{getInitials(bizName).slice(0, 1)}</span>
                        )}
                      </div>
                      <div className="venture-details">
                        <h3 className="venture-name">{bizName}</h3>
                        {subtitle && <p className="venture-sub">{subtitle}</p>}
                      </div>
                      {statusLabel ? (
                        <span className="venture-status">{statusLabel}</span>
                      ) : bizUrl ? (
                        <span className="venture-status" aria-label={`Visit ${bizName}`}>
                          <ExternalLink className="icon-sm" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  );

                  return bizUrl ? (
                    <a
                      key={biz.id}
                      href={bizUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="venture-item"
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <div key={biz.id} className="venture-item">
                      {cardContent}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Business Mode: Services & Catalogue (placed below Portfolio & Companies) */}
          {isBusiness && catalogue.length > 0 && (
            <section className="content-block" aria-labelledby="dp-catalogue-title">
              <div className="block-header">
                <h2 id="dp-catalogue-title" className="block-label">
                  Services &amp; Catalogue
                </h2>
              </div>
              <div className="venture-cards">
                {catalogue.map((item, idx) => {
                  const itemImage = resolveMediaUrl(item.imageUrl);
                  const itemAction = normalizeUrl(item.actionUrl);
                  const priceLabel = item.price
                    ? `${item.currency ? `${item.currency} ` : ''}${item.price}`
                    : item.itemType;

                  const content = (
                    <>
                      <div className={`venture-mono${idx === 0 ? ' accent-border' : ''}`}>
                        {itemImage ? (
                          <img src={itemImage} alt={item.title} />
                        ) : (
                          <span>{getInitials(item.title).slice(0, 1)}</span>
                        )}
                      </div>
                      <div className="venture-details">
                        <h3 className="venture-name">{item.title}</h3>
                        {item.description && <p className="venture-sub">{item.description}</p>}
                      </div>
                      {priceLabel && <span className="venture-status">{priceLabel}</span>}
                    </>
                  );

                  return itemAction ? (
                    <a
                      key={item.id}
                      href={itemAction}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="venture-item"
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={item.id} className="venture-item">
                      {content}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <section className="content-block" aria-labelledby="dp-social-title">
              <div className="block-header">
                <h2 id="dp-social-title" className="block-label">
                  Social Channels
                </h2>
              </div>
              <div className="social-pills">
                {socialLinks.map((link, idx) => {
                  const resolved = buildSocialProfileUrl(link.platform, link.url);
                  if (!resolved?.url) return null;
                  return (
                    <a
                      key={`${link.platform}-${idx}`}
                      href={resolved.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-pill"
                    >
                      <span>{resolved.platform?.name || link.platform}</span>
                      <ExternalLink className="icon-sm" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

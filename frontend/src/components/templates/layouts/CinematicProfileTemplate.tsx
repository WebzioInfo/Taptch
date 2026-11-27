import * as React from 'react';
import QRCode from 'qrcode';
import { MapPin, ExternalLink } from 'lucide-react';
import type { BusinessItem, ProfileRenderData } from '../ProfileRenderer';
import { TEMPLATE_PREVIEW_PLACEHOLDER } from '@/modules/templates/constants';
import { buildSocialProfileUrl } from '@/modules/social/platforms';
import './cinematic-noir.css';

export interface CinematicProfileTemplateProps {
  profile: ProfileRenderData;
  onDownloadVCard: () => void;
  onOpenExchange: (initialNote?: string) => void;
  onOpenQr: () => void;
  copiedUrl: boolean;
  onCopyLink: () => void;
  previewPlanId?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'T';
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

function normalizeInstagramUrl(raw?: string | null): { href: string; label: string } | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    const match = trimmed.match(/instagram\.com\/([^/?#]+)/i);
    const handle = match?.[1] ? `@${match[1].replace(/^@/, '')}` : trimmed;
    return { href: trimmed, label: handle };
  }
  const cleanHandle = trimmed.replace(/^@/, '');
  return {
    href: `https://instagram.com/${encodeURIComponent(cleanHandle)}`,
    label: `@${cleanHandle}`,
  };
}

function isValidUpiId(raw?: string | null): boolean {
  if (!raw) return false;
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(raw.trim());
}

function buildWhatsAppHref(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function CinematicProfileTemplate({
  profile,
  onDownloadVCard,
  onCopyLink,
}: CinematicProfileTemplateProps) {
  const isPreview = Boolean(profile.isDemo);
  const isEmbedded = Boolean(profile.isEmbedded || profile.isDemo);
  const custom = (profile.customFields || {}) as Record<string, unknown>;

  // Resolve display fields cleanly: preview mode may use neutral placeholders;
  // published customer profiles strictly render only real profile data.
  const displayName =
    profile.displayName?.trim() || (isPreview ? TEMPLATE_PREVIEW_PLACEHOLDER.displayName : 'Profile');
  const headline =
    profile.headline?.trim() || (isPreview ? TEMPLATE_PREVIEW_PLACEHOLDER.headline : '');
  const locationText =
    profile.location?.trim() ||
    profile.address?.trim() ||
    (typeof custom.location === 'string' ? custom.location.trim() : '') ||
    (isPreview ? TEMPLATE_PREVIEW_PLACEHOLDER.location : '');
  const bioText =
    profile.bio?.trim() || (isPreview ? TEMPLATE_PREVIEW_PLACEHOLDER.bio : '');

  const avatarUrl =
    profile.avatarUrl?.trim() || (isPreview ? TEMPLATE_PREVIEW_PLACEHOLDER.avatarUrl : '');

  const phone = profile.phone?.trim() || (isPreview ? TEMPLATE_PREVIEW_PLACEHOLDER.phone : '');
  const whatsappRaw =
    profile.whatsapp?.trim() || phone || (isPreview ? TEMPLATE_PREVIEW_PLACEHOLDER.whatsapp : '');
  const whatsappHref = buildWhatsAppHref(whatsappRaw);
  const email = profile.email?.trim() || (isPreview ? TEMPLATE_PREVIEW_PLACEHOLDER.email : '');

  const resolvedSocialChannels = React.useMemo(() => {
    const rawLinks: Array<{ platform: string; url?: string; username?: string }> =
      profile.socialLinks && profile.socialLinks.length > 0
        ? profile.socialLinks
        : typeof custom.instagram === 'string' && custom.instagram.trim()
          ? [{ platform: 'instagram', username: custom.instagram.trim() }]
          : isPreview
            ? [{ platform: 'instagram', username: TEMPLATE_PREVIEW_PLACEHOLDER.instagram }]
            : [];

    const seen = new Set<string>();
    const channels: Array<{
      id: string;
      platformName: string;
      handle: string;
      href: string;
    }> = [];

    for (const item of rawLinks) {
      const built = buildSocialProfileUrl(item.platform, item.username || item.url);
      if (!built) continue;
      if (seen.has(built.platform.id)) continue;
      seen.add(built.platform.id);
      channels.push({
        id: built.platform.id,
        platformName: built.platform.name,
        handle: built.displayHandle,
        href: built.url,
      });
    }

    return channels;
  }, [profile.socialLinks, custom.instagram, isPreview]);

  const education =
    typeof custom.education === 'string'
      ? custom.education.trim()
      : isPreview
        ? TEMPLATE_PREVIEW_PLACEHOLDER.education
        : '';

  const upiId = typeof custom.upiId === 'string' ? custom.upiId.trim() : '';
  const hasValidUpi = isValidUpiId(upiId);
  const upiPayeeName =
    typeof custom.upiPayeeName === 'string' && custom.upiPayeeName.trim()
      ? custom.upiPayeeName.trim()
      : displayName;
  const upiUri = hasValidUpi
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiPayeeName)}&cu=INR`
    : '';

  const businesses = React.useMemo<BusinessItem[]>(() => {
    if (profile.businesses && profile.businesses.length > 0) {
      return profile.businesses;
    }
    if (isPreview) {
      return TEMPLATE_PREVIEW_PLACEHOLDER.businesses.map((b) => ({
        id: b.id,
        companyName: b.companyName,
        tagline: b.tagline,
        roleTitle: b.roleTitle,
        websiteUrl: b.websiteUrl,
        logoUrl: b.logoUrl,
      }));
    }
    return [];
  }, [profile.businesses, isPreview]);

  // Optional section visibility toggles (default enabled unless explicitly false)
  // Embedded builder/modal previews bypass the full-screen intro curtain so content is immediately visible
  const showIntroOverlay = !isEmbedded && custom.showIntroOverlay !== false && custom.skipIntro !== true;
  const showVentures = custom.showVentures !== false;
  const showEducation = custom.showEducation !== false;
  const showUpi = custom.showUpi !== false && hasValidUpi;
  const showFooterSlate = custom.showFooterSlate !== false;

  // Intro curtain state
  const [curtainOpen, setCurtainOpen] = React.useState(!showIntroOverlay);
  const [introDismissed, setIntroDismissed] = React.useState(!showIntroOverlay);
  const [introSettled, setIntroSettled] = React.useState(!showIntroOverlay);

  // UPI Modal & Toast state
  const [showUpiModal, setShowUpiModal] = React.useState(false);
  const [upiQrDataUrl, setUpiQrDataUrl] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const triggerToast = React.useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 2400);
  }, []);

  React.useEffect(() => {
    if (!showIntroOverlay) {
      setCurtainOpen(true);
      setIntroDismissed(true);
      setIntroSettled(true);
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCurtainOpen(true);
      setIntroDismissed(true);
      setIntroSettled(true);
      return;
    }

    const openTimer = window.setTimeout(() => {
      setCurtainOpen(true);
    }, 1850);

    const dismissTimer = window.setTimeout(() => {
      setIntroDismissed(true);
      setIntroSettled(true);
    }, 2750);

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [showIntroOverlay]);

  const handleDismissIntro = React.useCallback(() => {
    setCurtainOpen(true);
    window.setTimeout(() => {
      setIntroDismissed(true);
      setIntroSettled(true);
    }, 450);
  }, []);

  // Lock background scroll while UPI modal is open
  React.useEffect(() => {
    if (!showUpiModal || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showUpiModal]);

  // Generate dynamic UPI QR data URL whenever modal opens
  React.useEffect(() => {
    if (!showUpiModal || !upiId) {
      setUpiQrDataUrl(null);
      return;
    }
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiPayeeName)}&cu=INR`;
    let active = true;
    QRCode.toDataURL(upiUri, {
      width: 240,
      margin: 1,
      color: { dark: '#0A0A0B', light: '#FFFFFF' },
    })
      .then((url) => {
        if (active) setUpiQrDataUrl(url);
      })
      .catch(() => {
        if (active) setUpiQrDataUrl(null);
      });
    return () => {
      active = false;
    };
  }, [showUpiModal, upiId, upiPayeeName]);

  const handleCopyUpi = async () => {
    if (!upiId || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(upiId);
      triggerToast('UPI ID copied');
    } catch {
      triggerToast('Unable to copy UPI ID');
    }
  };

  const handleShareProfile = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = profile.slug
      ? `${window.location.origin}/${profile.slug}`
      : window.location.href;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: displayName,
          text: headline ? `${displayName} — ${headline}` : displayName,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    onCopyLink();
    triggerToast('Profile link copied');
  };

  const hasCaptionCard = Boolean(headline || locationText);
  const hasVenturesBlock =
    (showVentures && businesses.length > 0) || (showEducation && Boolean(education));
  const currentYear = new Date().getFullYear();

  return (
    <div
      className={`cinematic-noir-root${isEmbedded ? ' is-embedded' : ''}${introSettled ? ' intro-settled' : ''
        }`}
    >
      <div className="cn-viewport-frame">
        {/* 1. Opening Cinematic Curtain Sequence */}
        {!introDismissed && (
          <div
            className={`cn-intro-overlay${curtainOpen ? ' curtain-open' : ''}`}
            onClick={handleDismissIntro}
            role="presentation"
          >
            <div className="cn-intro-curtain cn-intro-curtain-top" />
            <div className="cn-intro-curtain cn-intro-curtain-bottom" />
            <div className="cn-intro-content">
              <div className="cn-intro-line" />
              <div className="cn-intro-name">{displayName}</div>
              {(headline || locationText) && (
                <div className="cn-intro-meta">
                  {[headline, locationText].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <button
              type="button"
              className="cn-intro-skip-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDismissIntro();
              }}
            >
              Tap to enter
            </button>
          </div>
        )}

        <main className="cn-page-container">
          {/* 2. Full-Bleed Portrait Hero Poster */}
          <section className="cn-hero-poster">
            <div className="cn-hero-media-wrapper">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="cn-hero-portrait"
                  loading="eager"
                />
              ) : (
                <div className="cn-hero-placeholder-bg">
                  <span className="cn-hero-monogram">{getInitials(displayName)}</span>
                </div>
              )}
              <div className="cn-film-grain" aria-hidden="true" />
              <div className="cn-cinematic-vignette" aria-hidden="true" />
            </div>

            <div className="cn-hero-bottom-caption">
              <div className="cn-hero-title-group">
                <h1 className="cn-hero-display-name">{displayName}</h1>
              </div>

              <div className="cn-hero-actions-row">
                <button
                  type="button"
                  onClick={onDownloadVCard}
                  className="cn-btn-hero-action cn-btn-hero-primary"
                >
                  Save Contact
                </button>
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cn-btn-hero-action cn-btn-hero-secondary"
                  >
                    WhatsApp
                  </a>
                )}
              </div>

              {hasCaptionCard && (
                <div className="cn-caption-card">
                  <div className="cn-caption-row">
                    {headline && (
                      <div className="cn-caption-col">
                        <span className="cn-caption-label">Role</span>
                        <span className="cn-caption-value">{headline}</span>
                      </div>
                    )}
                    {headline && locationText && (
                      <div className="cn-caption-separator" aria-hidden="true" />
                    )}
                    {locationText && (
                      <div className="cn-caption-col">
                        <span className="cn-caption-label">Location</span>
                        <span className="cn-caption-value">{locationText}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2.5. Dedicated Biography Section (Below Role & Location) */}
          {bioText && (
            <section className="cn-bio-section">
              <p className="cn-bio-text">{bioText}</p>
            </section>
          )}

          {/* 3. Ventures & Education Credits */}
          {hasVenturesBlock && (
            <section className="cn-credits-section">
              <div className="cn-credits-header">
                <span className="cn-credits-index">01 /</span>
                <h2 className="cn-credits-heading">Ventures</h2>
              </div>

              {showVentures && businesses.length > 0 && (
                <div className="cn-ventures-list">
                  {businesses.map((biz, idx) => {
                    const num = String(idx + 1).padStart(2, '0');
                    const href = normalizeUrl(biz.websiteUrl);
                    const logoUrl = (biz as { logoUrl?: string | null }).logoUrl;
                    const role = biz.roleTitle || biz.tagline || '';
                    const ventureLocation =
                      biz.address?.trim() ||
                      (biz as { businessAddress?: string | null }).businessAddress?.trim() ||
                      '';

                    const content = (
                      <>
                        <div className="cn-venture-left">
                          <span className="cn-venture-num">{num}</span>
                          <div className="cn-logo-tile">
                            {logoUrl ? (
                              <img src={logoUrl} alt={biz.companyName} loading="lazy" />
                            ) : (
                              <span className="cn-tile-letter">
                                {biz.companyName.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="cn-venture-body">
                          <div className="cn-venture-title-row">
                            <span className="cn-venture-name">{biz.companyName}</span>
                          </div>
                          {role && <span className="cn-venture-role">{role}</span>}
                          {biz.description && (
                            <span className="cn-venture-desc">{biz.description}</span>
                          )}
                          {ventureLocation && (
                            <span className="cn-venture-location-row" title={ventureLocation}>
                              <MapPin className="cn-venture-location-icon" />
                              <span className="cn-venture-location-text">{ventureLocation}</span>
                            </span>
                          )}
                        </div>

                        {href && (
                          <div className="cn-venture-right-action">
                            <span className="cn-venture-arrow" aria-label="Visit Website">
                              <ExternalLink className="cn-venture-link-icon" />
                            </span>
                          </div>
                        )}
                      </>
                    );

                    return href ? (
                      <a
                        key={biz.id || idx}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cn-venture-item"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={biz.id || idx} className="cn-venture-item">
                        {content}
                      </div>
                    );
                  })}
                </div>
              )}

              {showEducation && education && (
                <div className="cn-education-line">
                  <span className="cn-edu-tag">Education</span>
                  <span className="cn-edu-val">{education}</span>
                </div>
              )}
            </section>
          )}

          {/* 4. Action Terminal Deck */}
          <section className="cn-actions-section">
            <div className="cn-credits-header">
              <span className="cn-credits-index">{hasVenturesBlock ? '02 /' : '01 /'}</span>
              <h2 className="cn-credits-heading">Direct Channels</h2>
            </div>

            <div className="cn-actions-sublist">
              {showUpi && (
                <div className="cn-pay-upi-card rounded-lg border border-[var(--cn-hairline)] bg-[var(--cn-bg-surface)] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* <span className="cn-action-tag block">Instant Transfer</span> */}
                      <span className="cn-action-main-value block mt-0.5">Pay via UPI</span>
                      {/* <p className="text-[11px] text-[var(--cn-text-muted)] mt-0.5">
                        Pay securely using your preferred UPI app
                      </p> */}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUpiModal(true)}
                      className="cn-action-row-qr-wrap shrink-0 px-2.5 py-1 rounded border border-[var(--cn-hairline-bright)] text-[10px] font-semibold tracking-wider uppercase text-[var(--cn-text-secondary)] hover:text-white"
                      title="Show UPI QR Code"
                    >
                      QR
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={upiUri}
                      onClick={() => {
                        // On desktop browsers without a UPI intent handler, open QR/Copy fallback
                        if (typeof navigator !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                          setShowUpiModal(true);
                        }
                      }}
                      className="flex-1 h-9 rounded-md bg-[var(--cn-accent-blue)] hover:bg-[#1a73f8] text-white text-xs font-semibold tracking-wider uppercase flex items-center justify-center transition-colors"
                    >
                      Pay via UPI
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="h-9 px-3 rounded-md border border-[var(--cn-hairline-bright)] bg-transparent hover:bg-white/5 text-[var(--cn-text-primary)] text-xs font-medium flex items-center justify-center transition-colors shrink-0"
                    >
                      Copy UPI ID
                    </button>
                  </div>
                </div>
              )}

              {resolvedSocialChannels.map((channel) => (
                <a
                  key={channel.id}
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cn-btn-action-row"
                >
                  <div className="cn-action-row-left">
                    <span className="cn-action-tag">{channel.platformName}</span>
                    <span className="cn-action-main-value">{channel.handle}</span>
                  </div>
                  <span className="cn-action-row-right">↗</span>
                </a>
              ))}

              {phone && (
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="cn-btn-action-row">
                  <div className="cn-action-row-left">
                    <span className="cn-action-tag">Telephone</span>
                    <span className="cn-action-main-value">{phone}</span>
                  </div>
                  <span className="cn-action-row-right">↗</span>
                </a>
              )}

              {email && (
                <a href={`mailto:${email}`} className="cn-btn-action-row">
                  <div className="cn-action-row-left">
                    <span className="cn-action-tag">Electronic Mail</span>
                    <span className="cn-action-main-value">{email}</span>
                  </div>
                  <span className="cn-action-row-right">↗</span>
                </a>
              )}

              <button type="button" onClick={handleShareProfile} className="cn-btn-action-row">
                <div className="cn-action-row-left">
                  <span className="cn-action-tag">Share</span>
                  <span className="cn-action-main-value">Share Digital Profile</span>
                </div>
                <span className="cn-action-row-right">↗</span>
              </button>
            </div>
          </section>

          {/* 5. Cinematic Production Slate Footer */}
          {showFooterSlate && (
            <footer className="cn-colophon-footer">
              <div className="cn-film-slate-box">
                <span className="cn-slate-corner cn-slate-tl" aria-hidden="true" />
                <span className="cn-slate-corner cn-slate-tr" aria-hidden="true" />
                <span className="cn-slate-corner cn-slate-bl" aria-hidden="true" />
                <span className="cn-slate-corner cn-slate-br" aria-hidden="true" />

                <div className="cn-slate-table">
                  <div className="cn-slate-row">
                    <span className="cn-slate-field">Subject</span>
                    <span className="cn-slate-data">{displayName}</span>
                  </div>
                  {(businesses[0]?.companyName || headline) && (
                    <div className="cn-slate-row">
                      <span className="cn-slate-field">
                        {businesses[0]?.companyName ? 'Primary' : 'Role'}
                      </span>
                      <span className="cn-slate-data">
                        {businesses[0]?.companyName || headline}
                      </span>
                    </div>
                  )}
                  {locationText && (
                    <div className="cn-slate-row">
                      <span className="cn-slate-field">Base</span>
                      <span className="cn-slate-data">{locationText}</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="cn-colophon-copyright">
                © {currentYear} {displayName}
              </p>
            </footer>
          )}
        </main>

        {/* 6. UPI Payment QR Modal */}
        {showUpiModal && upiId && (
          <div
            className="cn-upi-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cn-upi-modal-title"
          >
            <div className="cn-upi-backdrop" onClick={() => setShowUpiModal(false)} />
            <div className="cn-upi-sheet">
              <div className="cn-upi-drag-handle" aria-hidden="true" />
              <div className="cn-upi-header">
                <div>
                  <h3 id="cn-upi-modal-title" className="cn-upi-title">
                    UPI Payment
                  </h3>
                  <p className="cn-upi-payee">{upiPayeeName}</p>
                </div>
                <button
                  type="button"
                  className="cn-upi-close"
                  onClick={() => setShowUpiModal(false)}
                  aria-label="Close UPI modal"
                >
                  ✕
                </button>
              </div>

              <div className="cn-upi-qr-frame">
                {upiQrDataUrl ? (
                  <img src={upiQrDataUrl} alt={`UPI QR for ${upiPayeeName}`} />
                ) : (
                  <span style={{ color: '#0A0A0B', fontSize: '0.75rem' }}>
                    Generating QR...
                  </span>
                )}
              </div>

              <p className="text-center text-[11px] text-[#8E8D8A] tracking-wide">
                Scan with any UPI app
              </p>

              <div className="flex items-center gap-2">
                <div className="cn-upi-id-bar flex-1 truncate">{upiId}</div>
                <button type="button" className="cn-btn-copy-upi shrink-0" onClick={handleCopyUpi}>
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="cn-toast" role="status" aria-live="polite">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}

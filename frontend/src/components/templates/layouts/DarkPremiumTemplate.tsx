import React from 'react';
import type { ProfileRenderData } from '../ProfileRenderer';
import { TemplateContactForm } from '../TemplateContactForm';
import { DirectContactSection } from '@/components/profile/DirectContactSection';
import { SocialLinksSection } from '@/components/profile/SocialLinksSection';
import { formatTelLink, formatWhatsAppLink } from '@/lib/contact-utils';
import './dark-premium.css';

interface DarkPremiumProps {
  profile: ProfileRenderData;
  onDownloadVCard: () => void;
  onOpenExchange: (initialNote?: string) => void;
  onOpenQr: () => void;
  copiedUrl: boolean;
  onCopyLink: () => void;
  previewPlanId?: string;
}

export function DarkPremiumTemplate({
  profile,
  onDownloadVCard,
  onOpenExchange,
  onOpenQr,
  copiedUrl,
  onCopyLink,
}: DarkPremiumProps) {
  const businesses = profile.businesses || [];
  const primaryBusiness = businesses[0];
  const telLink = formatTelLink(profile.phone);
  const waLink = formatWhatsAppLink(profile.whatsapp, profile.phone);
  const location = profile.address || profile.location || '';

  return (
    <div className="template-dark-premium">
      <div className="page-wrapper">
        <main className="card-container" role="main">
          {/* Hero / Identity Block */}
          <header className="profile-hero">
            <div className="avatar-frame">
              <img
                src={profile.avatarUrl || '/avatar.svg'}
                alt={profile.displayName}
                className="avatar-img"
                width={104}
                height={104}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/avatar.svg';
                }}
              />
            </div>

            <div className="hero-text">
              <h1 className="hero-name">{profile.displayName}</h1>
              <p className="hero-tagline">{profile.headline || primaryBusiness?.tagline || 'Executive Identity'}</p>
              <div className="meta-row">
                {location ? (
                  <>
                    <span className="meta-item">
                      <svg
                        className="icon icon-sm"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {location}
                    </span>
                    <span className="meta-sep">/</span>
                  </>
                ) : null}
                <span className="meta-item">VIP Verified</span>
              </div>
            </div>
          </header>

          {/* Primary & Secondary CTA Buttons */}
          <section className="actions-section" aria-label="Quick Actions">
            <button
              type="button"
              onClick={onDownloadVCard}
              className="btn btn-primary"
            >
              <svg
                className="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Save Contact</span>
            </button>

            <div className="actions-grid">
              {telLink ? (
                <a href={telLink} className="btn btn-secondary">
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Call</span>
                </a>
              ) : (
                <button type="button" onClick={onOpenQr} className="btn btn-secondary">
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>QR Code</span>
                </button>
              )}

              {
                waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    <svg
                      className="icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <button type="button" onClick={onCopyLink} className="btn btn-secondary">
                    <span>{copiedUrl ? 'Copied!' : 'Share'}</span>
                  </button>
                )}
            </div>
          </section>

          {/* Portfolio / Companies */}
          {businesses.length > 0 && (
            <section className="content-block" aria-labelledby="portfolio-title">
              <div className="block-header">
                <h2 id="portfolio-title" className="block-label">Portfolio & Companies</h2>
              </div>

              <div className="venture-cards">
                {businesses.map((biz, idx) => {
                  const initial = (biz.companyName || 'V').charAt(0).toUpperCase();
                  const isAccent = idx === businesses.length - 1;
                  return (
                    <div key={biz.id} className="venture-item">
                      <div className={`venture-mono ${isAccent ? 'accent-border' : ''}`}>
                        {initial}
                      </div>
                      <div className="venture-details">
                        <h3 className="venture-name">{biz.companyName}</h3>
                        <p className="venture-sub">{biz.roleTitle || biz.tagline || 'Directorship'}</p>
                      </div>
                      <span className="venture-status">Active</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Communication & Coordinates */}
          <section className="content-block" aria-labelledby="coords-title">
            <DirectContactSection
              phone={profile.phone}
              whatsapp={profile.whatsapp}
              email={profile.email}
              website={profile.website}
              address={profile.address}
              variant="dark"
              title="Direct Coordinates"
              themeStyle={{
                accentColor: '#C5A880',
                cardBg: '#121316',
                borderColor: '#22252A',
                textColor: '#F4F4F6',
                headingColor: '#C5A880',
              }}
            />

            {/* Social Networking Channels */}
            <SocialLinksSection
              socialLinks={profile.socialLinks}
              variant="dark"
              themeStyle={{
                accentColor: '#C5A880',
                cardBg: '#121316',
                borderColor: '#22252A',
                textColor: '#F4F4F6',
                headingColor: '#C5A880',
              }}
            />
          </section>

          {/* Business Offerings & Catalogue Section */}
          {profile.catalogue && profile.catalogue.length > 0 && (
            <section className="content-block" aria-labelledby="dark-catalogue-heading">
              <div className="section-title-wrap mb-3 flex items-center justify-between">
                <h2 id="dark-catalogue-heading" className="text-sm font-bold uppercase tracking-wider text-[#C5A880]">
                  Capabilities &amp; Offerings
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#22252A] text-[#C5A880]">
                  {profile.catalogue.length} Items
                </span>
              </div>
              <div className="space-y-3">
                {profile.catalogue.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-[#22252A] bg-[#16181D] flex flex-col justify-between gap-3 transition-colors hover:border-[#C5A880]/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#C5A880]/15 text-[#C5A880]">
                            {item.itemType || 'Product'}
                          </span>
                          {item.price && (
                            <span className="text-xs font-mono font-bold text-[#F4F4F6]">
                              {item.currency || '₹'} {item.price}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-[#F4F4F6]">{item.title}</h3>
                        {item.description && (
                          <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">{item.description}</p>
                        )}
                      </div>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-16 h-16 rounded-lg object-cover border border-[#22252A] shrink-0"
                        />
                      )}
                    </div>
                    <div className="pt-2 border-t border-[#22252A] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onOpenExchange(`Inquiry regarding: ${item.title}`)}
                        className="text-xs font-semibold text-[#C5A880] hover:underline"
                      >
                        Request Private Mandate &rarr;
                      </button>
                      {item.actionUrl && (
                        <a
                          href={item.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-neutral-400 hover:text-[#C5A880]"
                        >
                          Details
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Universal Contact & Inquiries Form */}
          <section className="content-block" aria-label="Direct Inquiry">
            <TemplateContactForm
              profileId={profile.id}
              profileName={profile.displayName}
              themeStyle={{
                accentColor: '#C5A880',
                cardBg: '#1A1C20',
                textColor: '#F4F4F6',
                inputBg: '#121316',
                borderColor: '#22252A',
              }}
            />
          </section>

          {/* Footer Info */}
          <footer className="footer-meta">
            <div className="security-seal">
              <svg
                className="icon icon-sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>End-to-End Encrypted Digital V-Card</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

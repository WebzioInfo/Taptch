import React from 'react';
import type { ProfileRenderData } from '../ProfileRenderer';
import { TemplateContactForm } from '../TemplateContactForm';
import { DirectContactSection } from '@/components/profile/DirectContactSection';
import { SocialLinksSection } from '@/components/profile/SocialLinksSection';
import { formatTelLink, formatWhatsAppLink } from '@/lib/contact-utils';
import './soft-modern.css';

interface SoftModernProps {
  profile: ProfileRenderData;
  onDownloadVCard: () => void;
  onOpenExchange: (initialNote?: string) => void;
  onOpenQr: () => void;
  copiedUrl: boolean;
  onCopyLink: () => void;
  previewPlanId?: string;
}

export function SoftModernTemplate({
  profile,
  onDownloadVCard,
  onOpenExchange,
  onOpenQr,
  copiedUrl,
  onCopyLink,
}: SoftModernProps) {
  const businesses = profile.businesses || [];
  const primaryBusiness = businesses[0];
  const telLink = formatTelLink(profile.phone);
  const waLink = formatWhatsAppLink(profile.whatsapp, profile.phone);
  const location = profile.address || profile.location || '';

  return (
    <div className="template-soft-modern">
      <div className="page-wrapper">
        <main className="card-container" role="main">
          {/* Profile Header / Airy Avatar */}
          <header className="profile-header">
            <div className="photo-container">
              <img
                src={profile.avatarUrl || '/avatar.svg'}
                alt={profile.displayName}
                className="photo-img"
                width={120}
                height={120}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/avatar.svg';
                }}
              />
            </div>

            <div className="header-intro">
              {location ? (
                <span className="location-chip">
                  <svg
                    className="icon icon-xs"
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
                  {location} &bull; Verified
                </span>
              ) : (
                <span className="location-chip">Verified Digital Card</span>
              )}
              <h1 className="profile-name">{profile.displayName}</h1>
              <p className="profile-summary">
                {profile.bio || profile.headline || primaryBusiness?.tagline || 'Building ventures across technology, logistics, and connected experiences.'}
              </p>
            </div>
          </header>

          {/* Action Buttons (Soft Rounded Pill Style) */}
          <section className="actions-section" aria-label="Contact Actions">
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
                strokeWidth="2"
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

            <div className="secondary-actions">
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
                      waLink?(
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

          {/* Companies / Projects Section */}
          {businesses.length > 0 && (
            <section className="section-group" aria-labelledby="ventures-title">
              <h2 id="ventures-title" className="section-heading">Founding Companies</h2>
              <div className="ventures-stack">
                {businesses.map((biz) => {
                  const monogram = (biz.companyName || 'V').charAt(0).toUpperCase();
                  return (
                    <div key={biz.id} className="venture-tile">
                      <div className="venture-monogram">{monogram}</div>
                      <div className="venture-info">
                        <span className="venture-title">{biz.companyName}</span>
                        <span className="venture-meta">{biz.roleTitle || biz.tagline || 'Directorship & Founding'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Direct Contact Coordinates */}
          <section className="section-group" aria-labelledby="direct-title">
            <DirectContactSection
              phone={profile.phone}
              whatsapp={profile.whatsapp}
              email={profile.email}
              website={profile.website}
              address={profile.address}
              variant="soft"
              title="Get in Touch"
              themeStyle={{
                accentColor: '#24352D',
                cardBg: '#FAF8F5',
                borderColor: '#E8E3DA',
                textColor: '#23201D',
                headingColor: '#24352D',
              }}
            />

            {/* Social Channels Section */}
            <SocialLinksSection
              socialLinks={profile.socialLinks}
              variant="soft"
              themeStyle={{
                accentColor: '#24352D',
                cardBg: '#FAF8F5',
                borderColor: '#E8E3DA',
                textColor: '#23201D',
                headingColor: '#24352D',
              }}
            />
          </section>

          {/* Business Offerings & Menu Catalogue */}
          {profile.catalogue && profile.catalogue.length > 0 && (
            <section className="section-group" aria-labelledby="soft-catalogue-heading">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 id="soft-catalogue-heading" className="text-base font-serif font-medium text-[#24352D]">
                  Offerings &amp; Menu
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#24352D]/10 text-[#24352D] font-medium">
                  {profile.catalogue.length} {profile.catalogue.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
              <div className="space-y-3">
                {profile.catalogue.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-[#E8E3DA] bg-[#FAF8F5] flex flex-col justify-between gap-3 shadow-sm hover:border-[#24352D]/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#24352D]/10 text-[#24352D]">
                            {item.itemType || 'Product'}
                          </span>
                          {item.price && (
                            <span className="text-xs font-mono font-bold text-[#24352D]">
                              {item.currency || '₹'} {item.price}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-serif font-medium text-[#23201D]">{item.title}</h3>
                        {item.description && (
                          <p className="text-xs text-[#79716B] mt-1 leading-relaxed">{item.description}</p>
                        )}
                      </div>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-16 h-16 rounded-xl object-cover border border-[#E8E3DA] shrink-0"
                        />
                      )}
                    </div>
                    <div className="pt-2 border-t border-[#E8E3DA] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onOpenExchange(`Inquiry regarding: ${item.title}`)}
                        className="text-xs font-semibold text-[#24352D] hover:underline"
                      >
                        Inquire &amp; Order &rarr;
                      </button>
                      {item.actionUrl && (
                        <a
                          href={item.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#79716B] hover:text-[#24352D]"
                        >
                          View Link
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dynamic Universal Contact & Lead Generation Form */}
          <section className="section-group" aria-label="Send Direct Message">
            <TemplateContactForm
              profileId={profile.id}
              profileName={profile.displayName}
              themeStyle={{
                accentColor: '#24352D',
                cardBg: '#FAF8F5',
                textColor: '#23201D',
                inputBg: '#FFFFFF',
                borderColor: '#E8E3DA',
              }}
            />
          </section>

          {/* Subtle Footer */}
          <footer className="profile-footer">
            <p className="footer-note">Exchanged via NFC Tap • Taptch</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

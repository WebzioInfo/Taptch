import React from 'react';
import type { ProfileRenderData } from '../ProfileRenderer';
import { TemplateContactForm } from '../TemplateContactForm';
import './clean-corporate.css';

interface CleanCorporateProps {
  profile: ProfileRenderData;
  onDownloadVCard: () => void;
  onOpenExchange: (initialNote?: string) => void;
  onOpenQr: () => void;
  copiedUrl: boolean;
  onCopyLink: () => void;
  previewPlanId?: string;
}

export function CleanCorporateTemplate({
  profile,
  onDownloadVCard,
  onOpenExchange,
  onOpenQr,
  copiedUrl,
  onCopyLink,
}: CleanCorporateProps) {
  const businesses = profile.businesses || [];
  const primaryBusiness = businesses[0];
  const phone = profile.phone || '';
  const rawPhone = phone.replace(/\D/g, '');
  const email = profile.email || '';
  const location = profile.address || profile.location || 'Calicut, Kerala';

  return (
    <div className="template-clean-corporate">
      <div className="page-wrapper">
        <main className="card-container" role="main">
          {/* Profile Header */}
          <header className="profile-header">
            <div className="avatar-wrapper">
              <img
                src={profile.avatarUrl || '/avatar.svg'}
                alt={`Portrait of ${profile.displayName}`}
                className="avatar-img"
                width={104}
                height={104}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/avatar.svg';
                }}
              />
              <span className="status-indicator" title="Available" />
            </div>

            <div className="profile-meta">
              <h1 className="profile-name">{profile.displayName}</h1>
              <p className="profile-title">{profile.headline || primaryBusiness?.tagline || 'Digital Identity'}</p>
              <div className="location-badge">
                <svg
                  className="icon icon-sm"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 2.5C6.962 2.5 4.5 4.962 4.5 8c0 4.125 5.5 9.5 5.5 9.5s5.5-5.375 5.5-9.5c0-3.038-2.462-5.5-5.5-5.5z" />
                  <circle cx="10" cy="8" r="2.25" />
                </svg>
                <span>{location}</span>
                <span className="meta-dot" aria-hidden="true">•</span>
                <span>Verified</span>
              </div>
            </div>
          </header>

          {/* Primary & Secondary Quick Actions */}
          <section className="actions-section" aria-label="Quick Actions">
            <button
              type="button"
              onClick={onDownloadVCard}
              className="btn btn-primary"
              id="save-contact-btn"
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

            <div className="button-row">
              {phone ? (
                <a href={`tel:${phone}`} className="btn btn-secondary">
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

              {rawPhone ? (
                <a
                  href={`https://wa.me/${rawPhone}`}
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

          {/* Companies / Ventures */}
          {businesses.length > 0 && (
            <section className="content-section" aria-labelledby="ventures-heading">
              <div className="section-header">
                <h2 id="ventures-heading" className="section-title">Associated Ventures</h2>
                <span className="section-count">{businesses.length}</span>
              </div>

              <div className="companies-grid">
                {businesses.map((biz) => {
                  const initial = (biz.companyName || 'V').charAt(0).toUpperCase();
                  return (
                    <div key={biz.id} className="company-card">
                      <div className="company-logo-mark" aria-hidden="true">
                        {initial}
                      </div>
                      <div className="company-details">
                        <span className="company-name">{biz.companyName}</span>
                        <span className="company-role">{biz.roleTitle || biz.tagline || 'Partner'}</span>
                      </div>
                      {biz.websiteUrl && (
                        <a
                          href={biz.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          title="Open Website"
                        >
                          <svg
                            className="icon icon-chevron"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="7 5 12 10 7 15" />
                          </svg>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Direct Contact Points */}
          <section className="content-section" aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="section-title">Direct Details</h2>
            <div className="contact-list">
              {email && (
                <a href={`mailto:${email}`} className="contact-item">
                  <div className="contact-icon" aria-hidden="true">
                    <svg
                      className="icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">Email</span>
                    <span className="contact-value">{email}</span>
                  </div>
                </a>
              )}

              <div className="contact-item">
                <div className="contact-icon" aria-hidden="true">
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="contact-info">
                  <span className="contact-label">Headquarters</span>
                  <span className="contact-value">{location}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Dynamic Universal Contact & Lead Generation Form */}
          <section className="content-section" aria-label="Send Direct Enquiry">
            <TemplateContactForm
              profileId={profile.id}
              profileName={profile.displayName}
              themeStyle={{
                accentColor: '#0A2540',
                cardBg: '#F8FAFC',
                textColor: '#0F172A',
                inputBg: '#FFFFFF',
                borderColor: '#E2E8F0',
              }}
            />
          </section>

          {/* Footer Badge */}
          <footer className="card-footer">
            <span className="nfc-badge">
              <span>Verified NFC Profile</span>
              <span>•</span>
              <span>Taptch Cloud</span>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

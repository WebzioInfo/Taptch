import React from 'react';
import type { ProfileRenderData } from '../ProfileRenderer';
import { TemplateContactForm } from '../TemplateContactForm';
import './bold-editorial.css';

interface BoldEditorialProps {
  profile: ProfileRenderData;
  onDownloadVCard: () => void;
  onOpenExchange: (initialNote?: string) => void;
  onOpenQr: () => void;
  copiedUrl: boolean;
  onCopyLink: () => void;
  previewPlanId?: string;
}

export function BoldEditorialTemplate({
  profile,
  onDownloadVCard,
  onOpenExchange,
  onOpenQr,
  copiedUrl,
  onCopyLink,
}: BoldEditorialProps) {
  const businesses = profile.businesses || [];
  const primaryBusiness = businesses[0];
  const phone = profile.phone || '';
  const rawPhone = phone.replace(/\D/g, '');
  const email = profile.email || '';
  const location = profile.address || profile.location || 'Calicut, Kerala';

  const nameParts = profile.displayName.toUpperCase().split(' ');
  const firstName = nameParts[0] || 'TAPTCH';
  const lastName = nameParts.slice(1).join(' ') || 'IDENTITY';

  return (
    <div className="template-bold-editorial">
      <div className="page-wrapper">
        <main className="card-container" role="main">
          {/* Editorial Masthead / Colophon */}
          <div className="masthead">
            <span className="masthead-tag">PROFILE DOSSIER</span>
            <span className="masthead-date">NFC // VERIFIED</span>
          </div>

          {/* Oversized Editorial Name */}
          <header className="name-block">
            <h1 className="oversized-title">
              <span>{firstName}</span>
              {lastName && <span>{lastName}</span>}
            </h1>
            <div className="role-rule">
              <span className="role-pill">
                {(profile.headline || primaryBusiness?.tagline || 'FOUNDER • OPERATOR').toUpperCase()}
              </span>
              <span className="location-text">{location.toUpperCase()}</span>
            </div>
          </header>

          {/* Photo & Quick Metrics Grid */}
          <section className="editorial-hero" aria-label="Profile Overview">
            <div className="photo-frame">
              <img
                src={profile.avatarUrl || '/avatar.svg'}
                alt={`${profile.displayName} portrait`}
                className="editorial-img"
                width={112}
                height={112}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/avatar.svg';
                }}
              />
              <div className="photo-caption">FIG. 01 — IDENTITY</div>
            </div>

            <div className="spec-table">
              <div className="spec-cell">
                <span className="spec-label">STATUS</span>
                <span className="spec-value">Active / Available</span>
              </div>
              <div className="spec-cell">
                <span className="spec-label">LOCATION</span>
                <span className="spec-value">{location}</span>
              </div>
              <div className="spec-cell">
                <span className="spec-label">ENCRYPTION</span>
                <span className="spec-value">Standard NDEF</span>
              </div>
            </div>
          </section>

          {/* Primary & Secondary Buttons (Sharp Editorial Style) */}
          <section className="action-grid" aria-label="Direct Actions">
            <button
              type="button"
              onClick={onDownloadVCard}
              className="btn btn-primary"
            >
              <span>SAVE CONTACT</span>
              <svg
                className="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="square"
                aria-hidden="true"
              >
                <path d="M7 17l10-10M17 17V7H7" />
              </svg>
            </button>

            <div className="secondary-split">
              {phone ? (
                <a href={`tel:${phone}`} className="btn btn-secondary">
                  <svg
                    className="icon icon-sm"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>CALL</span>
                </a>
              ) : (
                <button type="button" onClick={onOpenQr} className="btn btn-secondary">
                  <span>QR CODE</span>
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
                    className="icon icon-sm"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    aria-hidden="true"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span>WHATSAPP</span>
                </a>
              ) : (
                <button type="button" onClick={onCopyLink} className="btn btn-secondary">
                  <span>{copiedUrl ? 'COPIED!' : 'SHARE'}</span>
                </button>
              )}
            </div>
          </section>

          {/* Companies List (Magazine Index Style) */}
          {businesses.length > 0 && (
            <section className="index-section" aria-labelledby="ventures-label">
              <div className="index-header">
                <h2 id="ventures-label" className="index-title">INDEX // VENTURES</h2>
                <span className="index-total">[ {businesses.length < 10 ? `0${businesses.length}` : businesses.length} ]</span>
              </div>

              <div className="index-list">
                {businesses.map((biz, idx) => {
                  const num = idx + 1 < 10 ? `0${idx + 1}` : idx + 1;
                  return (
                    <div key={biz.id} className="index-row">
                      <span className="row-num">{num}</span>
                      <div className="row-body">
                        <span className="row-name">{biz.companyName}</span>
                        <span className="row-desc">{biz.roleTitle || biz.tagline || 'Directorship'}</span>
                      </div>
                      <span className="row-tag">OFFICIAL</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Communication Lines */}
          <section className="index-section" aria-labelledby="comms-label">
            <div className="index-header">
              <h2 id="comms-label" className="index-title">COMMUNICATION LINES</h2>
            </div>

            <div className="index-list">
              {phone && (
                <div className="index-row">
                  <span className="row-num">TEL</span>
                  <div className="row-body">
                    <a href={`tel:${phone}`} className="row-link">{phone}</a>
                  </div>
                  <span className="row-tag">DIRECT</span>
                </div>
              )}

              {email && (
                <div className="index-row">
                  <span className="row-num">MAIL</span>
                  <div className="row-body">
                    <a href={`mailto:${email}`} className="row-link">{email}</a>
                  </div>
                  <span className="row-tag">OFFICIAL</span>
                </div>
              )}

              <div className="index-row">
                <span className="row-num">BASE</span>
                <div className="row-body">
                  <span className="row-name">{location}</span>
                </div>
                <span className="row-tag">HQ</span>
              </div>
            </div>
          </section>

          {/* Universal Contact Form - Sharp Editorial Style */}
          <section className="index-section" aria-label="Submit Dossier Enquiry">
            <div className="index-header" style={{ marginBottom: '12px' }}>
              <h2 className="index-title">DIRECT DISPATCH // INQUIRY</h2>
            </div>
            <TemplateContactForm
              profileId={profile.id}
              profileName={profile.displayName}
              themeStyle={{
                accentColor: '#000000',
                cardBg: '#F6F6F6',
                textColor: '#000000',
                inputBg: '#FFFFFF',
                borderColor: '#000000',
              }}
            />
          </section>

          {/* Editorial Footer */}
          <footer className="editorial-footer">
            <div className="footer-hairline" />
            <div className="footer-meta">
              <span>AUTONOMOUS PROFILE &copy; 2026</span>
              <span>{location.toUpperCase()}</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import type { ProfileRenderData } from '../ProfileRenderer';
import { CleanCorporateTemplate } from './CleanCorporateTemplate';
import { DarkPremiumTemplate } from './DarkPremiumTemplate';
import { SoftModernTemplate } from './SoftModernTemplate';
import { BoldEditorialTemplate } from './BoldEditorialTemplate';
import './index-preview.css';

interface NfcPreviewStudioProps {
  profile: ProfileRenderData;
  onDownloadVCard: () => void;
  onOpenExchange: (initialNote?: string) => void;
  onOpenQr: () => void;
  copiedUrl: boolean;
  onCopyLink: () => void;
  previewPlanId?: string;
  initialTemplate?: 'clean-corporate' | 'dark-premium' | 'soft-modern' | 'bold-editorial';
}

export function NfcPreviewStudio({
  profile,
  onDownloadVCard,
  onOpenExchange,
  onOpenQr,
  copiedUrl,
  onCopyLink,
  previewPlanId,
  initialTemplate = 'clean-corporate',
}: NfcPreviewStudioProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<
    'clean-corporate' | 'dark-premium' | 'soft-modern' | 'bold-editorial'
  >(initialTemplate);

  const templates = [
    { id: 'clean-corporate' as const, index: '01', label: 'Clean Corporate' },
    { id: 'dark-premium' as const, index: '02', label: 'Dark Premium' },
    { id: 'soft-modern' as const, index: '03', label: 'Soft Modern' },
    { id: 'bold-editorial' as const, index: '04', label: 'Bold Editorial' },
  ];

  const layoutProps = {
    profile: { ...profile, templateId: selectedTemplate },
    onDownloadVCard,
    onOpenExchange,
    onOpenQr,
    copiedUrl,
    onCopyLink,
    previewPlanId,
  };

  const renderActiveTemplate = () => {
    switch (selectedTemplate) {
      case 'dark-premium':
        return <DarkPremiumTemplate {...layoutProps} />;
      case 'soft-modern':
        return <SoftModernTemplate {...layoutProps} />;
      case 'bold-editorial':
        return <BoldEditorialTemplate {...layoutProps} />;
      case 'clean-corporate':
      default:
        return <CleanCorporateTemplate {...layoutProps} />;
    }
  };

  return (
    <div className="nfc-preview-studio">
      <div className="preview-layout">
        {/* Left Side: Vertical Template Switcher */}
        <aside className="side-panel side-left" aria-label="Template Switcher">
          <div className="panel-header">
            <span className="panel-badge">NFC STUDIO</span>
            <h2 className="panel-title">Templates</h2>
          </div>
          <nav className="template-list">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`template-btn ${selectedTemplate === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(t.id)}
              >
                <span className="btn-index">{t.index}</span>
                <span className="btn-label">{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Center: Centered Phone Mockup */}
        <main className="phone-viewport-container">
          <div className="phone-mockup">
            <div className="phone-speaker" aria-hidden="true" />
            <div className="phone-content-area">
              {renderActiveTemplate()}
            </div>
          </div>
        </main>

        {/* Right Side: Standalone Direct Launch Action */}
        <aside className="side-panel side-right" aria-label="Template Actions">
          <div className="action-wrap">
            <button
              type="button"
              onClick={onCopyLink}
              className="standalone-btn"
            >
              <span>{copiedUrl ? 'Link Copied!' : 'Copy Profile Link'}</span>
              <svg
                className="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
            <span className="action-hint">Active template: {selectedTemplate}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}


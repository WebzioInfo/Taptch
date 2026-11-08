'use client';

import React from 'react';
import { Instagram, QrCode } from 'lucide-react';
import type { CardDesignState } from '../../types';
import { campaignBrandConfig } from '../../config/brand.config';

interface CardCustomizerPreviewProps {
  design: CardDesignState;
  side: 'front' | 'back';
  material?: string;
  className?: string;
  interactive?: boolean;
  onFlip?: () => void;
}

// Contactless NFC pure vector waves glyph
function ContactlessGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-label="Contactless Symbol"
    >
      <path d="M7 16a5 5 0 0 1 0-8" />
      <path d="M10.5 19a9 9 0 0 1 0-14" />
      <path d="M14 22a13 13 0 0 1 0-20" />
    </svg>
  );
}

export function CardCustomizerPreview({
  design,
  side,
  material = 'PVC',
  className = '',
  interactive = false,
  onFlip,
}: CardCustomizerPreviewProps) {
  const isBack = side === 'back';
  const isMetal = material?.toUpperCase() === 'METAL' || design.templateId === 'executive-metal';
  const isBamboo = material?.toUpperCase() === 'BAMBOO';
  const isWhite = design.templateId === 'pure-minimalist' || design.backgroundColor === '#FFFFFF';
  const isGradient = design.templateId === 'gradient-instagram';

  // Dynamic surface styling matching luxury materials
  const getBackgroundStyle = () => {
    if (isGradient) {
      return {
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 35%, #D946EF 65%, #F43F5E 100%)',
      };
    }
    if (isMetal) {
      return {
        backgroundColor: '#16161A',
        backgroundImage:
          'repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px), radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 60%)',
      };
    }
    if (isBamboo) {
      return {
        backgroundColor: '#C8A87A',
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 2px, transparent 2px, transparent 8px)',
      };
    }
    return {
      backgroundColor: design.backgroundColor || '#0A0A0C',
      backgroundImage:
        'radial-gradient(ellipse at top left, rgba(255, 255, 255, 0.08) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(0, 0, 0, 0.4) 0%, transparent 60%)',
    };
  };

  const getTextColor = () => {
    if (isWhite) return '#111827';
    if (isBamboo) return '#291E13';
    return '#FFFFFF';
  };

  const textColor = getTextColor();

  return (
    <div
      className={`relative w-full max-w-[380px] aspect-[85.6/53.98] select-none transition-transform duration-500 [perspective:1200px] ${
        interactive ? 'cursor-pointer hover:scale-[1.02]' : ''
      } ${className}`}
      onClick={interactive ? onFlip : undefined}
    >
      {/* Outer 3D Card Shell */}
      <div
        className="w-full h-full relative rounded-2xl transition-all duration-500 [transform-style:preserve-3d]"
        style={{
          transform: isBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
          boxShadow: isWhite
            ? '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.06)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {/* ========================================================= */}
        {/* FRONT FACE */}
        {/* ========================================================= */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden [backface-visibility:hidden]"
          style={{
            ...getBackgroundStyle(),
            color: textColor,
            fontFamily: design.fontFamily || 'Inter, sans-serif',
          }}
        >
          {/* Subtle Studio Specular Glare Overlay */}
          <div
            className="pointer-events-none absolute -inset-full opacity-30 mix-blend-overlay"
            style={{
              background:
                'linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.6) 48%, rgba(255, 255, 255, 0.9) 50%, rgba(255, 255, 255, 0.6) 52%, transparent 60%)',
            }}
          />

          {/* Metal Chamfer Highlight Rim */}
          {isMetal && (
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
          )}

          {/* Top Bar: Contactless Wave + Instagram Foil Glyph */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-2 opacity-90">
              <ContactlessGlyph className="h-4 w-4" />
              <span className="text-[10px] tracking-[0.14em] font-medium uppercase opacity-75">
                NTAG216 • NFC
              </span>
            </div>

            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md transition-colors ${
                isWhite
                  ? 'bg-slate-100 text-slate-900 border border-slate-200'
                  : 'bg-white/10 text-white border border-white/15'
              }`}
            >
              <Instagram className="h-3.5 w-3.5 text-pink-500 fill-pink-500/20" />
              <span>Instagram</span>
            </div>
          </div>

          {/* Center Identity: Clean Monogram/Avatar + Handle + Bio */}
          <div className="space-y-1.5 my-auto relative z-10">
            {design.avatarUrl ? (
              <img
                src={design.avatarUrl}
                alt="Profile Avatar"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-white/30 object-cover shadow-md mb-2"
              />
            ) : (
              <div
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-1 shadow-sm transition-colors"
                style={{
                  backgroundColor: design.accentColor || '#2563EB',
                  color: '#FFFFFF',
                }}
              >
                {design.instagramUsername
                  ? design.instagramUsername.slice(0, 2).toUpperCase()
                  : 'IG'}
              </div>
            )}

            <div className="text-lg sm:text-xl font-bold tracking-tight line-clamp-1">
              @{design.instagramUsername || 'yourbrand'}
            </div>

            <div className="text-[11px] sm:text-xs font-normal opacity-80 line-clamp-1">
              {design.headline || 'Creator • Tap to Connect'}
            </div>
          </div>

          {/* Bottom Bar: Clean Specs */}
          <div className="flex items-center justify-between text-[9px] tracking-wider uppercase opacity-60 border-t border-current/10 pt-2.5 relative z-10">
            <span className="font-semibold">{material.toUpperCase()} EDITION</span>
            <span className="tracking-widest">TAP PHONE HERE</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BACK FACE */}
        {/* ========================================================= */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl p-6 sm:p-7 flex flex-col items-center justify-between text-center overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{
            ...getBackgroundStyle(),
            color: textColor,
            fontFamily: design.fontFamily || 'Inter, sans-serif',
          }}
        >
          {/* Metal Chamfer Highlight Rim */}
          {isMetal && (
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
          )}

          {/* Top Instruction */}
          <div className="text-[10px] sm:text-[11px] font-medium tracking-wider opacity-75 uppercase">
            {design.tagline || 'Scan or Tap with any smartphone'}
          </div>

          {/* Precision QR Code Center Frame */}
          <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200/60 relative group">
            <QrCode className="h-16 w-16 sm:h-20 sm:w-20 text-slate-900" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-black/5 pointer-events-none" />
          </div>

          {/* Direct URL and Legal Microtext */}
          <div className="space-y-0.5">
            <div className="text-[11px] sm:text-xs font-semibold tracking-tight text-current opacity-90">
              instagram.com/{design.instagramUsername || 'yourbrand'}
            </div>
            <div className="text-[9px] opacity-50 tracking-wider uppercase">
              {campaignBrandConfig.cardFooterText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

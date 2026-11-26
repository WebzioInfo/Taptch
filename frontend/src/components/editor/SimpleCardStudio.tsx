import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  CreditCard,
  RotateCw,
  Save,
  ArrowLeft,
  Check,
  ShieldCheck,
  ChevronDown,
  Layers,
  Type,
  Palette,
  ExternalLink,
  User,
  Users,
  Building2,
  ArrowRight,
  Eye,
  Maximize2,
  X,
} from 'lucide-react';
import { DesignAssistanceButton } from '../common/DesignAssistanceButton';
import { buildStudioDesignAssistanceMessage } from '../../utils/whatsappAssistance';
import { useEditorStore } from './useEditorStore';

export interface VariantTheme {
  background: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  borderColor: string;
  qrColor: string;
}

const VARIANT_THEME_FALLBACKS: Record<string, VariantTheme> = {
  var_pvc_black: {
    background: '#000000',
    primaryText: '#FFFFFF',
    secondaryText: '#D4AF37',
    accent: '#D4AF37',
    borderColor: '#27272A',
    qrColor: '#FFFFFF',
  },
  var_pvc_white: {
    background: '#FFFFFF',
    primaryText: '#111827',
    secondaryText: '#374151',
    accent: '#111827',
    borderColor: '#E5E7EB',
    qrColor: '#111827',
  },
  var_metal_black: {
    background: '#000000',
    primaryText: '#FFFFFF',
    secondaryText: '#D4D4D8',
    accent: '#D4AF37',
    borderColor: '#27272A',
    qrColor: '#D4AF37',
  },
  var_metal_silver: {
    background: '#C0C0C0',
    primaryText: '#111111',
    secondaryText: '#374151',
    accent: '#4B5563',
    borderColor: '#9CA3AF',
    qrColor: '#111111',
  },
  var_metal_gold: {
    background: '#D4AF37',
    primaryText: '#111111',
    secondaryText: '#292524',
    accent: '#78350F',
    borderColor: '#A16207',
    qrColor: '#111111',
  },
  var_metal_rose_gold: {
    background: '#B76E79',
    primaryText: '#FFFFFF',
    secondaryText: '#FFF1F2',
    accent: '#4C0519',
    borderColor: '#9F525E',
    qrColor: '#FFFFFF',
  },
};

export interface SimpleCardData {
  name: string;
  title: string;
  extra: string;
  surface: 'black' | 'white';
  finish: 'gold' | 'silver';
  style: 'executive-minimal' | 'signature-identity';
  fontFamily: string;
  variantId?: string;
}

// Curated high-end business card fonts emphasizing minimal & cool typography
export const BUSINESS_CARD_FONTS = [
  {
    id: 'inter',
    name: 'Inter',
    category: 'Swiss Minimalist',
    tag: 'minimal' as const,
    description: 'Ultra-clean, crisp, and neutral neo-grotesque. The gold standard of modern minimal design.',
    family: "'Inter', sans-serif",
  },
  {
    id: 'outfit',
    name: 'Outfit',
    category: 'Geometric Minimal',
    tag: 'minimal' as const,
    description: 'Contemporary, airy geometric curves designed for modern brand identities.',
    family: "'Outfit', sans-serif",
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    category: 'Tech Minimalist',
    tag: 'minimal' as const,
    description: 'Cool futuristic tech aesthetic with distinctive monospace proportions.',
    family: "'Space Grotesk', sans-serif",
  },
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    category: 'Modern Corporate',
    tag: 'minimal' as const,
    description: 'Refined, high-legibility contemporary sans preferred by startup founders.',
    family: "'Plus Jakarta Sans', sans-serif",
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    category: 'Architect Geometric',
    tag: 'minimal' as const,
    description: 'Generously tracked geometric capitals for architect and designer cards.',
    family: "'Montserrat', sans-serif",
  },
  {
    id: 'dmsans',
    name: 'DM Sans',
    category: 'Nordic Clean',
    tag: 'minimal' as const,
    description: 'Understated, geometric low-contrast sans for a minimalist studio aesthetic.',
    family: "'DM Sans', sans-serif",
  },
  {
    id: 'cinzel',
    name: 'Cinzel',
    category: 'Roman Heritage',
    tag: 'classic' as const,
    description: 'Symmetrical Roman inscriptional luxury, favored by heritage brands.',
    family: "'Cinzel', serif",
  },
  {
    id: 'bodoni',
    name: 'Bodoni Moda',
    category: 'Vogue Haute Couture',
    tag: 'classic' as const,
    description: 'High-contrast Didone serif popular in fashion and luxury architecture.',
    family: "'Bodoni Moda', serif",
  },
];

interface SimpleCardStudioProps {
  product?: any;
  selectedVariant?: any;
  initialQuantity?: number;
  onSwitchToAdvanced?: () => void;
}

export const SimpleCardStudio: React.FC<SimpleCardStudioProps> = ({
  product,
  selectedVariant,
  initialQuantity = 1,
  onSwitchToAdvanced,
}) => {
  const navigate = useNavigate();

  // Selected Customization State (100% driven by selected product variant)
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const variantTheme: VariantTheme = useMemo(() => {
    if (product?.themeConfig?.background) {
      return product.themeConfig as VariantTheme;
    }
    if (selectedVariant?.themeConfig?.background) {
      return selectedVariant.themeConfig as VariantTheme;
    }
    if (product?.id) {
      const prodKey = product.id.replace(/^prod_/, 'var_');
      if (VARIANT_THEME_FALLBACKS[prodKey]) {
        return VARIANT_THEME_FALLBACKS[prodKey];
      }
    }
    if (selectedVariant?.id && VARIANT_THEME_FALLBACKS[selectedVariant.id]) {
      return VARIANT_THEME_FALLBACKS[selectedVariant.id];
    }
    const slug = (product?.slug || product?.id || '').toLowerCase();
    if (slug.includes('rose')) return VARIANT_THEME_FALLBACKS.var_metal_rose_gold;
    if (slug.includes('gold')) return VARIANT_THEME_FALLBACKS.var_metal_gold;
    if (slug.includes('silver')) return VARIANT_THEME_FALLBACKS.var_metal_silver;
    if (slug.includes('white')) return VARIANT_THEME_FALLBACKS.var_pvc_white;
    if (slug.includes('metal')) return VARIANT_THEME_FALLBACKS.var_metal_black;
    return VARIANT_THEME_FALLBACKS.var_pvc_black;
  }, [selectedVariant, product]);

  const cardSurface: 'black' | 'white' =
    variantTheme.background.toUpperCase() === '#FFFFFF' ? 'white' : 'black';
  const foilFinish: 'gold' | 'silver' =
    variantTheme.accent.toUpperCase() === '#D4AF37' ? 'gold' : 'silver';
  const [templateStyle, setTemplateStyle] = useState<'executive-minimal' | 'signature-identity'>('executive-minimal');
  const [selectedFont, setSelectedFont] = useState(BUSINESS_CARD_FONTS[0].family);

  // Cardholder Details
  const [name, setName] = useState('ALEX VANCE');
  const [title, setTitle] = useState('FOUNDER & MANAGING DIRECTOR');
  const [extra, setExtra] = useState('+91 98765 43210');

  // Minimal Typography Options
  const [fontFilter, setFontFilter] = useState<'all' | 'minimal' | 'classic'>('minimal');
  const [isUpperCase, setIsUpperCase] = useState<boolean>(true);
  const [trackingMode, setTrackingMode] = useState<'wide' | 'ultra' | 'normal'>('wide');

  // Interactive 3D Perspective Tilt
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string>('');

  // Mobile Floating Live Preview State
  const [isMainCardVisible, setIsMainCardVisible] = useState(true);
  const [isPipMinimized, setIsPipMinimized] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Restore saved per-product customization on refresh
  useEffect(() => {
    if (!product?.id) return;
    try {
      const raw =
        localStorage.getItem(`taptch_simple_card_draft_${product.id}`) ||
        localStorage.getItem('taptch_simple_card_draft');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.productId && parsed.productId !== product.id) return;
      if (typeof parsed.name === 'string') setName(parsed.name);
      if (typeof parsed.title === 'string') setTitle(parsed.title);
      if (typeof parsed.extra === 'string') setExtra(parsed.extra);
      if (parsed.style === 'executive-minimal' || parsed.style === 'signature-identity') {
        setTemplateStyle(parsed.style);
      }
      if (typeof parsed.fontFamily === 'string') setSelectedFont(parsed.fontFamily);
    } catch {
      // Ignore corrupt draft
    }
  }, [product?.id]);

  // Monitor when main card scrolls out of view on mobile
  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMainCardVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const isGold = foilFinish === 'gold';

  // Generate dynamic QR code for back side (sanitized slug edge case protection)
  useEffect(() => {
    const cleanSlug =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'profile';
    const profileUrl = `https://taptch.com/${cleanSlug}`;
    const qrColor = variantTheme.qrColor || variantTheme.primaryText || '#FFFFFF';

    QRCode.toDataURL(profileUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: qrColor,
        light: '#00000000', // Transparent QR modules on pure solid card background
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate card QR code:', err));
  }, [name, variantTheme]);

  // Mouse tilt tracking for realistic 3D feel
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 12;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Calculate customization completion
  const completionPercentage = useMemo(() => {
    let score = 20; // default base surface
    if (name.trim().length > 0) score += 30;
    if (title.trim().length > 0) score += 30;
    if (extra.trim().length > 0) score += 20;
    return Math.min(100, score);
  }, [name, title, extra]);

  // Handle Save Draft
  const handleSaveDraft = (): boolean => {
    if (!product?.id) {
      setNameError('Selected product is missing. Please return to the catalog and select a card.');
      return false;
    }
    const draft: SimpleCardData & { productId: string } = {
      productId: product.id,
      name,
      title,
      extra,
      surface: cardSurface,
      finish: foilFinish,
      style: templateStyle,
      fontFamily: selectedFont,
    };
    try {
      localStorage.setItem(`taptch_simple_card_draft_${product.id}`, JSON.stringify(draft));
      localStorage.setItem('taptch_simple_card_draft', JSON.stringify(draft));
      localStorage.setItem(
        'taptch_checkout_design_draft',
        JSON.stringify({
          simpleCard: draft,
          surface: cardSurface,
          finish: foilFinish,
          productId: product.id,
          productName: product.name,
          variantId: selectedVariant?.id,
          material: product.material,
          color: product.color || selectedVariant?.color,
          colorName: product.colorName || selectedVariant?.name,
          imageUrl: product.imageUrl || selectedVariant?.imageUrl,
          previewUrl: product.imageUrl || selectedVariant?.imageUrl || '',
          themeConfig: variantTheme,
          quantity: initialQuantity,
          capturedAt: new Date().toISOString(),
        })
      );
      // Clear any stale Fabric canvas state from previous sessions so Checkout renders this exact product
      const store = useEditorStore.getState();
      store.loadSideConfigs('', '', '');
      store.setPreviews('', '');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      return true;
    } catch (e) {
      console.warn('Failed to save card draft to localStorage', e);
      setNameError('Unable to save your card design. Please try again.');
      return false;
    }
  };

  // Reset to default
  const handleReset = () => {
    setName('ALEX VANCE');
    setTitle('FOUNDER & MANAGING DIRECTOR');
    setExtra('+91 98765 43210');
    setTemplateStyle('executive-minimal');
    setSelectedFont(BUSINESS_CARD_FONTS[0].family);
    setIsUpperCase(true);
    setTrackingMode('wide');
    setActiveSide('front');
    setNameError('');
  };

  // Order Now -> Validate product & save design before Checkout
  const handleOrderNow = () => {
    if (!product?.id || product?.isActive === false) {
      setNameError('Selected NFC card product is unavailable. Please return to the catalog.');
      return;
    }
    if (!name.trim()) {
      setNameError('Please enter your cardholder name to proceed');
      return;
    }
    setNameError('');
    const saved = handleSaveDraft();
    if (!saved) return;

    const queryParams = new URLSearchParams({
      productId: product.id,
      surface: cardSurface,
      finish: foilFinish,
      style: templateStyle,
      name: name.trim(),
      title: title.trim(),
      extra: extra.trim(),
    });
    if (selectedVariant?.id) queryParams.set('variantId', selectedVariant.id);
    if (product.material) queryParams.set('material', product.material);
    if (initialQuantity > 1) queryParams.set('quantity', String(initialQuantity));
    navigate(`/checkout?${queryParams.toString()}`);
  };

  // Dynamic Typography Sizing preventing card boundary overflows on long names
  const getNameFontSizeClass = () => {
    const len = name.trim().length;
    if (len > 30) return 'text-xs sm:text-sm';
    if (len > 22) return 'text-sm sm:text-base';
    if (len > 14) return 'text-base sm:text-lg';
    return 'text-lg sm:text-xl md:text-2xl';
  };

  const getTitleFontSizeClass = () => {
    const len = title.trim().length;
    if (len > 35) return 'text-[8px] sm:text-[9px]';
    if (len > 24) return 'text-[9px] sm:text-[10px]';
    return 'text-[10px] sm:text-[11px]';
  };

  // Minimal Tracking Helper
  const getTrackingClass = () => {
    if (trackingMode === 'ultra') return 'tracking-[0.24em]';
    if (trackingMode === 'wide') return 'tracking-[0.16em]';
    return 'tracking-[0.06em]';
  };

  // Pure Solid-Color Card Surface (Zero gradients, zero translucency)
  const getCardSurfaceStyle = () => {
    return {
      backgroundColor: variantTheme.background,
      border: `1.5px solid ${variantTheme.borderColor}`,
      boxShadow: '0 18px 36px -12px rgba(0, 0, 0, 0.25)',
    };
  };

  const foilAccentColor = variantTheme.accent;

  const getPrimaryTextStyle = () => ({
    color: variantTheme.primaryText,
  });

  const getSecondaryTextStyle = () => ({
    color: variantTheme.secondaryText,
  });

  const getFoilTextStyle = getPrimaryTextStyle;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1E293B] flex flex-col font-sans select-none antialiased">
      {/* 1. Header Bar */}
      <header className="h-14 sm:h-16 bg-white border-b border-slate-200/90 px-3 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left: Back & Badge */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate('/cards')}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-[#FFF3E9] text-[#FF6A00] border border-[#FF6A00]/20">
            Studio
          </span>
        </div>

        {/* Center: Title */}
        <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight text-center">
          Design Your Card
        </h1>

        {/* Right: Save Draft */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSaveDraft}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4 text-slate-500" />}
            <span className="hidden xs:inline sm:inline">{isSaved ? 'Saved!' : 'Save'}</span>
          </button>

          {onSwitchToAdvanced && (
            <button
              onClick={onSwitchToAdvanced}
              className="hidden lg:flex items-center space-x-1 text-xs text-slate-400 hover:text-[#FF6A00] underline pl-1"
              title="Open Full Vector Canvas"
            >
              <span>Advanced Studio</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Studio Content (2-Column Grid) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ================= LEFT COLUMN: LIVE CARD PREVIEW ================= */}
        <section className="lg:col-span-7 flex flex-col items-center lg:sticky lg:top-20">
          {/* Front / Back Toggle Pill Switch */}
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl mb-6 shadow-inner">
            <button
              onClick={() => setActiveSide('front')}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeSide === 'front'
                ? 'bg-[#FF6A00] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Front
            </button>
            <button
              onClick={() => setActiveSide('back')}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeSide === 'back'
                ? 'bg-[#FF6A00] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Back
            </button>
          </div>

          {/* 3D Interactive Card Stage */}
          <div
            ref={stageRef}
            className="w-full max-w-[500px] py-4 flex flex-col items-center justify-center"
            style={{ perspective: '1200px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchEnd={() => setTilt({ x: 0, y: 0 })}
          >
            <div
              ref={cardRef}
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${activeSide === 'back' ? 'rotateY(180deg)' : ''
                  }`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              className="relative w-full aspect-[1.586/1] rounded-[22px] cursor-pointer select-none"
            >
              {/* ================= CARD FRONT FACE ================= */}
              <div
                style={{
                  ...getCardSurfaceStyle(),
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                className="absolute inset-0 rounded-[20px] sm:rounded-[22px] p-4 sm:p-7 flex flex-col justify-between overflow-hidden"
              >
                {/* Signature Identity Inner Border (Solid) */}
                {templateStyle === 'signature-identity' && (
                  <div
                    className="absolute inset-3 sm:inset-3.5 rounded-[16px] pointer-events-none transition-all"
                    style={{
                      border: `1px solid ${variantTheme.borderColor}`,
                    }}
                  />
                )}

                {/* Card Front Top Row: Clean Wifi / Contactless Wave Icon only */}
                <div className="relative z-10 flex items-center justify-end">
                  {/* Contactless Wave Icon */}
                  <div className="flex items-center space-x-1">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 transition-all"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={foilAccentColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                      <path d="M8 5a10.5 10.5 0 0 1 3 7 10.5 10.5 0 0 1-3 7" />
                      <path d="M4 8a5.5 5.5 0 0 1 2 4 5.5 5.5 0 0 1-2 4" />
                    </svg>
                  </div>
                </div>

                {/* Card Front Center: Identity Typography */}
                <div
                  className={`relative z-10 my-auto ${templateStyle === 'signature-identity' ? 'text-center' : 'text-left pl-2'
                    }`}
                >
                  {/* Signature Identity Accent Divider */}
                  {templateStyle === 'signature-identity' && (
                    <div
                      className="w-10 h-[2px] mb-3 mx-auto"
                      style={{ backgroundColor: foilAccentColor }}
                    />
                  )}

                  {/* Cardholder Name */}
                  <h2
                    style={{
                      ...getPrimaryTextStyle(),
                      fontFamily: selectedFont,
                    }}
                    className={`${getNameFontSizeClass()} font-medium ${getTrackingClass()} ${isUpperCase ? 'uppercase' : 'normal-case'
                      } transition-all leading-tight max-w-full break-words line-clamp-2`}
                  >
                    {name || 'YOUR NAME'}
                  </h2>

                  {/* Job Title / Company */}
                  <p
                    style={{
                      ...getSecondaryTextStyle(),
                      fontFamily: selectedFont,
                    }}
                    className={`${getTitleFontSizeClass()} font-normal ${trackingMode === 'ultra' ? 'tracking-[0.25em]' : 'tracking-[0.16em]'
                      } ${isUpperCase ? 'uppercase' : 'normal-case'
                      } mt-2 transition-all max-w-full break-words line-clamp-2`}
                  >
                    {title || 'JOB TITLE OR COMPANY'}
                  </p>

                  {/* Extra Line (Phone, email, or website) */}
                  {extra && (
                    <p
                      style={{
                        ...getSecondaryTextStyle(),
                        fontFamily: selectedFont,
                      }}
                      className="text-[9px] sm:text-[10px] font-light tracking-[0.12em] mt-1.5 font-mono"
                    >
                      {extra}
                    </p>
                  )}
                </div>

                {/* Clean Bottom Spacer for Perfect Aesthetic Balance */}
                <div className="h-6 sm:h-7 pointer-events-none" />
              </div>

              {/* ================= CARD BACK FACE ================= */}
              <div
                style={{
                  ...getCardSurfaceStyle(),
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                className="absolute inset-0 rounded-[20px] sm:rounded-[22px] p-4 sm:p-7 flex flex-col justify-between items-center text-center overflow-hidden"
              >

                {/* Back Top: Clean Wifi / Wave Icon */}
                <div className="relative z-10 w-full flex items-center justify-end">
                  <div className="opacity-75">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={foilAccentColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                      <path d="M8 5a10.5 10.5 0 0 1 3 7 10.5 10.5 0 0 1-3 7" />
                      <path d="M4 8a5.5 5.5 0 0 1 2 4 5.5 5.5 0 0 1-2 4" />
                    </svg>
                  </div>
                </div>

                {/* Back Center: Dynamic QR Code */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                  <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Profile QR Code"
                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center text-slate-400">
                        <RotateCw className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Clean Bottom Spacer */}
                <div className="h-4 sm:h-5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Flip to Back / Front Button */}
          <button
            onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
            className="mt-3 px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center space-x-2 active:scale-95"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>{activeSide === 'front' ? 'Flip to Back (QR & Logo)' : 'Flip to Front'}</span>
          </button>

          {/* Customization Completion Progress Bar */}
          <div className="w-full max-w-md mt-6 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-500">Customization completion</span>
              <span className="text-[#FF6A00] font-mono font-bold">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#FF6A00] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </section>

        {/* ================= RIGHT COLUMN: CUSTOMIZATION CONTROLS ================= */}
        <section className="lg:col-span-5 flex flex-col space-y-4 sm:space-y-5 pb-24 lg:pb-0">
          {/* Quick Jump to Card at Top (Mobile Only) */}
          {/* <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="lg:hidden w-full py-2.5 px-4 rounded-xl bg-[#FFF8F3] border border-[#FF6A00]/30 text-[#FF6A00] text-xs font-bold flex items-center justify-between hover:bg-[#FFF3E9] transition-all active:scale-98 shadow-xs"
          >
            {/* <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#FF6A00]" />
              <span>Preview 3D Card at Top</span>
            </span> */}
          {/* <span className="text-[10px] font-mono uppercase bg-white px-2 py-0.5 rounded-md border border-[#FF6A00]/20 shadow-xs">
              Scroll Up ↑
            </span> */}
          {/* </button> */}

          {/* 1. Selected Product Variant Theme (Locked to Selected Product) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-8 h-8 rounded-lg border shrink-0"
                  style={{
                    backgroundColor: variantTheme.background,
                    borderColor: variantTheme.borderColor,
                  }}
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {selectedVariant?.name || product?.name || 'PVC NFC Card'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {product?.name || 'NFC Smart Card'} &bull; ₹{(selectedVariant?.price || product?.basePrice || 1499).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(product?.slug ? `/nfc-cards/${encodeURIComponent(product.slug)}` : '/nfc-cards')}
                className="text-xs font-semibold text-[#FF6A00] hover:underline shrink-0"
              >
                Change
              </button>
            </div>
          </div>

          {/* 2. Design Template & Typography */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center space-x-2 mb-1">
              <Palette className="w-4 h-4 text-[#FF6A00]" />
              <h3 className="text-sm font-bold text-slate-900">Card Template & Typography</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Choose a layout template and executive typography</p>

            {/* Two New Solid-Color Layout Templates */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setTemplateStyle('executive-minimal')}
                className={`p-3 rounded-xl border text-left transition-all ${templateStyle === 'executive-minimal'
                  ? 'border-[#FF6A00] bg-[#FFF8F3] ring-2 ring-[#FF6A00]/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Executive Minimal</span>
                  {templateStyle === 'executive-minimal' && <Check className="w-4 h-4 text-[#FF6A00]" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">Clean alignment &amp; minimal spacing</p>
              </button>

              <button
                type="button"
                onClick={() => setTemplateStyle('signature-identity')}
                className={`p-3 rounded-xl border text-left transition-all ${templateStyle === 'signature-identity'
                  ? 'border-[#FF6A00] bg-[#FFF8F3] ring-2 ring-[#FF6A00]/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Signature Identity</span>
                  {templateStyle === 'signature-identity' && <Check className="w-4 h-4 text-[#FF6A00]" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">Centered layout with accent line</p>
              </button>
            </div>

            {/* Minimal & Cool Typography Picker */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                {/* <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Minimal Business Card Typography
                </label> */}
                <div className="flex items-center space-x-1 p-0.5 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFontFilter('minimal')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${fontFilter === 'minimal'
                      ? 'bg-white text-[#FF6A00] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    ✨ Minimal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontFilter('classic')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${fontFilter === 'classic'
                      ? 'bg-white text-[#FF6A00] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    Classic
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontFilter('all')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${fontFilter === 'all'
                      ? 'bg-white text-[#FF6A00] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Compact Font Cards Grid with Live Sample */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-3">
                {BUSINESS_CARD_FONTS.filter((font) =>
                  fontFilter === 'all' ? true : font.tag === fontFilter
                ).map((font) => {
                  const isSelected = selectedFont === font.family;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setSelectedFont(font.family)}
                      className={`px-2.5 py-2 rounded-xl border text-left transition-all ${isSelected
                        ? 'border-[#FF6A00] bg-[#FFF8F3] ring-1 ring-[#FF6A00]/25'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                          {font.name}
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-[#FF6A00] shrink-0" />}
                      </div>
                      <div
                        style={{ fontFamily: font.family }}
                        className={`text-[11px] mt-0.5 font-medium text-slate-600 truncate ${isUpperCase ? 'uppercase' : 'normal-case'
                          }`}
                      >
                        {name || 'ALEX VANCE'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Minimalist Spacing & Casing Controls */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                {/* Letter Casing */}
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Casing:
                  </span>
                  <div className="inline-flex p-0.5 bg-slate-200/70 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setIsUpperCase(true)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${isUpperCase
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                      ALL CAPS
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUpperCase(false)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${!isUpperCase
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                      Title Case
                    </button>
                  </div>
                </div>

                {/* Tracking / Spacing */}
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Spacing:
                  </span>
                  <div className="inline-flex p-0.5 bg-slate-200/70 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTrackingMode('normal')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${trackingMode === 'normal'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                      Tight
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackingMode('wide')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${trackingMode === 'wide'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                      Minimal Wide
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackingMode('ultra')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${trackingMode === 'ultra'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                      Ultra
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Cardholder Details Form */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center space-x-2 mb-1">
              <Type className="w-4 h-4 text-[#FF6A00]" />
              <h3 className="text-sm font-bold text-slate-900">Cardholder Details</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Type here &mdash; the card above updates in real time</p>

            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">{name.length}/40</span>
                </div>
                <input
                  type="text"
                  maxLength={40}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="e.g. ALEX VANCE"
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${nameError ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-slate-200'
                    } bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all ${isUpperCase ? 'uppercase' : 'normal-case'
                    }`}
                />
                {nameError && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{nameError}</p>
                )}
              </div>

              {/* Title Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Job Title or Company</label>
                  <span className="text-[10px] font-mono text-slate-400">{title.length}/48</span>
                </div>
                <input
                  type="text"
                  maxLength={48}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. FOUNDER & MANAGING DIRECTOR"
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all ${isUpperCase ? 'uppercase' : 'normal-case'
                    }`}
                />
              </div>

              {/* Extra Line Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Extra Line (Optional)</label>
                  <span className="text-[10px] font-mono text-slate-400">{extra.length}/35</span>
                </div>
                <input
                  type="text"
                  maxLength={35}
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="e.g. +91 98765 43210 or company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all"
                />
              </div>
            </div>
          </div>

          {/* 4. Bottom Action Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center space-x-3 mb-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-xs"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleOrderNow}
                className="hidden lg:flex flex-1 py-3 px-6 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 items-center justify-center space-x-2"
              >
                <span>Order Now</span>
                <span>&rarr;</span>
              </button>
            </div>

            <DesignAssistanceButton
              message={buildStudioDesignAssistanceMessage({
                productName: product?.name,
                variantName: selectedVariant?.name,
                templateName:
                  templateStyle === 'signature-identity'
                    ? 'Signature Identity'
                    : 'Executive Minimal',
              })}
              className="w-full mb-3"
            />

            {/* Guarantee Footer */}
            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 text-center font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>NTAG Microchip &bull; Direct Checkout & Production Guarantee</span>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Floating Live Picture-in-Picture Card (Visible when scrolled past main card on mobile) */}
      <div
        className={`fixed top-16 right-3 sm:right-6 z-40 transition-all duration-300 ease-out lg:hidden ${!isMainCardVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
      >
        {isPipMinimized ? (
          <button
            type="button"
            onClick={() => setIsPipMinimized(false)}
            className="px-3 py-1.5 rounded-full bg-slate-900/95 text-white text-[11px] font-bold shadow-xl border border-white/20 flex items-center gap-1.5 backdrop-blur-md active:scale-95 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Show Card</span>
          </button>
        ) : (
          <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col items-center ring-1 ring-black/5">
            {/* PiP Header Controls */}
            <div className="w-full flex items-center justify-between px-1 pb-1 mb-0.5 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#FF6A00]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] animate-pulse" />
                Live Card
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Flip Card"
                  aria-label="Flip Card"
                >
                  <RotateCw className="w-3 h-3 text-[#FF6A00]" />
                </button>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Scroll to Main Card"
                  aria-label="Scroll to Main Card"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPipMinimized(true)}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  title="Minimize Preview"
                  aria-label="Minimize Preview"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Mini Live Card Preview */}
            <div
              onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
              style={{
                ...getCardSurfaceStyle(),
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.45)',
              }}
              className="w-36 xs:w-40 aspect-[1.586/1] rounded-xl p-2.5 flex flex-col justify-between overflow-hidden cursor-pointer relative select-none"
              title="Tap to flip card"
            >
              {activeSide === 'front' ? (
                <>
                  {/* Signature Identity Frame in PiP */}
                  {templateStyle === 'signature-identity' && (
                    <div
                      className="absolute inset-1 rounded-lg pointer-events-none"
                      style={{
                        border: `0.5px solid ${variantTheme.borderColor}`,
                      }}
                    />
                  )}
                  {/* Wave icon */}
                  <div className="flex justify-end">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={foilAccentColor}
                      strokeWidth="2"
                    >
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                      <path d="M8 5a10.5 10.5 0 0 1 3 7 10.5 10.5 0 0 1-3 7" />
                      <path d="M4 8a5.5 5.5 0 0 1 2 4 5.5 5.5 0 0 1-2 4" />
                    </svg>
                  </div>
                  {/* Identity Typography */}
                  <div className={`my-auto ${templateStyle === 'signature-identity' ? 'text-center' : 'text-left pl-1'}`}>
                    {templateStyle === 'signature-identity' && (
                      <div className="w-4 h-[1.5px] mb-1 mx-auto" style={{ backgroundColor: foilAccentColor }} />
                    )}
                    <p
                      style={{ ...getPrimaryTextStyle(), fontFamily: selectedFont }}
                      className={`text-[9px] font-bold leading-tight truncate ${getTrackingClass()} ${isUpperCase ? 'uppercase' : 'normal-case'
                        }`}
                    >
                      {name || 'YOUR NAME'}
                    </p>
                    <p
                      style={{ ...getSecondaryTextStyle(), fontFamily: selectedFont }}
                      className={`text-[6.5px] mt-0.5 truncate ${trackingMode === 'ultra'
                        ? 'tracking-[0.25em]'
                        : trackingMode === 'wide'
                          ? 'tracking-[0.16em]'
                          : 'tracking-normal'
                        } ${isUpperCase ? 'uppercase' : 'normal-case'
                        }`}
                    >
                      {title || 'JOB TITLE'}
                    </p>
                  </div>
                  {/* Tap to flip hint */}
                  <div className="text-[6px] text-center text-slate-400 font-mono tracking-tighter">
                    Tap to flip
                  </div>
                </>
              ) : (
                /* Back side */
                <div className="flex flex-col items-center justify-center my-auto">
                  {qrCodeDataUrl && (
                    <img src={qrCodeDataUrl} alt="QR" className="w-10 h-10 object-contain" />
                  )}
                  <span className="text-[6px] text-slate-400 mt-1 font-mono tracking-tighter">
                    Tap to flip
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. Mobile Sticky Bottom Action Bar (Thumb-Friendly on Phones) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
          className="p-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
        >
          <RotateCw className="w-3.5 h-3.5 text-[#FF6A00]" />
          <span>{activeSide === 'front' ? 'Flip' : 'Front'}</span>
        </button>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
          title="Scroll up to Card"
        >
          <Eye className="w-3.5 h-3.5 text-[#FF6A00]" />
          <span>Top</span>
        </button>

        <button
          type="button"
          onClick={handleOrderNow}
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#FF6A00]/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <span>Order Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div >
  );
};

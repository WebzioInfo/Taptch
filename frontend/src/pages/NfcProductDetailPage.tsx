import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { savePendingPurchaseIntent } from '../hooks/usePurchaseJourney';
import { CardPreview } from '../components/cards/CardPreview';
import { Button } from '../components/ui/button';
import { defaultBrandConfig } from '../config/brand';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Layers,
  Loader2,
  Maximize2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  Wifi,
  X,
} from 'lucide-react';

export interface ProductVariant {
  id: string;
  productId?: string;
  name: string;
  color: string;
  finish: string;
  price: number;
  sku?: string | null;
  imageUrl?: string | null;
  themeConfig?: {
    background: string;
    primaryText: string;
    secondaryText: string;
    accent: string;
    borderColor: string;
    qrColor: string;
  } | null;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  discountPrice?: number | null;
  canvasWidth?: number;
  canvasHeight?: number;
  safeZone?: number;
  bleedZone?: number;
  supportedSides?: string;
  mockupType?: string;
  imageUrl?: string | null;
  isActive?: boolean;
  category?: string;
  material?: 'pvc' | 'metal' | 'wood' | 'matte';
  inStock?: boolean;
  features?: string[];
  specifications?: Record<string, string>;
  variants?: ProductVariant[];
}

interface GallerySlide {
  id: string;
  label: string;
  type: 'front' | 'back' | 'hardware';
}

const GALLERY_SLIDES: GallerySlide[] = [
  { id: 'front', label: 'Front Preview', type: 'front' },
  { id: 'back', label: 'Back Preview', type: 'back' },
  { id: 'hardware', label: 'Finish & Chip', type: 'hardware' },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Choose your NFC card',
    description: 'Select the material and finish that matches your personal or company identity.',
  },
  {
    step: '02',
    title: 'Customize its design',
    description: 'Personalize the front and back typography, surface, and QR layout in the studio.',
  },
  {
    step: '03',
    title: 'Place your order',
    description: 'Complete delivery details and checkout securely with instant order tracking.',
  },
  {
    step: '04',
    title: 'Set up your digital profile',
    description: 'Create your interactive digital profile after your purchase is confirmed.',
  },
  {
    step: '05',
    title: 'Attach profile to card',
    description: 'Link your profile to your physical NFC card and start sharing with a single tap.',
  },
];

export function NfcProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery<ProductDetail>({
    queryKey: ['public', 'product', slug],
    queryFn: () => ApiClient.get<ProductDetail>(`/api/v1/products/${encodeURIComponent(slug || '')}`),
    enabled: Boolean(slug),
    retry: false,
  });

  const { data: allProducts = [] } = useQuery<ProductDetail[]>({
    queryKey: ['public', 'products'],
    queryFn: () => ApiClient.get<ProductDetail[]>('/api/v1/products'),
  });

  const { data: productTemplates = [] } = useQuery<any[]>({
    queryKey: ['public', 'card-templates', product?.id],
    queryFn: () =>
      ApiClient.get<any[]>(`/api/v1/products/${encodeURIComponent(product?.id || '')}/templates`),
    enabled: Boolean(product?.id),
  });

  const variants = useMemo(() => product?.variants || [], [product]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  useEffect(() => {
    if (variants.length > 0) {
      setSelectedVariantId((prev) =>
        variants.some((v) => v.id === prev) ? prev : variants[0].id,
      );
    } else {
      setSelectedVariantId('');
    }
    setActiveSlideIndex(0);
    setQuantity(1);
  }, [product?.id, variants]);

  const activeVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) || variants[0] || null,
    [variants, selectedVariantId],
  );

  const currentPrice = useMemo(() => {
    if (activeVariant?.price) return activeVariant.price;
    if (product?.discountPrice != null) return product.discountPrice;
    return product?.basePrice ?? 1499;
  }, [activeVariant, product]);

  const originalPrice = useMemo(() => {
    if (!product) return null;
    if (activeVariant?.price && product.basePrice > activeVariant.price) {
      return product.basePrice;
    }
    if (product.discountPrice != null && product.basePrice > product.discountPrice) {
      return product.basePrice;
    }
    return null;
  }, [activeVariant, product]);

  const discountPercentage = useMemo(() => {
    if (!originalPrice || originalPrice <= currentPrice) return null;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }, [originalPrice, currentPrice]);

  const previewTemplate = productTemplates[0];
  const isAvailable = product?.inStock !== false && product?.isActive !== false;

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts.filter((p) => p.id !== product.id).slice(0, 3);
  }, [allProducts, product]);

  const handleDesignYourCard = () => {
    if (!product || !isAvailable) return;
    savePendingPurchaseIntent({
      selectedProductId: product.id,
      selectedVariantId: activeVariant?.id || null,
      selectedCardTemplateId: previewTemplate?.id || null,
      quantity,
      source: 'product_detail',
    });

    const params = new URLSearchParams();
    if (activeVariant?.id) params.set('variantId', activeVariant.id);
    if (quantity > 1) params.set('qty', String(quantity));
    const qs = params.toString();
    navigate(`/studio/${encodeURIComponent(product.id)}${qs ? `?${qs}` : ''}`);
  };

  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => (prev === 0 ? GALLERY_SLIDES.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev === GALLERY_SLIDES.length - 1 ? 0 : prev + 1));
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F8F9FA] px-4">
        <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#666666]">Loading NFC card details...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#F8F9FA] px-4 py-16">
        <div className="max-w-md w-full rounded-2xl bg-white border border-[#E5E7EB] p-8 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3E9] border border-[#FF6A00]/20 text-[#FF6A00] flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <h1 className="font-head text-2xl font-semibold text-[#171717]">
            NFC Product Not Found
          </h1>
          <p className="text-sm text-[#666666] leading-relaxed">
            The NFC card you are looking for does not exist or is no longer available in our catalog.
          </p>
          <div className="pt-2">
            <Link to="/nfc-cards">
              <Button className="bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-semibold gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Browse All NFC Cards</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeSlide = GALLERY_SLIDES[activeSlideIndex];
  const cardSurfaceColor = activeVariant?.color || (product.material === 'pvc' ? '#FAF8F5' : '#121216');

  const featuresList =
    product.features && product.features.length > 0
      ? product.features
      : [
        'NFC-enabled instant contactless sharing',
        'Dynamic QR code backup',
        'Compatible with iOS & Android smartphones',
        'Customizable front & back card design',
        'Durable physical card construction',
      ];

  const specRows: Array<{ label: string; value: string }> = [
    { label: 'Dimensions', value: product.specifications?.dimensions || '85.6 × 53.98 mm (ISO CR80)' },
    {
      label: 'Canvas Resolution',
      value:
        product.specifications?.canvasResolution ||
        `${product.canvasWidth || 1050} × ${product.canvasHeight || 600} px`,
    },
    { label: 'Print Coverage', value: product.specifications?.printSides || 'Front & Back Custom Print' },
    { label: 'NFC Microchip', value: product.specifications?.nfcChip || 'NXP NTAG213 (13.56 MHz)' },
    {
      label: 'Compatibility',
      value: product.specifications?.compatibility || 'iPhone (XS+) & NFC-enabled Android',
    },
    {
      label: 'Material & Finish',
      value: activeVariant
        ? `${(product.material || 'PVC').toUpperCase()} — ${activeVariant.name} (${activeVariant.finish})`
        : (product.material || 'PVC').toUpperCase(),
    },
  ];

  const renderSlideVisual = (slide: GallerySlide, enlarged = false) => {
    const theme = activeVariant?.themeConfig || {
      background: activeVariant?.color || '#000000',
      primaryText:
        (activeVariant?.color || '').toUpperCase() === '#FFFFFF' ||
        (activeVariant?.color || '').toUpperCase() === '#C0C0C0' ||
        (activeVariant?.color || '').toUpperCase() === '#D4AF37'
          ? '#111111'
          : '#FFFFFF',
      secondaryText: '#71717A',
      accent: '#D4AF37',
      borderColor: '#27272A',
      qrColor: '#FFFFFF',
    };
    const variantImage = activeVariant?.imageUrl || product.imageUrl;

    if (slide.type === 'front' && variantImage) {
      return (
        <div
          className={`w-full aspect-[1.586/1] rounded-2xl overflow-hidden border transition-all duration-300 ${
            enlarged ? 'max-w-2xl mx-auto' : ''
          }`}
          style={{ borderColor: theme.borderColor, backgroundColor: theme.background }}
        >
          <img
            src={variantImage}
            alt={`${product.name} - ${activeVariant?.name || 'Front'}`}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (slide.type === 'back' || slide.type === 'hardware') {
      return (
        <div
          className={`w-full aspect-[1.586/1] rounded-2xl border p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
            enlarged ? 'max-w-2xl mx-auto' : ''
          }`}
          style={{
            backgroundColor: theme.background,
            borderColor: theme.borderColor,
            color: theme.primaryText,
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border"
              style={{ borderColor: theme.borderColor, color: theme.secondaryText }}
            >
              {slide.type === 'back' ? 'Back Side QR & NFC' : `${activeVariant?.finish || product.material || 'NFC'} Finish`}
            </span>
            <Wifi className="w-6 h-6" style={{ color: theme.accent }} />
          </div>

          <div className="space-y-1">
            <p
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: theme.secondaryText }}
            >
              {defaultBrandConfig.name} Smart Hardware
            </p>
            <h3 className="text-lg sm:text-xl font-semibold" style={{ color: theme.primaryText }}>
              {activeVariant?.name || product.name}
            </h3>
          </div>
        </div>
      );
    }

    return (
      <CardPreview
        frontJson={previewTemplate?.frontCanvasJson}
        backJson={previewTemplate?.backCanvasJson}
        side={slide.type}
        allowFlip={false}
        cloudinaryWidth={800}
        alt={`${product.name} - ${slide.label}`}
        className={`rounded-2xl shadow-md transition-all duration-300 ${enlarged ? 'max-w-2xl mx-auto' : ''}`}
      />
    );
  };

  return (
    <div className="bg-[#F8F9FA] text-[#171717] font-body pb-24 lg:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#666666] mb-6 sm:mb-8">
          <Link to="/" className="hover:text-[#171717] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/nfc-cards" className="hover:text-[#171717] transition-colors">
            NFC Cards
          </Link>
          <span>/</span>
          <span className="text-[#171717] font-medium truncate">{product.name}</span>
        </nav>

        {/* Main 2-Column Product Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: PRODUCT GALLERY (~50%) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-[11px] font-medium text-[#52525B]">
                  <span>{activeSlide.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  aria-label="Enlarge product preview"
                  className="p-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-[#52525B] hover:text-[#171717] transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <div className="relative overflow-hidden py-2">
                {renderSlideVisual(activeSlide)}

                {/* Prev / Next Navigation */}
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Previous image"
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 border border-[#E5E7EB] shadow-sm flex items-center justify-center text-[#171717] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Next image"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 border border-[#E5E7EB] shadow-sm flex items-center justify-center text-[#171717] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {GALLERY_SLIDES.map((slide, idx) => {
                const isActive = idx === activeSlideIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`shrink-0 w-28 sm:w-32 rounded-xl border p-2 bg-white transition-all text-left ${isActive
                        ? 'border-[#FF6A00] ring-2 ring-[#FF6A00]/15'
                        : 'border-[#E5E7EB] hover:border-[#D4D4D8]'
                      }`}
                  >
                    <div className="pointer-events-none">{renderSlideVisual(slide)}</div>
                    <span className="block mt-1.5 text-[11px] font-medium text-center text-[#52525B]">
                      {slide.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: PRODUCT INFORMATION (~50%) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#FF6A00]">
                  {product.category || 'Classic NFC Cards'}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${isAvailable
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {isAvailable ? 'In Stock · Ready to Customize' : 'Currently Unavailable'}
                </span>
              </div>

              <h1 className="font-head text-2xl sm:text-3xl font-semibold text-[#171717] tracking-tight">
                {product.name}
              </h1>
              <p className="mt-3 text-sm text-[#52525B] leading-relaxed">{product.description}</p>
            </div>

            {/* Pricing */}
            <div className="pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-mono text-3xl font-bold text-[#171717]">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
                {originalPrice && (
                  <span className="font-mono text-base text-[#929292] line-through">
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercentage && (
                  <span className="px-2 py-0.5 rounded-md bg-[#FFF3E9] text-[#FF6A00] text-xs font-semibold">
                    {discountPercentage}% OFF
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-[#666666]">
                18% GST calculated at checkout · Free shipping on orders ₹2,000+ (₹99 standard)
              </p>
            </div>

            {/* Fixed Material & Color (Non-Editable) */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] text-xs font-medium text-[#171717]">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                  style={{ backgroundColor: (product as any).color || activeVariant?.color || '#000000' }}
                />
                <span>
                  Material:{' '}
                  <strong className="uppercase">{product.material || 'PVC'}</strong>
                </span>
                <span className="text-[#D4D4D8]">&bull;</span>
                <span>
                  Color:{' '}
                  <strong>{(product as any).colorName || activeVariant?.name || 'Black'}</strong>
                </span>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#52525B]">
                Quantity
              </span>
              <div className="inline-flex items-center rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-1">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#52525B] hover:bg-white hover:text-[#171717] transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-mono text-sm font-semibold text-[#171717]">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#52525B] hover:bg-white hover:text-[#171717] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Primary CTA */}
            <div className="pt-2 space-y-3">
              <Button
                type="button"
                disabled={!isAvailable}
                onClick={handleDesignYourCard}
                className="w-full h-12 rounded-xl bg-[#FF6A00] hover:bg-[#E85D00] text-white text-sm font-semibold tracking-wide gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>DESIGN THIS CARD</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-[11px] text-center text-[#666666]">
                No account required to design. Sign in only when you are ready to order.
              </p>
            </div>

            {/* Key Features */}
            <div className="pt-4 border-t border-[#E5E7EB] space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#52525B]">
                Key Features
              </h2>
              <ul className="space-y-2">
                {featuresList.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#171717]">
                    <Check className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Supporting Trust Info */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E5E7EB] text-center">
              <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
                <Smartphone className="w-4 h-4 text-[#FF6A00] mx-auto mb-1" />
                <p className="text-[11px] font-medium text-[#171717]">No App Needed</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
                <Truck className="w-4 h-4 text-[#FF6A00] mx-auto mb-1" />
                <p className="text-[11px] font-medium text-[#171717]">Pan-India Delivery</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
                <ShieldCheck className="w-4 h-4 text-[#FF6A00] mx-auto mb-1" />
                <p className="text-[11px] font-medium text-[#171717]">QR Backup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Why Choose This Card */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
            <h2 className="font-head text-lg sm:text-xl font-semibold text-[#171717] mb-4">
              Product Specifications
            </h2>
            <dl className="divide-y divide-[#E5E7EB]">
              {specRows.map((row) => (
                <div key={row.label} className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm">
                  <dt className="text-[#666666]">{row.label}</dt>
                  <dd className="font-medium text-[#171717] text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="font-head text-lg sm:text-xl font-semibold text-[#171717]">
              Why Choose This Card?
            </h2>
            <p className="text-sm text-[#52525B] leading-relaxed">
              Engineered for instant first impressions, {product.name} pairs a precision{' '}
              {activeVariant?.name || product.material || 'NFC'} finish with an embedded contactless
              chip and a custom-printed dynamic QR code so every tap or scan works reliably.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-1">
                <Layers className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-xs font-semibold text-[#171717]">Editable Anytime</h3>
                <p className="text-[11px] text-[#666666]">
                  Update your digital profile details anytime without reprinting your card.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-1">
                <Package className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-xs font-semibold text-[#171717]">Post-Purchase Setup</h3>
                <p className="text-[11px] text-[#666666]">
                  Design and order first, then link your digital profile once your order is placed.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* How It Works */}
        <section className="mt-12 bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#FF6A00]">
              HOW IT WORKS
            </span>
            <h2 className="font-head text-xl sm:text-2xl font-semibold text-[#171717] mt-1">
              From Card Selection to Live Contactless Sharing
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <div
                key={item.step}
                className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-2"
              >
                <span className="font-mono text-xs font-bold text-[#FF6A00]">{item.step}</span>
                <h3 className="text-sm font-semibold text-[#171717]">{item.title}</h3>
                <p className="text-xs text-[#666666] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#FF6A00]">
                  EXPLORE MORE
                </span>
                <h2 className="font-head text-xl sm:text-2xl font-semibold text-[#171717] mt-1">
                  Related NFC Smart Cards
                </h2>
              </div>
              <Link
                to="/nfc-cards"
                className="text-xs font-semibold text-[#FF6A00] hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((rel) => {
                const relPrice = rel.variants?.[0]?.price || rel.discountPrice || rel.basePrice;
                return (
                  <Link
                    key={rel.id}
                    to={`/nfc-cards/${encodeURIComponent(rel.slug || rel.id)}`}
                    className="group rounded-2xl bg-white border border-[#E5E7EB] p-5 hover:border-[#FF6A00]/50 transition-all shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#FF6A00]">
                        {rel.category || 'NFC Smart Card'}
                      </span>
                      <h3 className="font-head text-base font-semibold text-[#171717] mt-1 group-hover:text-[#FF6A00] transition-colors">
                        {rel.name}
                      </h3>
                      <p className="text-xs text-[#666666] mt-1.5 line-clamp-2">{rel.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-[#171717]">
                        ₹{relPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-[#FF6A00] inline-flex items-center gap-1">
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0">
          <p className="text-[11px] text-[#666666] truncate">{activeVariant?.name || product.name}</p>
          <p className="font-mono text-base font-bold text-[#171717]">
            ₹{(currentPrice * quantity).toLocaleString('en-IN')}
          </p>
        </div>
        <Button
          type="button"
          disabled={!isAvailable}
          onClick={handleDesignYourCard}
          className="flex-1 max-w-[240px] h-11 rounded-xl bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-semibold gap-1.5"
        >
          <span>Design This Card</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-8 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-head text-base font-semibold text-[#171717]">
                {product.name} — {activeSlide.label}
              </h3>
              <button
                type="button"
                aria-label="Close enlarged preview"
                onClick={() => setIsZoomOpen(false)}
                className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F8F9FA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderSlideVisual(activeSlide, true)}
          </div>
        </div>
      )}
    </div>
  );
}

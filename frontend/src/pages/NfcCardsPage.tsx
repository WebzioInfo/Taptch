import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { savePendingPurchaseIntent } from '../hooks/usePurchaseJourney';
import { CardPreview } from '../components/cards/CardPreview';
import { Button } from '../components/ui/button';
import {
  ArrowRight,
  Check,
  CreditCard,
  Eye,
  Layers,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Wifi,
} from 'lucide-react';

interface CardProductVariant {
  id: string;
  name: string;
  color: string;
  finish: string;
  price: number;
  imageUrl?: string;
}

interface CardProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category?: string;
  material?: 'pvc' | 'metal' | string;
  colorName?: string;
  color?: string;
  imageUrl?: string;
  basePrice: number;
  discountPrice?: number | null;
  variants?: CardProductVariant[];
}

const FALLBACK_PRODUCTS: CardProduct[] = [
  {
    id: 'prod_pvc_black',
    name: 'PVC NFC Card — Black',
    slug: 'pvc-nfc-card-black',
    category: 'PVC NFC Cards',
    material: 'pvc',
    colorName: 'Black',
    color: '#000000',
    imageUrl: '/products/pvc-black.svg',
    description:
      'Pure solid black ISO CR80 PVC contactless smart card with NXP NTAG213 chip and crisp white/gold custom typography.',
    basePrice: 1499,
    variants: [
      { id: 'var_pvc_black', name: 'Black', color: '#000000', finish: 'solid-matte', price: 1499, imageUrl: '/products/pvc-black.svg' },
    ],
  },
  {
    id: 'prod_pvc_white',
    name: 'PVC NFC Card — White',
    slug: 'pvc-nfc-card-white',
    category: 'PVC NFC Cards',
    material: 'pvc',
    colorName: 'White',
    color: '#FFFFFF',
    imageUrl: '/products/pvc-white.svg',
    description:
      'Pure solid white ISO CR80 PVC contactless smart card with NXP NTAG213 chip and high-contrast dark typography.',
    basePrice: 1499,
    variants: [
      { id: 'var_pvc_white', name: 'White', color: '#FFFFFF', finish: 'solid-matte', price: 1499, imageUrl: '/products/pvc-white.svg' },
    ],
  },
  {
    id: 'prod_metal_black',
    name: 'Metal NFC Card — Black',
    slug: 'metal-nfc-card-black',
    category: 'Metal NFC Cards',
    material: 'metal',
    colorName: 'Black',
    color: '#000000',
    imageUrl: '/products/metal-black.svg',
    description:
      'Precision-crafted solid black metal contactless smart card with anti-metal shielding, NTAG213 chip, and white/gold typography.',
    basePrice: 2499,
    variants: [
      { id: 'var_metal_black', name: 'Black', color: '#000000', finish: 'anodized-matte', price: 2499, imageUrl: '/products/metal-black.svg' },
    ],
  },
  {
    id: 'prod_metal_silver',
    name: 'Metal NFC Card — Silver',
    slug: 'metal-nfc-card-silver',
    category: 'Metal NFC Cards',
    material: 'metal',
    colorName: 'Silver',
    color: '#C0C0C0',
    imageUrl: '/products/metal-silver.svg',
    description:
      'Precision-crafted solid silver metal contactless smart card with anti-metal shielding, NTAG213 chip, and dark silver typography.',
    basePrice: 2499,
    variants: [
      { id: 'var_metal_silver', name: 'Silver', color: '#C0C0C0', finish: 'solid-silver', price: 2499, imageUrl: '/products/metal-silver.svg' },
    ],
  },
  {
    id: 'prod_metal_gold',
    name: 'Metal NFC Card — Gold',
    slug: 'metal-nfc-card-gold',
    category: 'Metal NFC Cards',
    material: 'metal',
    colorName: 'Gold',
    color: '#D4AF37',
    imageUrl: '/products/metal-gold.svg',
    description:
      'Precision-crafted solid gold metal contactless smart card with anti-metal shielding, NTAG213 chip, and deep gold/black typography.',
    basePrice: 2499,
    variants: [
      { id: 'var_metal_gold', name: 'Gold', color: '#D4AF37', finish: 'solid-gold', price: 2499, imageUrl: '/products/metal-gold.svg' },
    ],
  },
  {
    id: 'prod_metal_rose_gold',
    name: 'Metal NFC Card — Rose Gold',
    slug: 'metal-nfc-card-rose-gold',
    category: 'Metal NFC Cards',
    material: 'metal',
    colorName: 'Rose Gold',
    color: '#B76E79',
    imageUrl: '/products/metal-rose-gold.svg',
    description:
      'Precision-crafted solid rose gold metal contactless smart card with anti-metal shielding, NTAG213 chip, and crisp white/dark typography.',
    basePrice: 2499,
    variants: [
      { id: 'var_metal_rose_gold', name: 'Rose Gold', color: '#B76E79', finish: 'solid-rose-gold', price: 2499, imageUrl: '/products/metal-rose-gold.svg' },
    ],
  },
];

export function NfcCardsPage() {
  const navigate = useNavigate();

  const { data: productsData } = useQuery<CardProduct[]>({
    queryKey: ['public', 'products'],
    queryFn: () => ApiClient.get<CardProduct[]>('/api/v1/products'),
  });

  const products = productsData && productsData.length > 0 ? productsData : FALLBACK_PRODUCTS;

  const { data: defaultTemplates = [] } = useQuery<any[]>({
    queryKey: ['public', 'card-templates', 'prod_pvc_black'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/products/prod_pvc_black/templates'),
  });

  const handleDesignCard = (product: CardProduct) => {
    const variants =
      product.variants && product.variants.length > 0
        ? product.variants
        : FALLBACK_PRODUCTS.find((f) => f.id === product.id)?.variants || [];
    const variantId = variants[0]?.id || '';
    const templateId = defaultTemplates[0]?.id || 'tpl_executive_obsidian';

    savePendingPurchaseIntent({
      selectedProductId: product.id,
      selectedVariantId: variantId || null,
      selectedCardTemplateId: templateId,
      quantity: 1,
      source: 'nfc_cards_catalog',
    });

    const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
    navigate(`/studio/${encodeURIComponent(product.id)}${qs}`);
  };

  const pvcProducts = products.filter(
    (p) => (p.material || '').toLowerCase() !== 'metal' && !p.slug?.includes('metal'),
  );
  const metalProducts = products.filter(
    (p) => (p.material || '').toLowerCase() === 'metal' || p.slug?.includes('metal'),
  );

  const renderProductCard = (product: CardProduct) => {
    const fallbackMatch = FALLBACK_PRODUCTS.find((f) => f.id === product.id);
    const defaultVariant = product.variants?.[0] || fallbackMatch?.variants?.[0];
    const displayPrice = product.discountPrice ?? product.basePrice ?? defaultVariant?.price ?? 1499;
    const productImage = product.imageUrl || defaultVariant?.imageUrl || '/products/pvc-black.svg';
    const colorHex = product.color || defaultVariant?.color || '#000000';
    const colorLabel = product.colorName || defaultVariant?.name || 'Black';
    const materialLabel = (product.material || (product.slug?.includes('metal') ? 'metal' : 'pvc')).toUpperCase();

    return (
      <div
        key={product.id}
        className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-[#FF6A00]/40 transition-all"
      >
        <div>
          <Link
            to={`/nfc-cards/${encodeURIComponent(product.slug || product.id)}`}
            className="block mb-4 rounded-xl overflow-hidden border border-[var(--border)] bg-[#F8F9FA] aspect-[1.586/1]"
          >
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </Link>

          <div className="mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#FF6A00]">
                {product.category || (materialLabel === 'METAL' ? 'Metal NFC Cards' : 'PVC NFC Cards')}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--ink-muted)] px-1.5 py-0.5 rounded bg-[#F8F9FA] border border-[var(--border)]">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                  style={{ backgroundColor: colorHex }}
                />
                <span>{materialLabel} &middot; {colorLabel}</span>
              </span>
            </div>

            <div className="flex items-start justify-between gap-2 mt-1.5">
              <Link
                to={`/nfc-cards/${encodeURIComponent(product.slug || product.id)}`}
                className="font-head text-lg font-semibold text-[var(--ink)] leading-snug hover:text-[#FF6A00] transition-colors"
              >
                {product.name}
              </Link>
              <div className="text-right shrink-0">
                <span className="font-mono text-base font-bold text-[#FF6A00] block">
                  ₹{displayPrice.toLocaleString('en-IN')}
                </span>
                {product.discountPrice != null && product.basePrice > displayPrice && (
                  <span className="font-mono text-[11px] text-[var(--ink-muted)] line-through">
                    ₹{product.basePrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--ink-muted)] leading-relaxed mb-4">
            {product.description}
          </p>
        </div>

        <div className="pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-2.5">
          <Link to={`/nfc-cards/${encodeURIComponent(product.slug || product.id)}`} className="w-full">
            <Button
              variant="outline"
              className="w-full text-xs font-medium gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>View Details</span>
            </Button>
          </Link>
          <Button
            variant="accent"
            onClick={() => handleDesignCard(product)}
            className="text-xs font-semibold gap-1.5 bg-[#FF6A00] hover:bg-[#E85D00] text-white"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Design This Card</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="py-12 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[var(--bg-page)] text-[var(--ink)] font-body">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[#FF6A00]">
          NFC SMART HARDWARE
        </span>
        <h1 className="font-head text-3xl sm:text-5xl font-medium text-[var(--ink)] tracking-tight mt-2">
          Precision-Crafted NFC Smart Cards
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed">
          Tap any smartphone to instantly share your digital profile, capture leads, and showcase your brand. Explore finishes, preview front &amp; back designs, and start your order.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--ink-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>NTAG213 Dual-Read Chip</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Works on iOS &amp; Android (No App)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Dynamic QR Backup</span>
          </span>
        </div>
      </div>

      {/* Two-Category Six-Product Catalog */}
      <div className="space-y-12 max-w-5xl mx-auto">
        {pvcProducts.length > 0 && (
          <section aria-labelledby="pvc-nfc-heading">
            <div className="flex items-baseline justify-between mb-5 border-b border-[var(--border)] pb-3">
              <div>
                <h2 id="pvc-nfc-heading" className="font-head text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                  PVC NFC Cards
                </h2>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  Pure solid-color waterproof ISO CR80 PVC smart cards.
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-[#FF6A00]">
                {pvcProducts.length} {pvcProducts.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {pvcProducts.map(renderProductCard)}
            </div>
          </section>
        )}

        {metalProducts.length > 0 && (
          <section aria-labelledby="metal-nfc-heading">
            <div className="flex items-baseline justify-between mb-5 border-b border-[var(--border)] pb-3">
              <div>
                <h2 id="metal-nfc-heading" className="font-head text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                  Metal NFC Cards
                </h2>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  Heavyweight precision-crafted solid metal smart cards with anti-metal shielding.
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-[#FF6A00]">
                {metalProducts.length} {metalProducts.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {metalProducts.map(renderProductCard)}
            </div>
          </section>
        )}
      </div>

      {/* Personal vs Business Use Cases */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FFF3E9] text-[#FF6A00] text-[11px] font-semibold">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Personal Account</span>
          </div>
          <h3 className="font-head text-xl font-medium text-[var(--ink)]">
            For Founders, Creators &amp; Professionals
          </h3>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            Includes 1 personalized digital profile, 1 active luxury template, and 1 custom NFC smart card with instant vCard contact saving.
          </p>
          <ul className="space-y-1.5 text-xs text-[var(--ink)] pt-1">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#16A36A]" />
              <span>1 Digital Profile + 1 NFC Smart Card</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#16A36A]" />
              <span>Instant theme switching without losing data</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FFF3E9] text-[#FF6A00] text-[11px] font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Business Account</span>
          </div>
          <h3 className="font-head text-xl font-medium text-[var(--ink)]">
            For Teams, Agencies &amp; Enterprises
          </h3>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            Create independent digital profiles for every team member, pair each NFC card to its respective profile, and order in bulk or individually.
          </p>
          <ul className="space-y-1.5 text-xs text-[var(--ink)] pt-1">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#16A36A]" />
              <span>Multiple independent profiles &amp; templates</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#16A36A]" />
              <span>1-to-1 card-to-profile mapping &amp; multi-card orders</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

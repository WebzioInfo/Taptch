import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { savePendingPurchaseIntent } from '../hooks/usePurchaseJourney';
import { useSession } from '../lib/auth/client';
import { Button } from '../components/ui/button';
import {
  ArrowUpDown,
  Eye,
  Plus,
  Search,
  Sparkles,
  X,
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
  isActive?: boolean;
  variants?: CardProductVariant[];
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

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
    isActive: true,
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
    isActive: true,
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
    isActive: true,
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
    isActive: true,
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
    isActive: true,
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
    isActive: true,
    variants: [
      { id: 'var_metal_rose_gold', name: 'Rose Gold', color: '#B76E79', finish: 'solid-rose-gold', price: 2499, imageUrl: '/products/metal-rose-gold.svg' },
    ],
  },
];

function resolveProductCategory(product: CardProduct): string {
  if (product.category && product.category.trim()) return product.category.trim();
  const mat = (product.material || '').toLowerCase();
  if (mat === 'metal' || product.slug?.includes('metal')) return 'Metal NFC Cards';
  return 'PVC NFC Cards';
}

function getEffectivePrice(product: CardProduct): number {
  const fallbackMatch = FALLBACK_PRODUCTS.find((f) => f.id === product.id);
  const defaultVariant = product.variants?.[0] || fallbackMatch?.variants?.[0];
  return product.discountPrice ?? product.basePrice ?? defaultVariant?.price ?? 1499;
}

export function NfcCardsPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.systemRole === 'admin' || session?.user?.systemRole === 'superadmin';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Cards');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const { data: productsData } = useQuery<CardProduct[]>({
    queryKey: ['public', 'products'],
    queryFn: () => ApiClient.get<CardProduct[]>('/api/v1/products'),
  });

  const products = productsData && productsData.length > 0 ? productsData : FALLBACK_PRODUCTS;

  const { data: defaultTemplates = [] } = useQuery<any[]>({
    queryKey: ['public', 'card-templates', 'prod_pvc_black'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/products/prod_pvc_black/templates'),
  });

  const categories = useMemo(() => {
    const found = new Set<string>();
    for (const p of products) {
      found.add(resolveProductCategory(p));
    }
    return ['All Cards', ...Array.from(found)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      const cat = resolveProductCategory(p);
      if (selectedCategory !== 'All Cards' && cat !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        (p.colorName || '').toLowerCase().includes(q) ||
        (p.material || '').toLowerCase().includes(q)
      );
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    }
    if (sortBy === 'name-asc') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, searchQuery, selectedCategory, sortBy]);

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

  return (
    <div className="w-full min-h-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 bg-[var(--bg-page)] text-[var(--ink)] font-body space-y-5">
      {/* Compact Full-Width Marketplace Header */}
      <header className="flex flex-col gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="font-head text-xl sm:text-2xl font-semibold text-[var(--ink)] tracking-tight">
                NFC Card Catalogue
              </h1>
              <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF3E9] text-[#FF6A00] border border-[#FF6A00]/20">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-0.5">
              Select a card finish to preview specifications or customize it in the Design Studio.
            </p>
          </div>

          {/* Search, Sort & Optional Admin Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards..."
                aria-label="Search NFC cards"
                className="w-full pl-8 pr-7 py-2 text-xs rounded-lg border border-[var(--border)] bg-white text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[#FF6A00]"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 text-[var(--ink-muted)] pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort products"
                className="pl-7 pr-7 py-2 text-xs font-medium rounded-lg border border-[var(--border)] bg-white text-[var(--ink)] focus:outline-none focus:border-[#FF6A00] cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>

            {isAdmin && (
              <Link to="/admin">
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-semibold gap-1.5 h-9 px-3 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Product</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Category Filter Bar */}
        <nav aria-label="Product categories" className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                  active
                    ? 'bg-[#FF6A00] text-white border-[#FF6A00]'
                    : 'bg-white text-[var(--ink-muted)] border-[var(--border)] hover:text-[var(--ink)] hover:border-[#D4D4D8]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Product Grid — Min 4 columns on desktop (5–6 on xl/2xl), 3 on tablet, 2 on mobile */}
      {filteredProducts.length === 0 ? (
        <div className="w-full py-14 px-4 rounded-xl border border-dashed border-[var(--border)] bg-white text-center space-y-3">
          <p className="text-sm font-medium text-[var(--ink)]">
            No NFC cards match your current filters.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All Cards');
              setSortBy('featured');
            }}
            className="text-xs"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <section
          aria-label="NFC Card Products"
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5"
        >
          {filteredProducts.map((product) => {
            const fallbackMatch = FALLBACK_PRODUCTS.find((f) => f.id === product.id);
            const defaultVariant = product.variants?.[0] || fallbackMatch?.variants?.[0];
            const displayPrice = getEffectivePrice(product);
            const productImage = product.imageUrl || defaultVariant?.imageUrl || '/products/pvc-black.svg';
            const colorHex = product.color || defaultVariant?.color || '#000000';
            const colorLabel = product.colorName || defaultVariant?.name || 'Black';
            const categoryLabel = resolveProductCategory(product);
            const materialLabel = (
              product.material || (product.slug?.includes('metal') ? 'metal' : 'pvc')
            ).toUpperCase();
            const isAvailable = product.isActive !== false;

            return (
              <article
                key={product.id}
                className="group rounded-xl bg-white border border-[var(--border)] p-3 sm:p-3.5 flex flex-col justify-between h-full shadow-xs hover:shadow-md hover:border-[#FF6A00]/50 transition-all duration-150"
              >
                <div className="min-w-0">
                  <Link
                    to={`/nfc-cards/${encodeURIComponent(product.slug || product.id)}`}
                    className="block mb-3 rounded-lg overflow-hidden border border-[var(--border)] bg-[#F8F9FA] aspect-[1.586/1]"
                  >
                    <img
                      src={productImage}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  </Link>

                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#FF6A00] truncate">
                      {categoryLabel}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}
                    >
                      {isAvailable ? 'In Stock' : 'Unavailable'}
                    </span>
                  </div>

                  <Link
                    to={`/nfc-cards/${encodeURIComponent(product.slug || product.id)}`}
                    className="font-head text-sm sm:text-[15px] font-semibold text-[var(--ink)] leading-snug hover:text-[#FF6A00] transition-colors line-clamp-1 block"
                  >
                    {product.name}
                  </Link>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--ink-muted)] truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: colorHex }}
                      />
                      <span className="truncate">
                        {materialLabel} &middot; {colorLabel}
                      </span>
                    </span>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-bold text-[#FF6A00]">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                      {product.discountPrice != null && product.basePrice > displayPrice && (
                        <span className="ml-1 font-mono text-[10px] text-[var(--ink-muted)] line-through">
                          ₹{product.basePrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed mt-2 line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <Link
                    to={`/nfc-cards/${encodeURIComponent(product.slug || product.id)}`}
                    className="w-full"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-8 px-2 text-[11px] font-medium gap-1 rounded-lg"
                    >
                      <Eye className="w-3 h-3 text-[#FF6A00] shrink-0" />
                      <span className="truncate">View Details</span>
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="accent"
                    onClick={() => handleDesignCard(product)}
                    className="w-full h-8 px-2 text-[11px] font-semibold gap-1 rounded-lg bg-[#FF6A00] hover:bg-[#E85D00] text-white"
                  >
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span className="truncate">Customize</span>
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

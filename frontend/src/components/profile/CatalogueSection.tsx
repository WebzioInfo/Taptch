import React from 'react';
import { Send, ExternalLink, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safeTrim } from '@/lib/data-normalization';

export interface CatalogueItemData {
  id?: string;
  title: string;
  itemType?: 'product' | 'service' | string | null;
  type?: 'product' | 'service' | string | null;
  description?: string | null;
  price?: string | null;
  currency?: string | null;
  imageUrl?: string | null;
  actionUrl?: string | null;
}

export interface CatalogueSectionProps {
  catalogue?: CatalogueItemData[] | null;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onOpenExchange?: (initialNote?: string) => void;
  className?: string;
  themeStyle?: {
    accentColor?: string;
    cardBg?: string;
    borderColor?: string;
    textColor?: string;
    headingColor?: string;
    btnBg?: string;
    btnText?: string;
  };
  variant?:
    | 'obsidian'
    | 'corporate'
    | 'dark'
    | 'soft'
    | 'editorial'
    | 'industrial'
    | 'modern'
    | 'ivory'
    | 'retail'
    | 'restaurant'
    | 'creative'
    | 'apex';
}

export function CatalogueSection({
  catalogue,
  title = 'Products & Services',
  subtitle = 'Explore our commercial offerings, services, and solutions',
  actionLabel = 'Request a Quote',
  onOpenExchange,
  className = '',
  themeStyle,
  variant = 'obsidian',
}: CatalogueSectionProps) {
  const activeItems = (catalogue || [])
    .map((c, idx) => ({
      id: c.id || `cat-${idx}`,
      title: safeTrim(c.title),
      itemType: (c.itemType || c.type || 'product').toLowerCase() === 'service' ? 'Service' : 'Product',
      description: safeTrim(c.description),
      price: safeTrim(c.price),
      currency: safeTrim(c.currency, '₹'),
      imageUrl: safeTrim(c.imageUrl),
      actionUrl: safeTrim(c.actionUrl),
    }))
    .filter((c) => Boolean(c.title));

  if (activeItems.length === 0) {
    return null;
  }

  const accent = themeStyle?.accentColor || (variant === 'editorial' ? '#000000' : '#D4AF37');
  const cardBg = themeStyle?.cardBg || '#121216';
  const border = themeStyle?.borderColor || 'rgba(255, 255, 255, 0.12)';
  const text = themeStyle?.textColor || '#EDEDED';
  const heading = themeStyle?.headingColor || '#FFFFFF';
  const btnBg = themeStyle?.btnBg || accent;
  const btnText = themeStyle?.btnText || '#0A0A0C';

  if (variant === 'editorial') {
    return (
      <section className={`index-section ${className}`} aria-labelledby="catalogue-editorial-title">
        <div className="index-header" style={{ marginBottom: '12px' }}>
          <div className="flex items-center justify-between">
            <h2 id="catalogue-editorial-title" className="index-title font-mono font-bold text-xs uppercase tracking-widest text-black">
              {title.toUpperCase()}
            </h2>
            <span className="font-mono text-[10px] font-bold border border-black px-1.5 py-0.5">
              [ {activeItems.length < 10 ? `0${activeItems.length}` : activeItems.length} ITEMS ]
            </span>
          </div>
          {subtitle && (
            <p className="font-mono text-[10px] text-neutral-600 mt-1 uppercase">
              {subtitle}
            </p>
          )}
        </div>
        <div className="border border-black divide-y divide-black font-mono w-full">
          {activeItems.map((item, idx) => (
            <div key={item.id} className="p-4 bg-white space-y-3 w-full">
              {/* TOP ROW: Type on Left, Price on Right */}
              <div className="flex items-start justify-between gap-3 w-full">
                <span className="text-[9px] uppercase font-bold bg-black text-white px-2 py-0.5 shrink-0">
                  [ {item.itemType} #{idx + 1} ]
                </span>
                {item.price && (
                  <span className="font-bold text-xs sm:text-sm text-black text-right shrink-0 break-all">
                    {item.currency} {item.price}
                  </span>
                )}
              </div>

              {/* MIDDLE: Title & Description */}
              <div className="space-y-1 w-full">
                <h3 className="font-bold text-sm text-black uppercase tracking-tight break-words">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs text-neutral-700 leading-relaxed break-words font-sans">
                    {item.description}
                  </p>
                )}
              </div>

              {/* IMAGE: Only if provided */}
              {item.imageUrl && (
                <div className="w-full h-44 rounded overflow-hidden border border-black bg-neutral-100">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* BOTTOM: Action Buttons */}
              <div className="pt-2 border-t border-black/15 flex items-center justify-between gap-2 text-xs">
                {onOpenExchange ? (
                  <button
                    type="button"
                    onClick={() => onOpenExchange(`Inquiry regarding: ${item.title}`)}
                    className="font-bold underline text-black hover:opacity-75 uppercase"
                  >
                    [ {actionLabel.toUpperCase()} &rarr; ]
                  </button>
                ) : (
                  <span className="font-bold uppercase text-black">[ {item.title} ]</span>
                )}
                {item.actionUrl && (
                  <a
                    href={item.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-neutral-600 hover:text-black uppercase underline text-[11px] shrink-0"
                  >
                    [ DETAILS ]
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className={`space-y-4 w-full ${className}`}>
      <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: border }}>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: heading }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />
            <span>{title}</span>
          </h2>
          {subtitle && (
            <p className="text-[11px] opacity-70 mt-0.5 line-clamp-1" style={{ color: text }}>
              {subtitle}
            </p>
          )}
        </div>
        <span
          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0"
          style={{ borderColor: border, color: accent }}
        >
          {activeItems.length} {activeItems.length === 1 ? 'Offering' : 'Offerings'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full">
        {activeItems.map((item) => (
          <div
            key={item.id}
            className="w-full rounded-2xl border p-4 sm:p-5 flex flex-col justify-between space-y-3.5 shadow-md transition-all hover:scale-[1.005]"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${border}`,
              color: text,
            }}
          >
            {/* TOP ROW: Type on Left, Price on Right (Safe Flex with Gap) */}
            <div className="flex items-start justify-between gap-3 w-full">
              <span
                className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md border shrink-0"
                style={{
                  backgroundColor: `${accent}15`,
                  borderColor: `${accent}30`,
                  color: accent,
                }}
              >
                {item.itemType}
              </span>
              {item.price && (
                <span
                  className="font-mono text-xs sm:text-sm font-bold text-right shrink-0 break-all"
                  style={{ color: heading }}
                >
                  {item.currency} {item.price}
                </span>
              )}
            </div>

            {/* MIDDLE: Title & Description */}
            <div className="space-y-1 w-full">
              <h3 className="font-bold text-sm sm:text-base leading-snug break-words" style={{ color: heading }}>
                {item.title}
              </h3>
              {item.description && (
                <p className="text-xs leading-relaxed opacity-80 break-words pt-0.5" style={{ color: text }}>
                  {item.description}
                </p>
              )}
            </div>

            {/* IMAGE: Only displayed when a valid URL is present, cleanly constrained */}
            {item.imageUrl && (
              <div
                className="w-full h-44 sm:h-48 rounded-xl overflow-hidden border relative bg-black/40"
                style={{ borderColor: border }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* BOTTOM: Action Button */}
            <div className="pt-2 border-t flex items-center gap-2 w-full" style={{ borderColor: `${border}66` }}>
              <Button
                size="sm"
                onClick={() => onOpenExchange && onOpenExchange(`Inquiry regarding: ${item.title}`)}
                className="flex-1 text-xs h-9 font-bold gap-1.5 shadow-sm"
                style={{ backgroundColor: btnBg, color: btnText }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{actionLabel}</span>
              </Button>
              {item.actionUrl && (
                <a href={item.actionUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs border"
                    style={{ borderColor: border, backgroundColor: 'rgba(255,255,255,0.04)', color: text }}
                    title="View Online"
                  >
                    <ExternalLink className="w-3.5 h-3.5" style={{ color: accent }} />
                  </Button>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

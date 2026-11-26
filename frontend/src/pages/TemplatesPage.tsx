import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { TemplatePreviewModal } from '../components/templates/TemplatePreviewModal';
import { STANDARD_TEMPLATES } from '../modules/templates/constants';
import { useSession } from '../lib/auth/client';
import { startPurchaseJourney } from '../hooks/usePurchaseJourney';
import {
  Eye,
  Search,
  Filter,
  ArrowRight,
  Smartphone,
} from 'lucide-react';

export function TemplatesPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user?.id);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const { data: serverTemplates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/templates'),
  });

  // Merge server metadata with standard rich templates
  const allTemplates = STANDARD_TEMPLATES.map((st) => {
    const srv = serverTemplates.find((s) => s.id === st.id || s.slug === st.slug);
    return {
      ...st,
      ...(srv || {}),
    };
  });

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'personal', label: 'Luxury & Executive' },
    { id: 'corporate', label: 'Corporate & Finance' },
    { id: 'creative', label: 'Creative & Agency' },
    { id: 'business', label: 'Commercial' },
    { id: 'retail', label: 'Retail & Storefront' },
    { id: 'food', label: 'Culinary & Dining' },
    { id: 'industrial', label: 'Industrial & B2B' },
  ];

  const filteredTemplates = allTemplates.filter((t) => {
    const matchesCat =
      selectedCategory === 'all' ||
      t.category === selectedCategory ||
      (selectedCategory === 'personal' && (t.category === 'luxury' || t.category === 'personal'));
    const matchesSearch =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.features && t.features.some((f: string) => f.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCat && matchesSearch;
  });

  const handleUseTemplate = (templateId: string) => {
    if (isAuthenticated) {
      navigate(`/profile-setup?template=${encodeURIComponent(templateId)}`);
    } else {
      navigate('/nfc-cards');
    }
  };

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[var(--bg-page)] text-[var(--ink)] font-body">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--accent-text)]">
          CURATED ARCHITECTURE
        </span>
        <h1 className="font-head text-3xl sm:text-5xl font-medium text-[var(--ink)] tracking-tight mt-2">
          Luxury Themes for Every Ambition
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed">
          Switch themes with one click. Your contact details, catalogues, social links, and enquiries are automatically preserved across all styles.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates by industry, style, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
          />
        </div>

        {/* Category Filters */}
        <div className="mt-6 flex items-center justify-start sm:justify-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
      className={`whitespace-nowrap px-3.5 py-1.5 rounded-[var(--radius-sm)] font-mono text-[11px] transition-colors ${selectedCategory === c.id
          ? 'bg-[var(--ink)] text-[var(--bg-page)] font-medium shadow-none'
          : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)]'
        }`}
            >
      {c.label}
    </button>
  ))
}
        </div >
      </div >

      {/* Templates Grid */ }
      < div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" >
      {
        filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="group rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden hover:border-[var(--border-strong)] transition-colors flex flex-col justify-between shadow-none"
          >
            {/* Visual Cover Preview */}
            <div className="relative aspect-[16/10] overflow-hidden bg-black/60 border-b border-[var(--border)]">
              <img
                src={t.thumbnailUrl}
                alt={t.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-black/30" />

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider">
                <span className="px-2 py-0.5 rounded-[var(--radius-sm)] bg-black/80 border border-white/20 text-white font-medium">
                  {t.category}
                </span>
                <span className="px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-ink)] font-medium">
                  {t.requiredPlanId ? `${t.requiredPlanId.toUpperCase()} PLAN` : 'INCLUDED'}
                </span>
              </div>

              {/* Quick Preview Hover Pill */}
              <button
                type="button"
                onClick={() => setPreviewTemplateId(t.id)}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
              >
                <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] text-[var(--ink)] font-medium text-xs shadow-md">
                  <Smartphone className="w-4 h-4 text-[var(--accent-text)]" />
                  <span>Preview Theme</span>
                </div>
              </button>
            </div>

            {/* Template Information */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-head text-lg font-medium text-[var(--ink)] group-hover:text-[var(--accent-text)] transition-colors">
                  {t.name}
                </h3>
                <p className="mt-1.5 text-xs text-[var(--ink-muted)] leading-relaxed line-clamp-2">
                  {t.description}
                </p>

                {/* Features Pills */}
                {t.features && (
                  <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-[10px]">
                    {t.features.slice(0, 3).map((f: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--ink-muted)] font-medium"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => setPreviewTemplateId(t.id)}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-9 gap-1.5 rounded-[var(--radius-sm)]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => handleUseTemplate(t.id)}
                  variant="accent"
                  size="sm"
                  className="w-full text-xs h-9 gap-1.5 rounded-[var(--radius-sm)] shadow-none"
                >
                  <span>Select</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))
      }
      </div >

      {
        filteredTemplates.length === 0 && (
          <div className="text-center py-16 bg-[var(--bg-surface)] rounded-[var(--radius-md)] border border-[var(--border)] max-w-md mx-auto">
            <Filter className="w-8 h-8 text-[var(--ink-muted)] mx-auto mb-3" />
            <h3 className="font-head text-base font-medium text-[var(--ink)]">No matching themes found</h3>
            <p className="font-body text-xs text-[var(--ink-muted)] mt-1">
              Try adjusting your search query or category filter.
            </p>
            <Button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              variant="outline"
              size="sm"
              className="mt-4 text-xs rounded-[var(--radius-sm)]"
            >
              Clear Filters
            </Button>
          </div>
        )
      }

  {/* Interactive Smartphone Preview Modal */ }
  {
        previewTemplateId && (
        <TemplatePreviewModal
          isOpen={Boolean(previewTemplateId)}
          onClose={() => setPreviewTemplateId(null)}
          initialTemplateId={previewTemplateId}
          onSelectTemplate={(tplId) => {
            setPreviewTemplateId(null);
            handleUseTemplate(tplId);
          }}
        />
      )
  }
    </div >
  );
}

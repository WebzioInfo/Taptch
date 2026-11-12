import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { TemplatePreviewModal } from '../components/templates/TemplatePreviewModal';
import { STANDARD_TEMPLATES } from '../modules/templates/constants';
import {
  Sparkles,
  Eye,
  Check,
  Search,
  Filter,
  ArrowRight,
  Smartphone,
  Shield,
  Layers,
} from 'lucide-react';

export function TemplatesPage() {
  const navigate = useNavigate();
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
    navigate(`/register?template=${encodeURIComponent(templateId)}`);
  };

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Bespoke Digital Identity Studio</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Luxury Themes for Every Industry
        </h1>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Switch themes with one click. Your contact details, catalogues, social links, and enquiries are automatically preserved across all styles.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates by industry, style, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121216] border border-border/60 text-white placeholder:text-muted-foreground text-xs focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Category Filters (Mobile Horizontal Scrollable) */}
        <div className="mt-6 flex items-center justify-start sm:justify-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === c.id
                  ? 'bg-primary text-black font-semibold shadow-md'
                  : 'bg-[#121216] border border-border/50 text-muted-foreground hover:text-white hover:border-border'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid (Mobile-First: 1 col on mobile, 2 col on tablet, 3 col on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="group rounded-3xl bg-[#121216] border border-border/60 overflow-hidden hover:border-primary/50 transition-all flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-primary/5"
          >
            {/* Visual Cover Preview */}
            <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900 border-b border-border/30">
              <img
                src={t.thumbnailUrl}
                alt={t.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-black/30" />

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md border border-white/10 text-white">
                  {t.category}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 backdrop-blur-md border border-primary/40 text-primary">
                  {t.requiredPlanId ? `${t.requiredPlanId} plan` : 'Included'}
                </span>
              </div>

              {/* Quick Preview Hover Pill */}
              <button
                type="button"
                onClick={() => setPreviewTemplateId(t.id)}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs"
              >
                <div className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span>Interactive Smartphone Preview</span>
                </div>
              </button>
            </div>

            {/* Template Information */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                  {t.name}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {t.description}
                </p>

                {/* Features Pills */}
                {t.features && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {t.features.slice(0, 3).map((f: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-neutral-300 font-medium"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-border/40 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => setPreviewTemplateId(t.id)}
                  variant="outline"
                  className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10 font-semibold rounded-xl text-xs h-10 gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => handleUseTemplate(t.id)}
                  className="w-full bg-primary hover:bg-primary-hover text-black font-bold rounded-xl text-xs h-10 gap-1.5 shadow-md"
                >
                  <span>Select</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-20 bg-[#121216] rounded-3xl border border-border/40 max-w-md mx-auto">
          <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No matching templates found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search query or category filter.
          </p>
          <Button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            variant="outline"
            className="mt-4 text-xs rounded-xl"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Interactive Smartphone Preview Modal */}
      {previewTemplateId && (
        <TemplatePreviewModal
          isOpen={Boolean(previewTemplateId)}
          onClose={() => setPreviewTemplateId(null)}
          initialTemplateId={previewTemplateId}
          onSelectTemplate={(tplId) => {
            setPreviewTemplateId(null);
            handleUseTemplate(tplId);
          }}
        />
      )}
    </div>
  );
}

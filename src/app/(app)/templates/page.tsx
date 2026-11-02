'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Smartphone, Monitor, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { defaultBrandConfig } from '@/config/brand';
import type { Template } from '@/modules/templates';

const CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'personal', label: 'Personal & Executives' },
  { id: 'business', label: 'Business & Commercial' },
  { id: 'corporate', label: 'Corporate & Consulting' },
  { id: 'creative', label: 'Creators & Artists' },
  { id: 'real-estate', label: 'Real Estate & Wealth' },
];

const PLAN_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'gold' | 'outline' }> = {
  nano: { label: 'Free (Nano)', variant: 'secondary' },
  micro: { label: 'Micro Plan', variant: 'outline' },
  mini: { label: 'Mini Plan', variant: 'outline' },
  max: { label: 'Max Plan', variant: 'gold' },
};

export default function TemplateMarketplacePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProfileType, setSelectedProfileType] = useState<'all' | 'personal' | 'business'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  useEffect(() => {
    async function fetchTemplates() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/v1/templates');
        const json = await res.json();
        if (json.data) {
          setTemplates(json.data);
        }
      } catch (err) {
        console.error('Failed to load templates', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchCategory =
        selectedCategory === 'all' || t.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchType =
        selectedProfileType === 'all' ||
        (Array.isArray(t.supportedProfileTypes) &&
          t.supportedProfileTypes.includes(selectedProfileType));
      const matchSearch =
        searchQuery.trim() === '' ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchType && matchSearch;
    });
  }, [templates, selectedCategory, selectedProfileType, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Banner */}
      <section className="border-b border-border/40 bg-card/40 backdrop-blur-md pt-12 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="gold" className="mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Curated Design Gallery
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Select Your Digital Identity Template
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from high-conversion, responsive digital profile designs powered by {defaultBrandConfig.name}.
            Switch templates anytime without losing your profile data or multiple businesses.
          </p>

          {/* Search & Mode Toggles */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search templates by style, purpose, or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-card/60 border-border/80 rounded-xl"
              />
            </div>
            <div className="flex bg-muted p-1 rounded-xl w-full sm:w-auto border border-border/60">
              <button
                type="button"
                onClick={() => setSelectedProfileType('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedProfileType === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Modes
              </button>
              <button
                type="button"
                onClick={() => setSelectedProfileType('personal')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedProfileType === 'personal'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => setSelectedProfileType('business')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedProfileType === 'business'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Business
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gold/15 text-gold border-gold/40 shadow-sm'
                    : 'bg-card/50 text-muted-foreground border-border/60 hover:bg-card hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-card/40 animate-pulse border border-border/40" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20 bg-card/20 rounded-2xl border border-dashed border-border p-8">
            <h3 className="text-lg font-semibold">No templates match your criteria</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search terms or clearing your category filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedProfileType('all');
                setSearchQuery('');
              }}
              className="mt-4"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => {
              const planBadge = PLAN_BADGES[template.requiredPlanId] || PLAN_BADGES.nano;
              return (
                <div
                  key={template.id}
                  className="group relative flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden transition-all duration-300 hover:border-gold/50 hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Card Visual / Thumbnail Simulation */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-6 flex flex-col justify-between border-b border-border/60">
                    {/* Simulated Profile UI Card */}
                    <div
                      className="absolute inset-0 opacity-40 group-hover:scale-105 transition-transform duration-500"
                      style={{
                        background:
                          template.defaultThemeConfig.background === '#FDFBF7'
                            ? 'linear-gradient(135deg, #FDFBF7 0%, #E2E8F0 100%)'
                            : template.defaultThemeConfig.primaryColor
                            ? `radial-gradient(circle at 80% 20%, ${template.defaultThemeConfig.primaryColor}22 0%, #0A0A0C 70%)`
                            : 'none',
                      }}
                    />

                    {/* Top Badges */}
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <Badge variant={planBadge.variant} className="text-[11px] backdrop-blur-md">
                        {planBadge.label}
                      </Badge>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground bg-background/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-border/40">
                        {template.category}
                      </span>
                    </div>

                    {/* Miniature Profile Mockup Center */}
                    <div className="relative z-10 flex items-center gap-3 bg-card/80 backdrop-blur-md p-3.5 rounded-xl border border-border/60 shadow-lg">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-inner"
                        style={{
                          backgroundColor:
                            template.defaultThemeConfig.primaryColor || '#D4AF37',
                        }}
                      >
                        {template.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate text-foreground">
                          {template.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {template.supportedProfileTypes.join(' & ')} Mode
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-gold transition-colors">
                        {template.name}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>

                      {/* Capabilities pill tags */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {template.supportedProfileTypes.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center text-[10px] uppercase font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md"
                          >
                            <CheckCircle className="w-2.5 h-2.5 mr-1 text-gold" />
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => {
                          setPreviewTemplate(template);
                          setPreviewDevice('mobile');
                        }}
                      >
                        <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                        Preview
                      </Button>
                      <Link
                        href={`/builder/new?template=${template.slug}`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          className="w-full text-xs font-semibold bg-gold text-gold-foreground hover:bg-gold-light"
                        >
                          Use Template
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Dual Device Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col bg-background border-border">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/60">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <span>{previewTemplate.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {previewTemplate.category}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Interactive template preview for mobile and desktop viewports
                </DialogDescription>
              </div>

              {/* Viewport switch */}
              <div className="flex items-center gap-2">
                <div className="flex bg-muted p-1 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                      previewDevice === 'mobile'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                      previewDevice === 'desktop'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Desktop
                  </button>
                </div>

                <Link href={`/builder/new?template=${previewTemplate.slug}`}>
                  <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold-light text-xs font-semibold">
                    Select Template
                  </Button>
                </Link>
              </div>
            </div>

            {/* Viewport Render Area */}
            <div className="flex-1 bg-neutral-950 p-6 flex items-center justify-center overflow-auto">
              {previewDevice === 'mobile' ? (
                // Mobile Frame
                <div className="w-[360px] h-[640px] rounded-[36px] border-4 border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col relative">
                  {/* Phone notch */}
                  <div className="h-6 bg-neutral-900 flex items-center justify-center">
                    <div className="w-24 h-4 bg-neutral-800 rounded-b-xl" />
                  </div>
                  {/* Screen Content Mockup */}
                  <div
                    className="flex-1 p-5 overflow-y-auto"
                    style={{
                      backgroundColor:
                        previewTemplate.defaultThemeConfig.background?.toString() || '#0A0A0C',
                      color:
                        previewTemplate.defaultThemeConfig.background === '#FDFBF7'
                          ? '#1A202C'
                          : '#F9FAFB',
                      fontFamily:
                        previewTemplate.defaultThemeConfig.fontFamily?.toString() || 'sans-serif',
                    }}
                  >
                    {/* Simulated Cover */}
                    <div className="h-20 w-full rounded-xl bg-gradient-to-r from-gold/30 to-gold/10 -mt-1 mb-6 border border-border/20 flex items-center justify-center text-xs font-medium opacity-60">
                      Cover Banner
                    </div>

                    {/* Avatar & Header */}
                    <div className="text-center -mt-12">
                      <div
                        className="w-16 h-16 rounded-full mx-auto border-2 border-background flex items-center justify-center font-bold text-lg shadow-md"
                        style={{
                          backgroundColor:
                            previewTemplate.defaultThemeConfig.primaryColor?.toString() || '#D4AF37',
                          color: '#FFFFFF',
                        }}
                      >
                        JM
                      </div>
                      <h4 className="mt-2 text-base font-bold">John Mathew</h4>
                      <p className="text-xs opacity-70">Managing Director & Tech Founder</p>
                    </div>

                    {/* Save Contact CTA */}
                    <div className="mt-5">
                      <button
                        type="button"
                        className="w-full py-2.5 rounded-xl font-semibold text-xs text-center shadow-md"
                        style={{
                          backgroundColor:
                            previewTemplate.defaultThemeConfig.primaryColor?.toString() || '#D4AF37',
                          color:
                            previewTemplate.defaultThemeConfig.background === '#FDFBF7'
                              ? '#FFFFFF'
                              : '#0A0A0C',
                        }}
                      >
                        Save Contact
                      </button>
                    </div>

                    {/* Multiple Ventures / Business Card Mini Showcase */}
                    <div className="mt-6 space-y-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
                        Ventures & Businesses
                      </div>
                      <div className="p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                        <div className="text-xs font-bold">ABC Technologies</div>
                        <div className="text-[11px] opacity-70">Cloud Architecture & AI</div>
                      </div>
                      <div className="p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                        <div className="text-xs font-bold">XYZ Properties</div>
                        <div className="text-[11px] opacity-70">Commercial Real Estate</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Desktop Frame
                <div className="w-full max-w-3xl h-[520px] rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col">
                  {/* Browser Bar */}
                  <div className="h-8 bg-neutral-800 px-3 flex items-center gap-2 border-b border-neutral-700">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 text-center text-[10px] text-muted-foreground font-mono bg-neutral-900 py-0.5 rounded">
                      {defaultBrandConfig.appUrl}/p/johnmathew
                    </div>
                  </div>
                  {/* Desktop Content Mockup */}
                  <div
                    className="flex-1 p-8 overflow-y-auto"
                    style={{
                      backgroundColor:
                        previewTemplate.defaultThemeConfig.background?.toString() || '#0A0A0C',
                      color:
                        previewTemplate.defaultThemeConfig.background === '#FDFBF7'
                          ? '#1A202C'
                          : '#F9FAFB',
                    }}
                  >
                    <div className="max-w-xl mx-auto text-center">
                      <div
                        className="w-20 h-20 rounded-full mx-auto flex items-center justify-center font-bold text-xl shadow-lg"
                        style={{
                          backgroundColor:
                            previewTemplate.defaultThemeConfig.primaryColor?.toString() || '#D4AF37',
                          color: '#FFFFFF',
                        }}
                      >
                        JM
                      </div>
                      <h3 className="mt-3 text-2xl font-bold">John Mathew</h3>
                      <p className="text-sm opacity-70">Managing Director & Tech Founder</p>
                      <div className="mt-4 flex justify-center gap-3">
                        <button
                          type="button"
                          className="px-6 py-2 rounded-xl text-xs font-semibold shadow-md"
                          style={{
                            backgroundColor:
                              previewTemplate.defaultThemeConfig.primaryColor?.toString() || '#D4AF37',
                            color:
                              previewTemplate.defaultThemeConfig.background === '#FDFBF7'
                                ? '#FFFFFF'
                                : '#0A0A0C',
                          }}
                        >
                          Save Contact
                        </button>
                        <button
                          type="button"
                          className="px-6 py-2 rounded-xl text-xs font-semibold border border-white/20 hover:bg-white/5"
                        >
                          Exchange Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

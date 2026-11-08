'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Eye,
  Check,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/lib/auth/client';
import type { Template } from '@/modules/templates';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import type { ProfileRenderData } from '@/components/templates/ProfileRenderer';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'business', label: 'Business' },
  { id: 'personal', label: 'Personal' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'creative', label: 'Creative' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'retail', label: 'Retail' },
  { id: 'food', label: 'Food' },
];

const PLAN_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'gold' | 'outline' }> = {
  nano: { label: 'Free', variant: 'secondary' },
  micro: { label: 'Micro', variant: 'outline' },
  mini: { label: 'Mini', variant: 'outline' },
  max: { label: 'Max', variant: 'gold' },
};

const PLAN_ORDER: Record<string, number> = {
  nano: 1,
  micro: 2,
  mini: 3,
  max: 4,
};

function TemplateMarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPreviewParam = searchParams.get('preview');

  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'featured' | 'name' | 'plan'>('featured');
  const [previewTemplateId, setPreviewTemplateId] = React.useState<string | null>(null);

  // Authenticated customer's active profile (if any)
  const [customerProfile, setCustomerProfile] = React.useState<ProfileRenderData | null>(null);
  const [activeProfileId, setActiveProfileId] = React.useState<string | null>(null);
  const [selectedSuccessMessage, setSelectedSuccessMessage] = React.useState<string | null>(null);
  const [isApplying, setIsApplying] = React.useState<string | null>(null);

  // Check URL query param for deep-linked preview
  React.useEffect(() => {
    if (initialPreviewParam) {
      setPreviewTemplateId(initialPreviewParam);
    }
  }, [initialPreviewParam]);

  // Load templates without requiring authentication
  const fetchTemplates = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const tplRes = await fetch('/api/v1/templates');
      if (!tplRes.ok) {
        throw new Error(`Failed to load templates (HTTP ${tplRes.status})`);
      }
      const tplJson = await tplRes.json();
      if (tplJson.data) {
        setTemplates(tplJson.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load templates.';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Silently load user profile if authenticated
  React.useEffect(() => {
    if (!isAuthenticated) return;

    async function loadCustomerProfile() {
      try {
        const profileRes = await fetch('/api/v1/profiles');
        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          const profilesList = profileJson.data || [];
          if (profilesList.length > 0) {
            const first = profilesList[0];
            setActiveProfileId(first.id);
            setCustomerProfile({
              id: first.id,
              slug: first.slug,
              displayName: first.displayName,
              headline: first.headline,
              bio: first.bio,
              avatarUrl: first.avatarUrl,
              coverUrl: first.coverUrl,
              profileType: first.profileType,
              templateId: first.templateId,
              businesses: first.businesses || [],
              catalogue: first.catalogue || [],
            });
          }
        }
      } catch {
        // Silently ignore background profile fetch failure
      }
    }

    loadCustomerProfile();
  }, [isAuthenticated]);

  const filteredTemplates = React.useMemo(() => {
    let list = templates.filter((t) => {
      const matchCategory =
        selectedCategory === 'all' ||
        t.category.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === 'personal' && (t.category === 'personal' || t.category === 'real-estate'));

      const matchSearch =
        searchQuery.trim() === '' ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchSearch;
    });

    if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'plan') {
      list = [...list].sort(
        (a, b) => (PLAN_ORDER[a.requiredPlanId.toLowerCase()] ?? 1) - (PLAN_ORDER[b.requiredPlanId.toLowerCase()] ?? 1)
      );
    } else {
      list = [...list].sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
    }

    return list;
  }, [templates, selectedCategory, searchQuery, sortBy]);

  // Apply or use selected template
  const handleSelectTemplate = async (templateId: string) => {
    // 1. Unauthenticated visitor: redirect to registration preserving template
    if (!isAuthenticated) {
      router.push(`/register?template=${encodeURIComponent(templateId)}`);
      return;
    }

    // 2. Authenticated user without a profile: redirect to builder with template
    if (!activeProfileId) {
      router.push(`/builder/new?template=${encodeURIComponent(templateId)}`);
      return;
    }

    // 3. Authenticated user with active profile: apply to current profile
    try {
      setIsApplying(templateId);
      const res = await fetch(`/api/v1/profiles/${activeProfileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile template.');
      }

      await res.json();
      if (customerProfile) {
        setCustomerProfile({
          ...customerProfile,
          templateId,
        });
      }

      const tpl = templates.find((t) => t.id === templateId || t.slug === templateId);
      setSelectedSuccessMessage(
        `Applied "${tpl?.name || templateId}".`
      );
      setTimeout(() => setSelectedSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error selecting template', err);
    } finally {
      setIsApplying(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      {/* Toast Notification Banner */}
      {selectedSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-white border border-blue-600/40 text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="text-xs font-medium">{selectedSuccessMessage}</div>
        </div>
      )}

      {/* Header Bar */}
      <section className="border-b border-slate-100 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-slate-900">
                Templates
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Curated layouts for digital profiles and smart NFC cards.
              </p>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-7 h-8 text-xs bg-white border-slate-200/80 rounded-lg placeholder:text-slate-500 focus:border-blue-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'featured' | 'name' | 'plan')}
                className="h-8 px-2.5 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600 cursor-pointer shrink-0"
                aria-label="Sort templates"
              >
                <option value="featured">Featured</option>
                <option value="name">Name (A-Z)</option>
                <option value="plan">Plan</option>
              </select>
            </div>
          </div>

          {/* Category Horizontal Navigation */}
          <div className="mt-5 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-foreground text-background font-semibold shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-muted/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid of Templates */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-[16/10] rounded-xl bg-white animate-pulse border border-slate-100"
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center py-16 bg-destructive/10 rounded-2xl border border-destructive/20 p-8 max-w-sm mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">Could not load templates</h3>
            <p className="text-xs text-slate-500 mt-1 mb-3">{loadError}</p>
            <Button variant="outline" size="sm" onClick={fetchTemplates} className="gap-2 text-xs h-8">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16 bg-white/20 rounded-2xl border border-dashed border-slate-200 p-8 max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-slate-900">No templates found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or category filter.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-3 text-xs h-8"
            >
              Reset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTemplates.map((template) => {
              const planBadge = PLAN_BADGES[template.requiredPlanId] || PLAN_BADGES.nano;
              const isCurrentActive =
                isAuthenticated &&
                (customerProfile?.templateId === template.id || customerProfile?.templateId === template.slug);

              return (
                <div
                  key={template.id}
                  className={`group relative flex flex-col rounded-xl border bg-white overflow-hidden transition-all duration-200 hover:border-slate-200 hover:shadow-lg ${
                    isCurrentActive
                      ? 'border-blue-600 ring-1 ring-primary/30'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Large Visual Preview */}
                  <div
                    className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900 cursor-pointer"
                    onClick={() => setPreviewTemplateId(template.id)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Subtle Scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    {/* Top Right: Plan Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-neutral-300 border border-white/10">
                        {planBadge.label}
                      </span>
                    </div>

                    {/* Top Left: Active Badge */}
                    {isCurrentActive && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500 text-neutral-950 flex items-center gap-1 shadow">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      </div>
                    )}

                    {/* Hover Action Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/90 text-white text-xs font-medium border border-white/15 backdrop-blur-md shadow-md">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Preview</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Info & Action Bar */}
                  <div className="p-3.5 flex items-center justify-between gap-3 border-t border-slate-100">
                    <div className="min-w-0">
                      <h3
                        onClick={() => setPreviewTemplateId(template.id)}
                        className="text-xs font-semibold text-slate-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                      >
                        {template.name}
                      </h3>
                      <span className="text-[11px] text-slate-500 capitalize">
                        {template.category}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant={isCurrentActive ? 'secondary' : 'default'}
                      disabled={isApplying === template.id}
                      onClick={() => handleSelectTemplate(template.id)}
                      className={`h-7 px-3 text-xs font-medium shrink-0 ${
                        isCurrentActive
                          ? 'bg-muted text-slate-500'
                          : 'bg-blue-600 text-blue-600-foreground hover:bg-blue-600/90'
                      }`}
                    >
                      {isApplying === template.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isCurrentActive ? (
                        'Active'
                      ) : (
                        'Use'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Interactive Template Preview Modal */}
      {previewTemplateId && (
        <TemplatePreviewModal
          isOpen={!!previewTemplateId}
          onClose={() => setPreviewTemplateId(null)}
          initialTemplateId={previewTemplateId}
          customerProfile={customerProfile}
          onSelectTemplate={handleSelectTemplate}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
}

export default function TemplateMarketplacePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <TemplateMarketplaceContent />
    </React.Suspense>
  );
}

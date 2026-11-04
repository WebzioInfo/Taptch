'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  ArrowRight,
  Eye,
  Check,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSession } from '@/lib/auth/client';
import type { Template } from '@/modules/templates';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import type { ProfileRenderData } from '@/components/templates/ProfileRenderer';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'business', label: 'Business' },
  { id: 'personal', label: 'Luxury' },
  { id: 'retail', label: 'Retail' },
  { id: 'food', label: 'Food' },
  { id: 'creative', label: 'Creative' },
];

const PLAN_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'gold' | 'outline' }> = {
  nano: { label: 'Free', variant: 'secondary' },
  micro: { label: 'Micro', variant: 'outline' },
  mini: { label: 'Mini', variant: 'outline' },
  max: { label: 'Max', variant: 'gold' },
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

      // Public API: Zero authentication required
      const tplRes = await fetch('/api/v1/templates');
      if (!tplRes.ok) {
        throw new Error(`Failed to load templates (HTTP ${tplRes.status})`);
      }
      const tplJson = await tplRes.json();
      if (tplJson.data) {
        setTemplates(tplJson.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load template directory.';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // If user is authenticated, silently load their profile in the background
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
    return templates.filter((t) => {
      const matchCategory =
        selectedCategory === 'all' ||
        t.category.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === 'personal' && (t.category === 'personal' || t.category === 'real-estate'));

      const matchSearch =
        searchQuery.trim() === '' ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.features && t.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchCategory && matchSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

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
        `Template updated to "${tpl?.name || templateId}"! Your profile data and catalogue have been preserved.`
      );
      setTimeout(() => setSelectedSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error selecting template', err);
    } finally {
      setIsApplying(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Toast Notification Banner */}
      {selectedSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-medium">{selectedSuccessMessage}</div>
        </div>
      )}

      {/* Header Banner */}
      <section className="border-b border-border/40 bg-card/40 backdrop-blur-md pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Templates
          </h1>

          {/* Search & Input */}
          <div className="mt-5 flex items-center justify-center max-w-md mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gold/15 text-gold border-gold/40 shadow-sm font-semibold'
                    : 'bg-card/50 text-muted-foreground border-border/60 hover:bg-card hover:text-foreground'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-card/40 animate-pulse border border-border/40 flex flex-col justify-end p-6 space-y-3"
              >
                <div className="h-4 bg-muted/60 rounded w-1/3" />
                <div className="h-6 bg-muted/60 rounded w-2/3" />
                <div className="h-4 bg-muted/40 rounded w-full" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center py-16 bg-destructive/10 rounded-2xl border border-destructive/20 p-8 max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <h3 className="text-sm font-bold text-foreground">Could not load templates</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-3">{loadError}</p>
            <Button variant="outline" size="sm" onClick={fetchTemplates} className="gap-2 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16 bg-card/20 rounded-2xl border border-dashed border-border p-8">
            <h3 className="text-sm font-semibold">No templates found</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-3 text-xs"
            >
              Reset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const planBadge = PLAN_BADGES[template.requiredPlanId] || PLAN_BADGES.nano;
              const isCurrentActive =
                isAuthenticated &&
                (customerProfile?.templateId === template.id || customerProfile?.templateId === template.slug);

              return (
                <div
                  key={template.id}
                  className={`group relative flex flex-col rounded-2xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    isCurrentActive
                      ? 'border-amber-400 ring-2 ring-amber-400/20'
                      : 'border-border/80 hover:border-gold/50'
                  }`}
                >
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900 border-b border-border/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-black/30" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                      <Badge variant={planBadge.variant} className="text-[10px] backdrop-blur-md uppercase tracking-wider">
                        {planBadge.label}
                      </Badge>
                      {isCurrentActive && (
                        <Badge className="bg-amber-500 text-neutral-950 font-bold text-[10px] gap-1">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </Badge>
                      )}
                    </div>

                    {/* Bottom Category Tag */}
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                        {template.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-gold transition-colors">
                        {template.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-border/60 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs gap-1.5 h-8"
                        onClick={() => setPreviewTemplateId(template.id)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </Button>

                      <Button
                        size="sm"
                        disabled={isApplying === template.id}
                        onClick={() => handleSelectTemplate(template.id)}
                        className={`flex-1 text-xs font-semibold h-8 gap-1.5 ${
                          isCurrentActive
                            ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                            : 'bg-gold text-gold-foreground hover:bg-gold-light'
                        }`}
                      >
                        {isApplying === template.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isCurrentActive ? (
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isCurrentActive
                            ? 'Active'
                            : isAuthenticated
                            ? 'Select'
                            : 'Use'}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Interactive Template Preview Modal (Mode A Demo & Mode B Customer) */}
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
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <TemplateMarketplaceContent />
    </React.Suspense>
  );
}


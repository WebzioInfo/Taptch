'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Smartphone,
  Tablet,
  Monitor,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/auth/client';
import { brandConfig } from '@/config/brand';
import { ProfileRenderer } from '@/components/templates/ProfileRenderer';
import { getDemoBusinessByTemplate } from '@/lib/mock-data/demo-businesses';
import { STANDARD_TEMPLATES } from '@/modules/templates/constants';

export default function IndividualTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const templateIdParam = (params.id as string) || '';
  const profileIdParam = searchParams.get('profileId');

  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const [isApplying, setIsApplying] = React.useState(false);

  const [previewDevice, setPreviewDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  const template = React.useMemo(() => {
    return (
      STANDARD_TEMPLATES.find(
        (t) => t.id === templateIdParam || t.slug === templateIdParam
      ) || STANDARD_TEMPLATES[0]
    );
  }, [templateIdParam]);

  const demoBusiness = React.useMemo(() => {
    return getDemoBusinessByTemplate(template.id);
  }, [template.id]);

  const renderData = React.useMemo(() => {
    return {
      ...demoBusiness,
      templateId: template.id,
      previewPlanId: 'max',
    };
  }, [demoBusiness, template.id]);

  const handleUseTemplate = async () => {
    if (!isAuthenticated) {
      router.push(`/register?template=${encodeURIComponent(template.id)}`);
      return;
    }

    if (profileIdParam) {
      try {
        setIsApplying(true);
        const res = await fetch(`/api/v1/profiles/${profileIdParam}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId: template.id }),
        });
        if (res.ok) {
          router.push(`/builder/${profileIdParam}`);
          return;
        }
      } catch (e) {
        console.error('Failed to apply template', e);
      } finally {
        setIsApplying(false);
      }
    }

    router.push(`/builder/new?template=${encodeURIComponent(template.id)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header Bar */}
      <section className="border-b border-border/40 bg-card/40 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Back & Template Meta */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={profileIdParam ? `/builder/${profileIdParam}` : '/templates'}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{profileIdParam ? 'Editor' : 'Templates'}</span>
            </Link>

            <div className="h-4 w-px bg-border/60 hidden sm:block shrink-0" />

            <div className="flex items-center gap-2 truncate">
              <h1 className="text-sm font-semibold truncate">
                {template.name}
              </h1>
              <Badge variant="outline" className="text-[10px] uppercase font-mono hidden sm:inline-flex shrink-0">
                {template.category}
              </Badge>
            </div>
          </div>

          {/* Center: Viewport Controls */}
          <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/80 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                previewDevice === 'mobile'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Mobile (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('tablet')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                previewDevice === 'tablet'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Tablet (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                previewDevice === 'desktop'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Desktop</span>
            </button>
          </div>

          {/* Right: Primary Action */}
          <div className="shrink-0">
            <Button
              size="sm"
              onClick={handleUseTemplate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-8 px-3.5 gap-1.5 shadow-sm"
            >
              <span>{isApplying ? 'Applying...' : profileIdParam ? 'Apply to Profile' : isAuthenticated ? 'Use Template' : 'Get Started'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Main Preview Stage */}
      <main className="flex-1 bg-neutral-950 p-4 sm:p-8 flex items-center justify-center overflow-auto">
        {previewDevice === 'mobile' && (
          <div className="w-[360px] h-[720px] rounded-[36px] border-[8px] border-neutral-800 bg-black shadow-2xl overflow-hidden flex flex-col relative shrink-0 ring-1 ring-white/10">
            {/* Camera Pill */}
            <div className="h-5 bg-neutral-950 flex items-center justify-center shrink-0 z-20">
              <div className="w-16 h-3.5 bg-neutral-900 rounded-full" />
            </div>
            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto bg-neutral-950">
              <ProfileRenderer profile={renderData} />
            </div>
            {/* Home Bar */}
            <div className="h-3.5 bg-neutral-950 flex items-center justify-center shrink-0">
              <div className="w-24 h-1 bg-neutral-700 rounded-full" />
            </div>
          </div>
        )}

        {previewDevice === 'tablet' && (
          <div className="w-[720px] max-w-full h-[780px] rounded-[28px] border-[8px] border-neutral-800 bg-black shadow-2xl overflow-hidden flex flex-col relative shrink-0 ring-1 ring-white/10">
            <div className="h-4 bg-neutral-950 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-neutral-900" />
            </div>
            <div className="flex-1 overflow-y-auto bg-neutral-950">
              <ProfileRenderer profile={renderData} />
            </div>
          </div>
        )}

        {previewDevice === 'desktop' && (
          <div className="w-full max-w-5xl h-[780px] rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
            {/* Browser Header Bar */}
            <div className="h-8 bg-neutral-800 px-3 flex items-center gap-2 border-b border-neutral-700 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500/80" />
                <div className="w-2 h-2 rounded-full bg-amber-500/80" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 text-center text-[11px] text-neutral-400 font-mono bg-neutral-950/80 py-0.5 rounded max-w-xs mx-auto truncate px-2 border border-white/5">
                https://{brandConfig.appUrl?.replace(/^https?:\/\//, '') || 'app.taptch.com'}/p/{renderData.slug}
              </div>
            </div>
            {/* Desktop Screen Content */}
            <div className="flex-1 overflow-y-auto bg-neutral-950">
              <ProfileRenderer profile={renderData} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

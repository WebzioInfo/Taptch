'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/auth/client';
import { ProfileRenderer } from '@/components/templates/ProfileRenderer';
import { getDemoBusinessByTemplate } from '@/lib/mock-data/demo-businesses';
import { STANDARD_TEMPLATES } from '@/modules/templates/constants';

export default function IndividualTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateIdParam = (params.id as string) || '';

  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const [previewDevice, setPreviewDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [simulatedPlan, setSimulatedPlan] = React.useState<'nano' | 'micro' | 'mini' | 'max'>('mini');

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
      previewPlanId: simulatedPlan,
    };
  }, [demoBusiness, template.id, simulatedPlan]);

  const handleUseTemplate = () => {
    if (!isAuthenticated) {
      router.push(`/register?template=${encodeURIComponent(template.id)}`);
    } else {
      router.push(`/builder/new?template=${encodeURIComponent(template.id)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header Bar */}
      <section className="border-b border-border/40 bg-card/40 backdrop-blur-md py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Template Gallery</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {template.name}
              </h1>
              <Badge variant="gold" className="uppercase text-[10px] tracking-wider">
                {template.category}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              {template.description}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {/* Viewport Toggles */}
            <div className="flex bg-muted/60 p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  previewDevice === 'mobile'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  previewDevice === 'tablet'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Tablet View"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tablet</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  previewDevice === 'desktop'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
            </div>

            {/* Use Template CTA */}
            <Button
              variant="gold"
              size="sm"
              onClick={handleUseTemplate}
              className="gap-1.5 text-xs font-bold shadow-md"
            >
              <span>{isAuthenticated ? 'Use This Template' : 'Create Free Profile'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Main Preview Workspace */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Template Metadata & Features */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card/60 border border-border/80 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Template Specifications
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Layout Type</span>
                  <span className="font-semibold capitalize">{template.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Compatibility</span>
                  <span className="font-semibold uppercase text-gold">{template.requiredPlanId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Device Support</span>
                  <span className="font-semibold">Mobile, Tablet, Desktop</span>
                </div>
              </div>

              {/* Plan Simulator */}
              <div className="pt-2 border-t border-border/40">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-gold" />
                  <span>Simulate Plan Tier:</span>
                </label>
                <select
                  value={simulatedPlan}
                  onChange={(e) => setSimulatedPlan(e.target.value as 'nano' | 'micro' | 'mini' | 'max')}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase text-foreground focus:outline-none focus:border-gold"
                >
                  <option value="nano">Nano (Base Free)</option>
                  <option value="micro">Micro (Solo Professional)</option>
                  <option value="mini">Mini (Growth Business)</option>
                  <option value="max">Max (Enterprise Luxury)</option>
                </select>
              </div>

              {/* Key Features */}
              <div className="pt-2 border-t border-border/40 space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Included Features:</span>
                <div className="space-y-1.5">
                  {template.features?.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="gold"
                className="w-full text-xs font-bold gap-1.5 shadow-lg mt-4"
                onClick={handleUseTemplate}
              >
                <span>{isAuthenticated ? 'Use This Template' : 'Sign Up to Use'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Right Column: Live Responsive Frame */}
          <div className="lg:col-span-3 flex justify-center items-start overflow-hidden">
            {previewDevice === 'mobile' && (
              <div className="w-[375px] h-[780px] rounded-[44px] border-[10px] border-neutral-800 bg-black shadow-2xl overflow-hidden flex flex-col relative shrink-0 ring-1 ring-white/10">
                <div className="h-6 bg-neutral-950 flex items-center justify-center shrink-0 z-20">
                  <div className="w-20 h-4 bg-neutral-900 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto bg-neutral-950">
                  <ProfileRenderer profile={renderData} />
                </div>
                <div className="h-4 bg-neutral-950 flex items-center justify-center shrink-0">
                  <div className="w-28 h-1 bg-neutral-700 rounded-full" />
                </div>
              </div>
            )}

            {previewDevice === 'tablet' && (
              <div className="w-[768px] max-w-full h-[820px] rounded-[36px] border-[12px] border-neutral-800 bg-black shadow-2xl overflow-hidden flex flex-col relative shrink-0 ring-1 ring-white/10">
                <div className="h-5 bg-neutral-950 flex items-center justify-center shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                </div>
                <div className="flex-1 overflow-y-auto bg-neutral-950">
                  <ProfileRenderer profile={renderData} />
                </div>
              </div>
            )}

            {previewDevice === 'desktop' && (
              <div className="w-full h-[820px] rounded-2xl border border-border bg-neutral-900 shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
                <div className="h-9 bg-neutral-800 px-4 flex items-center gap-3 border-b border-neutral-700 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 max-w-sm mx-auto bg-neutral-900/80 rounded-md px-3 py-1 text-[11px] text-neutral-400 text-center truncate border border-neutral-700">
                    https://tappzio.com/p/{demoBusiness.slug}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto bg-neutral-950">
                  <ProfileRenderer profile={renderData} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

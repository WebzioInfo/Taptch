'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import {
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Minimize2,
  CheckCircle,
  Sparkles,
  Building,
  User,
  Shield,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { ProfileRenderer, type ProfileRenderData } from './ProfileRenderer';
import { DEMO_BUSINESSES, getDemoBusinessByTemplate, type DemoBusinessProfile } from '@/lib/mock-data/demo-businesses';
import { STANDARD_TEMPLATES } from '@/modules/templates/constants';

export interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplateId: string;
  customerProfile?: ProfileRenderData | null;
  onSelectTemplate?: (templateId: string) => Promise<void> | void;
  isAuthenticated?: boolean;
}

export function TemplatePreviewModal({
  isOpen,
  onClose,
  initialTemplateId,
  customerProfile,
  onSelectTemplate,
  isAuthenticated = false,
}: TemplatePreviewModalProps) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>(initialTemplateId);
  const [previewDevice, setPreviewDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [previewMode, setPreviewMode] = React.useState<'demo' | 'customer'>(
    customerProfile ? 'customer' : 'demo'
  );
  const [selectedDemoIndex, setSelectedDemoIndex] = React.useState<number>(0);
  const [simulatedPlan, setSimulatedPlan] = React.useState<'nano' | 'micro' | 'mini' | 'max'>('mini');
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Sync initial template if it changes when modal opens
  React.useEffect(() => {
    if (initialTemplateId) {
      setSelectedTemplateId(initialTemplateId);
      const matchingDemoIdx = DEMO_BUSINESSES.findIndex(
        (b) => b.templateId === initialTemplateId || b.category === initialTemplateId
      );
      if (matchingDemoIdx !== -1) {
        setSelectedDemoIndex(matchingDemoIdx);
      }
    }
  }, [initialTemplateId]);

  if (!isOpen) return null;

  // Selected template details
  const activeTemplate =
    STANDARD_TEMPLATES.find((t) => t.id === selectedTemplateId || t.slug === selectedTemplateId) ||
    STANDARD_TEMPLATES[0];

  // Active demo business
  const currentDemoBusiness: DemoBusinessProfile = DEMO_BUSINESSES[selectedDemoIndex] || DEMO_BUSINESSES[0];

  // Prepare profile data to render
  let renderData: ProfileRenderData;

  if (previewMode === 'customer' && customerProfile) {
    // Mode B: Customer Data with Graceful Placeholders
    renderData = {
      ...customerProfile,
      templateId: selectedTemplateId,
      previewPlanId: simulatedPlan,
      // Provide placeholders if certain fields are completely missing
      displayName: customerProfile.displayName || 'Your Business Name',
      headline: customerProfile.headline || 'Add an executive headline to showcase your organization.',
      bio: customerProfile.bio || 'Your organization bio will appear here. Edit your profile to highlight your services, team, and story.',
      businesses: customerProfile.businesses && customerProfile.businesses.length > 0
        ? customerProfile.businesses
        : [
            {
              id: 'placeholder-biz',
              companyName: customerProfile.displayName || 'Primary Organization',
              roleTitle: 'Founder & Managing Director',
              industry: 'Commercial Business',
              description: 'Add detailed enterprise background and subsidiaries in the profile builder.',
            },
          ],
      catalogue: customerProfile.catalogue && customerProfile.catalogue.length > 0
        ? customerProfile.catalogue
        : [
            {
              id: 'placeholder-cat-1',
              title: 'Sample Product or Service Offering',
              itemType: 'product',
              description: 'Your catalogue items will appear here with price tags, descriptions, and quotation buttons.',
              price: '0',
              currency: '₹',
            },
          ],
    };
  } else {
    // Mode A: Centrally Managed Demo Data
    renderData = {
      ...currentDemoBusiness,
      templateId: selectedTemplateId,
      previewPlanId: simulatedPlan,
    };
  }

  const handleApplyTemplate = async () => {
    if (!isAuthenticated && !customerProfile) {
      router.push(`/register?template=${encodeURIComponent(selectedTemplateId)}`);
      return;
    }

    if (onSelectTemplate) {
      try {
        setIsSaving(true);
        await onSelectTemplate(selectedTemplateId);
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1500);
      } catch (err) {
        console.error('Failed to select template', err);
      } finally {
        setIsSaving(false);
      }
    } else {
      router.push(`/builder/new?template=${encodeURIComponent(selectedTemplateId)}`);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white transition-all ${isFullScreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      {/* Top Navigation & Toolbar */}
      <header className="h-16 border-b border-white/10 bg-neutral-900/90 backdrop-blur-md px-4 flex items-center justify-between gap-4 shrink-0 rounded-t-2xl">
        {/* Left: Back & Template Selector */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-neutral-400 hover:text-white gap-1.5 text-xs h-9 px-2.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Gallery</span>
          </Button>

          <div className="h-5 w-px bg-white/15 hidden sm:block" />

          {/* Quick Template Switcher Dropdown */}
          <div className="relative flex items-center">
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                setSelectedTemplateId(e.target.value);
                // Also auto-switch demo business to match template theme if in demo mode
                const demo = getDemoBusinessByTemplate(e.target.value);
                const demoIdx = DEMO_BUSINESSES.findIndex((d) => d.id === demo.id);
                if (demoIdx !== -1) setSelectedDemoIndex(demoIdx);
              }}
              className="bg-neutral-800 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 pr-8 cursor-pointer"
            >
              {STANDARD_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Device Viewport Controls & Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Viewport Toolbar */}
          <div className="flex bg-neutral-800/90 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                previewDevice === 'mobile'
                  ? 'bg-neutral-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Mobile Device (375px)"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('tablet')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                previewDevice === 'tablet'
                  ? 'bg-neutral-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Tablet Device (768px)"
            >
              <Tablet className="w-4 h-4" />
              <span className="hidden md:inline">Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                previewDevice === 'desktop'
                  ? 'bg-neutral-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Desktop Browser"
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden md:inline">Desktop</span>
            </button>
          </div>

          {/* Mode Switcher: Mode A (Demo) vs Mode B (My Business) */}
          <div className="flex bg-neutral-800/90 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setPreviewMode('demo')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                previewMode === 'demo'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('customer')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                previewMode === 'customer'
                  ? 'bg-primary/20 text-primary font-bold border border-primary/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-primary" />
              <span>My Business</span>
            </button>
          </div>
        </div>

        {/* Right: Plan Simulator, FullScreen & Select Button */}
        <div className="flex items-center gap-2">
          {/* Plan Simulator Tier Dropdown */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs bg-neutral-800/90 px-2.5 py-1.5 rounded-xl border border-white/10">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400">Plan:</span>
            <select
              value={simulatedPlan}
              onChange={(e) => setSimulatedPlan(e.target.value as 'nano' | 'micro' | 'mini' | 'max')}
              className="bg-transparent text-white font-bold uppercase text-[11px] focus:outline-none cursor-pointer"
            >
              <option value="nano" className="bg-neutral-900 text-white">Nano (Base)</option>
              <option value="micro" className="bg-neutral-900 text-white">Micro (Solo)</option>
              <option value="mini" className="bg-neutral-900 text-white">Mini (Growth)</option>
              <option value="max" className="bg-neutral-900 text-white">Max (Enterprise)</option>
            </select>
          </div>

          {/* Full Screen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="text-neutral-400 hover:text-white p-2 h-9 w-9"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {/* Apply / Select Template CTA */}
          <Button
            onClick={handleApplyTemplate}
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs h-9 px-4 gap-1.5 shadow-lg shadow-amber-500/20"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle className="w-4 h-4 text-emerald-950" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>
              {saveSuccess
                ? 'Template Applied!'
                : isAuthenticated || customerProfile
                ? 'Select Template'
                : 'Use This Template'}
            </span>
          </Button>
        </div>
      </header>

      {/* Sub-bar: Demo Business Selector (when in Demo Mode) or Customer Profile Indicator */}
      <div className="h-10 bg-neutral-900/60 border-b border-white/5 px-4 flex items-center justify-between text-xs text-neutral-400 shrink-0">
        {previewMode === 'demo' ? (
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="font-semibold text-neutral-300 shrink-0">Select Demo Business:</span>
            {DEMO_BUSINESSES.map((demo, idx) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => setSelectedDemoIndex(idx)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 transition-all ${
                  selectedDemoIndex === idx
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {demo.displayName}
              </button>
            ))}
          </div>
        ) : !customerProfile && !isAuthenticated ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="text-white font-medium">
                Previewing with sample customer layout
              </span>
              <span className="text-[11px] text-neutral-400">
                &bull; Sign in to link your real business profile
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/login?template=${encodeURIComponent(selectedTemplateId)}`)}
              className="text-xs text-primary hover:text-amber-300 font-semibold underline"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="text-white font-medium">
              Rendering with your saved business data: {customerProfile?.displayName || 'My Profile'}
            </span>
            <span className="text-[11px] text-neutral-500">&bull; Changes here do not alter your profile until saved</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-3 text-[11px]">
          <span>Template: <strong className="text-white">{activeTemplate.name}</strong></span>
          <span>&bull;</span>
          <span>Compatibility: <strong className="text-amber-400 uppercase">{activeTemplate.requiredPlanId}</strong></span>
        </div>
      </div>

      {/* Main Preview Canvas */}
      <main className="flex-1 bg-neutral-950 p-4 sm:p-8 flex items-center justify-center overflow-auto">
        {previewDevice === 'mobile' && (
          // Mobile Frame: 375px x 780px
          <div className="w-[375px] h-[760px] rounded-[44px] border-[10px] border-neutral-800 bg-black shadow-2xl overflow-hidden flex flex-col relative shrink-0 ring-1 ring-white/10">
            {/* Speaker & Dynamic Island simulation */}
            <div className="h-6 bg-neutral-950 flex items-center justify-center shrink-0 z-20">
              <div className="w-20 h-4 bg-neutral-900 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
              </div>
            </div>
            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto bg-neutral-950">
              <ProfileRenderer profile={renderData} />
            </div>
            {/* Home Indicator */}
            <div className="h-4 bg-neutral-950 flex items-center justify-center shrink-0">
              <div className="w-28 h-1 bg-neutral-700 rounded-full" />
            </div>
          </div>
        )}

        {previewDevice === 'tablet' && (
          // Tablet Frame: 768px x 860px
          <div className="w-[768px] max-w-full h-[820px] rounded-[36px] border-[12px] border-neutral-800 bg-black shadow-2xl overflow-hidden flex flex-col relative shrink-0 ring-1 ring-white/10">
            {/* Camera dot */}
            <div className="h-5 bg-neutral-950 flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
            </div>
            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto bg-neutral-950">
              <ProfileRenderer profile={renderData} />
            </div>
          </div>
        )}

        {previewDevice === 'desktop' && (
          // Desktop Browser Frame
          <div className="w-full max-w-5xl h-[820px] rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
            {/* Browser Header Bar */}
            <div className="h-9 bg-neutral-800 px-4 flex items-center gap-3 border-b border-neutral-700 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 text-center text-xs text-neutral-400 font-mono bg-neutral-950/80 py-1 rounded-md max-w-md mx-auto truncate px-3 border border-white/5">
                https://{brandConfig.appUrl?.replace(/^https?:\/\//, '') || 'app.tappzio.com'}/p/{renderData.slug}
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

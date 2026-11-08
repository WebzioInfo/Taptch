'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Tablet,
  Monitor,
  Check,
  Loader2,
  ArrowLeft,
  X,
} from 'lucide-react';
import { ProfileRenderer, type ProfileRenderData } from './ProfileRenderer';
import { getDemoBusinessByTemplate, type DemoBusinessProfile } from '@/lib/mock-data/demo-businesses';
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
  const [selectedTemplateId] = React.useState<string>(initialTemplateId);
  const [previewDevice, setPreviewDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [previewMode, setPreviewMode] = React.useState<'demo' | 'customer'>(
    customerProfile ? 'customer' : 'demo'
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Keyboard escape handler
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Selected template details
  const activeTemplate =
    STANDARD_TEMPLATES.find((t) => t.id === selectedTemplateId || t.slug === selectedTemplateId) ||
    STANDARD_TEMPLATES[0];

  // Active demo business matching this template
  const currentDemoBusiness: DemoBusinessProfile = getDemoBusinessByTemplate(activeTemplate.id);

  // Prepare profile data to render
  let renderData: ProfileRenderData;

  if (previewMode === 'customer' && customerProfile) {
    renderData = {
      ...customerProfile,
      templateId: selectedTemplateId,
      previewPlanId: 'max',
      displayName: customerProfile.displayName || 'Your Name',
      headline: customerProfile.headline || 'Your Headline',
      bio: customerProfile.bio || 'Your bio will appear here.',
      businesses: customerProfile.businesses && customerProfile.businesses.length > 0
        ? customerProfile.businesses
        : [
            {
              id: 'placeholder-biz',
              companyName: customerProfile.displayName || 'Company Name',
              roleTitle: 'Founder',
              industry: 'Business',
            },
          ],
      catalogue: customerProfile.catalogue && customerProfile.catalogue.length > 0
        ? customerProfile.catalogue
        : [],
    };
  } else {
    renderData = {
      ...currentDemoBusiness,
      templateId: selectedTemplateId,
      previewPlanId: 'max',
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
        }, 1200);
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
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="h-14 border-b border-white/10 bg-neutral-900/90 backdrop-blur-md px-4 flex items-center justify-between gap-4 shrink-0">
        {/* Left: Close & Template Info */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-neutral-400 hover:text-white gap-1.5 text-xs h-8 px-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </Button>

          <div className="h-4 w-px bg-white/15 hidden sm:block" />

          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-white truncate">
              {activeTemplate.name}
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono border-white/20 text-neutral-400 hidden sm:inline-flex">
              {activeTemplate.category}
            </Badge>
          </div>
        </div>

        {/* Center: Device Viewport Controls */}
        <div className="flex items-center bg-neutral-800 p-0.5 rounded-lg border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setPreviewDevice('mobile')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              previewDevice === 'mobile'
                ? 'bg-neutral-700 text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
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
                ? 'bg-neutral-700 text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
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
                ? 'bg-neutral-700 text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Desktop"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>
        </div>

        {/* Right: Data Mode (if customer) & Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          {customerProfile && (
            <div className="hidden sm:flex bg-neutral-800 p-0.5 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setPreviewMode('demo')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  previewMode === 'demo' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Demo
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('customer')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  previewMode === 'customer' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                My Data
              </button>
            </div>
          )}

          <Button
            size="sm"
            onClick={handleApplyTemplate}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-8 px-3.5 gap-1.5 shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : null}
            <span>
              {saveSuccess
                ? 'Applied'
                : isAuthenticated || customerProfile
                ? 'Select'
                : 'Use Template'}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-neutral-400 hover:text-white h-8 w-8 p-0"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Preview Stage */}
      <main className="flex-1 bg-neutral-950 p-4 sm:p-6 flex items-center justify-center overflow-auto">
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
          <div className="w-full max-w-4xl h-[780px] rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
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

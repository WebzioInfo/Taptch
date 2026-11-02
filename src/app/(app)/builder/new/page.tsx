'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Building2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { defaultBrandConfig } from '@/config/brand';
import type { Template } from '@/modules/templates';

export default function NewProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateSlugParam = searchParams.get('template') || 'obsidian-luxury';

  const [profileType, setProfileType] = useState<'personal' | 'business'>('personal');
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateSlugParam);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/v1/templates');
        const json = await res.json();
        if (json.data) {
          setTemplates(json.data);
          const found = json.data.find(
            (t: Template) => t.slug === templateSlugParam || t.id === templateSlugParam
          );
          if (found) {
            setSelectedTemplateId(found.id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch templates', err);
      }
    }
    loadTemplates();
  }, [templateSlugParam]);

  // Auto-slugify when display name changes if slug hasn't been manually heavily customized
  const handleNameChange = (name: string) => {
    setDisplayName(name);
    const generated = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Please enter a display name or business name.');
      return;
    }

    if (!slug.trim()) {
      setError('Please provide a unique profile URL slug.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          headline: headline.trim() || undefined,
          slug: slug.trim(),
          profileType,
          templateId: selectedTemplateId,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to create profile.');
      }

      const created = json.data;
      router.push(`/builder/${created.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/templates" className="hover:text-foreground">
            Templates
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Create Profile</span>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <Badge variant="gold" className="mb-3">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Step 1 of 2: Profile Setup
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Create Your Digital Identity
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure your core profile identity and choose your presentation mode on {defaultBrandConfig.name}.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6 bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Profile Type Selector */}
          <div>
            <label className="block text-sm font-semibold mb-3">Select Profile Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setProfileType('personal')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  profileType === 'personal'
                    ? 'border-gold bg-gold/5 shadow-sm'
                    : 'border-border/80 bg-background hover:bg-card/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-gold/15 text-gold">
                    <User className="w-5 h-5" />
                  </div>
                  {profileType === 'personal' && <Check className="w-4 h-4 text-gold" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Personal Profile</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    For founders, executives & creators. Supports showcasing multiple businesses under one profile.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProfileType('business')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  profileType === 'business'
                    ? 'border-gold bg-gold/5 shadow-sm'
                    : 'border-border/80 bg-background hover:bg-card/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-gold/15 text-gold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  {profileType === 'business' && <Check className="w-4 h-4 text-gold" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Single Business Profile</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Dedicated standalone company identity with products, services catalogue, and brochure downloads.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Name & Headline */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                {profileType === 'personal' ? 'Your Full Name' : 'Company / Business Name'} *
              </label>
              <Input
                type="text"
                placeholder={profileType === 'personal' ? 'e.g. John Mathew' : 'e.g. ABC Technologies Pvt Ltd'}
                value={displayName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Headline / Title
              </label>
              <Input
                type="text"
                placeholder={profileType === 'personal' ? 'e.g. Managing Director & Tech Investor' : 'e.g. Next-Gen Enterprise Cloud Architecture'}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          {/* Custom Slug */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-foreground">
              Profile URL Slug *
            </label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 h-11 rounded-l-md border border-r-0 border-border bg-muted text-xs text-muted-foreground">
                {defaultBrandConfig.primaryDomain}/p/
              </span>
              <Input
                type="text"
                placeholder="yourname"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                required
                className="rounded-l-none h-11 font-mono text-sm"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              This will be your permanent public link and NFC smart card destination.
            </p>
          </div>

          {/* Template Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-foreground">
                Visual Template
              </label>
              <Link href="/templates" className="text-xs text-gold hover:underline">
                Browse All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedTemplateId === tpl.id
                      ? 'border-gold bg-gold/10 shadow-sm'
                      : 'border-border/60 bg-background/50 hover:bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate text-foreground">{tpl.name}</span>
                    {selectedTemplateId === tpl.id && <Check className="w-3.5 h-3.5 text-gold shrink-0" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase">{tpl.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
            <Link href="/dashboard">
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gold text-gold-foreground hover:bg-gold-light font-semibold"
            >
              {isLoading ? 'Creating Profile...' : 'Open Profile Builder'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

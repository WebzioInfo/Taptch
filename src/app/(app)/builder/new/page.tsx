'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Title */}
        <div className="border-b border-border/60 pb-4">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Create Profile
          </h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/15 border border-destructive/30 text-destructive text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5 bg-card/40 border border-border/70 rounded-xl p-5 shadow-sm">
          {/* Profile Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProfileType('personal')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  profileType === 'personal'
                    ? 'border-gold bg-gold/10'
                    : 'border-border/70 bg-background hover:bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-foreground">Personal</div>
                  {profileType === 'personal' && <Check className="w-3.5 h-3.5 text-gold" />}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Individuals & executives
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProfileType('business')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  profileType === 'business'
                    ? 'border-gold bg-gold/10'
                    : 'border-border/70 bg-background hover:bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-foreground">Business</div>
                  {profileType === 'business' && <Check className="w-3.5 h-3.5 text-gold" />}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Standalone company
                </div>
              </button>
            </div>
          </div>

          {/* Name & Headline */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {profileType === 'personal' ? 'Name' : 'Company Name'} *
              </label>
              <Input
                type="text"
                placeholder={profileType === 'personal' ? 'John Mathew' : 'ABC Tech'}
                value={displayName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Headline
              </label>
              <Input
                type="text"
                placeholder={profileType === 'personal' ? 'Managing Director' : 'Cloud Architecture'}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Slug *
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 h-9 rounded-l-md border border-r-0 border-border bg-muted/30 text-xs text-muted-foreground font-mono">
                  /p/
                </span>
                <Input
                  type="text"
                  placeholder="yourname"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                  required
                  className="rounded-l-none h-9 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Template
              </label>
              <Link href="/templates" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {templates.slice(0, 6).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedTemplateId === tpl.id
                      ? 'border-gold bg-gold/10'
                      : 'border-border/60 bg-background/50 hover:bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate text-foreground">{tpl.name}</span>
                    {selectedTemplateId === tpl.id && <Check className="w-3 h-3 text-gold shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
            <Link href="/dashboard">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-8 text-xs font-semibold bg-gold text-neutral-950 hover:bg-gold-light"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

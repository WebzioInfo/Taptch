'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { FormField, FormLabel, FormError } from '@/components/ui/form-field';
import { useToast } from '@/components/ui/use-toast';
import type { Template } from '@/modules/templates';

export default function NewProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateSlugParam = searchParams.get('template') || 'obsidian-luxury';

  const [step, setStep] = useState<1 | 2>(1);
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

  const handleNameChange = (name: string) => {
    setDisplayName(name);
    const generated = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        displayName,
        headline,
        slug: slug || undefined,
        profileType,
        templateId: selectedTemplateId,
      };

      const res = await fetch('/api/v1/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to create profile');
      }

      router.push(`/builder/${data.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 antialiased">
      {/* Onboarding Journey Progress Indicator */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Step {step} of 2</span>
          <span>{step === 1 ? 'Profile Details' : 'Select Style'}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      <div className="text-center space-y-1 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {step === 1 ? 'Build your profile' : 'Choose your profile style'}
        </h1>
        <p className="text-xs text-slate-500">
          {step === 1
            ? 'Enter your essential identity details to get started.'
            : 'Select the visual presentation for your digital profile.'}
        </p>
      </div>

      {error && (
        <FormError message={error} className="mb-6 p-3 rounded-md bg-red-50 border border-red-200" />
      )}

      <Card className="border border-slate-200 bg-white shadow-xs rounded-lg overflow-hidden">
        <CardContent className="p-6">
          {step === 1 ? (
            <div className="space-y-5">
              {/* Profile Type Toggle */}
              <div className="space-y-1.5 text-left">
                <FormLabel>Profile Type</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProfileType('personal')}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
                      profileType === 'personal'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Personal Identity
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileType('business')}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
                      profileType === 'business'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Business Identity
                  </button>
                </div>
              </div>

              {/* Display Name */}
              <FormField>
                <FormLabel htmlFor="displayName" required>
                  Full Name / Entity Name
                </FormLabel>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Aditya Sharma"
                  required
                  className="h-9 text-xs"
                  autoFocus
                />
              </FormField>

              {/* Headline */}
              <FormField>
                <FormLabel htmlFor="headline">
                  Professional Title / Role
                </FormLabel>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Founder & Managing Director"
                  className="h-9 text-xs"
                />
              </FormField>

              {/* Profile Link Slug */}
              <FormField>
                <FormLabel htmlFor="slug">
                  Profile Link
                </FormLabel>
                <div className="flex rounded-md border border-slate-200 bg-slate-50 px-3 items-center text-xs">
                  <span className="text-slate-400 select-none">/p/</span>
                  <input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="your-name"
                    className="flex-1 bg-transparent py-2 px-1 text-slate-900 focus:outline-none"
                  />
                </div>
              </FormField>

              <div className="pt-2">
                <Button
                  type="button"
                  disabled={!displayName.trim()}
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5"
                >
                  <span>Continue to style</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {templates.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id || selectedTemplateId === tpl.slug;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`cursor-pointer rounded-lg border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/40'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-900">{tpl.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="text-xs h-9 border-slate-300 text-slate-700"
                >
                  Back
                </Button>

                <LoadingButton
                  type="submit"
                  loading={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9"
                >
                  Create Profile
                </LoadingButton>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

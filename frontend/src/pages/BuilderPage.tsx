import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { ProfileRenderer, canonicalTemplateId } from '../components/templates/ProfileRenderer';
import { MiniatureThemeCardPreview } from '../components/templates/MiniatureThemeCardPreview';
import {
  STANDARD_TEMPLATES,
  getTemplateDefaultThemeConfig,
} from '../modules/templates/constants';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  ArrowLeft,
  Save,
  Globe,
  Sparkles,
  Smartphone,
  Eye,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
  Palette,
  User,
  Share2,
  Briefcase,
  ShoppingBag,
} from 'lucide-react';

export function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isNew = id === 'new' || !id;

  // Active editor tab
  const [activeTab, setActiveTab] = useState<'identity' | 'theme' | 'socials' | 'businesses' | 'catalogue' | 'seo'>('theme');
  // Mobile preview toggle (when on mobile screen, toggle between form and phone view)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Form State
  const [profileType, setProfileType] = useState<'personal' | 'business'>('personal');
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [templateId, setTemplateId] = useState('premium-brand');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [themeColors, setThemeColors] = useState<Record<string, string>>(() =>
    getTemplateDefaultThemeConfig('premium-brand') as any
  );
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([]);
  const [businesses, setBusinesses] = useState<Array<any>>([]);
  const [catalogue, setCatalogue] = useState<Array<any>>([]);
  const [themeCustomizations, setThemeCustomizations] = useState<Record<string, Record<string, string>>>({});

  const handleSelectTheme = (newTemplateId: string) => {
    const canonical = canonicalTemplateId(newTemplateId);
    if (canonical === templateId) return;
    setThemeCustomizations((prev) => ({
      ...prev,
      [templateId]: themeColors,
    }));
    const nextConfig = themeCustomizations[canonical] || getTemplateDefaultThemeConfig(canonical);
    setTemplateId(canonical);
    setThemeColors(nextConfig as any);
  };

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch existing profile if editing
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => ApiClient.get<any>(`/api/v1/profiles/${id}`),
    enabled: !isNew && Boolean(id),
  });

  // Populate form when data loads
  useEffect(() => {
    if (profile) {
      setProfileType(profile.profileType === 'business' ? 'business' : 'personal');
      setDisplayName(profile.displayName || '');
      setSlug(profile.slug || '');
      setHeadline(profile.headline || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
      setCoverUrl(profile.coverUrl || '');
      setPhone(profile.phone || '');
      setWhatsapp(profile.whatsapp || '');
      setEmail(profile.email || '');
      setWebsite(profile.website || '');
      setAddress(profile.address || '');
      const loadedTpl = canonicalTemplateId(profile.templateId || profile.themeId || 'premium-brand');
      setTemplateId(loadedTpl);
      if (profile.customFields?.seo) {
        setSeoTitle(profile.customFields.seo.title || '');
        setSeoDescription(profile.customFields.seo.description || '');
      }
        if (profile.themeConfig && Object.keys(profile.themeConfig).length > 0) {
          setThemeColors(profile.themeConfig);
        } else {
          setThemeColors(getTemplateDefaultThemeConfig(loadedTpl) as any);
        }
        if (Array.isArray(profile.socialLinks)) {
          setSocialLinks(profile.socialLinks);
        }
        if (Array.isArray(profile.businesses)) {
          setBusinesses(profile.businesses);
        }
        if (Array.isArray(profile.catalogue)) {
          setCatalogue(profile.catalogue);
        }
      }
    }, [profile]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (publish: boolean = false) => {
      const payload = {
        profileType,
        displayName: displayName.trim(),
        slug: slug.trim().toLowerCase(),
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        coverUrl: coverUrl.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        address: address.trim() || null,
        templateId,
        themeId: templateId,
        customFields: {
          seo: {
            title: seoTitle.trim() || undefined,
            description: seoDescription.trim() || undefined,
          },
        },
        themeConfig: themeColors,
        socialLinks,
        businesses,
        catalogue,
      };

      let profileId = id;
      if (isNew) {
        const created: any = await ApiClient.post('/api/v1/profiles', payload);
        profileId = created.id;
      } else {
        await ApiClient.patch(`/api/v1/profiles/${id}`, payload);
      }

      if (publish && profileId) {
        await ApiClient.post(`/api/v1/profiles/${profileId}/publish`);
      }

      return profileId;
    },
    onSuccess: (savedId) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile', savedId] });
      setNotification({ type: 'success', message: 'Profile saved successfully!' });
      setTimeout(() => setNotification(null), 3000);
      if (isNew && savedId) {
        navigate(`/builder/${savedId}`, { replace: true });
      }
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to save profile. Please check required fields.',
      });
    },
  });

  // Construct Live Profile preview snapshot
  const livePreviewData: any = {
    id: id || 'preview-id',
    slug: slug || 'preview',
    displayName: displayName || 'Your Full Name',
    headline: headline || 'Your Professional Title / Role',
    bio: bio || 'Welcome to my digital business card. Tap any button below to connect with me.',
    avatarUrl: avatarUrl || undefined,
    coverUrl: coverUrl || undefined,
    phone: phone || undefined,
    whatsapp: whatsapp || undefined,
    email: email || undefined,
    website: website || undefined,
    address: address || undefined,
    templateId,
    profileType,
    themeConfig: themeColors,
    socialLinks,
    businesses: profileType === 'business'
      ? businesses
        .filter((b) => Boolean((b.companyName || b.name || '').trim()))
        .map((b, i) => ({
          id: b.id || `biz-${i}`,
          companyName: (b.companyName || b.name || '').trim(),
          roleTitle: (b.jobTitle || b.tagline || '').trim() || undefined,
          websiteUrl: (b.websiteUrl || b.businessWebsite || b.website || '').trim() || undefined,
          address: (b.address || b.businessAddress || '').trim() || undefined,
          logoUrl: b.logoUrl || undefined,
        }))
      : [],
    catalogue: profileType === 'business'
      ? catalogue
        .filter((c) => Boolean((c.title || '').trim()))
        .map((c, i) => ({
          id: c.id || `cat-${i}`,
          title: (c.title || '').trim(),
          itemType: c.type || c.itemType || 'product',
          description: (c.description || '').trim() || undefined,
          price: (c.price || '').trim() || undefined,
          imageUrl: (c.imageUrl || '').trim() || undefined,
          actionUrl: (c.actionUrl || '').trim() || undefined,
          currency: c.currency || '₹',
        }))
      : [],
    isDemo: false,
    previewPlanId: 'max',
  };

  const handleAddSocial = () => {
    setSocialLinks([...socialLinks, { platform: 'instagram', url: 'https://' }]);
  };

  const handleUpdateSocial = (index: number, key: 'platform' | 'url', val: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [key]: val };
    setSocialLinks(updated);
  };

  const handleRemoveSocial = (index: number) => {
    setSocialLinks(socialLinks.filter((_, idx) => idx !== index));
  };

  const handleAddBusiness = () => {
    setBusinesses([
      ...businesses,
      {
        id: crypto.randomUUID(),
        companyName: '',
        jobTitle: '',
        businessWebsite: '',
        businessAddress: '',
      },
    ]);
  };

  const handleAddCatalogue = () => {
    setCatalogue([
      ...catalogue,
      {
        id: crypto.randomUUID(),
        title: '',
        type: 'product',
        price: '₹',
        description: '',
        actionUrl: '',
      },
    ]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const tabList = [
    { id: 'theme', label: '1. Theme & Style', shortLabel: 'Theme', icon: Palette },
    { id: 'identity', label: profileType === 'personal' ? '2. Identity & Card' : '2. Company Info', shortLabel: profileType === 'personal' ? 'Identity' : 'Company', icon: User },
    { id: 'socials', label: '3. Social Channels', shortLabel: 'Socials', icon: Share2 },
    ...(profileType === 'business'
      ? [
        { id: 'businesses', label: '4. Companies & Locations', shortLabel: 'Companies', icon: Briefcase },
        { id: 'catalogue', label: '5. Products & Services', shortLabel: 'Catalogue', icon: ShoppingBag },
      ]
      : []),
    { id: 'seo', label: `${profileType === 'business' ? '6' : '4'}. SEO & Cards`, shortLabel: 'SEO', icon: Globe },
  ];
  const activeTabObj = tabList.find((t) => t.id === activeTab);
  const activeTabShort = activeTabObj?.shortLabel ?? 'Edit';

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F4F4F6] flex flex-col">
      {/* Studio Header Bar */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 bg-[#121216] border-b border-border/40 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <Link
            to="/dashboard"
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors shrink-0"
            title="Back to Profiles"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
              <span className="truncate">{displayName || 'New Profile Studio'}</span>
              {slug && (
                <a
                  href={`/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden md:inline-flex items-center text-[10px] text-primary hover:underline font-mono shrink-0"
                >
                  <span>/{slug}</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-1" />
                </a>
              )}
            </h1>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
              Mobile-First Profile &amp; Template Studio
            </p>
          </div>
        </div>

        {/* Mobile View Toggle Switch */}
        <div className="lg:hidden flex items-center bg-black/60 p-0.5 sm:p-1 rounded-xl border border-white/10 shrink-0 mx-2">
          <button
            type="button"
            onClick={() => setMobileView('editor')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${mobileView === 'editor' ? 'bg-primary text-black shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMobileView('preview')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${mobileView === 'preview' ? 'bg-primary text-black shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>

        {/* Save & Publish Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <Button
            type="button"
            onClick={() => saveMutation.mutate(false)}
            disabled={saveMutation.isPending}
            variant="outline"
            className="bg-white/5 hover:bg-white/10 text-white border-white/10 text-xs rounded-xl h-8 sm:h-9 px-2.5 sm:px-3 gap-1.5"
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Save Draft</span>
          </Button>

          <Button
            type="button"
            onClick={() => saveMutation.mutate(true)}
            disabled={saveMutation.isPending}
            className="bg-primary hover:bg-primary-hover text-black font-bold text-xs rounded-xl h-8 sm:h-9 px-3 sm:px-4 gap-1.5 shadow-md"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Publish</span>
          </Button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold ${notification.type === 'success'
            ? 'bg-emerald-500 text-black border border-emerald-400'
            : 'bg-red-500 text-white border border-red-400'
            }`}
        >
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Studio Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Editor Panels */}
        <div
          className={`w-full lg:w-3/5 xl:w-7/12 border-r border-border/40 overflow-y-auto p-4 sm:p-8 ${mobileView === 'preview' ? 'hidden lg:block' : 'block'
            }`}
        >
          {/* Profile Architecture Selector (Personal vs Business) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#121216] border border-border/50 mb-6">
            <button
              type="button"
              onClick={() => {
                setProfileType('personal');
                if (activeTab === 'businesses' || activeTab === 'catalogue') {
                  setActiveTab('identity');
                }
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${profileType === 'personal'
                ? 'bg-primary text-black shadow-md'
                : 'text-muted-foreground hover:text-white'
                }`}
            >
              <User className="w-4 h-4" />
              <span>Personal Visiting Card</span>
            </button>
            <button
              type="button"
              onClick={() => setProfileType('business')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${profileType === 'business'
                ? 'bg-primary text-black shadow-md'
                : 'text-muted-foreground hover:text-white'
                }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Business &amp; Services Profile</span>
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-6 border-b border-border/40 scrollbar-none">
            {tabList.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${activeTab === tab.id
                    ? 'bg-primary text-black shadow-md'
                    : 'bg-[#121216] border border-border/50 text-muted-foreground hover:text-white'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: IDENTITY & BASIC CONTACT */}
          {activeTab === 'identity' && (
            <div className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Full Display Name *</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Vikramaditya Singhania"
                    className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Public Card Handle / Slug *</Label>
                  <div className="mt-1.5 flex rounded-xl overflow-hidden border border-border bg-[#121216]">
                    <span className="px-3 py-2 text-xs text-muted-foreground bg-white/5 border-r border-border font-mono">
                      /
                    </span>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="vikram"
                      className="flex-1 px-3 py-2 bg-transparent text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Professional Headline / Role</Label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Managing Partner • Global Investment Banking"
                  className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Bio / About Me</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Brief introductory summary of your background, achievements, and focus areas..."
                  className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
                <div>
                  <Label className="text-xs text-muted-foreground">Profile Avatar Image URL</Label>
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cover Banner Image URL</Label>
                  <Input
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Direct Contact Coordinates */}
              <div className="pt-4 border-t border-border/40 space-y-4">
                <h3 className="text-sm font-bold text-white">Direct Contact Coordinates</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Direct Phone Number</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">WhatsApp Direct Number</Label>
                    <Input
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Business Email Address</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vikram@taptch.com"
                      className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Official Website URL</Label>
                    <Input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://taptch.com"
                      className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Office / Physical Address</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Level 28, One World Centre, Lower Parel, Mumbai"
                    className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: AUTOMATED SEO & SOCIAL CARDS */}
          {activeTab === 'seo' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Automated Search Engine &amp; Social Card Metadata
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Taptch automatically builds crawler-ready Open Graph and Schema.org rich tags. You can fine-tune titles and summaries here.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Custom Meta Title</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(seoTitle || displayName).length}/60 chars
                    </span>
                  </div>
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={
                      profileType === 'business'
                        ? `${displayName || 'Acme Corp'} | Official Business Profile & Offerings`
                        : `${displayName || 'John Doe'} — ${headline || 'Digital Identity & Visiting Card'}`
                    }
                    className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Leave blank to automatically inherit profile title.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Custom Meta Description</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(seoDescription || bio).length}/160 chars
                    </span>
                  </div>
                  <Textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={3}
                    placeholder={
                      bio
                        ? bio.slice(0, 150)
                        : `Connect with ${displayName || 'our profile'} on Taptch. Explore portfolio, direct contact exchange, and verified digital identity.`
                    }
                    className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Summarizes your profile in search engine results and social chat previews.
                  </p>
                </div>
              </div>

              {/* Live Search Engine Result Mockup */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white">Google Search Result Preview</Label>
                <div className="p-4 rounded-2xl bg-[#18181D] border border-border/60 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                      T
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">
                      https://taptch.com/{slug || 'username'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                    {seoTitle || (profileType === 'business' ? `${displayName || 'Business Name'} | Official Business Profile` : `${displayName || 'Full Name'} — ${headline || 'Digital Identity'}`)}
                  </h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {seoDescription || bio || `Connect with ${displayName || 'this professional'} on Taptch - Intelligent Digital Identity & Smart Contact Exchange.`}
                  </p>
                </div>
              </div>

              {/* Live WhatsApp / Social Card Preview */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white">Social Media &amp; WhatsApp Card Preview</Label>
                <div className="rounded-2xl border border-border/60 bg-[#121216] overflow-hidden max-w-md shadow-xl">
                  <div className="h-40 bg-neutral-900 relative overflow-hidden flex items-center justify-center">
                    {avatarUrl || coverUrl ? (
                      <img
                        src={coverUrl || avatarUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground p-4">
                        <Globe className="w-8 h-8 mx-auto mb-1 opacity-40" />
                        <span className="text-[11px]">Upload cover/avatar for rich social card image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-[#18181D] space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                      TAPTCH.COM
                    </span>
                    <h5 className="font-bold text-sm text-white truncate">
                      {seoTitle || displayName || 'Digital Profile'}
                    </h5>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {seoDescription || bio || 'Tap to connect and exchange verified contact identity.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: THEME & TEMPLATE SELECTOR (STEP 1) */}
          {activeTab === 'theme' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <span>Step 1 &mdash; Select Visual Identity Template</span>
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Select your architectural layout. Every theme automatically adapts your contact details and products, immediately visible in the live smartphone simulator.
                </p>

                {/* Responsive Theme Card Grid: 3 cols desktop, 2 cols tablet/mobile, 1 col small phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                  {STANDARD_TEMPLATES.map((tpl) => {
                    const canonical = canonicalTemplateId(tpl.id);
                    const isSelected = templateId === canonical || templateId === canonicalTemplateId(tpl.slug);
                    const defaults = getTemplateDefaultThemeConfig(canonical);
                    const rawCustom = isSelected ? themeColors : (themeCustomizations[canonical] || {});
                    const cardColors: any = { ...defaults, ...rawCustom };

                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectTheme(tpl.id)}
                        className={`group relative cursor-pointer rounded-xl overflow-hidden border transition-all duration-200 flex flex-col ${isSelected
                            ? 'bg-[#18181D] border-primary shadow-md ring-1.5 ring-primary/80 ring-offset-1 ring-offset-[#0A0A0C]'
                            : 'bg-[#121216] border-border/50 hover:border-white/30 hover:shadow-sm'
                          }`}
                          >
                        {/* Compact Miniature Theme Preview Frame */}
                        <div className="relative w-full h-20 sm:h-22 overflow-hidden bg-black/40 border-b border-border/40 shrink-0">
                          <MiniatureThemeCardPreview
                            templateId={tpl.id}
                            colors={cardColors}
                            displayName={displayName}
                            headline={headline}
                            avatarUrl={avatarUrl}
                          />

                          {/* Selected Badge Overlay */}
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary text-black text-[8px] font-bold shadow-md">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              <span>Active</span>
                            </div>
                          )}

                          {/* Hover preview hint */}
                          {!isSelected && (
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-white text-[9px] font-medium border border-white/20 shadow">
                                Select
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Compact Theme Card Metadata */}
                        <div className="p-2 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h4 className="text-[11px] font-bold text-white group-hover:text-primary transition-colors truncate">
                                {tpl.name}
                              </h4>
                              <span className="text-[8px] text-primary uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-primary/10 border border-primary/20 shrink-0">
                                {tpl.requiredPlanId || 'Free'}
                              </span>
                            </div>
                            <p className="text-[9px] text-muted-foreground line-clamp-1 leading-tight">
                              {tpl.description}
                            </p>
                          </div>

                          <div className="mt-1.5 pt-1 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] text-neutral-400 capitalize flex items-center gap-1 truncate">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cardColors.primary }} />
                              <span className="truncate">{tpl.category}</span>
                            </span>
                            <span className="text-[8.5px] text-muted-foreground/60 font-mono shrink-0">
                              {tpl.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Theme Colors */}
              <div className="pt-6 border-t border-border/40 space-y-4">
                <h3 className="text-sm font-bold text-white">Custom Accent Colors</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Primary Accent</Label>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <input
                        type="color"
                        value={themeColors.primary || '#D4AF37'}
                        onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={themeColors.primary || '#D4AF37'}
                        onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                        className="w-full px-2 py-1 rounded bg-[#121216] border border-border text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] text-muted-foreground">Background</Label>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <input
                        type="color"
                        value={themeColors.background || '#0A0A0C'}
                        onChange={(e) => setThemeColors({ ...themeColors, background: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={themeColors.background || '#0A0A0C'}
                        onChange={(e) => setThemeColors({ ...themeColors, background: e.target.value })}
                        className="w-full px-2 py-1 rounded bg-[#121216] border border-border text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] text-muted-foreground">Card Surface</Label>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <input
                        type="color"
                        value={themeColors.surface || '#121216'}
                        onChange={(e) => setThemeColors({ ...themeColors, surface: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={themeColors.surface || '#121216'}
                        onChange={(e) => setThemeColors({ ...themeColors, surface: e.target.value })}
                        className="w-full px-2 py-1 rounded bg-[#121216] border border-border text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AUTOMATED SEO & SOCIAL CARDS */}
          {activeTab === 'seo' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Automated Search Engine &amp; Social Card Metadata
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Taptch automatically builds crawler-ready Open Graph and Schema.org rich tags. You can fine-tune titles and summaries here.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Custom Meta Title</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(seoTitle || displayName).length}/60 chars
                    </span>
                  </div>
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={
                      profileType === 'business'
                        ? `${displayName || 'Acme Corp'} | Official Business Profile & Offerings`
                        : `${displayName || 'John Doe'} — ${headline || 'Digital Identity & Visiting Card'}`
                    }
                    className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Leave blank to automatically inherit profile title.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Custom Meta Description</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(seoDescription || bio).length}/160 chars
                    </span>
                  </div>
                  <Textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={3}
                    placeholder={
                      bio
                        ? bio.slice(0, 150)
                        : `Connect with ${displayName || 'our profile'} on Taptch. Explore portfolio, direct contact exchange, and verified digital identity.`
                    }
                    className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Summarizes your profile in search engine results and social chat previews.
                  </p>
                </div>
              </div>

              {/* Live Search Engine Result Mockup */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white">Google Search Result Preview</Label>
                <div className="p-4 rounded-2xl bg-[#18181D] border border-border/60 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                      T
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">
                      https://taptch.com/{slug || 'username'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                    {seoTitle || (profileType === 'business' ? `${displayName || 'Business Name'} | Official Business Profile` : `${displayName || 'Full Name'} — ${headline || 'Digital Identity'}`)}
                  </h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {seoDescription || bio || `Connect with ${displayName || 'this professional'} on Taptch - Intelligent Digital Identity & Smart Contact Exchange.`}
                  </p>
                </div>
              </div>

              {/* Live WhatsApp / Social Card Preview */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white">Social Media &amp; WhatsApp Card Preview</Label>
                <div className="rounded-2xl border border-border/60 bg-[#121216] overflow-hidden max-w-md shadow-xl">
                  <div className="h-40 bg-neutral-900 relative overflow-hidden flex items-center justify-center">
                    {avatarUrl || coverUrl ? (
                      <img
                        src={coverUrl || avatarUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground p-4">
                        <Globe className="w-8 h-8 mx-auto mb-1 opacity-40" />
                        <span className="text-[11px]">Upload cover/avatar for rich social card image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-[#18181D] space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                      TAPTCH.COM
                    </span>
                    <h5 className="font-bold text-sm text-white truncate">
                      {seoTitle || displayName || 'Digital Profile'}
                    </h5>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {seoDescription || bio || 'Tap to connect and exchange verified contact identity.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOCIAL MEDIA LINKS */}
          {activeTab === 'socials' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Social & Channel Links</h3>
                  <p className="text-xs text-muted-foreground">Display high-impact icons for your network channels</p>
                </div>
                <Button
                  type="button"
                  onClick={handleAddSocial}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-xs rounded-xl h-8 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </Button>
              </div>

              <div className="space-y-3">
                {socialLinks.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-[#121216] p-3 rounded-xl border border-border/60">
                    <select
                      value={item.platform}
                      onChange={(e) => handleUpdateSocial(idx, 'platform', e.target.value)}
                      className="px-2.5 py-1.5 bg-[#18181D] border border-border text-xs text-white rounded-lg focus:outline-none"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="twitter">Twitter / X</option>
                      <option value="youtube">YouTube</option>
                      <option value="github">GitHub</option>
                      <option value="telegram">Telegram</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="website">Custom Website</option>
                    </select>

                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => handleUpdateSocial(idx, 'url', e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-1.5 bg-[#18181D] border border-border text-xs text-white rounded-lg focus:outline-none font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveSocial(idx)}
                      className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Remove Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {socialLinks.length === 0 && (
                  <div className="text-center py-12 rounded-xl border border-dashed border-border/60 bg-[#121216]/50">
                    <Share2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-muted-foreground">No social media links added yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: AUTOMATED SEO & SOCIAL CARDS */}
          {activeTab === 'seo' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Automated Search Engine &amp; Social Card Metadata
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Taptch automatically builds crawler-ready Open Graph and Schema.org rich tags. You can fine-tune titles and summaries here.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Custom Meta Title</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(seoTitle || displayName).length}/60 chars
                    </span>
                  </div>
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={
                      profileType === 'business'
                        ? `${displayName || 'Acme Corp'} | Official Business Profile & Offerings`
                        : `${displayName || 'John Doe'} — ${headline || 'Digital Identity & Visiting Card'}`
                    }
                    className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Leave blank to automatically inherit profile title.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Custom Meta Description</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(seoDescription || bio).length}/160 chars
                    </span>
                  </div>
                  <Textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={3}
                    placeholder={
                      bio
                        ? bio.slice(0, 150)
                        : `Connect with ${displayName || 'our profile'} on Taptch. Explore portfolio, direct contact exchange, and verified digital identity.`
                    }
                    className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Summarizes your profile in search engine results and social chat previews.
                  </p>
                </div>
              </div>

              {/* Live Search Engine Result Mockup */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white">Google Search Result Preview</Label>
                <div className="p-4 rounded-2xl bg-[#18181D] border border-border/60 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                      T
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">
                      https://taptch.com/{slug || 'username'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                    {seoTitle || (profileType === 'business' ? `${displayName || 'Business Name'} | Official Business Profile` : `${displayName || 'Full Name'} — ${headline || 'Digital Identity'}`)}
                  </h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {seoDescription || bio || `Connect with ${displayName || 'this professional'} on Taptch - Intelligent Digital Identity & Smart Contact Exchange.`}
                  </p>
                </div>
              </div>

              {/* Live WhatsApp / Social Card Preview */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white">Social Media &amp; WhatsApp Card Preview</Label>
                <div className="rounded-2xl border border-border/60 bg-[#121216] overflow-hidden max-w-md shadow-xl">
                  <div className="h-40 bg-neutral-900 relative overflow-hidden flex items-center justify-center">
                    {avatarUrl || coverUrl ? (
                      <img
                        src={coverUrl || avatarUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground p-4">
                        <Globe className="w-8 h-8 mx-auto mb-1 opacity-40" />
                        <span className="text-[11px]">Upload cover/avatar for rich social card image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-[#18181D] space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                      TAPTCH.COM
                    </span>
                    <h5 className="font-bold text-sm text-white truncate">
                      {seoTitle || displayName || 'Digital Profile'}
                    </h5>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {seoDescription || bio || 'Tap to connect and exchange verified contact identity.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BUSINESSES & VENTURES */}
          {activeTab === 'businesses' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Associated Businesses & Roles</h3>
                  <p className="text-xs text-muted-foreground">Showcase multiple companies or boards you lead</p>
                </div>
                <Button
                  type="button"
                  onClick={handleAddBusiness}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-xs rounded-xl h-8 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Company</span>
                </Button>
              </div>

              <div className="space-y-4">
                {businesses.map((biz, idx) => (
                    <div key={biz.id || `biz-${idx}`} className="p-4 rounded-2xl bg-[#121216] border border-border/60 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <span className="text-xs font-bold text-primary">Company #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setBusinesses(businesses.filter((_, i) => i !== idx))}
                          className="text-xs text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Company Name *</Label>
                          <Input
                            value={biz.companyName ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBusinesses((prev) =>
                                prev.map((b, i) => (i === idx ? { ...b, companyName: val, name: val } : b))
                              );
                            }}
                            placeholder="e.g. Acme Innovations"
                            className="mt-1 bg-[#18181D] border-border text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Designation / Role</Label>
                          <Input
                            value={biz.jobTitle ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBusinesses((prev) =>
                                prev.map((b, i) => (i === idx ? { ...b, jobTitle: val, tagline: val } : b))
                              );
                            }}
                            placeholder="e.g. Co-Founder & CTO"
                            className="mt-1 bg-[#18181D] border-border text-xs rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Website URL</Label>
                          <Input
                            value={biz.businessWebsite ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBusinesses((prev) =>
                                prev.map((b, i) => (i === idx ? { ...b, businessWebsite: val, websiteUrl: val } : b))
                              );
                            }}
                            placeholder="https://..."
                            className="mt-1 bg-[#18181D] border-border text-xs rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Location</Label>
                          <Input
                            value={biz.businessAddress ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBusinesses((prev) =>
                                prev.map((b, i) => (i === idx ? { ...b, businessAddress: val, address: val } : b))
                              );
                            }}
                            placeholder="Bengaluru, India"
                            className="mt-1 bg-[#18181D] border-border text-xs rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                        ))}

                    {businesses.length === 0 && (
                      <div className="text-center py-12 rounded-xl border border-dashed border-border/60 bg-[#121216]/50">
                        <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-muted-foreground">No business entities added yet.</p>
                      </div>
                    )}
                  </div>
                    </div>
                  )}

              {/* TAB: AUTOMATED SEO & SOCIAL CARDS */}
              {activeTab === 'seo' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      Automated Search Engine &amp; Social Card Metadata
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Taptch automatically builds crawler-ready Open Graph and Schema.org rich tags. You can fine-tune titles and summaries here.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Custom Meta Title</Label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {(seoTitle || displayName).length}/60 chars
                        </span>
                      </div>
                      <Input
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder={
                          profileType === 'business'
                            ? `${displayName || 'Acme Corp'} | Official Business Profile & Offerings`
                            : `${displayName || 'John Doe'} — ${headline || 'Digital Identity & Visiting Card'}`
                        }
                        className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Leave blank to automatically inherit profile title.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Custom Meta Description</Label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {(seoDescription || bio).length}/160 chars
                        </span>
                      </div>
                      <Textarea
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        rows={3}
                        placeholder={
                          bio
                            ? bio.slice(0, 150)
                            : `Connect with ${displayName || 'our profile'} on Taptch. Explore portfolio, direct contact exchange, and verified digital identity.`
                        }
                        className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl resize-none"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Summarizes your profile in search engine results and social chat previews.
                      </p>
                    </div>
                  </div>

                  {/* Live Search Engine Result Mockup */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-white">Google Search Result Preview</Label>
                    <div className="p-4 rounded-2xl bg-[#18181D] border border-border/60 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                          T
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">
                          https://taptch.com/{slug || 'username'}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                        {seoTitle || (profileType === 'business' ? `${displayName || 'Business Name'} | Official Business Profile` : `${displayName || 'Full Name'} — ${headline || 'Digital Identity'}`)}
                      </h4>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {seoDescription || bio || `Connect with ${displayName || 'this professional'} on Taptch - Intelligent Digital Identity & Smart Contact Exchange.`}
                      </p>
                    </div>
                  </div>

                  {/* Live WhatsApp / Social Card Preview */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-white">Social Media &amp; WhatsApp Card Preview</Label>
                    <div className="rounded-2xl border border-border/60 bg-[#121216] overflow-hidden max-w-md shadow-xl">
                      <div className="h-40 bg-neutral-900 relative overflow-hidden flex items-center justify-center">
                        {avatarUrl || coverUrl ? (
                          <img
                            src={coverUrl || avatarUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-muted-foreground p-4">
                            <Globe className="w-8 h-8 mx-auto mb-1 opacity-40" />
                            <span className="text-[11px]">Upload cover/avatar for rich social card image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-[#18181D] space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                          TAPTCH.COM
                        </span>
                        <h5 className="font-bold text-sm text-white truncate">
                          {seoTitle || displayName || 'Digital Profile'}
                        </h5>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {seoDescription || bio || 'Tap to connect and exchange verified contact identity.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PRODUCTS & CATALOGUE */}
              {activeTab === 'catalogue' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Catalogue & Services</h3>
                      <p className="text-xs text-muted-foreground">Showcase key offerings with direct enquiry actions</p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddCatalogue}
                      variant="outline"
                      className="bg-white/5 border-white/10 text-xs rounded-xl h-8 gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {catalogue.map((cat, idx) => (
                        <div key={cat.id || `cat-${idx}`} className="p-4 rounded-2xl bg-[#121216] border border-border/60 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <span className="text-xs font-bold text-primary">Item #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setCatalogue(catalogue.filter((_, i) => i !== idx))}
                              className="text-xs text-muted-foreground hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <Label className="text-[11px] text-muted-foreground">Title *</Label>
                              <Input
                                value={cat.title ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCatalogue((prev) =>
                                    prev.map((c, i) => (i === idx ? { ...c, title: val } : c))
                                  );
                                }}
                                placeholder="e.g. Enterprise Consulting"
                                className="mt-1 bg-[#18181D] border-border text-xs rounded-xl"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] text-muted-foreground">Price</Label>
                              <Input
                                value={cat.price ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCatalogue((prev) =>
                                    prev.map((c, i) => (i === idx ? { ...c, price: val } : c))
                                  );
                                }}
                                placeholder="₹49,999"
                                className="mt-1 bg-[#18181D] border-border text-xs rounded-xl"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-[11px] text-muted-foreground">Description</Label>
                            <Input
                              value={cat.description ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCatalogue((prev) =>
                                  prev.map((c, i) => (i === idx ? { ...c, description: val } : c))
                                );
                              }}
                              placeholder="Key features, deliverables or package details..."
                              className="mt-1 bg-[#18181D] border-border text-xs rounded-xl"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-[11px] text-muted-foreground">Image URL</Label>
                              <Input
                                value={cat.imageUrl ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCatalogue((prev) =>
                                    prev.map((c, i) => (i === idx ? { ...c, imageUrl: val } : c))
                                  );
                                }}
                                placeholder="https://..."
                                className="mt-1 bg-[#18181D] border-border text-xs rounded-xl font-mono"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] text-muted-foreground">Action URL</Label>
                              <Input
                                value={cat.actionUrl ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCatalogue((prev) =>
                                    prev.map((c, i) => (i === idx ? { ...c, actionUrl: val } : c))
                                  );
                                }}
                                placeholder="https://..."
                                className="mt-1 bg-[#18181D] border-border text-xs rounded-xl font-mono"
                              />
                            </div>
                          </div>
                        </div>
                        ))}

                        {catalogue.length === 0 && (
                          <div className="text-center py-12 rounded-xl border border-dashed border-border/60 bg-[#121216]/50">
                            <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-xs text-muted-foreground">No catalogue products or services added.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: AUTOMATED SEO & SOCIAL CARDS */}
                  {activeTab === 'seo' && (
                    <div className="space-y-6 max-w-2xl">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Globe className="w-4 h-4 text-primary" />
                          Automated Search Engine &amp; Social Card Metadata
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Taptch automatically builds crawler-ready Open Graph and Schema.org rich tags. You can fine-tune titles and summaries here.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Custom Meta Title</Label>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {(seoTitle || displayName).length}/60 chars
                            </span>
                          </div>
                          <Input
                            value={seoTitle}
                            onChange={(e) => setSeoTitle(e.target.value)}
                            placeholder={
                              profileType === 'business'
                                ? `${displayName || 'Acme Corp'} | Official Business Profile & Offerings`
                                : `${displayName || 'John Doe'} — ${headline || 'Digital Identity & Visiting Card'}`
                            }
                            className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Leave blank to automatically inherit profile title.
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Custom Meta Description</Label>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {(seoDescription || bio).length}/160 chars
                            </span>
                          </div>
                          <Textarea
                            value={seoDescription}
                            onChange={(e) => setSeoDescription(e.target.value)}
                            rows={3}
                            placeholder={
                              bio
                                ? bio.slice(0, 150)
                                : `Connect with ${displayName || 'our profile'} on Taptch. Explore portfolio, direct contact exchange, and verified digital identity.`
                            }
                            className="mt-1.5 bg-[#121216] border-border text-xs rounded-xl resize-none"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Summarizes your profile in search engine results and social chat previews.
                          </p>
                        </div>
                      </div>

                      {/* Live Search Engine Result Mockup */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-white">Google Search Result Preview</Label>
                        <div className="p-4 rounded-2xl bg-[#18181D] border border-border/60 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                              T
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate">
                              https://taptch.com/{slug || 'username'}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                            {seoTitle || (profileType === 'business' ? `${displayName || 'Business Name'} | Official Business Profile` : `${displayName || 'Full Name'} — ${headline || 'Digital Identity'}`)}
                          </h4>
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {seoDescription || bio || `Connect with ${displayName || 'this professional'} on Taptch - Intelligent Digital Identity & Smart Contact Exchange.`}
                          </p>
                        </div>
                      </div>

                      {/* Live WhatsApp / Social Card Preview */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-white">Social Media &amp; WhatsApp Card Preview</Label>
                        <div className="rounded-2xl border border-border/60 bg-[#121216] overflow-hidden max-w-md shadow-xl">
                          <div className="h-40 bg-neutral-900 relative overflow-hidden flex items-center justify-center">
                            {avatarUrl || coverUrl ? (
                              <img
                                src={coverUrl || avatarUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center text-muted-foreground p-4">
                                <Globe className="w-8 h-8 mx-auto mb-1 opacity-40" />
                                <span className="text-[11px]">Upload cover/avatar for rich social card image</span>
                              </div>
                            )}
                          </div>
                          <div className="p-4 bg-[#18181D] space-y-1">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                              TAPTCH.COM
                            </span>
                            <h5 className="font-bold text-sm text-white truncate">
                              {seoTitle || displayName || 'Digital Profile'}
                            </h5>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {seoDescription || bio || 'Tap to connect and exchange verified contact identity.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Real-Time Mobile Device Simulator (Desktop only >= lg) */}
              <div
                className="hidden lg:flex lg:w-2/5 xl:w-5/12 bg-[#0A0A0C] flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto"
              >
                <div className="text-center mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Interactive Smartphone Simulator
                  </span>
                </div>

                {/* Smartphone Frame (375px x 780px) on Desktop */}
                <div className="w-[375px] h-[780px] max-w-full rounded-[44px] border-[6px] border-[#27272A] bg-black shadow-2xl overflow-hidden relative flex flex-col ring-1 ring-white/10 shrink-0">
                  {/* Dynamic Island / Speaker Notch */}
                  <div className="h-6 w-full bg-black flex items-center justify-center relative z-20 shrink-0">
                    <div className="w-24 h-4 bg-black rounded-full border border-neutral-800" />
                  </div>

                  {/* Simulated Live Profile View */}
                  <div className="flex-1 overflow-y-auto scrollbar-none">
                    <ProfileRenderer key={templateId} profile={livePreviewData} />
                  </div>

                  {/* Bottom Home Indicator Bar */}
                  <div className="h-4 w-full bg-black flex items-center justify-center shrink-0">
                    <div className="w-28 h-1 rounded-full bg-neutral-700" />
                  </div>
                </div>
              </div>

              {/* Mobile Preview View (lg:hidden when mobileView === 'preview') */}
              {mobileView === 'preview' && (
                <div className="lg:hidden w-full flex-1 bg-[#0A0A0C] flex flex-col relative overflow-hidden">
                  {/* Real Screen Mobile Profile (Edge-to-Edge, natural scroll) */}
                  <div className="flex-1 overflow-y-auto pb-24">
                    <ProfileRenderer key={templateId} profile={livePreviewData} />
                  </div>

                  {/* Floating Return-to-Edit Action Bar */}
                  <div className="fixed bottom-0 inset-x-0 p-3 sm:p-4 bg-[#121216]/95 backdrop-blur-xl border-t border-border/60 z-50 flex items-center justify-between gap-2 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => setMobileView('editor')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors shrink-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Edit: {activeTabShort}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => saveMutation.mutate(false)}
                        disabled={saveMutation.isPending}
                        variant="outline"
                        className="bg-white/5 hover:bg-white/10 text-white border-white/10 text-xs rounded-xl h-8 px-2.5 gap-1"
                      >
                        {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        <span>Draft</span>
                      </Button>

                      <Button
                        type="button"
                        onClick={() => saveMutation.mutate(true)}
                        disabled={saveMutation.isPending}
                        className="bg-primary hover:bg-primary-hover text-black font-bold text-xs rounded-xl h-8 px-3 gap-1 shadow-md"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Publish</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>
        );
}


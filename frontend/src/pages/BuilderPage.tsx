import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { ProfileRenderer } from '../components/templates/ProfileRenderer';
import { STANDARD_TEMPLATES } from '../modules/templates/constants';
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
  const [activeTab, setActiveTab] = useState<'identity' | 'theme' | 'socials' | 'businesses' | 'catalogue' | 'seo'>('identity');
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
  const [templateId, setTemplateId] = useState('obsidian-luxury');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [themeColors, setThemeColors] = useState<Record<string, string>>({
    primary: '#D4AF37',
    background: '#0A0A0C',
    surface: '#121216',
  });
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([]);
  const [businesses, setBusinesses] = useState<Array<any>>([]);
  const [catalogue, setCatalogue] = useState<Array<any>>([]);

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
      setTemplateId(profile.templateId || profile.themeId || 'obsidian-luxury');
      if (profile.customFields?.seo) {
        setSeoTitle(profile.customFields.seo.title || '');
        setSeoDescription(profile.customFields.seo.description || '');
      }
      if (profile.themeConfig) {
        setThemeColors(profile.themeConfig);
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
    businesses: profileType === 'business' ? businesses.map((b) => ({
      id: b.id || Math.random().toString(),
      companyName: b.companyName || b.name || 'Company Name',
      roleTitle: b.jobTitle || b.tagline || 'Title',
      websiteUrl: b.websiteUrl || b.businessWebsite || b.website || undefined,
      address: b.address || b.businessAddress || undefined,
      logoUrl: b.logoUrl || undefined,
    })) : [],
    catalogue: profileType === 'business' ? catalogue.map((c) => ({
      id: c.id || Math.random().toString(),
      title: c.title || 'Product / Service Title',
      itemType: c.type || 'product',
      description: c.description || undefined,
      price: c.price || undefined,
      imageUrl: c.imageUrl || undefined,
      actionUrl: c.actionUrl || undefined,
    })) : [],
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

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F4F4F6] flex flex-col">
      {/* Studio Header Bar */}
      <header className="h-16 px-4 sm:px-6 bg-[#121216] border-b border-border/40 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            title="Back to Profiles"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{displayName || 'New Profile Studio'}</span>
              {slug && (
                <a
                  href={`/p/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center text-[10px] text-primary hover:underline font-mono"
                >
                  <span>/{slug}</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-1" />
                </a>
              )}
            </h1>
            <p className="text-[10px] text-muted-foreground">Mobile-First Profile & Template Studio</p>
          </div>
        </div>

        {/* Mobile View Toggle Button */}
        <div className="lg:hidden flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setMobileView('editor')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              mobileView === 'editor' ? 'bg-primary text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              mobileView === 'preview' ? 'bg-primary text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>

        {/* Save & Publish Actions */}
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            onClick={() => saveMutation.mutate(false)}
            disabled={saveMutation.isPending}
            variant="outline"
            className="bg-white/5 hover:bg-white/10 text-white border-white/10 text-xs rounded-xl h-9 px-3 gap-1.5"
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Save Draft</span>
          </Button>

          <Button
            type="button"
            onClick={() => saveMutation.mutate(true)}
            disabled={saveMutation.isPending}
            className="bg-primary hover:bg-primary-hover text-black font-bold text-xs rounded-xl h-9 px-4 gap-1.5 shadow-md"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Publish</span>
          </Button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold ${
            notification.type === 'success'
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
          className={`w-full lg:w-3/5 xl:w-7/12 border-r border-border/40 overflow-y-auto p-4 sm:p-8 ${
            mobileView === 'preview' ? 'hidden lg:block' : 'block'
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
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                profileType === 'personal'
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
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                profileType === 'business'
                  ? 'bg-primary text-black shadow-md'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Business &amp; Services Profile</span>
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 border-b border-border/40 scrollbar-none">
            {[
              { id: 'identity', label: profileType === 'personal' ? 'Identity & Card' : 'Company Info', icon: User },
              { id: 'theme', label: 'Theme & Style', icon: Palette },
              { id: 'socials', label: 'Social Channels', icon: Share2 },
              ...(profileType === 'business'
                ? [
                    { id: 'businesses', label: 'Ventures / Branches', icon: Briefcase },
                    { id: 'catalogue', label: 'Offerings & Catalogue', icon: ShoppingBag },
                  ]
                : []),
              { id: 'seo', label: 'SEO & Social Cards', icon: Globe },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
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
                      /p/
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
                      https://taptch.com/p/{slug || 'username'}
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

          {/* TAB 2: THEME & TEMPLATE SELECTOR */}
          {activeTab === 'theme' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Select Visual Identity Template</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Choose a bespoke layout calibrated for your role. Contact data and catalogues adapt automatically.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {STANDARD_TEMPLATES.map((tpl) => {
                    const isSelected = templateId === tpl.id || templateId === tpl.slug;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          setTemplateId(tpl.id);
                          if (tpl.defaultThemeConfig?.primaryColor) {
                            setThemeColors({
                              primary: tpl.defaultThemeConfig.primaryColor,
                              background: tpl.defaultThemeConfig.background || '#0A0A0C',
                              surface: tpl.defaultThemeConfig.cardBg || '#121216',
                            });
                          }
                        }}
                        className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                          isSelected
                            ? 'bg-[#18181D] border-primary shadow-lg ring-1 ring-primary'
                            : 'bg-[#121216] border-border/50 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white">{tpl.name}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-primary text-black flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-[10px] text-primary uppercase font-bold tracking-wider">
                            {tpl.requiredPlanId || 'Free'} Tier
                          </span>
                          <span className="text-[10px] text-neutral-400 capitalize">{tpl.category}</span>
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
                      https://taptch.com/p/{slug || 'username'}
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
                      https://taptch.com/p/{slug || 'username'}
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
                  <div key={idx} className="p-4 rounded-2xl bg-[#121216] border border-border/60 space-y-3">
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
                          value={biz.companyName || biz.name || ''}
                          onChange={(e) => {
                            const updated = [...businesses];
                            updated[idx].companyName = e.target.value;
                            setBusinesses(updated);
                          }}
                          placeholder="e.g. Acme Innovations"
                          className="mt-1 bg-[#18181D] border-border text-xs rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Designation / Role</Label>
                        <Input
                          value={biz.jobTitle || biz.tagline || ''}
                          onChange={(e) => {
                            const updated = [...businesses];
                            updated[idx].jobTitle = e.target.value;
                            setBusinesses(updated);
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
                          value={biz.businessWebsite || biz.websiteUrl || ''}
                          onChange={(e) => {
                            const updated = [...businesses];
                            updated[idx].businessWebsite = e.target.value;
                            setBusinesses(updated);
                          }}
                          placeholder="https://..."
                          className="mt-1 bg-[#18181D] border-border text-xs rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Location</Label>
                        <Input
                          value={biz.businessAddress || biz.address || ''}
                          onChange={(e) => {
                            const updated = [...businesses];
                            updated[idx].businessAddress = e.target.value;
                            setBusinesses(updated);
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
                      https://taptch.com/p/{slug || 'username'}
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
                  <div key={idx} className="p-4 rounded-2xl bg-[#121216] border border-border/60 space-y-3">
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
                          value={cat.title || ''}
                          onChange={(e) => {
                            const updated = [...catalogue];
                            updated[idx].title = e.target.value;
                            setCatalogue(updated);
                          }}
                          placeholder="e.g. Enterprise Consulting"
                          className="mt-1 bg-[#18181D] border-border text-xs rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Price</Label>
                        <Input
                          value={cat.price || ''}
                          onChange={(e) => {
                            const updated = [...catalogue];
                            updated[idx].price = e.target.value;
                            setCatalogue(updated);
                          }}
                          placeholder="₹49,999"
                          className="mt-1 bg-[#18181D] border-border text-xs rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-[11px] text-muted-foreground">Description</Label>
                      <Input
                        value={cat.description || ''}
                        onChange={(e) => {
                          const updated = [...catalogue];
                          updated[idx].description = e.target.value;
                          setCatalogue(updated);
                        }}
                        placeholder="Key features, deliverables or package details..."
                        className="mt-1 bg-[#18181D] border-border text-xs rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Image URL</Label>
                        <Input
                          value={cat.imageUrl || ''}
                          onChange={(e) => {
                            const updated = [...catalogue];
                            updated[idx].imageUrl = e.target.value;
                            setCatalogue(updated);
                          }}
                          placeholder="https://..."
                          className="mt-1 bg-[#18181D] border-border text-xs rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Action URL</Label>
                        <Input
                          value={cat.actionUrl || ''}
                          onChange={(e) => {
                            const updated = [...catalogue];
                            updated[idx].actionUrl = e.target.value;
                            setCatalogue(updated);
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
                      https://taptch.com/p/{slug || 'username'}
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

        {/* Right Side: Real-Time Mobile Device Simulator */}
        <div
          className={`w-full lg:w-2/5 xl:w-5/12 bg-[#0A0A0C] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto ${
            mobileView === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="text-center mb-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Interactive Smartphone Simulator
            </span>
          </div>

          {/* Smartphone Frame (375px x 780px) */}
          <div className="w-[375px] h-[780px] max-w-full rounded-[44px] border-[6px] border-[#27272A] bg-black shadow-2xl overflow-hidden relative flex flex-col ring-1 ring-white/10">
            {/* Dynamic Island / Speaker Notch */}
            <div className="h-6 w-full bg-black flex items-center justify-center relative z-20 shrink-0">
              <div className="w-24 h-4 bg-black rounded-full border border-neutral-800" />
            </div>

            {/* Simulated Live Profile View */}
            <div className="flex-1 overflow-y-auto scrollbar-none">
              <ProfileRenderer profile={livePreviewData} />
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="h-4 w-full bg-black flex items-center justify-center shrink-0">
              <div className="w-28 h-1 rounded-full bg-neutral-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


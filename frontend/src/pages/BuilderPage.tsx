import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { useSession } from '../lib/auth/client';
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
  X,
} from 'lucide-react';

export function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const isNew = id === 'new' || !id;

  // Active editor tab
  const [activeTab, setActiveTab] = useState<'theme' | 'identity' | 'socials' | 'businesses' | 'catalogue' | 'seo'>('theme');
  // Mobile preview toggle (when on mobile screen, toggle between form and phone view)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  // Live Web Look Modal for Instant Mobile Preview
  const [isLookModalOpen, setIsLookModalOpen] = useState(false);

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
        setBusinesses(
          profile.businesses.map((b: any) => ({
            id: b.id || crypto.randomUUID(),
            companyName: b.companyName || b.name || '',
            name: b.name || b.companyName || '',
            jobTitle: b.jobTitle || b.tagline || '',
            tagline: b.tagline || b.jobTitle || '',
            businessWebsite: b.businessWebsite || b.website || b.websiteUrl || '',
            websiteUrl: b.websiteUrl || b.businessWebsite || b.website || '',
            website: b.website || b.businessWebsite || b.websiteUrl || '',
            businessAddress: b.businessAddress || b.address || '',
            address: b.address || b.businessAddress || '',
            logoUrl: b.logoUrl || '',
            email: b.email || b.businessEmail || '',
            phone: b.phone || b.businessPhone || '',
            whatsapp: b.whatsapp || '',
          }))
        );
      }
      if (Array.isArray(profile.catalogue)) {
        setCatalogue(
          profile.catalogue.map((c: any) => ({
            id: c.id || crypto.randomUUID(),
            title: c.title || '',
            type: c.type || c.itemType || 'product',
            itemType: c.type || c.itemType || 'product',
            price: c.price || '',
            description: c.description || '',
            imageUrl: c.imageUrl || '',
            actionUrl: c.actionUrl || '',
            actionLabel: c.actionLabel || 'Enquire',
          }))
        );
      }
    }
  }, [profile]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (publish: boolean = false) => {
      const cleanName = displayName.trim();
      const cleanSlug = slug.trim().toLowerCase();

      if (!cleanName) {
        throw new Error(profileType === 'business' ? 'Business / Company Name is required.' : 'Display Name is required.');
      }
      if (!cleanSlug) {
        throw new Error('Public handle / slug is required.');
      }

      const cleanBusinesses = businesses
        .filter((b) => Boolean((b.companyName || b.name || '').trim()))
        .map((b) => ({
          id: b.id,
          companyName: (b.companyName || b.name || '').trim(),
          name: (b.name || b.companyName || '').trim(),
          jobTitle: (b.jobTitle || b.tagline || '').trim() || null,
          tagline: (b.tagline || b.jobTitle || '').trim() || null,
          businessWebsite: (b.businessWebsite || b.website || b.websiteUrl || '').trim() || null,
          website: (b.website || b.businessWebsite || b.websiteUrl || '').trim() || null,
          businessAddress: (b.businessAddress || b.address || '').trim() || null,
          address: (b.address || b.businessAddress || '').trim() || null,
          logoUrl: b.logoUrl || null,
          email: (b.email || b.businessEmail || '').trim() || null,
          phone: (b.phone || b.businessPhone || '').trim() || null,
          whatsapp: (b.whatsapp || '').trim() || null,
        }));

      const cleanCatalogue = catalogue
        .filter((c) => Boolean((c.title || '').trim()))
        .map((c) => ({
          id: c.id,
          title: (c.title || '').trim(),
          type: c.type || c.itemType || 'product',
          itemType: c.type || c.itemType || 'product',
          price: (c.price || '').trim() || null,
          description: (c.description || '').trim() || null,
          imageUrl: c.imageUrl || null,
          actionUrl: (c.actionUrl || '').trim() || null,
          actionLabel: (c.actionLabel || '').trim() || 'Enquire',
        }));

      const payload = {
        profileType,
        displayName: cleanName,
        slug: cleanSlug,
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
        businesses: cleanBusinesses,
        catalogue: cleanCatalogue,
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

      return { profileId, slug: cleanSlug, published: publish };
    },
    onSuccess: ({ profileId, slug: savedSlug, published }) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      setNotification({
        type: 'success',
        message: published
          ? `Profile published live at /${savedSlug}!`
          : 'Profile draft saved successfully!',
      });
      setTimeout(() => setNotification(null), 4000);
      if (isNew && profileId) {
        navigate(`/builder/${profileId}`, { replace: true });
      }
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to save profile. Please check required fields.',
      });
    },
  });

  // Safe fallback name using user name or profile type (never generic 'Your Full Name' / 'Y')
  const defaultDisplayName =
    session?.user?.name || (profileType === 'business' ? 'Business Profile' : 'Professional Profile');

  // Construct Live Profile preview snapshot
  const livePreviewData: any = {
    id: id || 'preview-id',
    slug: slug || 'preview',
    displayName: displayName.trim() || defaultDisplayName,
    headline: headline || (profileType === 'business' ? 'Industry • Tagline / Slogan' : 'Your Professional Title / Role'),
    bio: bio || (profileType === 'business' ? 'Welcome to our official business profile. Explore our ventures, products, services, and direct contact channels below.' : 'Welcome to my digital business card. Tap any button below to connect with me.'),
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
    businesses: businesses
      .filter((b) => Boolean((b.companyName || b.name || '').trim()))
      .map((b, i) => ({
        id: b.id || `biz-${i}`,
        companyName: (b.companyName || b.name || '').trim(),
        roleTitle: (b.jobTitle || b.tagline || '').trim() || undefined,
        websiteUrl: (b.websiteUrl || b.businessWebsite || b.website || '').trim() || undefined,
        address: (b.address || b.businessAddress || '').trim() || undefined,
        logoUrl: b.logoUrl || undefined,
        email: (b.email || b.businessEmail || '').trim() || undefined,
        phone: (b.phone || b.businessPhone || '').trim() || undefined,
        whatsapp: (b.whatsapp || '').trim() || undefined,
      })),
    catalogue: catalogue
      .filter((c) => Boolean((c.title || '').trim()))
      .map((c, i) => ({
        id: c.id || `cat-${i}`,
        title: (c.title || '').trim(),
        price: (c.price || '').trim() || undefined,
        description: (c.description || '').trim() || undefined,
        actionUrl: (c.actionUrl || '').trim() || undefined,
        type: c.type || c.itemType || 'product',
        itemType: c.type || c.itemType || 'product',
        imageUrl: (c.imageUrl || '').trim() || undefined,
        currency: c.currency || '₹',
        actionLabel: (c.actionLabel || '').trim() || 'Enquire',
      })),
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
        <div data-theme="light" className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
          <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        </div>
        );
  }

        const tabList = [
        {id: 'theme', label: '1. Theme & Style', shortLabel: 'Theme', icon: Palette },
        {id: 'identity', label: profileType === 'personal' ? '2. Identity & Card' : '2. Company Info', shortLabel: profileType === 'personal' ? 'Identity' : 'Company', icon: User },
        {id: 'socials', label: '3. Social Channels', shortLabel: 'Socials', icon: Share2 },
        ...(profileType === 'business'
        ? [
        {id: 'businesses', label: '4. Branches & Ventures', shortLabel: 'Branches', icon: Briefcase },
        {id: 'catalogue', label: '5. Products & Menu', shortLabel: 'Catalogue', icon: ShoppingBag },
        ]
        : []),
        {id: 'seo', label: `${profileType === 'business' ? '6' : '4'}. SEO & Cards`, shortLabel: 'SEO', icon: Globe },
        ];

  const currentStepIndex = tabList.findIndex((t) => t.id === activeTab);
  const activeTabObj = tabList.find((t) => t.id === activeTab);
        const activeTabShort = activeTabObj?.shortLabel ?? 'Edit';

        return (
        <div
          data-theme="light"
          className="min-h-screen bg-[var(--bg-page)] text-[var(--ink)] font-body flex flex-col selection:bg-[var(--accent)] selection:text-[var(--accent-ink)]"
        >
          {/* Studio Header Bar */}
          <header className="h-14 sm:h-16 px-4 sm:px-6 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between sticky top-0 z-40 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <Link
                to="/dashboard"
                className="p-1.5 sm:p-2 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors shrink-0"
                title="Back to Profiles"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="min-w-0">
                <h1 className="font-head text-xs sm:text-sm font-medium text-[var(--ink)] flex items-center gap-1.5 truncate">
                  <span className="truncate">{displayName || 'New Profile Studio'}</span>
                  {slug && (
                    <a
                      href={`/p/${slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hidden md:inline-flex items-center text-[10px] text-[var(--accent-text)] hover:underline font-mono shrink-0"
                    >
                      <span>/{slug}</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-1" />
                    </a>
                  )}
                </h1>
                <p className="font-body text-[10px] text-[var(--ink-muted)] truncate">
                  Mobile-First Profile &amp; Template Studio
                </p>
              </div>
            </div>

            {/* Mobile View Web Look Modal Trigger */}
            <div className="lg:hidden flex items-center shrink-0 mx-1.5">
              <button
                type="button"
                onClick={() => setIsLookModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF3E9] text-[#FF6A00] border border-[#FF6A00]/30 hover:bg-[#FFE8D6] text-xs font-bold transition-all active:scale-95 shadow-xs"
                title="Preview Web Profile Look"
              >
                <Eye className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>View Look</span>
              </button>
            </div>

            {/* Save & Publish Actions */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="hidden md:flex items-center mr-2">
                {saveMutation.isPending ? (
                  <span className="font-mono text-[10px] text-[var(--accent-text)] flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Autosaving...</span>
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-[var(--ink-muted)] flex items-center gap-1">
                    <Check className="w-3 h-3 text-[var(--success)]" />
                    <span>Ready</span>
                  </span>
                )}
              </div>

              <Button
                type="button"
                onClick={() => saveMutation.mutate(false)}
                disabled={saveMutation.isPending}
                variant="outline"
                className="text-xs h-8 sm:h-9 px-3 gap-1.5 rounded-[var(--radius-sm)]"
              >
                {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Save Draft</span>
              </Button>

              <Button
                type="button"
                onClick={() => saveMutation.mutate(true)}
                disabled={saveMutation.isPending}
                variant="accent"
                className="text-xs h-8 sm:h-9 px-3 sm:px-4 gap-1.5 rounded-[var(--radius-sm)] shadow-none"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Publish</span>
              </Button>
            </div>
          </header>

          {/* Notification Toast */}
          {notification && (
            <div
              className={`fixed top-20 right-4 z-50 p-4 rounded-[var(--radius-sm)] shadow-lg flex items-center space-x-2 text-xs font-medium ${notification.type === 'success'
                  ? 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/40 bg-[var(--bg-surface)]'
                  : 'bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/40 bg-[var(--bg-surface)]'
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
              className={`w-full lg:w-3/5 xl:w-7/12 border-r border-[var(--border)] overflow-y-auto p-4 sm:p-8 pb-28 lg:pb-8 ${mobileView === 'preview' ? 'hidden lg:block' : 'block'
                }`}
            >
              {/* Profile Architecture Selector (Personal vs Business) */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border)] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setProfileType('personal');
                    if (activeTab === 'businesses' || activeTab === 'catalogue') {
                      setActiveTab('identity');
                    }
                  }}
                  className={`py-2 px-3 rounded-[var(--radius-sm)] text-xs font-medium transition-all flex items-center justify-center gap-2 ${profileType === 'personal'
                      ? 'bg-[var(--bg-raised)] text-[var(--ink)] border border-[var(--accent)] shadow-none'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                >
                  <User className="w-4 h-4" />
                  <span>Personal Visiting Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileType('business')}
                  className={`py-2 px-3 rounded-[var(--radius-sm)] text-xs font-medium transition-all flex items-center justify-center gap-2 ${profileType === 'business'
                      ? 'bg-[var(--bg-raised)] text-[var(--ink)] border border-[var(--accent)] shadow-none'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Business &amp; Services Profile</span>
                </button>
              </div>

              {/* Stepper with Progress Bars */}
              <div className="mb-6">
                {/* Horizontal Segmented Progress Bars */}
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 mb-3" style={{ gridTemplateColumns: `repeat(${tabList.length}, minmax(0, 1fr))` }}>
                  {tabList.map((tab, idx) => {
                    const isCompleted = currentStepIndex > idx;
                    const isCurrent = currentStepIndex === idx;
                    return (
                      <div
                        key={tab.id}
                        className={`h-1.5 rounded-full transition-colors duration-200 ${isCompleted
                            ? 'bg-[var(--accent)]'
                            : isCurrent
                              ? 'bg-[var(--ink)]'
                              : 'bg-[var(--border)]'
                          }`}
                      />
                    );
                  })}
                </div>

                {/* Stepper Navigation Buttons */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
                  {tabList.map((tab, idx) => {
                    const Icon = tab.icon;
                    const isCompleted = currentStepIndex > idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-[var(--radius-sm)] font-mono text-[11px] whitespace-nowrap transition-colors shrink-0 ${isCurrent
                            ? 'bg-[var(--ink)] text-[var(--bg-page)] font-medium shadow-none'
                            : isCompleted
                              ? 'border border-[var(--accent)]/60 bg-[var(--accent)]/10 text-[var(--accent-text)]'
                              : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)]'
                          }`}
                      >
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TAB 1: THEME & TEMPLATE SELECTOR */}
              {activeTab === 'theme' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h3 className="font-head text-base font-medium text-[var(--ink)] mb-1 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[var(--accent-text)]" />
                      <span>Step 1 &mdash; Select Visual Identity Template</span>
                    </h3>
                    <p className="font-body text-xs text-[var(--ink-muted)] mb-4">
                      Select your architectural layout. Every theme automatically adapts your contact details and products, immediately visible in the live smartphone simulator.
                    </p>

                    {/* Theme Card Grid with 2px orange border when selected (Responsive 2-column on mobile) */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
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
                            className={`group relative cursor-pointer rounded-[var(--radius-md)] overflow-hidden transition-all duration-150 flex flex-col ${isSelected
                                ? 'bg-[var(--bg-surface)] border-2 border-[var(--accent)] ring-1 ring-[var(--accent)]/20 shadow-xs'
                                : 'bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-strong)]'
                              }`}
                          >
                            {/* Miniature Theme Preview Frame (Responsive mobile height) */}
                            <div className="relative w-full h-16 xs:h-20 sm:h-24 overflow-hidden bg-black/50 border-b border-[var(--border)] shrink-0">
                              <MiniatureThemeCardPreview
                                templateId={tpl.id}
                                colors={cardColors}
                                displayName={displayName || defaultDisplayName}
                                headline={headline}
                                avatarUrl={avatarUrl}
                              />

                              {/* Selected Badge Overlay */}
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-ink)] font-mono text-[9px] font-medium uppercase">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  <span className="hidden xs:inline">Active</span>
                                </div>
                              )}
                            </div>

                            {/* Theme Card Metadata (Compact for mobile) */}
                            <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-1">
                                  <h4 className="font-head text-xs font-semibold text-[var(--ink)] truncate">
                                    {tpl.name}
                                  </h4>
                                  <span className="font-mono text-[8px] sm:text-[9px] text-[var(--accent-text)] bg-[var(--accent)]/15 border border-[var(--accent)]/30 px-1 py-0.2 rounded-[var(--radius-sm)] font-medium uppercase tracking-[0.04em] shrink-0">
                                    {(tpl.requiredPlanId || 'Free').toUpperCase()}
                                  </span>
                                </div>
                                <p className="font-body text-[10px] sm:text-[11px] text-[var(--ink-muted)] line-clamp-1 leading-tight">
                                  {tpl.description}
                                </p>
                              </div>

                              <div className="mt-1.5 sm:mt-2.5 pt-1.5 border-t border-[var(--border)] flex items-center justify-between font-mono text-[9px] sm:text-[10px] text-[var(--ink-muted)]">
                                <span className="capitalize flex items-center gap-1 truncate">
                                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: cardColors.primary }} />
                                  <span className="truncate">{tpl.category}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: IDENTITY & BASIC CONTACT */}
              {activeTab === 'identity' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="font-head text-base font-medium text-[var(--ink)] mb-1 flex items-center gap-2">
                      <User className="w-4 h-4 text-[var(--accent-text)]" />
                      <span>{profileType === 'business' ? 'Company Details & Identity' : 'Personal Identity & Details'}</span>
                    </h3>
                    <p className="font-body text-xs text-[var(--ink-muted)]">
                      These core coordinates populate the primary header of your digital profile and vCard.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-[var(--ink)] font-medium">Full Display Name *</Label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={profileType === 'business' ? 'e.g. Apex Global Logistics' : 'e.g. Vikramaditya Singhania'}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[var(--ink)] font-medium">Public Card Handle / Slug *</Label>
                      <div className="mt-1.5 flex rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border)] bg-[var(--bg-raised)]">
                        <span className="px-3 py-1.5 text-xs text-[var(--ink-muted)] bg-[var(--bg-surface)] border-r border-[var(--border)] font-mono">
                          /p/
                        </span>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                          placeholder="vikram-singhania"
                          className="w-full px-3 py-1.5 text-xs font-mono text-[var(--ink)] bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-[var(--ink)] font-medium">Professional Headline / Role</Label>
                      <Input
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="Managing Director &bull; Apex Capital"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[var(--ink)] font-medium">Profile Photo / Logo URL</Label>
                      <Input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="mt-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-[var(--ink)] font-medium">Bio / About Profile</Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Tell clients, investors, or partners about your expertise, experience, and background..."
                      className="mt-1.5 bg-[var(--bg-raised)] border border-[var(--border)] text-xs text-[var(--ink)] rounded-[var(--radius-sm)] resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-[var(--border)] space-y-4">
                    <h4 className="font-head text-sm font-medium text-[var(--ink)]">Direct Contact Coordinates</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-[var(--ink)] font-medium">Direct Phone Number</Label>
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98200 12345"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[var(--ink)] font-medium">WhatsApp Direct Number</Label>
                        <Input
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="+91 98200 12345"
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-[var(--ink)] font-medium">Business Email Address</Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="vikram@apexcapital.in"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[var(--ink)] font-medium">Official Website URL</Label>
                        <Input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://taptch.com"
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-[var(--ink)] font-medium">Office / Physical Address</Label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Level 28, One World Centre, Lower Parel, Mumbai"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SOCIAL MEDIA LINKS */}
              {activeTab === 'socials' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-head text-base font-medium text-[var(--ink)]">Social &amp; Channel Links</h3>
                      <p className="font-body text-xs text-[var(--ink-muted)]">Display high-impact icons for your network channels</p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddSocial}
                      variant="outline"
                      size="sm"
                      className="rounded-[var(--radius-sm)] text-xs gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Channel</span>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {socialLinks.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border)]"
                      >
                        <select
                          value={item.platform}
                          onChange={(e) => handleUpdateSocial(idx, 'platform', e.target.value)}
                          className="bg-[var(--bg-raised)] border border-[var(--border)] text-xs rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[var(--ink)] focus:outline-none"
                        >
                          <option value="instagram">Instagram</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="twitter">X (Twitter)</option>
                          <option value="youtube">YouTube</option>
                          <option value="github">GitHub</option>
                          <option value="facebook">Facebook</option>
                        </select>

                        <Input
                          type="url"
                          value={item.url}
                          onChange={(e) => handleUpdateSocial(idx, 'url', e.target.value)}
                          placeholder="https://..."
                          className="flex-1 font-mono text-xs"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveSocial(idx)}
                          className="p-2 text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {socialLinks.length === 0 && (
                      <div className="text-center py-12 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-surface)]">
                        <Share2 className="w-8 h-8 text-[var(--ink-muted)] mx-auto mb-2 opacity-50" />
                        <p className="font-body text-xs text-[var(--ink-muted)]">No social media links added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: BUSINESSES & VENTURES (Business Profile Only) */}
              {activeTab === 'businesses' && profileType === 'business' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-head text-base font-medium text-[var(--ink)]">Branches &amp; Associated Ventures</h3>
                      <p className="font-body text-xs text-[var(--ink-muted)]">Showcase subsidiary brands, retail stores, or venture divisions</p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddBusiness}
                      variant="outline"
                      size="sm"
                      className="rounded-[var(--radius-sm)] text-xs gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Branch</span>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {businesses.map((biz, idx) => (
                      <div
                        key={biz.id || idx}
                        className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-[var(--accent-text)] font-medium uppercase">
                            Branch #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setBusinesses(businesses.filter((_, i) => i !== idx))}
                            className="text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-[var(--ink)]">Branch / Venture Name</Label>
                            <Input
                              value={biz.companyName || biz.name || ''}
                              onChange={(e) => {
                                const updated = [...businesses];
                                updated[idx].companyName = e.target.value;
                                updated[idx].name = e.target.value;
                                setBusinesses(updated);
                              }}
                              placeholder="e.g. Apex South Hub"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[var(--ink)]">Division / Role Tag</Label>
                            <Input
                              value={biz.jobTitle || biz.tagline || ''}
                              onChange={(e) => {
                                const updated = [...businesses];
                                updated[idx].jobTitle = e.target.value;
                                updated[idx].tagline = e.target.value;
                                setBusinesses(updated);
                              }}
                              placeholder="e.g. Flagship Store"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-[var(--ink)]">Website / Link</Label>
                            <Input
                              value={biz.businessWebsite || biz.websiteUrl || biz.website || ''}
                              onChange={(e) => {
                                const updated = [...businesses];
                                updated[idx].businessWebsite = e.target.value;
                                updated[idx].websiteUrl = e.target.value;
                                setBusinesses(updated);
                              }}
                              placeholder="https://..."
                              className="mt-1 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[var(--ink)]">Address / Location</Label>
                            <Input
                              value={biz.businessAddress || biz.address || ''}
                              onChange={(e) => {
                                const updated = [...businesses];
                                updated[idx].businessAddress = e.target.value;
                                updated[idx].address = e.target.value;
                                setBusinesses(updated);
                              }}
                              placeholder="e.g. Bandra West, Mumbai"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {businesses.length === 0 && (
                      <div className="text-center py-12 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-surface)]">
                        <Briefcase className="w-8 h-8 text-[var(--ink-muted)] mx-auto mb-2 opacity-50" />
                        <p className="font-body text-xs text-[var(--ink-muted)]">No business entities or branches added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: PRODUCTS & CATALOGUE (Business Profile Only) */}
              {activeTab === 'catalogue' && profileType === 'business' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-head text-base font-medium text-[var(--ink)]">Products &amp; Service Catalogue</h3>
                      <p className="font-body text-xs text-[var(--ink-muted)]">Display items with pricing, images, and enquiry buttons</p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddCatalogue}
                      variant="outline"
                      size="sm"
                      className="rounded-[var(--radius-sm)] text-xs gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {catalogue.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-[var(--accent-text)] font-medium uppercase">
                            Item #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCatalogue(catalogue.filter((_, i) => i !== idx))}
                            className="text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-[var(--ink)]">Title / Item Name</Label>
                            <Input
                              value={item.title || ''}
                              onChange={(e) => {
                                const updated = [...catalogue];
                                updated[idx].title = e.target.value;
                                setCatalogue(updated);
                              }}
                              placeholder="e.g. Executive Consulting"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[var(--ink)]">Price / Rate</Label>
                            <Input
                              value={item.price || ''}
                              onChange={(e) => {
                                const updated = [...catalogue];
                                updated[idx].price = e.target.value;
                                setCatalogue(updated);
                              }}
                              placeholder="₹15,000 / session"
                              className="mt-1 font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-[var(--ink)]">Description</Label>
                          <Input
                            value={item.description || ''}
                            onChange={(e) => {
                              const updated = [...catalogue];
                              updated[idx].description = e.target.value;
                              setCatalogue(updated);
                            }}
                            placeholder="Comprehensive 1-on-1 strategy alignment"
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-[var(--ink)]">Image URL</Label>
                            <Input
                              value={item.imageUrl || ''}
                              onChange={(e) => {
                                const updated = [...catalogue];
                                updated[idx].imageUrl = e.target.value;
                                setCatalogue(updated);
                              }}
                              placeholder="https://..."
                              className="mt-1 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[var(--ink)]">Action URL (WhatsApp or Link)</Label>
                            <Input
                              value={item.actionUrl || ''}
                              onChange={(e) => {
                                const updated = [...catalogue];
                                updated[idx].actionUrl = e.target.value;
                                setCatalogue(updated);
                              }}
                              placeholder="https://wa.me/..."
                              className="mt-1 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {catalogue.length === 0 && (
                      <div className="text-center py-12 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-surface)]">
                        <ShoppingBag className="w-8 h-8 text-[var(--ink-muted)] mx-auto mb-2 opacity-50" />
                        <p className="font-body text-xs text-[var(--ink-muted)]">No catalogue products or services added.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6 (OR 4): AUTOMATED SEO & SOCIAL CARDS STUDIO (Rendered once!) */}
              {activeTab === 'seo' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="font-head text-base font-medium text-[var(--ink)] flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[var(--accent-text)]" />
                      <span>Search Engine &amp; Social Card Studio</span>
                    </h3>
                    <p className="font-body text-xs text-[var(--ink-muted)] mt-1">
                      Crawler-ready Open Graph and metadata configuration. Live search and social cards automatically synchronize with your inputs.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-[var(--ink)] font-medium">Custom Meta Title</Label>
                        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
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
                        className="mt-1.5"
                      />
                      <p className="font-body text-[11px] text-[var(--ink-muted)] mt-1">
                        Leave blank to automatically inherit profile title.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-[var(--ink)] font-medium">Custom Meta Description</Label>
                        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
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
                        className="mt-1.5 bg-[var(--bg-raised)] border border-[var(--border)] text-xs text-[var(--ink)] rounded-[var(--radius-sm)] resize-none"
                      />
                      <p className="font-body text-[11px] text-[var(--ink-muted)] mt-1">
                        Summarizes your profile in search engine results and social chat previews.
                      </p>
                    </div>
                  </div>

                  {/* Google Search Result Mockup */}
                  <div className="space-y-2">
                    <Label className="font-head text-xs font-medium text-[var(--ink)]">Google Search Result Preview</Label>
                    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-[var(--accent)]/20 flex items-center justify-center font-mono text-[9px] font-bold text-[var(--accent-text)]">
                          T
                        </div>
                        <span className="font-mono text-[11px] text-[var(--ink-muted)] truncate">
                          https://taptch.com/p/{slug || 'username'}
                        </span>
                      </div>
                      <h4 className="font-head text-sm font-medium text-blue-400 hover:underline cursor-pointer truncate">
                        {seoTitle || (profileType === 'business' ? `${displayName || 'Business Name'} | Official Business Profile` : `${displayName || 'Full Name'} — ${headline || 'Digital Identity'}`)}
                      </h4>
                      <p className="font-body text-xs text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
                        {seoDescription || bio || `Connect with ${displayName || 'this professional'} on Taptch - Intelligent Digital Identity & Smart Contact Exchange.`}
                      </p>
                    </div>
                  </div>

                  {/* Social Media & WhatsApp Card Preview */}
                  <div className="space-y-2">
                    <Label className="font-head text-xs font-medium text-[var(--ink)]">Social Media &amp; WhatsApp Card Preview</Label>
                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden max-w-md">
                      <div className="h-36 bg-black relative overflow-hidden flex items-center justify-center">
                        {avatarUrl || coverUrl ? (
                          <img
                            src={coverUrl || avatarUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-[var(--ink-muted)] p-4">
                            <Globe className="w-8 h-8 mx-auto mb-1 opacity-40 text-[var(--accent-text)]" />
                            <span className="font-body text-[11px]">Upload cover/avatar for rich social card image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-[var(--bg-raised)] space-y-1 border-t border-[var(--border)]">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                          TAPTCH.COM
                        </span>
                        <h5 className="font-head text-sm font-medium text-[var(--ink)] truncate">
                          {seoTitle || displayName || 'Digital Profile'}
                        </h5>
                        <p className="font-body text-xs text-[var(--ink-muted)] line-clamp-2">
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
              className="hidden lg:flex lg:w-2/5 xl:w-5/12 bg-[var(--bg-page)] flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto"
            >
              <div className="text-center mb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)] flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                  Live Interactive Smartphone Simulator
                </span>
              </div>

              {/* Smartphone Frame (375px x 780px) on Desktop */}
              <div className="w-[375px] h-[780px] max-w-full rounded-[var(--radius-phone)] border-4 border-[#2E2E2C] bg-black overflow-hidden relative flex flex-col shrink-0 shadow-sm">
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
              <div className="lg:hidden w-full flex-1 bg-[var(--bg-page)] flex flex-col relative overflow-hidden">
                {/* Real Screen Mobile Profile (Edge-to-Edge, natural scroll) */}
                <div className="flex-1 overflow-y-auto pb-24">
                  <ProfileRenderer key={templateId} profile={livePreviewData} />
                </div>

                {/* Floating Return-to-Edit Action Bar */}
                <div className="fixed bottom-0 inset-x-0 p-3 sm:p-4 bg-[var(--bg-surface)] border-t border-[var(--border)] z-50 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileView('editor')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--ink)] font-medium text-xs transition-colors shrink-0"
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
                      className="text-xs rounded-[var(--radius-sm)] h-8 px-2.5 gap-1"
                    >
                      {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      <span>Draft</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={() => saveMutation.mutate(true)}
                      disabled={saveMutation.isPending}
                      variant="accent"
                      className="text-xs rounded-[var(--radius-sm)] h-8 px-3 gap-1 shadow-none"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Publish</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Live Web Look Button (Mobile Only) */}
          <div className="lg:hidden fixed bottom-6 right-4 z-40">
            <button
              type="button"
              onClick={() => setIsLookModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FF6A00] text-white text-xs font-bold shadow-xl shadow-[#FF6A00]/35 hover:bg-[#E55F00] active:scale-95 transition-all border border-white/20 backdrop-blur-sm"
              title="Open Live Web Profile Preview"
            >
              <Eye className="w-4 h-4 text-white" />
              <span>View Web Look</span>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </button>
          </div>

          {/* Live Web View Modal (Mobile Bottom Sheet / Desktop Centered Simulator) */}
          {isLookModalOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              {/* Click outside backdrop to close */}
              <div
                className="absolute inset-0"
                onClick={() => setIsLookModalOpen(false)}
              />

              {/* Modal Container */}
              <div className="relative z-10 w-full sm:max-w-md h-[92vh] sm:h-[85vh] bg-[#0E0F12] text-white rounded-t-[32px] sm:rounded-[36px] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Modal Drag Handle & Header */}
                <div className="pt-2.5 px-4 pb-3 bg-neutral-900/95 border-b border-neutral-800 flex flex-col gap-2 shrink-0">
                  <div className="w-10 h-1 rounded-full bg-neutral-700 mx-auto" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
                        Live Web Profile
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono hidden xs:inline">
                        /{slug || 'preview'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsLookModalOpen(false)}
                      className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      title="Close Preview"
                      aria-label="Close Preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Simulated Live Profile View */}
                <div className="flex-1 overflow-y-auto bg-black scrollbar-none">
                  <ProfileRenderer key={templateId} profile={livePreviewData} />
                </div>

                {/* Modal Footer Actions */}
                <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsLookModalOpen(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-all active:scale-95 text-center"
                  >
                    ← Back to Editing
                  </button>

                  <Button
                    type="button"
                    onClick={() => {
                      setIsLookModalOpen(false);
                      saveMutation.mutate(true);
                    }}
                    disabled={saveMutation.isPending}
                    variant="accent"
                    className="py-2.5 px-4 rounded-xl text-xs font-bold gap-1.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white shadow-none"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Publish</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        );
}

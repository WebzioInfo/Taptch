import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { useSession } from '../lib/auth/client';
import { UsernameInput } from '../components/profiles/UsernameInput';
import { validateUsernameFormat } from '../config/reservedUsernames';
import { ProfileRenderer, canonicalTemplateId } from '../components/templates/ProfileRenderer';
import {
  buildProfileSaveErrorNotification,
  getToastDurationMs,
  type ToastNotification,
} from '../lib/toast-utils';
import { MiniatureThemeCardPreview } from '../components/templates/MiniatureThemeCardPreview';
import { ImageUploadField } from '../components/builder/ImageUploadField';
import { SmartphoneSimulator } from '../components/builder/SmartphoneSimulator';
import {
  STANDARD_TEMPLATES,
  getTemplateDefaultThemeConfig,
} from '../modules/templates/constants';
import {
  SOCIAL_PLATFORMS,
  buildSocialProfileUrl,
  extractSocialUsername,
  getSocialPlatform,
  validateSocialUsername,
} from '../modules/social/platforms';
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
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  QrCode,
} from 'lucide-react';

export function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const isNew = id === 'new' || !id;

  // Active editor tab (start on Identity so initial screen focuses on essential profile fields)
  const [activeTab, setActiveTab] = useState<'theme' | 'identity' | 'socials' | 'businesses' | 'catalogue'>('identity');
  // Mobile preview toggle (when on mobile screen, toggle between form and phone view)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  // Live Web Look Modal for Instant Mobile Preview
  const [isLookModalOpen, setIsLookModalOpen] = useState(false);

  // Account type auto-resolution
  const userAccountType = (session?.user?.accountType || 'personal') as 'personal' | 'business';

  // Form State
  const [profileType, setProfileType] = useState<'personal' | 'business'>(() => {
    return userAccountType === 'business' ? 'business' : 'personal';
  });
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
  const [templateId, setTemplateId] = useState('cinematic-noir');
  const [education, setEducation] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiPayeeName, setUpiPayeeName] = useState('');
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string | null>(null);
  const [upiQrError, setUpiQrError] = useState<string | null>(null);
  const [showIntroOverlay, setShowIntroOverlay] = useState(true);
  const [showVentures, setShowVentures] = useState(true);
  const [showEducation, setShowEducation] = useState(true);
  const [showUpi, setShowUpi] = useState(true);
  const [showFooterSlate, setShowFooterSlate] = useState(true);
  const [themeColors, setThemeColors] = useState<Record<string, string>>(() =>
    getTemplateDefaultThemeConfig('cinematic-noir') as any
  );
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; username?: string; url: string }>>([]);
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

  const [notification, setNotification] = useState<ToastNotification | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissNotification = useCallback(() => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setNotification(null);
  }, []);

  const showNotification = useCallback((next: ToastNotification) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setNotification((prev) => {
      if (prev && prev.type === next.type && prev.message === next.message) {
        return prev;
      }
      return next;
    });
    notificationTimerRef.current = setTimeout(() => {
      notificationTimerRef.current = null;
      setNotification(null);
    }, getToastDurationMs(next.type));
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  // Fetch all user profiles to detect limit and offer quick jump
  const { data: userProfiles = [] } = useQuery<any[]>({
    queryKey: ['profiles', 'my'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/profiles'),
  });

  // Fetch existing profile if editing
  const {
    data: profile,
    isLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => ApiClient.get<any>(`/api/v1/profiles/${id}`),
    enabled: !isNew && Boolean(id),
  });

  // Populate form when data loads or user session establishes accountType
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
      setAddress(profile.address || profile.location || '');
      const loadedTpl = canonicalTemplateId(profile.templateId || profile.themeId || 'cinematic-noir');
      setTemplateId(loadedTpl);
      if (typeof profile.customFields?.education === 'string') {
        setEducation(profile.customFields.education);
      }
      if (typeof profile.customFields?.upiId === 'string') {
        setUpiId(profile.customFields.upiId);
        const savedPayee =
          typeof profile.customFields?.upiPayeeName === 'string'
            ? profile.customFields.upiPayeeName
            : profile.displayName || '';
        if (/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(profile.customFields.upiId.trim())) {
          void handleGenerateUpiQr(profile.customFields.upiId, savedPayee);
        }
      }
      if (typeof profile.customFields?.upiPayeeName === 'string') {
        setUpiPayeeName(profile.customFields.upiPayeeName);
      }
      if (profile.customFields?.showIntroOverlay !== undefined) {
        setShowIntroOverlay(profile.customFields.showIntroOverlay !== false);
      }
      if (profile.customFields?.showVentures !== undefined) {
        setShowVentures(profile.customFields.showVentures !== false);
      }
      if (profile.customFields?.showEducation !== undefined) {
        setShowEducation(profile.customFields.showEducation !== false);
      }
      if (profile.customFields?.showUpi !== undefined) {
        setShowUpi(profile.customFields.showUpi !== false);
      }
      if (profile.customFields?.showFooterSlate !== undefined) {
        setShowFooterSlate(profile.customFields.showFooterSlate !== false);
      }
      if (profile.themeConfig && Object.keys(profile.themeConfig).length > 0) {
        setThemeColors(profile.themeConfig);
      } else {
        setThemeColors(getTemplateDefaultThemeConfig(loadedTpl) as any);
      }
      if (Array.isArray(profile.socialLinks)) {
        setSocialLinks(
          profile.socialLinks.map((s: any) => {
            const platform = (s.platform || 'instagram').toLowerCase();
            const username = extractSocialUsername(platform, s.username || s.url);
            const built = buildSocialProfileUrl(platform, username);
            return {
              platform,
              username,
              url: built?.url || s.url || '',
            };
          }),
        );
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
            description: b.description || '',
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
    } else if (isNew && session?.user?.accountType) {
      setProfileType(session.user.accountType === 'business' ? 'business' : 'personal');
    }
  }, [profile, isNew, session?.user?.accountType]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (publish: boolean = false) => {
      const cleanName = displayName.trim();
      const cleanSlug = slug.trim().toLowerCase();

      if (!cleanName) {
        throw new Error(profileType === 'business' ? 'Business / Company Name is required.' : 'Display Name is required.');
      }
      const usernameError = validateUsernameFormat(cleanSlug);
      if (usernameError) {
        throw new Error(usernameError);
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
          description: (b.description || '').trim() || null,
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
          education: education.trim() || undefined,
          upiId: upiId.trim() || undefined,
          upiPayeeName: upiPayeeName.trim() || undefined,
          showIntroOverlay,
          showVentures,
          showEducation,
          showUpi,
          showFooterSlate,
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
      queryClient.invalidateQueries({ queryKey: ['public-profile'] });
      showNotification({
        type: 'success',
        message: published
          ? `Profile published live at /${savedSlug}!`
          : 'Profile draft saved successfully!',
      });
      if (isNew && profileId) {
        navigate(`/builder/${profileId}`, { replace: true });
      }
    },
    onError: (err: any) => {
      showNotification(buildProfileSaveErrorNotification(err, userAccountType, isNew));
    },
  });

  // Safe fallback name using user name or profile type (never generic 'Your Full Name' / 'Y')
  const defaultDisplayName =
    session?.user?.name || (profileType === 'business' ? 'Business Profile' : 'Professional Profile');

  // Construct Live Profile preview snapshot (strictly synced with form state, zero fake fallbacks)
  const livePreviewData: any = {
    id: id || 'preview-id',
    slug: slug || 'preview',
    displayName: displayName.trim() || defaultDisplayName,
    headline: headline.trim() || undefined,
    bio: bio.trim() || undefined,
    avatarUrl: avatarUrl.trim() || undefined,
    coverUrl: coverUrl.trim() || undefined,
    phone: phone.trim() || undefined,
    whatsapp: whatsapp.trim() || undefined,
    email: email.trim() || undefined,
    website: website.trim() || undefined,
    address: address.trim() || undefined,
    location: address.trim() || undefined,
    templateId,
    profileType,
    themeConfig: themeColors,
    customFields: {
      location: address.trim() || undefined,
      education: education.trim() || undefined,
      upiId: upiId.trim() || undefined,
      upiPayeeName: upiPayeeName.trim() || undefined,
      showIntroOverlay,
      showVentures,
      showEducation,
      showUpi,
      showFooterSlate,
      skipIntro: true,
    },
    socialLinks,
    businesses: businesses
      .filter((b) => Boolean((b.companyName || b.name || '').trim()))
      .map((b, i) => ({
        id: b.id || `biz-${i}`,
        companyName: (b.companyName || b.name || '').trim(),
        roleTitle: (b.jobTitle || b.tagline || '').trim() || undefined,
        description: (b.description || '').trim() || undefined,
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
    isEmbedded: true,
    previewPlanId: 'max',
  };

  const handleGenerateUpiQr = async (overrideUpiId?: string, overridePayee?: string) => {
    const cleanUpi = (overrideUpiId ?? upiId).trim();
    const cleanPayee = (overridePayee ?? upiPayeeName).trim() || displayName.trim() || 'Payee';

    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(cleanUpi)) {
      setUpiQrDataUrl(null);
      setUpiQrError('Enter a valid UPI ID (e.g. name@bank) to generate a QR code.');
      return;
    }

    setUpiQrError(null);
    const upiUri = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanPayee)}&cu=INR`;
    try {
      const dataUrl = await QRCode.toDataURL(upiUri, {
        width: 180,
        margin: 1,
        color: { dark: '#0A0A0B', light: '#FFFFFF' },
      });
      setUpiQrDataUrl(dataUrl);
    } catch {
      setUpiQrDataUrl(null);
      setUpiQrError('Unable to generate UPI QR code.');
    }
  };

  const handleAddSocial = () => {
    const used = new Set(socialLinks.map((s) => s.platform));
    const nextPlatform = SOCIAL_PLATFORMS.find((p) => !used.has(p.id))?.id || 'instagram';
    setSocialLinks([...socialLinks, { platform: nextPlatform, username: '', url: '' }]);
  };

  const handleUpdateSocial = (index: number, key: 'platform' | 'username', val: string) => {
    const updated = [...socialLinks];
    const current = { ...updated[index] };
    if (key === 'platform') {
      current.platform = val;
      const cleanUser = extractSocialUsername(val, current.username || current.url);
      current.username = cleanUser;
      current.url = buildSocialProfileUrl(val, cleanUser)?.url || '';
    } else {
      const cleanUser = extractSocialUsername(current.platform, val);
      current.username = cleanUser;
      current.url = buildSocialProfileUrl(current.platform, cleanUser)?.url || '';
    }
    updated[index] = current;
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
        name: '',
        jobTitle: '',
        tagline: '',
        description: '',
        businessWebsite: '',
        websiteUrl: '',
        businessAddress: '',
        address: '',
        logoUrl: '',
      },
    ]);
  };

  const handleMoveItem = <T,>(list: T[], setter: React.Dispatch<React.SetStateAction<T[]>>, index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const next = [...list];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setter(next);
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

  if (!isNew && isProfileError) {
    return (
      <div data-theme="light" className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] p-6">
        <div className="max-w-md w-full p-6 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-[var(--danger)] mx-auto" />
          <div className="space-y-1">
            <h2 className="font-head text-base font-semibold text-[var(--ink)]">Unable to Load Profile</h2>
            <p className="font-body text-xs text-[var(--ink-muted)]">
              {(profileError as Error)?.message || 'The requested profile could not be retrieved.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => refetchProfile()}>
              Retry
            </Button>
            <Link to="/dashboard">
              <Button type="button" variant="accent" size="sm">
                Back to Profiles
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabList = [
    { id: 'theme', label: '1. Theme & Style', shortLabel: 'Theme', icon: Palette },
    { id: 'identity', label: profileType === 'personal' ? '2. Identity & Card' : '2. Company Info', shortLabel: profileType === 'personal' ? 'Identity' : 'Company', icon: User },
    { id: 'socials', label: '3. Social Channels', shortLabel: 'Socials', icon: Share2 },
    { id: 'businesses', label: profileType === 'business' ? '4. Branches & Ventures' : '4. Ventures', shortLabel: 'Ventures', icon: Briefcase },
    ...(profileType === 'business'
      ? [
        { id: 'catalogue', label: '5. Products & Menu', shortLabel: 'Catalogue', icon: ShoppingBag },
      ]
      : []),
  ];

  const currentStepIndex = tabList.findIndex((t) => t.id === activeTab);
  const activeTabObj = tabList.find((t) => t.id === activeTab);
  const activeTabShort = activeTabObj?.shortLabel ?? 'Edit';

  return (
    <div
      data-theme="light"
      className="min-h-screen lg:h-screen lg:overflow-hidden bg-[var(--bg-page)] text-[var(--ink)] font-body flex flex-col selection:bg-[var(--accent)] selection:text-[var(--accent-ink)]"
    >
      {/* Compact Studio Header Bar */}
      <header className="h-12 sm:h-14 px-3 sm:px-5 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors shrink-0"
            title="Back to Profiles"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-head text-xs sm:text-sm font-medium text-[var(--ink)] flex items-center gap-1.5 truncate">
              <span className="truncate">{displayName || 'New Profile Studio'}</span>
              {slug && (
                <a
                  href={`/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden md:inline-flex items-center text-[10px] text-[var(--accent-text)] hover:underline font-mono shrink-0"
                >
                  <span>/{slug}</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-1" />
                </a>
              )}
            </h1>
            <p className="font-body text-[10px] text-[var(--ink-muted)] truncate hidden sm:block">
              Profile &amp; Template Studio
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
          role="alert"
          className={`fixed top-16 right-4 left-4 sm:left-auto sm:max-w-md z-50 px-3.5 py-2.5 rounded-[var(--radius-md)] shadow-xl flex items-center gap-2.5 text-xs font-medium border ${
            notification.type === 'success'
              ? 'bg-[var(--bg-surface)] text-[var(--success)] border-[var(--success)]/40'
              : notification.type === 'limit_reached'
              ? 'bg-[var(--bg-surface)] text-[var(--ink)] border-[var(--accent)] ring-1 ring-[var(--accent)]/30'
              : notification.type === 'info'
              ? 'bg-[var(--bg-surface)] text-[var(--ink)] border-[var(--border)]'
              : 'bg-[var(--bg-surface)] text-[var(--danger)] border-[var(--danger)]/40'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="w-4 h-4 text-[var(--success)] shrink-0" />
          ) : notification.type === 'limit_reached' ? (
            <AlertCircle className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[var(--danger)] shrink-0" />
          )}

          <span className="font-body text-[11px] leading-snug flex-1">
            {notification.message}
          </span>

          {notification.actionLabel && notification.actionTo && (
            <button
              type="button"
              onClick={() => {
                const target = notification.actionTo!;
                dismissNotification();
                navigate(target);
              }}
              className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-ink)] text-[11px] font-semibold hover:opacity-90 transition-opacity shrink-0"
            >
              {notification.actionLabel}
            </button>
          )}

          <button
            type="button"
            onClick={dismissNotification}
            aria-label="Close notification"
            className="text-[var(--ink-muted)] hover:text-[var(--ink)] p-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Studio Workspace Layout — Fits Viewport on Desktop */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Compact Sticky Controls + Independently Scrollable Form */}
        <div
          className={`w-full lg:w-[58%] xl:w-[59%] border-r border-[var(--border)] flex flex-col min-h-0 ${mobileView === 'preview' ? 'hidden lg:flex' : 'flex'
            }`}
        >
          {/* Sticky Compact Navigation & Architecture Header */}
          <div className="px-4 sm:px-6 pt-3 pb-2.5 border-b border-[var(--border)] bg-[var(--bg-page)] shrink-0 space-y-2.5">
            {/* Account Type Indicator Banner (Clean, compact, no interactive switcher for defined account types) */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border)] text-xs">
              <div className="flex items-center gap-2">
                {profileType === 'business' ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent-text)]">
                      <Briefcase className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="font-medium text-[var(--ink)]">Business Profile Studio</span>
                      <span className="ml-1.5 font-mono text-[10px] text-[var(--accent-text)] uppercase font-semibold">Business Account</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent-text)]">
                      <User className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="font-medium text-[var(--ink)]">Personal Visiting Card Studio</span>
                      <span className="ml-1.5 font-mono text-[10px] text-[var(--accent-text)] uppercase font-semibold">Personal Account</span>
                    </div>
                  </>
                )}
              </div>
              {isNew && userAccountType === 'personal' && userProfiles.length > 0 ? (
                <Link
                  to={`/builder/${userProfiles[0].id}`}
                  className="font-mono text-[10px] text-[var(--accent-text)] hover:underline font-medium"
                >
                  Edit Existing Profile →
                </Link>
              ) : (
                <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                  {profileType === 'business' ? 'Business Templates' : 'Personal Templates'}
                </span>
              )}
            </div>

            {/* Thin Horizontal Segmented Progress Bars */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${tabList.length}, minmax(0, 1fr))` }}>
              {tabList.map((tab, idx) => {
                const isCompleted = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;
                return (
                  <div
                    key={tab.id}
                    className={`h-1 rounded-full transition-colors duration-200 ${isCompleted
                      ? 'bg-[var(--accent)]'
                      : isCurrent
                        ? 'bg-[var(--ink)]'
                        : 'bg-[var(--border)]'
                      }`}
                  />
                );
              })}
            </div>

            {/* Compact Stepper Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {tabList.map((tab, idx) => {
                const Icon = tab.icon;
                const isCompleted = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] font-mono text-[11px] whitespace-nowrap transition-colors shrink-0 ${isCurrent
                      ? 'bg-[var(--ink)] text-[var(--bg-page)] font-medium shadow-none'
                      : isCompleted
                        ? 'border border-[var(--accent)]/60 bg-[var(--accent)]/10 text-[var(--accent-text)]'
                        : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)]'
                      }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 text-[var(--accent-text)]" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Independently Scrollable Step Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 pb-28 lg:pb-6">

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

                  {/* Theme Card Grid with 2px orange border when selected (Filtered by Account Profile Type) */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                    {STANDARD_TEMPLATES.filter((tpl) => {
                      const requiredType = profileType.toUpperCase();
                      return (
                        tpl.templateType === requiredType ||
                        (tpl.supportedProfileTypes && tpl.supportedProfileTypes.includes(profileType))
                      );
                    }).map((tpl) => {
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

                {/* Profile Display Settings (Section Visibility Toggles) */}
                <div className="pt-4 border-t border-[var(--border)] space-y-3">
                  <div>
                    <h4 className="font-head text-sm font-medium text-[var(--ink)]">Profile Display Settings</h4>
                    <p className="font-body text-[11px] text-[var(--ink-muted)]">
                      Control optional visual sections on your public profile. Empty sections are hidden automatically.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: 'Cinematic Intro Curtain', checked: showIntroOverlay, setter: setShowIntroOverlay },
                      { label: 'Ventures', checked: showVentures, setter: setShowVentures },
                      { label: 'Education Line', checked: showEducation, setter: setShowEducation },
                      { label: 'UPI Payment Card', checked: showUpi, setter: setShowUpi },
                      { label: 'Production Slate Footer', checked: showFooterSlate, setter: setShowFooterSlate },
                    ].map((toggle) => (
                      <label
                        key={toggle.label}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--ink)] cursor-pointer select-none"
                      >
                        <span>{toggle.label}</span>
                        <input
                          type="checkbox"
                          checked={toggle.checked}
                          onChange={(e) => toggle.setter(e.target.checked)}
                          className="accent-[var(--accent)] h-3.5 w-3.5"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: IDENTITY & BASIC CONTACT */}
            {activeTab === 'identity' && (
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[var(--ink)] font-medium">Full Display Name *</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={profileType === 'business' ? 'e.g. Nova Technologies' : 'e.g. Alex Morgan'}
                      className="mt-1 h-9"
                    />
                  </div>
                  <div>
                    <UsernameInput
                      value={slug}
                      onChange={setSlug}
                      originalUsername={profile?.slug}
                      isLocked={Boolean(profile?.usernameLocked)}
                      label="Username *"
                      placeholder="john"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[var(--ink)] font-medium">Professional Headline / Role</Label>
                    <Input
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Managing Director • Nova Technologies"
                      className="mt-1 h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[var(--ink)] font-medium">Location</Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="London, UK or Bengaluru, India"
                      className="mt-1 h-9"
                    />
                  </div>
                </div>

                <ImageUploadField
                  label="Profile Photo / Avatar"
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  category="avatar"
                  placeholder="https://images.unsplash.com/photo-..."
                />

                <div>
                  <Label className="text-xs text-[var(--ink)] font-medium">Bio / About Profile</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    placeholder="Short intro about your work, expertise, or brand..."
                    className="mt-1 bg-[var(--bg-raised)] border border-[var(--border)] text-xs text-[var(--ink)] rounded-[var(--radius-sm)] resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-[var(--border)] space-y-3">
                  <h4 className="font-head text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                    Direct Contact &amp; Payment
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-[var(--ink)] font-medium">Phone Number</Label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98200 12345"
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[var(--ink)] font-medium">WhatsApp Number</Label>
                      <Input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+91 98200 12345"
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[var(--ink)] font-medium">Business Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="mt-1 h-9"
                      />
                    </div>
                    {templateId !== 'cinematic-noir' && (
                      <div>
                        <Label className="text-xs text-[var(--ink)] font-medium">Website</Label>
                        <Input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://example.com"
                          className="mt-1 h-9"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-[var(--ink)] font-medium">Education (Optional)</Label>
                    <Input
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder="e.g. Business Administration"
                      className="mt-1 h-9"
                    />
                  </div>

                  <div className="p-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-surface)] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[var(--ink)]">UPI Payment &amp; QR</span>
                      <Button
                        type="button"
                        onClick={() => handleGenerateUpiQr()}
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-[11px] gap-1.5 rounded-[var(--radius-sm)]"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                        <span>Generate QR</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <Label className="text-[11px] text-[var(--ink-muted)]">UPI ID / Payee VPA</Label>
                        <Input
                          value={upiId}
                          onChange={(e) => {
                            setUpiId(e.target.value);
                            setUpiQrDataUrl(null);
                            setUpiQrError(null);
                          }}
                          placeholder="name@upi"
                          className="mt-1 h-8 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-[var(--ink-muted)]">Payee Name</Label>
                        <Input
                          value={upiPayeeName}
                          onChange={(e) => {
                            setUpiPayeeName(e.target.value);
                            setUpiQrDataUrl(null);
                            setUpiQrError(null);
                          }}
                          placeholder="Payee display name"
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                    </div>

                    {upiQrError && (
                      <p className="text-[11px] text-[var(--danger)] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{upiQrError}</span>
                      </p>
                    )}

                    {upiQrDataUrl && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-20 h-20 rounded-lg bg-white p-1.5 border border-[var(--border)] shrink-0">
                          <img src={upiQrDataUrl} alt="Generated UPI QR" className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-medium text-[var(--ink)]">UPI QR Ready</p>
                          <p className="text-[11px] font-mono text-[var(--ink-muted)] truncate">{upiId.trim()}</p>
                          <p className="text-[10px] text-[var(--ink-muted)]">
                            Synced to live preview &amp; saved with profile.
                          </p>
                        </div>
                      </div>
                    )}
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

                <div className="space-y-2.5">
                  {socialLinks.map((item, idx) => {
                    const platformCfg = getSocialPlatform(item.platform) || SOCIAL_PLATFORMS[0];
                    const rawUsername = item.username ?? extractSocialUsername(item.platform, item.url);
                    const validation = rawUsername
                      ? validateSocialUsername(item.platform, rawUsername)
                      : { valid: false, username: '', error: undefined };
                    const generated = rawUsername
                      ? buildSocialProfileUrl(item.platform, rawUsername)
                      : null;

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border)] space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <select
                            value={item.platform}
                            onChange={(e) => handleUpdateSocial(idx, 'platform', e.target.value)}
                            className="bg-[var(--bg-raised)] border border-[var(--border)] text-xs rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[var(--ink)] focus:outline-none shrink-0"
                          >
                            {SOCIAL_PLATFORMS.map((p) => {
                              const isUsedElsewhere = socialLinks.some(
                                (other, otherIdx) => otherIdx !== idx && other.platform === p.id,
                              );
                              return (
                                <option key={p.id} value={p.id} disabled={isUsedElsewhere}>
                                  {p.name}
                                </option>
                              );
                            })}
                          </select>

                          <Input
                            type="text"
                            value={rawUsername}
                            onChange={(e) => handleUpdateSocial(idx, 'username', e.target.value)}
                            placeholder={`Enter ${platformCfg.name} username`}
                            className="flex-1 h-8 text-xs"
                          />

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveItem(socialLinks, setSocialLinks, idx, -1)}
                              disabled={idx === 0}
                              className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-30 transition-colors"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveItem(socialLinks, setSocialLinks, idx, 1)}
                              disabled={idx === socialLinks.length - 1}
                              className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-30 transition-colors"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSocial(idx)}
                              className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {generated ? (
                          <p className="text-[10px] font-mono text-[var(--ink-muted)] truncate pl-1">
                            Link: <span className="text-[var(--ink)]">{generated.url}</span>
                          </p>
                        ) : validation.error ? (
                          <p className="text-[10px] text-[var(--danger)] pl-1">{validation.error}</p>
                        ) : null}
                      </div>
                    );
                  })}

                  {socialLinks.length === 0 && (
                    <div className="text-center py-12 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-surface)]">
                      <Share2 className="w-8 h-8 text-[var(--ink-muted)] mx-auto mb-2 opacity-50" />
                      <p className="font-body text-xs text-[var(--ink-muted)]">No social media links added yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: BUSINESSES & VENTURES */}
            {activeTab === 'businesses' && (
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-head text-base font-medium text-[var(--ink)]">
                      {profileType === 'business' ? 'Branches & Associated Ventures' : 'Ventures & Companies'}
                    </h3>
                    <p className="font-body text-xs text-[var(--ink-muted)]">
                      Add, reorder, or edit ventures displayed in your profile
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddBusiness}
                    variant="accent"
                    size="sm"
                    className="rounded-[var(--radius-sm)] text-xs gap-1 shadow-none shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Venture</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {businesses.map((biz, idx) => (
                    <div
                      key={biz.id || idx}
                      className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] space-y-2.5"
                    >
                      {/* Card Header: Venture number on left, Up/Down/Delete on right */}
                      <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]/50">
                        <span className="font-mono text-[10px] text-[var(--accent-text)] font-semibold uppercase tracking-wider">
                          Venture #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(businesses, setBusinesses, idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-surface-elevated)] disabled:opacity-30 transition-colors"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(businesses, setBusinesses, idx, 1)}
                            disabled={idx === businesses.length - 1}
                            className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-surface-elevated)] disabled:opacity-30 transition-colors"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setBusinesses(businesses.filter((_, i) => i !== idx))}
                            className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-surface-elevated)] transition-colors ml-1"
                            title="Delete Venture"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row 1 — Primary details: Name (~42%), Role (~35%), Company Logo (Remaining ~23%) */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                        <div className="md:col-span-5 min-w-0">
                          <Label className="text-[11px] text-[var(--ink)]">Venture / Company Name *</Label>
                          <Input
                            value={biz.companyName || biz.name || ''}
                            onChange={(e) => {
                              const updated = [...businesses];
                              updated[idx] = {
                                ...updated[idx],
                                companyName: e.target.value,
                                name: e.target.value,
                              };
                              setBusinesses(updated);
                            }}
                            placeholder="e.g. Nova Technologies"
                            className="mt-0.5 h-8 text-xs w-full"
                          />
                        </div>

                        <div className="md:col-span-4 min-w-0">
                          <Label className="text-[11px] text-[var(--ink)]">Role / Designation</Label>
                          <Input
                            value={biz.jobTitle || biz.tagline || ''}
                            onChange={(e) => {
                              const updated = [...businesses];
                              updated[idx] = {
                                ...updated[idx],
                                jobTitle: e.target.value,
                                tagline: e.target.value,
                              };
                              setBusinesses(updated);
                            }}
                            placeholder="e.g. Founder & CEO"
                            className="mt-0.5 h-8 text-xs w-full"
                          />
                        </div>

                        <div className="md:col-span-3 min-w-0 overflow-hidden">
                          <ImageUploadField
                            label="Company Logo"
                            value={biz.logoUrl || ''}
                            onChange={(nextUrl) => {
                              const updated = [...businesses];
                              updated[idx] = {
                                ...updated[idx],
                                logoUrl: nextUrl,
                              };
                              setBusinesses(updated);
                            }}
                            category="logo"
                            placeholder="https://..."
                            compact
                          />
                        </div>
                      </div>

                      {/* Row 2 — Secondary details: Short Description (~42%), Website URL (~29%), Location (~29%) */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                        <div className="md:col-span-5 min-w-0">
                          <Label className="text-[11px] text-[var(--ink)]">Short Description (Optional)</Label>
                          <Input
                            value={biz.description || ''}
                            onChange={(e) => {
                              const updated = [...businesses];
                              updated[idx] = {
                                ...updated[idx],
                                description: e.target.value,
                              };
                              setBusinesses(updated);
                            }}
                            placeholder="Brief summary of venture"
                            className="mt-0.5 h-8 text-xs w-full"
                          />
                        </div>

                        <div className="md:col-span-3.5 md:col-span-4 min-w-0">
                          <Label className="text-[11px] text-[var(--ink)]">Website URL</Label>
                          <Input
                            type="url"
                            value={biz.websiteUrl || biz.businessWebsite || biz.website || ''}
                            onChange={(e) => {
                              const updated = [...businesses];
                              updated[idx] = {
                                ...updated[idx],
                                websiteUrl: e.target.value,
                                businessWebsite: e.target.value,
                                website: e.target.value,
                              };
                              setBusinesses(updated);
                            }}
                            placeholder="https://example.com"
                            className="mt-0.5 h-8 font-mono text-xs w-full"
                          />
                        </div>

                        <div className="md:col-span-3.5 md:col-span-3 min-w-0">
                          <Label className="text-[11px] text-[var(--ink)]">Location (Optional)</Label>
                          <Input
                            value={biz.address || biz.businessAddress || ''}
                            onChange={(e) => {
                              const updated = [...businesses];
                              updated[idx] = {
                                ...updated[idx],
                                address: e.target.value,
                                businessAddress: e.target.value,
                              };
                              setBusinesses(updated);
                            }}
                            placeholder="e.g. Kozhikode, Kerala"
                            className="mt-0.5 h-8 text-xs w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {businesses.length === 0 && (
                    <div className="text-center py-10 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
                      <Briefcase className="w-8 h-8 text-[var(--ink-muted)] mx-auto opacity-50" />
                      <div>
                        <p className="font-body text-xs text-[var(--ink-muted)]">No ventures added yet.</p>
                        <p className="font-body text-[11px] text-[var(--ink-muted)] opacity-80">
                          Add your companies or ventures to showcase them on your profile.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddBusiness}
                        variant="outline"
                        size="sm"
                        className="rounded-[var(--radius-sm)] text-xs gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Venture</span>
                      </Button>
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
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(catalogue, setCatalogue, idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-30 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(catalogue, setCatalogue, idx, 1)}
                            disabled={idx === catalogue.length - 1}
                            className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-30 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCatalogue(catalogue.filter((_, i) => i !== idx))}
                            className="p-1 text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
          </div>
        </div>

        {/* Right Side: Realistic Viewport-Fit Smartphone Simulator (Desktop >= lg) */}
        <div
          className="hidden lg:flex lg:w-[42%] xl:w-[41%] bg-[var(--bg-page)] flex-col items-center justify-center p-3 xl:p-4 overflow-hidden shrink-0"
        >
          <div className="text-center mb-2 shrink-0">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)] flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Live Smartphone Preview
            </span>
          </div>

          <SmartphoneSimulator profile={livePreviewData} templateId={templateId} />
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

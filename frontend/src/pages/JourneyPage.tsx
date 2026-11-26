import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { useSession } from '../lib/auth/client';
import { usePurchaseJourney } from '../hooks/usePurchaseJourney';
import { BrandLogo } from '../components/brand';
import { Button } from '../components/ui/button';
import { CardPreview } from '../components/cards/CardPreview';
import { ProfileRenderer, canonicalTemplateId } from '../components/templates/ProfileRenderer';
import { MiniatureThemeCardPreview } from '../components/templates/MiniatureThemeCardPreview';
import { TemplatePreviewModal } from '../components/templates/TemplatePreviewModal';
import {
  STANDARD_TEMPLATES,
  getTemplateDefaultThemeConfig,
} from '../modules/templates/constants';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  Eye,
  Layers,
  Loader2,
  Palette,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';

type FlowStep = 'account' | 'template' | 'profile' | 'card';

const FLOW_STEPS: Array<{ id: string; label: string }> = [
  { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
  { id: 'card', label: 'Card Design' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'success', label: 'Success' },
];

export function JourneyPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending } = useSession();
  const isAuthenticated = Boolean(session?.user?.id);

  const {
    user,
    entitlements,
    profiles,
    designs,
    journey,
    isLoading: isJourneyLoading,
    updateJourney,
    resetJourney,
  } = usePurchaseJourney();

  // Redirect unauthenticated users to registration while preserving /journey
  useEffect(() => {
    if (!isSessionPending && !isAuthenticated) {
      navigate(`/register?redirect=${encodeURIComponent('/journey')}`, { replace: true });
    }
  }, [isSessionPending, isAuthenticated, navigate]);

  const [activeStep, setActiveStep] = useState<FlowStep>('account');
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Account setup state
  const [selectedAccountType, setSelectedAccountType] = useState<'personal' | 'business'>('personal');
  const [businessName, setBusinessName] = useState('');

  // Profile template & creation state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('obsidian-luxury');
  const [previewModalTemplateId, setPreviewModalTemplateId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Profile form fields (all supported fields)
  const [profileType, setProfileType] = useState<'personal' | 'business'>('personal');
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyRole, setCompanyRole] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([]);

  // Card Design step state
  const { data: productsData = [] } = useQuery<any[]>({
    queryKey: ['public', 'products'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/products'),
  });
  const [selectedProductId, setSelectedProductId] = useState<string>('prod_matte_obsidian');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('var_matte_black');
  const [selectedCardTemplateId, setSelectedCardTemplateId] = useState<string>('tpl_executive_obsidian');
  const [cardCustomName, setCardCustomName] = useState<string>('');
  const [cardCustomRole, setCardCustomRole] = useState<string>('');
  const [cardQuantity, setCardQuantity] = useState<number>(1);
  const [cardPreviewSide, setCardPreviewSide] = useState<'front' | 'back'>('front');

  const { data: cardTemplates = [] } = useQuery<any[]>({
    queryKey: ['public', 'card-templates', selectedProductId],
    queryFn: () => ApiClient.get<any[]>(`/api/v1/products/${selectedProductId}/templates`),
    enabled: Boolean(selectedProductId),
  });

  // Hydrate initial step and state from backend journey & user context
  useEffect(() => {
    if (!user && !journey) return;

    const requestedStep = searchParams.get('step') as FlowStep | null;
    const effectiveAccountType = (user?.accountType || journey?.accountType) as
      | 'personal'
      | 'business'
      | null;

    if (effectiveAccountType) {
      setSelectedAccountType(effectiveAccountType);
      setProfileType(effectiveAccountType);
    }

    if (journey?.selectedProfileTemplateId) {
      setSelectedTemplateId(canonicalTemplateId(journey.selectedProfileTemplateId));
    }
    if (journey?.selectedProductId) {
      setSelectedProductId(journey.selectedProductId);
    }
    if (journey?.selectedVariantId) {
      setSelectedVariantId(journey.selectedVariantId);
    }
    if (journey?.selectedCardTemplateId) {
      setSelectedCardTemplateId(journey.selectedCardTemplateId);
    }
    if (journey?.quantity && journey.quantity >= 1) {
      setCardQuantity(effectiveAccountType === 'personal' ? 1 : journey.quantity);
    }

    if (journey?.profileId) {
      setEditingProfileId(journey.profileId);
    } else if (effectiveAccountType === 'personal' && profiles.length > 0) {
      setEditingProfileId(profiles[0].id);
    }

    // Determine initial step if not explicitly overridden by URL
    if (requestedStep && ['account', 'template', 'profile', 'card'].includes(requestedStep)) {
      setActiveStep(requestedStep);
      return;
    }

    if (!effectiveAccountType) {
      setActiveStep('account');
    } else if (journey?.stage === 'CARD_DESIGN' && (journey.profileId || profiles.length > 0)) {
      setActiveStep('card');
    } else if (journey?.stage === 'PROFILE_CREATION') {
      setActiveStep('profile');
    } else if (journey?.selectedProfileTemplateId && !journey.profileId) {
      setActiveStep('profile');
    } else if (effectiveAccountType === 'personal' && profiles.length > 0) {
      // Existing personal customer with a profile: show account/profile summary or jump to profile/card
      setActiveStep('account');
    } else if (effectiveAccountType === 'business' && profiles.length > 0 && !journey?.profileId) {
      setActiveStep('account');
    } else {
      setActiveStep('template');
    }
  }, [user?.id, user?.accountType, journey?.id, journey?.stage, profiles.length]);

  // Populate profile form when editingProfileId changes
  const { data: loadedProfile } = useQuery({
    queryKey: ['profile', editingProfileId],
    queryFn: () => ApiClient.get<any>(`/api/v1/profiles/${editingProfileId}`),
    enabled: Boolean(editingProfileId),
  });

  useEffect(() => {
    if (loadedProfile) {
      setProfileType(loadedProfile.profileType === 'business' ? 'business' : 'personal');
      setDisplayName(loadedProfile.displayName || '');
      setSlug(loadedProfile.slug || '');
      setHeadline(loadedProfile.headline || '');
      setBio(loadedProfile.bio || '');
      setPhone(loadedProfile.phone || '');
      setWhatsapp(loadedProfile.whatsapp || '');
      setEmail(loadedProfile.email || '');
      setWebsite(loadedProfile.website || '');
      setAddress(loadedProfile.address || '');
      setAvatarUrl(loadedProfile.avatarUrl || '');
      setCoverUrl(loadedProfile.coverUrl || '');
      if (loadedProfile.templateId) {
        setSelectedTemplateId(canonicalTemplateId(loadedProfile.templateId));
      }
      if (Array.isArray(loadedProfile.socialLinks)) {
        setSocialLinks(loadedProfile.socialLinks);
      }
      if (Array.isArray(loadedProfile.businesses) && loadedProfile.businesses[0]) {
        setCompanyName(loadedProfile.businesses[0].companyName || loadedProfile.businesses[0].name || '');
        setCompanyRole(loadedProfile.businesses[0].jobTitle || loadedProfile.businesses[0].tagline || '');
      }
      if (loadedProfile.customFields?.note) {
        setCustomNote(String(loadedProfile.customFields.note));
      }
    } else if (user && !editingProfileId && !displayName) {
      setDisplayName(user.name || '');
      setEmail(user.email || '');
      const autoSlug = (user.name || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(`${autoSlug}-${Math.floor(100 + Math.random() * 900)}`);
    }
  }, [loadedProfile, editingProfileId, user?.id]);

  // Pre-fill card name/role from profile
  useEffect(() => {
    if (!cardCustomName && displayName) setCardCustomName(displayName.toUpperCase());
    if (!cardCustomRole && headline) setCardCustomRole(headline.toUpperCase());
  }, [displayName, headline]);

  const showSavedToast = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Step 1 Handler: Confirm Account Type or Select Existing Profile
  const handleConfirmAccountType = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (!user?.accountType) {
        await ApiClient.post('/api/auth/account-type', { accountType: selectedAccountType });
        await queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      }
      await updateJourney({
        accountType: user?.accountType || selectedAccountType,
        stage: 'PROFILE_TEMPLATE_SELECTION',
      });
      setProfileType(user?.accountType || selectedAccountType);
      setActiveStep('template');
      setSearchParams({ step: 'template' });
    } catch (err: any) {
      setError(err?.message || 'Could not save account type.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpgradeToBusiness = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await ApiClient.post('/api/auth/upgrade-business', {
        businessName: businessName.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      await queryClient.invalidateQueries({ queryKey: ['purchase-journey', 'active'] });
      setSelectedAccountType('business');
      setProfileType('business');
      showSavedToast('Upgraded to Business Account');
    } catch (err: any) {
      setError(err?.message || 'Failed to upgrade account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectExistingProfile = async (profId: string, profTemplateId?: string) => {
    setError(null);
    setEditingProfileId(profId);
    if (profTemplateId) setSelectedTemplateId(canonicalTemplateId(profTemplateId));
    await updateJourney({
      profileId: profId,
      selectedProfileTemplateId: profTemplateId || selectedTemplateId,
      stage: 'PROFILE_CREATION',
    });
    setActiveStep('profile');
    setSearchParams({ step: 'profile' });
  };

  const handleStartNewProfile = async () => {
    setError(null);
    setEditingProfileId(null);
    setDisplayName(user?.name || '');
    setHeadline('');
    setBio('');
    setSlug(`${(user?.name || 'profile').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(100 + Math.random() * 900)}`);
    await updateJourney({
      profileId: null,
      stage: 'PROFILE_TEMPLATE_SELECTION',
    });
    setActiveStep('template');
    setSearchParams({ step: 'template' });
  };

  // Step 2a Handler: Confirm Template Selection
  const handleConfirmTemplate = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await updateJourney({
        selectedProfileTemplateId: selectedTemplateId,
        stage: 'PROFILE_CREATION',
      });
      setActiveStep('profile');
      setSearchParams({ step: 'profile' });
    } catch (err: any) {
      setError(err?.message || 'Could not save template selection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2b Handler: Save & Publish Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    if (!cleanSlug || cleanSlug.length < 3) {
      setError('Please enter a valid profile URL handle (minimum 3 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        profileType,
        displayName: displayName.trim(),
        slug: cleanSlug,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        address: address.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        coverUrl: coverUrl.trim() || null,
        templateId: selectedTemplateId,
        themeId: selectedTemplateId,
        themeConfig: getTemplateDefaultThemeConfig(selectedTemplateId),
        socialLinks: socialLinks.filter((s) => s.url && s.url.trim()),
        customFields: customNote.trim() ? { note: customNote.trim() } : {},
        businesses: companyName.trim()
          ? [{ companyName: companyName.trim(), jobTitle: companyRole.trim() || headline.trim() }]
          : [],
      };

      let savedProfile: any;
      if (editingProfileId) {
        savedProfile = await ApiClient.patch<any>(`/api/v1/profiles/${editingProfileId}`, payload);
      } else {
        savedProfile = await ApiClient.post<any>('/api/v1/profiles', payload);
      }

      const finalProfileId = savedProfile?.id || editingProfileId;
      if (finalProfileId) {
        setEditingProfileId(finalProfileId);
        // Publish profile so NFC card tap resolves immediately
        await ApiClient.post(`/api/v1/profiles/${finalProfileId}/publish`, {}).catch(() => {});
        await updateJourney({
          profileId: finalProfileId,
          selectedProfileTemplateId: selectedTemplateId,
          stage: 'CARD_DESIGN',
        });
        await queryClient.invalidateQueries({ queryKey: ['purchase-journey', 'active'] });
      }

      showSavedToast('Profile saved & published');
      setActiveStep('card');
      setSearchParams({ step: 'card' });
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3 Handler: Save Card Design, Attach to Profile, & Proceed to Checkout
  const handleProceedToCheckout = async () => {
    setError(null);
    const activeProfileId = editingProfileId || journey?.profileId || profiles[0]?.id;
    if (!activeProfileId) {
      setError('Please create or select a digital profile first.');
      setActiveStep('profile');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeCardTpl =
        cardTemplates.find((t: any) => t.id === selectedCardTemplateId) || cardTemplates[0];
      const customizedFrontJson = buildCustomizedFrontJson(
        activeCardTpl?.frontCanvasJson,
        cardCustomName || displayName.toUpperCase() || 'TAPTCH MEMBER',
        cardCustomRole || headline.toUpperCase() || 'EXECUTIVE',
      );

      // Persist card design with profileId attachment
      const savedDesign = await ApiClient.post<any>('/api/v1/designs/draft', {
        designId: journey?.designId || undefined,
        name: `${displayName || 'Custom'} NFC Card`,
        productId: selectedProductId,
        variantId: selectedVariantId,
        templateId: activeCardTpl?.id || undefined,
        profileId: activeProfileId,
        frontCanvasJson: customizedFrontJson,
        backCanvasJson: activeCardTpl?.backCanvasJson || undefined,
        previewUrl: activeCardTpl?.previewUrl || undefined,
      });

      const designId = savedDesign?.id || journey?.designId;
      if (designId) {
        await ApiClient.post(`/api/v1/designs/${designId}/attach-profile`, {
          profileId: activeProfileId,
        });
      }

      const effectiveQty = (user?.accountType || selectedAccountType) === 'personal' ? 1 : Math.max(1, cardQuantity);

      await updateJourney({
        selectedProductId,
        selectedVariantId,
        selectedCardTemplateId: activeCardTpl?.id || selectedCardTemplateId,
        profileId: activeProfileId,
        designId: designId || null,
        quantity: effectiveQty,
        stage: 'CHECKOUT',
      });

      const params = new URLSearchParams({
        journeyId: journey?.id || 'active',
        productId: selectedProductId,
        variantId: selectedVariantId,
        profileId: activeProfileId,
        quantity: String(effectiveQty),
      });
      if (designId) params.set('designId', designId);

      navigate(`/checkout?${params.toString()}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to save card configuration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeProduct = useMemo(
    () => productsData.find((p) => p.id === selectedProductId) || productsData[0],
    [productsData, selectedProductId],
  );
  const activeCardTpl = useMemo(
    () => cardTemplates.find((t: any) => t.id === selectedCardTemplateId) || cardTemplates[0],
    [cardTemplates, selectedCardTemplateId],
  );
  const liveCustomizedFrontJson = useMemo(
    () =>
      buildCustomizedFrontJson(
        activeCardTpl?.frontCanvasJson,
        cardCustomName || displayName.toUpperCase() || 'TAPTCH MEMBER',
        cardCustomRole || headline.toUpperCase() || 'EXECUTIVE',
      ),
    [activeCardTpl, cardCustomName, cardCustomRole, displayName, headline],
  );

  // Live Profile Preview snapshot object
  const liveProfilePreviewData = useMemo(
    () => ({
      id: editingProfileId || 'preview',
      slug: slug || 'preview',
      displayName: displayName || user?.name || 'Your Name',
      headline: headline || 'Your Role / Headline',
      bio: bio || 'Share your digital identity, contact card, and links with a single tap.',
      avatarUrl: avatarUrl || null,
      coverUrl: coverUrl || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: email || user?.email || null,
      website: website || null,
      address: address || null,
      profileType,
      templateId: selectedTemplateId,
      themeId: selectedTemplateId,
      themeConfig: getTemplateDefaultThemeConfig(selectedTemplateId),
      socialLinks: socialLinks.filter((s) => s.url),
      businesses: companyName ? [{ id: 'b1', companyName, name: companyName, jobTitle: companyRole }] : [],
      catalogue: [],
      sections: [],
    }),
    [
      editingProfileId,
      slug,
      displayName,
      headline,
      bio,
      avatarUrl,
      coverUrl,
      phone,
      whatsapp,
      email,
      website,
      address,
      profileType,
      selectedTemplateId,
      socialLinks,
      companyName,
      companyRole,
      user,
    ],
  );

  if (isSessionPending || isJourneyLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin mb-3" />
        <p className="text-xs font-medium text-zinc-600">Restoring your setup progress...</p>
      </div>
    );
  }

  const currentStepIdx =
    activeStep === 'account' ? 0 : activeStep === 'template' || activeStep === 'profile' ? 1 : 2;
  const effectiveAccountType = user?.accountType || selectedAccountType;
  const isPersonalAtLimit =
    effectiveAccountType === 'personal' && profiles.length >= (entitlements?.maxProfiles || 1);

  return (
    <div data-theme="light" className="min-h-screen bg-[#F8F9FA] text-[#171717] flex flex-col font-sans">
      {/* Compact Distraction-Free Flow Header (Zero Dashboard Sidebar) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8E8E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo variant="horizontal" size="sm" asLink href="/" />
          </div>

          {/* 5-Step Progress Indicator */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Purchase journey progress">
            {FLOW_STEPS.map((st, idx) => {
              const isCompleted = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <React.Fragment key={st.id}>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      isCurrent
                        ? 'bg-[#FFF3E9] text-[#FF6A00] border border-[#FF6A00]/30 font-semibold'
                        : isCompleted
                        ? 'text-[#16A36A]'
                        : 'text-[#929292]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-[#FF6A00] text-white'
                          : isCompleted
                          ? 'bg-[#16A36A] text-white'
                          : 'bg-[#E8E8E8] text-[#666666]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                    </span>
                    <span>{st.label}</span>
                  </div>
                  {idx < FLOW_STEPS.length - 1 && (
                    <div className="w-4 h-px bg-[#E8E8E8]" />
                  )}
                </React.Fragment>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 text-xs">
            {saveMessage && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[#16A36A] font-medium">
                <Check className="w-3.5 h-3.5" />
                {saveMessage}
              </span>
            )}
            <Link
              to="/dashboard"
              className="text-xs font-medium text-[#666666] hover:text-[#171717] transition-colors"
            >
              My Account
            </Link>
          </div>
        </div>

        {/* Mobile Compact Progress Strip */}
        <div className="md:hidden px-4 pb-2.5 flex items-center justify-between text-[11px] text-[#666666]">
          <span className="font-semibold text-[#FF6A00]">
            Step {currentStepIdx + 1} of 5: {FLOW_STEPS[currentStepIdx].label}
          </span>
          <div className="w-28 h-1.5 rounded-full bg-[#E8E8E8] overflow-hidden">
            <div
              className="h-full bg-[#FF6A00] transition-all duration-300"
              style={{ width: `${((currentStepIdx + 1) / 5) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Flow Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: ACCOUNT SETUP OR EXISTING ACCOUNT PATH */}
        {activeStep === 'account' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {!user?.accountType ? (
              <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h1 className="font-head text-2xl font-semibold text-[#171717]">
                    Choose Your Account Type
                  </h1>
                  <p className="text-sm text-[#666666] mt-1">
                    Select how you plan to use Taptch. This configures your profile limits and NFC card ordering experience.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedAccountType('personal')}
                    className={`p-5 rounded-xl border text-left transition-all space-y-2 ${
                      selectedAccountType === 'personal'
                        ? 'border-[#FF6A00] bg-[#FFF3E9] shadow-xs'
                        : 'border-[#E8E8E8] bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 text-[#FF6A00] flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      {selectedAccountType === 'personal' && (
                        <Check className="w-5 h-5 text-[#FF6A00]" />
                      )}
                    </div>
                    <h3 className="font-semibold text-base text-[#171717]">Personal Account</h3>
                    <p className="text-xs text-[#666666] leading-relaxed">
                      Ideal for individuals &amp; professionals. Includes 1 digital profile, 1 active template, and 1 personal NFC card.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAccountType('business')}
                    className={`p-5 rounded-xl border text-left transition-all space-y-2 ${
                      selectedAccountType === 'business'
                        ? 'border-[#FF6A00] bg-[#FFF3E9] shadow-xs'
                        : 'border-[#E8E8E8] bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 text-[#FF6A00] flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      {selectedAccountType === 'business' && (
                        <Check className="w-5 h-5 text-[#FF6A00]" />
                      )}
                    </div>
                    <h3 className="font-semibold text-base text-[#171717]">Business Account</h3>
                    <p className="text-xs text-[#666666] leading-relaxed">
                      Built for teams &amp; companies. Create multiple independent profiles, use multiple templates, and pair multiple NFC cards.
                    </p>
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="accent"
                    onClick={handleConfirmAccountType}
                    disabled={isSubmitting}
                    className="bg-[#FF6A00] hover:bg-[#E85D00] text-white px-6"
                  >
                    {isSubmitting ? 'Saving...' : 'Continue to Profile Setup'}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Existing Authenticated Customer with Account Type & Profiles (Phase 10) */
              <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E8] pb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF3E9] text-[#FF6A00] text-[11px] font-semibold uppercase">
                      {effectiveAccountType === 'business' ? 'Business Account' : 'Personal Account'}
                    </span>
                    <h1 className="font-head text-2xl font-semibold text-[#171717] mt-2">
                      Welcome back, {user.name}
                    </h1>
                    <p className="text-xs text-[#666666] mt-0.5">
                      {effectiveAccountType === 'business'
                        ? 'Select an existing profile to pair with your new NFC card, or create a new team profile.'
                        : 'Manage your personal profile and continue to configure your NFC card.'}
                    </p>
                  </div>
                </div>

                {/* Existing Profiles List */}
                {profiles.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                      Your Existing Profiles ({profiles.length} / {entitlements?.maxProfiles || 1})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {profiles.map((prof) => (
                        <div
                          key={prof.id}
                          className="p-4 rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm text-[#171717]">
                                {prof.displayName}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E8E8E8] text-[#666666]">
                                /{prof.slug}
                              </span>
                            </div>
                            <p className="text-xs text-[#666666] mt-0.5 truncate">
                              {prof.headline || 'Digital Identity'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectExistingProfile(prof.id, prof.templateId)}
                              className="flex-1 text-xs"
                            >
                              Edit Profile
                            </Button>
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={async () => {
                                setEditingProfileId(prof.id);
                                await updateJourney({ profileId: prof.id, stage: 'CARD_DESIGN' });
                                setActiveStep('card');
                                setSearchParams({ step: 'card' });
                              }}
                              className="flex-1 text-xs bg-[#FF6A00] hover:bg-[#E85D00] text-white"
                            >
                              Pair Card
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Create New Profile OR Upgrade to Business */}
                <div className="pt-2 border-t border-[#E8E8E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {!isPersonalAtLimit ? (
                    <Button
                      variant="accent"
                      onClick={handleStartNewProfile}
                      className="bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Profile</span>
                    </Button>
                  ) : (
                    <div className="w-full p-4 rounded-xl bg-[#FFF3E9] border border-[#FF6A00]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-[#171717]">
                          Personal Account Limit Reached (1 / 1 Profile)
                        </p>
                        <p className="text-[11px] text-[#666666] mt-0.5">
                          Need multiple profiles or team NFC cards? Upgrade cleanly to a Business Account.
                        </p>
                      </div>
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={handleUpgradeToBusiness}
                        disabled={isSubmitting}
                        className="bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs shrink-0"
                      >
                        {isSubmitting ? 'Upgrading...' : 'Upgrade to Business'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2A: SELECT PROFILE TEMPLATE */}
        {activeStep === 'template' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-[#E8E8E8] p-5 shadow-xs">
              <div>
                <h1 className="font-head text-xl sm:text-2xl font-semibold text-[#171717]">
                  Step 1: Choose Your Profile Template
                </h1>
                <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
                  Select a design for your digital profile. You can preview any template or switch it later without losing data.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep('account')}
                  className="text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back
                </Button>
                <Button
                  variant="accent"
                  onClick={handleConfirmTemplate}
                  disabled={isSubmitting}
                  className="bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Continue with Selected'}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {STANDARD_TEMPLATES.map((tpl) => {
                const isSelected = canonicalTemplateId(tpl.id) === canonicalTemplateId(selectedTemplateId);
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(canonicalTemplateId(tpl.id))}
                    className={`rounded-2xl bg-white border p-4 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#FF6A00] ring-2 ring-[#FF6A00]/20 shadow-sm'
                        : 'border-[#E8E8E8] hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="rounded-xl overflow-hidden border border-[#E8E8E8] mb-3 h-44 bg-[#F4F4F2]">
                        <MiniatureThemeCardPreview
                          templateId={tpl.id}
                          colors={getTemplateDefaultThemeConfig(tpl.id)}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm text-[#171717]">{tpl.name}</h3>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF3E9] text-[#FF6A00] text-[10px] font-semibold">
                            <Check className="w-3 h-3" /> Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#666666] mt-1 line-clamp-2">{tpl.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F4F4F2] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewModalTemplateId(tpl.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#666666] hover:text-[#171717]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Live Preview</span>
                      </button>
                      <span className="text-[11px] font-mono text-[#FF6A00] font-semibold">
                        {isSelected ? 'Active Selection' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2B: CREATE / EDIT PROFILE WITH LIVE PREVIEW */}
        {activeStep === 'profile' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-[#E8E8E8] p-4 sm:p-5 shadow-xs">
              <div>
                <h1 className="font-head text-xl font-semibold text-[#171717]">
                  Step 2: Configure Your Digital Profile
                </h1>
                <p className="text-xs text-[#666666] mt-0.5">
                  Fill in your contact details, bio, socials, and branding. Changes update the live preview immediately.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep('template')}
                  className="text-xs"
                >
                  <Palette className="w-3.5 h-3.5 mr-1 text-[#FF6A00]" />
                  Change Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMobilePreview(!showMobilePreview)}
                  className="lg:hidden text-xs"
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1" />
                  {showMobilePreview ? 'Edit Form' : 'Live Preview'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Form */}
              <form
                onSubmit={handleSaveProfile}
                className={`lg:col-span-7 bg-white rounded-2xl border border-[#E8E8E8] p-5 sm:p-6 space-y-5 shadow-xs ${
                  showMobilePreview ? 'hidden lg:block' : 'block'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#171717] mb-1">
                      Full Name / Business Name *
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Aarav Sharma"
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#171717] mb-1">
                      Profile Handle (taptch.com/...) *
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="aarav-sharma"
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#171717] mb-1">
                      Headline / Designation
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Founder & Managing Director"
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#171717] mb-1">
                      Profile Mode
                    </label>
                    <select
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value as 'personal' | 'business')}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                    >
                      <option value="personal">Personal Profile</option>
                      <option value="business">Business Profile</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#171717] mb-1">
                    Bio / About
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief introduction, achievements, or business overview..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  />
                </div>

                {/* Contact Details */}
                <div className="pt-3 border-t border-[#F4F4F2] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                    Contact Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#171717] mb-1">Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#171717] mb-1">WhatsApp</label>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#171717] mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contact@company.com"
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#171717] mb-1">Website</label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://company.com"
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#171717] mb-1">
                      Location / Office Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Indiranagar, Bengaluru, India"
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                    />
                  </div>
                </div>

                {/* Company & Media */}
                <div className="pt-3 border-t border-[#F4F4F2] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                    Company &amp; Media
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#171717] mb-1">Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Acme Ventures Pvt Ltd"
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#171717] mb-1">Company Role</label>
                      <input
                        type="text"
                        value={companyRole}
                        onChange={(e) => setCompanyRole(e.target.value)}
                        placeholder="Director"
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#171717] mb-1">Profile Photo URL</label>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#171717] mb-1">Cover Banner URL</label>
                      <input
                        type="url"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="pt-3 border-t border-[#F4F4F2] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                      Social Links
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSocialLinks([...socialLinks, { platform: 'linkedin', url: '' }])}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6A00] hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Social
                    </button>
                  </div>
                  {socialLinks.map((sl, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={sl.platform}
                        onChange={(e) => {
                          const next = [...socialLinks];
                          next[idx].platform = e.target.value;
                          setSocialLinks(next);
                        }}
                        className="px-2.5 py-2 rounded-lg border border-[#E8E8E8] text-xs bg-white"
                      >
                        <option value="linkedin">LinkedIn</option>
                        <option value="instagram">Instagram</option>
                        <option value="twitter">X / Twitter</option>
                        <option value="youtube">YouTube</option>
                        <option value="github">GitHub</option>
                      </select>
                      <input
                        type="url"
                        value={sl.url}
                        onChange={(e) => {
                          const next = [...socialLinks];
                          next[idx].url = e.target.value;
                          setSocialLinks(next);
                        }}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 rounded-lg border border-[#E8E8E8] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setSocialLinks(socialLinks.filter((_, i) => i !== idx))}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                        aria-label="Remove social link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Custom Field */}
                <div className="pt-3 border-t border-[#F4F4F2]">
                  <label className="block text-xs font-medium text-[#171717] mb-1">
                    Custom Field / Callout Note
                  </label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g. Available for advisory & keynote bookings"
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                  />
                </div>

                <div className="pt-4 border-t border-[#E8E8E8] flex items-center justify-between gap-3">
                  {editingProfileId && (
                    <Link
                      to={`/builder/${editingProfileId}`}
                      className="text-xs font-medium text-[#666666] hover:text-[#FF6A00] underline"
                    >
                      Open Full Profile Studio
                    </Link>
                  )}
                  <Button
                    type="submit"
                    variant="accent"
                    disabled={isSubmitting}
                    className="ml-auto bg-[#FF6A00] hover:bg-[#E85D00] text-white px-6 text-xs font-semibold"
                  >
                    {isSubmitting ? 'Saving Profile...' : 'Save & Continue to Card Design'}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </form>

              {/* Right Live Profile Preview */}
              <div
                className={`lg:col-span-5 ${
                  showMobilePreview ? 'block' : 'hidden lg:block'
                } lg:sticky lg:top-24`}
              >
                <div className="bg-white rounded-2xl border border-[#E8E8E8] p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#666666]">
                      Live Profile Preview
                    </span>
                    <span className="text-[11px] font-mono text-[#FF6A00]">
                      /{slug || 'preview'}
                    </span>
                  </div>
                  <div className="max-w-[360px] mx-auto rounded-[2.2rem] border-[6px] border-zinc-900 overflow-hidden shadow-lg bg-white h-[620px] overflow-y-auto">
                    <ProfileRenderer profile={liveProfilePreviewData as any} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: NFC CARD DESIGN & PROFILE ATTACHMENT */}
        {activeStep === 'card' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-[#E8E8E8] p-5 shadow-xs">
              <div>
                <h1 className="font-head text-xl sm:text-2xl font-semibold text-[#171717]">
                  Step 3: Design &amp; Attach Your NFC Card
                </h1>
                <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
                  Customize your physical NFC smart card and attach it to{' '}
                  <span className="font-semibold text-[#171717]">
                    {displayName || profiles.find((p) => p.id === editingProfileId)?.displayName || 'your profile'}
                  </span>
                  .
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setActiveStep('profile')}
                className="text-xs self-start sm:self-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Profile
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Live Card Front/Back Preview */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E8E8E8] p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                    Card Preview (Tap to Flip)
                  </span>
                  <div className="inline-flex rounded-lg bg-[#F8F9FA] border border-[#E8E8E8] p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setCardPreviewSide('front')}
                      className={`px-3 py-1 rounded-md font-medium ${
                        cardPreviewSide === 'front' ? 'bg-white text-[#171717] shadow-xs' : 'text-[#666666]'
                      }`}
                    >
                      Front
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardPreviewSide('back')}
                      className={`px-3 py-1 rounded-md font-medium ${
                        cardPreviewSide === 'back' ? 'bg-white text-[#171717] shadow-xs' : 'text-[#666666]'
                      }`}
                    >
                      Back
                    </button>
                  </div>
                </div>

                <div className="max-w-[360px] mx-auto py-2">
                  <CardPreview
                    frontJson={liveCustomizedFrontJson}
                    backJson={activeCardTpl?.backCanvasJson}
                    side={cardPreviewSide}
                    allowFlip={true}
                    showFlipHint={true}
                    onFlip={setCardPreviewSide}
                    cloudinaryWidth={800}
                    className="rounded-xl shadow-md"
                  />
                </div>

                <div className="pt-2 border-t border-[#F4F4F2] flex items-center justify-between text-xs">
                  <span className="text-[#666666]">
                    Linked Profile:{' '}
                    <span className="font-semibold text-[#FF6A00]">
                      /{slug || profiles.find((p) => p.id === editingProfileId)?.slug || 'profile'}
                    </span>
                  </span>
                  <Link
                    to={`/studio/${encodeURIComponent(selectedProductId)}?returnTo=${encodeURIComponent('/journey?step=card')}&profileId=${encodeURIComponent(editingProfileId || '')}`}
                    className="inline-flex items-center gap-1 font-semibold text-[#FF6A00] hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Open Advanced Canvas Studio
                  </Link>
                </div>
              </div>

              {/* Right: Card Product, Variant, Personalization & Quantity */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E8E8E8] p-5 sm:p-6 shadow-xs space-y-5">
                {/* Product Material Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666]">
                    1. Select Card Material
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(productsData.length > 0
                      ? productsData
                      : [
                          { id: 'prod_classic_pvc', name: 'Classic PVC', basePrice: 1499 },
                          { id: 'prod_matte_obsidian', name: 'Matte Obsidian', basePrice: 1499 },
                          { id: 'prod_brushed_metal', name: 'Brushed Metal', basePrice: 2499 },
                        ]
                    ).map((prod) => {
                      const isSel = prod.id === selectedProductId;
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            if (prod.variants?.[0]?.id) {
                              setSelectedVariantId(prod.variants[0].id);
                            }
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSel
                              ? 'border-[#FF6A00] bg-[#FFF3E9]'
                              : 'border-[#E8E8E8] bg-white hover:border-zinc-300'
                          }`}
                        >
                          <p className="text-xs font-semibold text-[#171717] truncate">{prod.name}</p>
                          <p className="text-[11px] font-mono font-bold text-[#FF6A00] mt-1">
                            ₹{(prod.discountPrice || prod.basePrice || 1499).toLocaleString('en-IN')}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card Personalization Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#171717] mb-1">
                      Name Printed on Card
                    </label>
                    <input
                      type="text"
                      value={cardCustomName}
                      onChange={(e) => setCardCustomName(e.target.value)}
                      placeholder="ALEXANDER VANCE"
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#171717] mb-1">
                      Title / Subtitle on Card
                    </label>
                    <input
                      type="text"
                      value={cardCustomRole}
                      onChange={(e) => setCardCustomRole(e.target.value)}
                      placeholder="MANAGING DIRECTOR"
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                    />
                  </div>
                </div>

                {/* Quantity & Entitlement Enforcement */}
                <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E8E8E8] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#171717]">Quantity</p>
                    <p className="text-[11px] text-[#666666]">
                      {effectiveAccountType === 'personal'
                        ? 'Personal Account includes 1 NFC card allocation'
                        : 'Business Account supports multi-card orders'}
                    </p>
                  </div>
                  {effectiveAccountType === 'business' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCardQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg border border-[#E8E8E8] bg-white font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-sm">{cardQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setCardQuantity((q) => q + 1)}
                        className="w-8 h-8 rounded-lg border border-[#E8E8E8] bg-white font-bold"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-white border border-[#E8E8E8] font-mono text-xs font-bold">
                      1 Card
                    </span>
                  )}
                </div>

                <Button
                  variant="accent"
                  onClick={handleProceedToCheckout}
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[#FF6A00] hover:bg-[#E85D00] text-white text-sm font-semibold"
                >
                  {isSubmitting ? 'Attaching Card & Saving...' : 'Attach Card & Proceed to Checkout'}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Template Live Preview Modal */}
      {previewModalTemplateId && (
        <TemplatePreviewModal
          initialTemplateId={previewModalTemplateId}
          isOpen={Boolean(previewModalTemplateId)}
          onClose={() => setPreviewModalTemplateId(null)}
          isAuthenticated={isAuthenticated}
          onSelectTemplate={(tplId: string) => {
            setSelectedTemplateId(canonicalTemplateId(tplId));
            setPreviewModalTemplateId(null);
          }}
        />
      )}
    </div>
  );
}

function buildCustomizedFrontJson(
  baseJsonStr: string | undefined,
  nameText: string,
  roleText: string,
): string {
  if (!baseJsonStr) {
    return JSON.stringify({
      version: '5.3.0',
      backgroundColor: '#0A0A0C',
      objects: [
        { type: 'rect', left: 0, top: 0, width: 1050, height: 600, fill: '#0A0A0C' },
        { type: 'i-text', left: 80, top: 360, fill: '#FFFFFF', fontFamily: 'Inter', fontSize: 36, fontWeight: '700', text: nameText },
        { type: 'i-text', left: 80, top: 420, fill: '#D4AF37', fontFamily: 'Inter', fontSize: 18, fontWeight: '600', text: roleText },
      ],
    });
  }

  try {
    const parsed = JSON.parse(baseJsonStr);
    if (Array.isArray(parsed.objects)) {
      parsed.objects = parsed.objects.map((obj: any) => {
        if (obj.id === 'text_name' || obj.name === 'Full Name') {
          return { ...obj, text: nameText };
        }
        if (obj.id === 'text_role' || obj.name === 'Job Title') {
          return { ...obj, text: roleText };
        }
        return obj;
      });
    }
    return JSON.stringify(parsed);
  } catch {
    return baseJsonStr;
  }
}

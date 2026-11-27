/**
 * PostPurchaseProfileSetupPage (/profile-setup)
 * Implements the post-purchase profile creation and card-to-profile attachment flow:
 * Step 1: Select the purchased card that needs a profile
 * Step 2: Select an existing profile template
 * Step 3: Create a new profile or choose an eligible existing profile + Live Preview
 * Step 4: Save profile & attach it to the purchased NFC card -> Confirmation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { useSession } from '../lib/auth/client';
import { BrandLogo } from '../components/brand';
import { UsernameInput } from '../components/profiles/UsernameInput';
import { validateUsernameFormat } from '../config/reservedUsernames';
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
  Check,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Eye,
  Loader2,
  Palette,
  Plus,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react';

type SetupStep = 'select-card' | 'select-template' | 'configure-profile' | 'done';

export function PostPurchaseProfileSetupPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending } = useSession();
  const isAuthenticated = Boolean(session?.user?.id);

  const queryCardId = searchParams.get('cardId');
  const queryOrderId = searchParams.get('orderId');
  const queryTemplateId = searchParams.get('template');

  useEffect(() => {
    if (!isSessionPending && !isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`, {
        replace: true,
      });
    }
  }, [isSessionPending, isAuthenticated, navigate]);

  const { data: purchasedCards = [], isLoading: isCardsLoading } = useQuery<any[]>({
    queryKey: ['cards', 'purchased'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/cards/purchased'),
    enabled: isAuthenticated,
  });

  const { data: existingProfiles = [], isLoading: isProfilesLoading } = useQuery<any[]>({
    queryKey: ['profiles', 'my'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/profiles'),
    enabled: isAuthenticated,
  });

  const { data: journeyContext } = useQuery<any>({
    queryKey: ['purchase-journey', 'active'],
    queryFn: () => ApiClient.get<any>('/api/v1/journey/active'),
    enabled: isAuthenticated,
  });

  const [step, setStep] = useState<SetupStep>('select-card');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(queryCardId);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    queryTemplateId ? canonicalTemplateId(queryTemplateId) : 'cinematic-noir',
  );
  const [previewModalTemplateId, setPreviewModalTemplateId] = useState<string | null>(null);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingProfileId, setSelectedExistingProfileId] = useState<string | null>(null);
  const [attachedResult, setAttachedResult] = useState<{ card: any; profile: any } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Profile Form Fields
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

  const accountType = (session?.user?.accountType || journeyContext?.user?.accountType || 'personal') as
    | 'personal'
    | 'business';
  const maxProfiles = journeyContext?.entitlements?.maxProfiles || (accountType === 'business' ? 20 : 1);
  const isAtProfileLimit = existingProfiles.length >= maxProfiles;

  // Auto-select target card from query params or first awaiting card
  useEffect(() => {
    if (purchasedCards.length === 0) return;
    if (queryCardId) {
      setSelectedCardId(queryCardId);
      setStep('select-template');
      return;
    }
    if (queryOrderId) {
      const orderCard =
        purchasedCards.find((c) => c.orderId === queryOrderId && c.profileAssignmentStatus !== 'PROFILE_ATTACHED') ||
        purchasedCards.find((c) => c.orderId === queryOrderId);
      if (orderCard) {
        setSelectedCardId(orderCard.id);
        // If only 1 card in order, go straight to template selection
        const orderCardsCount = purchasedCards.filter((c) => c.orderId === queryOrderId).length;
        if (orderCardsCount === 1) {
          setStep('select-template');
        }
        return;
      }
    }
    if (!selectedCardId) {
      const firstAwaiting = purchasedCards.find((c) => c.profileAssignmentStatus !== 'PROFILE_ATTACHED');
      if (firstAwaiting) setSelectedCardId(firstAwaiting.id);
    }
  }, [purchasedCards, queryCardId, queryOrderId]);

  // Pre-fill defaults for new profile form or switch to existing if personal limit reached
  useEffect(() => {
    setProfileType(accountType === 'business' ? 'business' : 'personal');
    if (isAtProfileLimit && existingProfiles.length > 0) {
      setMode('existing');
      setSelectedExistingProfileId(existingProfiles[0].id);
    }
    if (session?.user && !displayName) {
      setDisplayName(session.user.name || '');
      setEmail(session.user.email || '');
      const baseSlug = (session.user.name || 'member')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(`${baseSlug}-${Math.floor(100 + Math.random() * 900)}`);
    }
  }, [accountType, isAtProfileLimit, existingProfiles.length, session?.user?.id]);

  const selectedCard = useMemo(
    () => purchasedCards.find((c) => c.id === selectedCardId) || null,
    [purchasedCards, selectedCardId],
  );

  const liveProfilePreviewData = useMemo(
    () => ({
      id: 'preview',
      slug: slug || 'preview',
      displayName: displayName || session?.user?.name || 'Your Name',
      headline: headline || 'Your Role / Designation',
      bio: bio || 'Tap to view contact details, socials, and portfolio.',
      avatarUrl: avatarUrl || null,
      coverUrl: coverUrl || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: email || session?.user?.email || null,
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
      isEmbedded: true,
    }),
    [
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
      session?.user,
    ],
  );

  const handleSelectCardAndContinue = async (cardId: string) => {
    setSelectedCardId(cardId);
    setError(null);
    await ApiClient.patch(`/api/v1/cards/purchased/${cardId}/status`, {
      status: 'PROFILE_SETUP_IN_PROGRESS',
    }).catch(() => { });
    setStep('select-template');
  };

  const handleAttachExistingProfile = async () => {
    if (!selectedCardId || !selectedExistingProfileId) {
      setError('Please select both a purchased card and a digital profile.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await ApiClient.post<any>(
        `/api/v1/cards/purchased/${selectedCardId}/attach-profile`,
        { profileId: selectedExistingProfileId },
      );
      await queryClient.invalidateQueries({ queryKey: ['cards', 'purchased'] });
      setAttachedResult({
        card: res,
        profile: res.profile || existingProfiles.find((p) => p.id === selectedExistingProfileId),
      });
      setStep('done');
    } catch (err: any) {
      setError(err?.message || 'Failed to attach profile to this card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndAttachProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardId) {
      setError('Please select a purchased card first.');
      setStep('select-card');
      return;
    }
    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
      const cleanSlug = slug.trim().toLowerCase();
      const usernameError = validateUsernameFormat(cleanSlug);
      if (usernameError) {
        setError(usernameError);
        return;
      }

      setIsSubmitting(true);
      setError(null);
      try {
        const createdProfile = await ApiClient.post<any>('/api/v1/profiles', {
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
        });

        await ApiClient.post(`/api/v1/profiles/${createdProfile.id}/publish`, {}).catch(() => { });

        const attachRes = await ApiClient.post<any>(
          `/api/v1/cards/purchased/${selectedCardId}/attach-profile`,
          { profileId: createdProfile.id },
        );

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['cards', 'purchased'] }),
          queryClient.invalidateQueries({ queryKey: ['profiles', 'my'] }),
        ]);

        setAttachedResult({
          card: attachRes,
          profile: createdProfile,
        });
        setStep('done');
      } catch (err: any) {
        setError(err?.message || 'Failed to create and attach profile.');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (isSessionPending || isCardsLoading || isProfilesLoading) {
      return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin mb-3" />
          <p className="text-xs font-medium text-zinc-600">Loading your purchased NFC cards...</p>
        </div>
      );
    }

    const remainingUnassignedCards = purchasedCards.filter(
      (c) => c.id !== selectedCardId && c.profileAssignmentStatus !== 'PROFILE_ATTACHED',
    );

    const stepNum =
      step === 'select-card' ? 1 : step === 'select-template' ? 2 : step === 'configure-profile' ? 3 : 4;

    return (
      <div data-theme="light" className="min-h-screen bg-[#F8F9FA] text-[#171717] flex flex-col font-sans">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#E8E8E8]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo variant="horizontal" size="sm" asLink href="/" />
              <span className="hidden sm:inline text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#FFF3E9] text-[#FF6A00] font-semibold">
                Post-Purchase Profile Setup
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-[#666666] font-medium">Step {stepNum} of 4</span>
              <Link to="/cards" className="font-medium text-[#171717] hover:text-[#FF6A00]">
                My Cards
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SELECT PURCHASED CARD (50/50 Horizontal Desktop Setup Cards) */}
          {step === 'select-card' && (
            <div className="w-full space-y-5">
              <div className="bg-white rounded-2xl border border-[#E8E8E8] p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E8E8E8]">
                  <div>
                    <h1 className="font-head text-xl sm:text-2xl font-semibold text-[#171717]">
                      NFC Card Setup
                    </h1>
                    <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
                      Choose an NFC card below to configure its profile and tap destination.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#FF6A00] bg-[#FFF3E9] px-3 py-1 rounded-full border border-[#FF6A00]/20 self-start sm:self-auto">
                    {purchasedCards.length} {purchasedCards.length === 1 ? 'Card' : 'Cards'}
                  </span>
                </div>

                {purchasedCards.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <CreditCard className="w-10 h-10 text-[#FF6A00] mx-auto" />
                    <p className="text-sm font-medium text-[#171717]">No purchased NFC cards found.</p>
                    <p className="text-xs text-[#666666]">
                      Order an NFC smart card first, then return here to set up your digital profile.
                    </p>
                    <Link to="/nfc-cards">
                      <Button variant="accent" className="bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs mt-2">
                        Explore NFC Cards
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchasedCards.map((card, idx) => {
                      const isAttached = card.profileAssignmentStatus === 'PROFILE_ATTACHED';
                      return (
                        <div
                          key={card.id}
                          className={`p-4 sm:p-5 rounded-xl border transition-all grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center ${
                            selectedCardId === card.id
                              ? 'border-[#FF6A00] bg-[#FFF3E9]/40'
                              : 'border-[#E8E8E8] bg-[#F8F9FA]'
                          }`}
                        >
                          {/* LEFT 50%: Step/Icon, Title, Description, Status */}
                          <div className="flex items-start sm:items-center gap-4 min-w-0">
                            <div className="w-[96px] h-[60px] rounded-[6px] overflow-hidden border border-[#E8E8E8] shrink-0 bg-[#161616]">
                              <CardPreview
                                frontUrl={card.previewFrontUrl}
                                backUrl={card.previewBackUrl}
                                width="96px"
                                height="60px"
                                cloudinaryWidth={240}
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-white border border-[#E8E8E8] text-[#666666]">
                                  Card #{card.unitIndex || idx + 1}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    isAttached
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {isAttached ? 'Profile Attached' : 'Setup Pending'}
                                </span>
                              </div>
                              <h3 className="font-semibold text-sm sm:text-base text-[#171717] truncate">
                                {card.productName}
                              </h3>
                              <p className="text-xs text-[#666666] truncate">
                                Order #{card.order?.orderNumber || card.orderId?.slice(0, 8)}
                                {isAttached && card.profile?.displayName
                                  ? ` · Linked to ${card.profile.displayName}`
                                  : ' · Ready for digital profile setup'}
                              </p>
                            </div>
                          </div>

                          {/* RIGHT 50%: Configuration Status & Action Controls */}
                          <div className="flex flex-col sm:flex-row md:justify-end items-stretch sm:items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-[#E8E8E8] md:pl-6">
                            <div className="min-w-0 flex-1 md:text-right">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] block">
                                Destination
                              </span>
                              <span className="font-mono text-xs text-[#171717] truncate block">
                                {isAttached && card.profile?.slug
                                  ? `https://taptch.com/${card.profile.slug}`
                                  : 'Not assigned yet'}
                              </span>
                            </div>
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => handleSelectCardAndContinue(card.id)}
                              className="bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-semibold shrink-0 px-4"
                            >
                              {isAttached ? 'Change / Reassign Profile' : 'Set Up Profile'}
                              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT PROFILE TEMPLATE */}
          {step === 'select-template' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-[#E8E8E8] p-5 shadow-xs">
                <div>
                  <h1 className="font-head text-xl sm:text-2xl font-semibold text-[#171717]">
                    Choose Your Profile Template
                  </h1>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Configuring{' '}
                    <span className="font-semibold text-[#171717]">
                      {selectedCard?.productName || 'NFC Card'} (#{selectedCard?.unitIndex || 1})
                    </span>
                    . Or attach an existing profile directly on the next step.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Button variant="outline" onClick={() => setStep('select-card')} className="text-xs">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                  </Button>
                  <Button
                    variant="accent"
                    onClick={() => setStep('configure-profile')}
                    className="bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs"
                  >
                    Continue <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {STANDARD_TEMPLATES.filter((tpl) => {
                  const req = accountType.toUpperCase();
                  return (
                    tpl.templateType === req ||
                    (tpl.supportedProfileTypes && tpl.supportedProfileTypes.includes(accountType))
                  );
                }).map((tpl) => {
                  const isSelected = canonicalTemplateId(tpl.id) === canonicalTemplateId(selectedTemplateId);
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(canonicalTemplateId(tpl.id))}
                      className={`rounded-2xl bg-white border p-4 cursor-pointer flex flex-col justify-between transition-all ${isSelected ? 'border-[#FF6A00] ring-2 ring-[#FF6A00]/20' : 'border-[#E8E8E8]'
                        }`}
                    >
                      <div>
                        <div className="rounded-xl overflow-hidden border border-[#E8E8E8] mb-3 h-44 bg-[#F4F4F2]">
                          <MiniatureThemeCardPreview
                            templateId={tpl.id}
                            colors={getTemplateDefaultThemeConfig(tpl.id)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-[#171717]">{tpl.name}</h3>
                          {isSelected && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF3E9] text-[#FF6A00]">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#666666] mt-1 line-clamp-2">{tpl.description}</p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-[#F4F4F2] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewModalTemplateId(tpl.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-[#666666] hover:text-[#171717]"
                        >
                          <Eye className="w-3.5 h-3.5" /> Live Preview
                        </button>
                        <span className="text-[11px] font-mono text-[#FF6A00] font-semibold">
                          {isSelected ? 'Selected' : 'Choose'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CREATE NEW OR ATTACH EXISTING PROFILE + LIVE PREVIEW */}
          {step === 'configure-profile' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-[#E8E8E8] p-4 sm:p-5 shadow-xs">
                <div>
                  <h1 className="font-head text-xl font-semibold text-[#171717]">
                    Configure &amp; Attach Digital Profile
                  </h1>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Card: <span className="font-semibold text-[#171717]">{selectedCard?.productName}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setStep('select-template')} className="text-xs">
                    <Palette className="w-3.5 h-3.5 mr-1 text-[#FF6A00]" /> Template
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

              {/* Mode Switcher if user already has eligible profiles */}
              {existingProfiles.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E8E8E8] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('existing')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${mode === 'existing'
                          ? 'border-[#FF6A00] bg-[#FFF3E9] text-[#FF6A00]'
                          : 'border-[#E8E8E8] text-[#666666]'
                        }`}
                    >
                      Attach Existing Profile ({existingProfiles.length})
                    </button>
                    {!isAtProfileLimit && (
                      <button
                        type="button"
                        onClick={() => setMode('new')}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${mode === 'new'
                            ? 'border-[#FF6A00] bg-[#FFF3E9] text-[#FF6A00]'
                            : 'border-[#E8E8E8] text-[#666666]'
                          }`}
                      >
                        Create New Profile
                      </button>
                    )}
                  </div>
                  {isAtProfileLimit && (
                    <span className="text-[11px] text-[#666666]">
                      Personal account limit reached ({existingProfiles.length}/{maxProfiles} profile). Attach your existing profile below.
                    </span>
                  )}
                </div>
              )}

              {mode === 'existing' && existingProfiles.length > 0 ? (
                <div className="bg-white rounded-2xl border border-[#E8E8E8] p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* LEFT 50%: Context & Instructions */}
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#FF6A00]">
                      Attach Existing Profile
                    </span>
                    <h2 className="font-head text-lg font-semibold text-[#171717]">
                      Select an Existing Profile to Link
                    </h2>
                    <p className="text-xs text-[#666666] leading-relaxed">
                      Choose one of your existing digital profiles on the right. Tapping your physical NFC card will immediately resolve to that profile&apos;s public URL.
                    </p>
                  </div>

                  {/* RIGHT 50%: Profile Selection & Action */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {existingProfiles.map((prof) => (
                        <button
                          key={prof.id}
                          type="button"
                          onClick={() => setSelectedExistingProfileId(prof.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all ${selectedExistingProfileId === prof.id
                              ? 'border-[#FF6A00] bg-[#FFF3E9]'
                              : 'border-[#E8E8E8] hover:border-zinc-300'
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-[#171717] truncate">{prof.displayName}</span>
                            {selectedExistingProfileId === prof.id && (
                              <Check className="w-4 h-4 text-[#FF6A00] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs font-mono text-[#666666] mt-0.5 truncate">/{prof.slug}</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="accent"
                        onClick={handleAttachExistingProfile}
                        disabled={isSubmitting || !selectedExistingProfileId}
                        className="w-full sm:w-auto bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-semibold px-6"
                      >
                        {isSubmitting ? 'Attaching...' : 'Attach Selected Profile to Card'}
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <form
                    onSubmit={handleCreateAndAttachProfile}
                    className={`lg:col-span-7 bg-white rounded-2xl border border-[#E8E8E8] p-5 sm:p-6 space-y-4 shadow-xs ${showMobilePreview ? 'hidden lg:block' : 'block'
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
                          className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                          required
                        />
                      </div>
                      <div>
                      <UsernameInput
                          value={slug}
                          onChange={setSlug}
                          label="Public Username *"
                          placeholder="john"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#171717] mb-1">Headline</label>
                        <input
                          type="text"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="Founder & CEO"
                          className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#171717] mb-1">Profile Type</label>
                        <div className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm bg-gray-50 text-gray-700 capitalize font-medium">
                          {profileType === 'business' ? 'Business Profile' : 'Personal Profile'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#171717] mb-1">Bio</label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#171717] mb-1">Phone</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#171717] mb-1">WhatsApp</label>
                        <input
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#171717] mb-1">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#171717] mb-1">Website</label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#171717] mb-1">Company Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#171717] mb-1">Role at Company</label>
                        <input
                          type="text"
                          value={companyRole}
                          onChange={(e) => setCompanyRole(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#171717] mb-1">Avatar URL</label>
                        <input
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#171717] mb-1">Cover Image URL</label>
                        <input
                          type="url"
                          value={coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#171717] mb-1">Address / Location</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[#171717]">Social Links</label>
                        <button
                          type="button"
                          onClick={() => setSocialLinks([...socialLinks, { platform: 'linkedin', url: '' }])}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6A00]"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
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
                            className="px-2 py-2 rounded-lg border border-[#E8E8E8] text-xs bg-white"
                          >
                            <option value="linkedin">LinkedIn</option>
                            <option value="instagram">Instagram</option>
                            <option value="twitter">X</option>
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
                            className="p-2 text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#171717] mb-1">Custom Note</label>
                      <input
                        type="text"
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E8E8] text-sm"
                      />
                    </div>

                    <div className="pt-3 border-t border-[#E8E8E8] flex justify-end">
                      <Button
                        type="submit"
                        variant="accent"
                        disabled={isSubmitting}
                        className="bg-[#FF6A00] hover:bg-[#E85D00] text-white px-6 text-xs font-semibold"
                      >
                        {isSubmitting ? 'Saving & Attaching...' : 'Save Profile & Attach to NFC Card'}
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </form>

                  {/* Live Profile Preview */}
                  <div
                    className={`lg:col-span-5 ${showMobilePreview ? 'block' : 'hidden lg:block'
                      } lg:sticky lg:top-24`}
                  >
                    <div className="bg-white rounded-2xl border border-[#E8E8E8] p-4 shadow-xs">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[11px] font-mono uppercase text-[#666666]">
                          Live Profile Preview
                        </span>
                        <span className="text-[11px] font-mono text-[#FF6A00]">/{slug || 'preview'}</span>
                      </div>
                      <div className="max-w-[360px] mx-auto rounded-[2.2rem] border-[6px] border-zinc-900 overflow-hidden shadow-lg bg-white h-[620px] overflow-y-auto">
                        <ProfileRenderer profile={liveProfilePreviewData as any} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: CONFIRMATION */}
          {step === 'done' && attachedResult && (
            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E8E8E8] p-8 text-center space-y-5 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-[#16A36A] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h1 className="font-head text-2xl font-semibold text-[#171717]">
                  Profile Attached to Your NFC Card!
                </h1>
                <p className="text-xs sm:text-sm text-[#666666]">
                  <span className="font-semibold text-[#171717]">{attachedResult.profile?.displayName}</span> is now linked to{' '}
                  <span className="font-semibold text-[#171717]">
                    {attachedResult.card?.productName} (Card #{attachedResult.card?.unitIndex || 1})
                  </span>
                  .
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {attachedResult.profile?.slug && (
                  <a
                    href={`/${attachedResult.profile.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Live Profile</span>
                  </a>
                )}
                {remainingUnassignedCards.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCardId(remainingUnassignedCards[0].id);
                      setAttachedResult(null);
                      setDisplayName('');
                      setSlug(`member-${Math.floor(100 + Math.random() * 900)}`);
                      setStep('select-template');
                    }}
                    className="text-xs font-semibold border-[#FF6A00] text-[#FF6A00]"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Set Up Next Card ({remainingUnassignedCards.length} left)
                  </Button>
                )}
                <Link to="/cards">
                  <Button variant="outline" className="text-xs font-medium">
                    Manage My Cards
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </main>

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

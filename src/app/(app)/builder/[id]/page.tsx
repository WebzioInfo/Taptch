'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Palette,
  Phone,
  Building2,
  Package,
  Share2,
  Star,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Smartphone,
  ChevronRight,
  RotateCcw,
  Mail,
  Globe,
  MapPin,
  IndianRupee,
  Tablet,
  Monitor,
  Check,
  QrCode,
  Copy,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingButton } from '@/components/ui/loading-button';
import { DeleteDialog } from '@/components/ui/confirm-dialog';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useToast } from '@/components/ui/use-toast';
import { ProfileRenderer } from '@/components/templates/ProfileRenderer';
import { ImageUploadOrUrl } from '@/components/media/ImageUploadOrUrl';
import { SOCIAL_PLATFORMS, normalizeSocialUrl, extractSocialHandle } from '@/lib/socials';
import { isValidUpiId, generateUpiQrDataUrl, type UpiPaymentConfig } from '@/lib/upi';
import { validateProfileForPublishing, type ProfileValidationResult } from '@/lib/validation/profile-completion';

interface BusinessItem {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  googleMapsUrl?: string | null;
  googleReviewUrl?: string | null;
}

interface CatalogueItem {
  id: string;
  businessId?: string | null;
  type: 'product' | 'service';
  title: string;
  description?: string | null;
  price?: string | null;
  currency?: string;
  imageUrl?: string | null;
  actionUrl?: string | null;
  actionLabel?: string;
}

interface ProfileSection {
  id: string;
  sectionType: string;
  title: string | null;
  isEnabled: boolean;
  displayOrder: number;
}

interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
  [key: string]: string | undefined;
}

interface ProfileData {
  id: string;
  slug: string;
  profileType: 'personal' | 'business';
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  location: string | null;
  socialLinks: SocialLinks;
  googleReviewUrl?: string | null;
  brochureUrl?: string | null;
  templateId: string;
  themeConfig: {
    primaryColor?: string;
    background?: string;
    cardBg?: string;
    fontFamily?: string;
    [key: string]: unknown;
  };
  customFields?: {
    upiConfig?: UpiPaymentConfig;
    [key: string]: unknown;
  };
  status: 'draft' | 'published';
  businesses: BusinessItem[];
  catalogue: CatalogueItem[];
  sections: ProfileSection[];
}

const SECTION_TABS = [
  { id: 'identity', label: 'Identity', icon: User },
  { id: 'theme', label: 'Styles', icon: Palette },
  { id: 'contacts', label: 'Contact', icon: Phone },
  { id: 'businesses', label: 'Ventures', icon: Building2 },
  { id: 'catalogue', label: 'Catalogue', icon: Package },
  { id: 'socials', label: 'Socials', icon: Share2 },
  { id: 'upi', label: 'UPI Payment', icon: IndianRupee },
  { id: 'reviews', label: 'Extras', icon: Star },
];

export const LUXURY_TEMPLATES = [
  {
    id: 'obsidian-luxury',
    name: 'Obsidian Luxury',
    tagline: 'Executive High-Contrast',
    description: 'Deep charcoal and matte black with brushed gold accents, VIP verified shield, and prestige typography.',
    target: 'C-Suite executives, partners, enterprise founders',
    plan: 'Free',
    palette: ['#0A0A0C', '#121216', '#D4AF37'],
    defaultTheme: { primaryColor: '#D4AF37', background: '#0A0A0C', cardBg: '#121216' },
  },
  {
    id: 'ivory-minimal',
    name: 'Ivory Minimalist',
    tagline: 'Warm Editorial Paper',
    description: 'Warm alabaster and ivory with timeless editorial serif headings, fine dividers, and supreme legibility.',
    target: 'Architects, consultants, physicians, attorneys',
    plan: 'Free',
    palette: ['#FAF8F5', '#FFFFFF', '#8C6D3B'],
    defaultTheme: { primaryColor: '#8C6D3B', background: '#FAF8F5', cardBg: '#FFFFFF' },
  },
  {
    id: 'aurora-creator',
    name: 'Aurora Creator',
    tagline: 'Neon Glassmorphism',
    description: 'Vibrant neon purple gradients, subtle backdrop blurs, creative compositions, and portfolio showcase.',
    target: 'Creators, artists, designers, digital agencies',
    plan: 'Micro',
    palette: ['#0B0D1B', '#151833', '#A855F7'],
    defaultTheme: { primaryColor: '#A855F7', background: '#0B0D1B', cardBg: '#151833' },
  },
  {
    id: 'zenith-corporate',
    name: 'Zenith Corporate',
    tagline: 'Precision Titanium Grid',
    description: 'Enterprise titanium navy with structured information hierarchy, multi-venture tabs, and corporate precision.',
    target: 'B2B executives, M&A advisors, corporate directors',
    plan: 'Mini',
    palette: ['#0B0F19', '#111827', '#2563EB'],
    defaultTheme: { primaryColor: '#2563EB', background: '#0B0F19', cardBg: '#111827' },
  },
  {
    id: 'catalyst-business',
    name: 'Catalyst Business',
    tagline: 'High-Conversion Commerce',
    description: 'Commercial showcase with dedicated product shelves, service cards, and quick lead capture.',
    target: 'Retailers, product founders, showroom directors',
    plan: 'Mini',
    palette: ['#064E3B', '#065F46', '#059669'],
    defaultTheme: { primaryColor: '#059669', background: '#064E3B', cardBg: '#065F46' },
  },
  {
    id: 'apex-capital',
    name: 'Apex Capital & Wealth',
    tagline: 'Prestige Wealth & Property',
    description: 'Deep emerald and dark graphite tailored for luxury real estate developers, venture capital, and private wealth.',
    target: 'Luxury real estate, private equity, hedge funds',
    plan: 'Max',
    palette: ['#021A14', '#062D24', '#10B981'],
    defaultTheme: { primaryColor: '#10B981', background: '#021A14', cardBg: '#062D24' },
  },
];

export default function ProfileBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState('identity');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bizToDelete, setBizToDelete] = useState<string | null>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [validationResult, setValidationResult] = useState<ProfileValidationResult | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);
  const [newSocialPlatform, setNewSocialPlatform] = useState('instagram');
  const [newSocialInput, setNewSocialInput] = useState('');
  const [copiedLiveLink, setCopiedLiveLink] = useState(false);

  // Business Modal State
  const [isBizModalOpen, setIsBizModalOpen] = useState(false);
  const [editingBizId, setEditingBizId] = useState<string | null>(null);
  const [bizForm, setBizForm] = useState({
    name: '',
    tagline: '',
    description: '',
    logoUrl: '',
    website: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    googleMapsUrl: '',
    googleReviewUrl: '',
  });

  // Catalogue Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({
    type: 'product' as 'product' | 'service',
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    actionUrl: '',
    actionLabel: 'Enquire',
  });

  // Fetch full profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/v1/profiles/${id}`);
        const json = await res.json();
        if (json.data) {
          const loadedData: ProfileData = {
            ...json.data,
            phone: json.data.phone || '',
            whatsapp: json.data.whatsapp || '',
            email: json.data.email || '',
            website: json.data.website || '',
            address: json.data.address || '',
            location: json.data.location || '',
            socialLinks: json.data.socialLinks || {},
            customFields: json.data.customFields || {},
            googleReviewUrl: json.data.customFields?.googleReviewUrl || '',
            brochureUrl: json.data.customFields?.brochureUrl || '',
          };
          setProfile(loadedData);
          setOriginalProfile(JSON.parse(JSON.stringify(loadedData)));
        } else {
          setErrorMessage(json.error?.message || 'Failed to load profile.');
        }
      } catch {
        setErrorMessage('Failed to connect to server.');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  const hasChanges = Boolean(
    profile && originalProfile && JSON.stringify(profile) !== JSON.stringify(originalProfile)
  );

  const renderProfileData = React.useMemo(() => {
    if (!profile) return null;
    return {
      id: profile.id,
      slug: profile.slug,
      displayName: profile.displayName || 'Your Name',
      headline: profile.headline,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      coverUrl: profile.coverUrl,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      email: profile.email,
      website: profile.website,
      address: profile.address,
      location: profile.location,
      templateId: profile.templateId || 'obsidian-luxury',
      themeConfig: profile.themeConfig,
      customFields: profile.customFields,
      businesses: profile.businesses.map((b) => ({
        id: b.id,
        companyName: b.name,
        tagline: b.tagline,
        roleTitle: b.tagline,
        description: b.description,
        websiteUrl: b.website,
        address: b.address,
      })),
      catalogue: profile.catalogue.map((c) => ({
        id: c.id,
        title: c.title,
        itemType: c.type,
        description: c.description,
        price: c.price,
        currency: c.currency,
        imageUrl: c.imageUrl,
        actionUrl: c.actionUrl,
      })),
      socialLinks: profile.socialLinks
        ? Object.entries(profile.socialLinks)
            .filter(([, url]) => Boolean(url))
            .map(([platform, url]) => ({ platform, url: url as string }))
        : [],
    };
  }, [profile]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Reset changes to last saved state
  const handleResetChanges = () => {
    if (originalProfile) {
      setProfile(JSON.parse(JSON.stringify(originalProfile)));
      setErrorMessage(null);
      setSaveStatus('Changes reverted');
      setTimeout(() => setSaveStatus(null), 2500);
    }
  };

  // Save specific section partially
  const handleSaveSection = async (sectionName: string, partialPayload: Record<string, unknown>) => {
    if (!profile) return;
    try {
      setSavingSection(sectionName);
      setSaveStatus(null);
      setErrorMessage(null);

      const res = await fetch(`/api/v1/profiles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialPayload),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || `Failed to save ${sectionName}`);
      }

      setOriginalProfile((prev) => (prev ? { ...prev, ...partialPayload } : null));
      setSaveStatus(`${sectionName} saved successfully`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(`Failed to save ${sectionName}.`);
      }
    } finally {
      setSavingSection(null);
    }
  };

  // Save complete profile draft
  const handleSaveDraft = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      setSaveStatus(null);
      setErrorMessage(null);

      const payload = {
        displayName: profile.displayName,
        headline: profile.headline || null,
        bio: profile.bio || null,
        avatarUrl: profile.avatarUrl || null,
        coverUrl: profile.coverUrl || null,
        phone: profile.phone || null,
        whatsapp: profile.whatsapp || null,
        email: profile.email || null,
        website: profile.website || null,
        address: profile.address || null,
        location: profile.location || null,
        socialLinks: profile.socialLinks || {},
        templateId: profile.templateId,
        themeConfig: profile.themeConfig,
        customFields: {
          ...profile.customFields,
          googleReviewUrl: profile.googleReviewUrl || null,
          brochureUrl: profile.brochureUrl || null,
        },
      };

      const res = await fetch(`/api/v1/profiles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Save failed');
      }

      setOriginalProfile(JSON.parse(JSON.stringify(profile)));
      setSaveStatus('Draft saved successfully');
      toast.success('Profile draft saved successfully');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Pre-flight check and initiate publishing
  const handleInitiatePublish = () => {
    if (!profile) return;
    const result = validateProfileForPublishing(profile);
    setValidationResult(result);
    setShowValidationModal(true);
  };

  // Confirm publish after validation check
  const handleConfirmPublish = async () => {
    if (!profile) return;
    try {
      setIsPublishing(true);
      setErrorMessage(null);

      // Save draft first if there are dirty changes
      if (hasChanges) {
        await handleSaveDraft();
      }

      const res = await fetch(`/api/v1/profiles/${id}/publish`, {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Publishing failed');
      }

      setProfile((prev) => (prev ? { ...prev, status: 'published' } : null));
      setSaveStatus('Profile published successfully!');
      setShowValidationModal(false);
      setShowPublishSuccessModal(true);
      toast.success(`Profile published successfully! Live at /p/${profile.slug}`);
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish profile.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  // Multiple Business Handlers
  const handleOpenBizModal = (biz?: BusinessItem) => {
    if (biz) {
      setEditingBizId(biz.id);
      setBizForm({
        name: biz.name || '',
        tagline: biz.tagline || '',
        description: biz.description || '',
        logoUrl: (biz as { logoUrl?: string | null }).logoUrl || '',
        website: biz.website || '',
        email: biz.email || '',
        phone: biz.phone || '',
        whatsapp: biz.whatsapp || '',
        address: biz.address || '',
        googleMapsUrl: biz.googleMapsUrl || '',
        googleReviewUrl: biz.googleReviewUrl || '',
      });
    } else {
      setEditingBizId(null);
      setBizForm({
        name: '',
        tagline: '',
        description: '',
        logoUrl: '',
        website: '',
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        googleMapsUrl: '',
        googleReviewUrl: '',
      });
    }
    setIsBizModalOpen(true);
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const url = editingBizId
        ? `/api/v1/profiles/${id}/businesses/${editingBizId}`
        : `/api/v1/profiles/${id}/businesses`;
      const method = editingBizId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bizForm),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to save business.');
      }

      // Update local state
      if (editingBizId) {
        setProfile({
          ...profile,
          businesses: profile.businesses.map((b) =>
            b.id === editingBizId ? { ...b, ...bizForm } : b
          ),
        });
      } else {
        setProfile({
          ...profile,
          businesses: [...profile.businesses, json.data],
        });
      }

      setIsBizModalOpen(false);
      toast.success(editingBizId ? 'Business updated successfully' : 'Business added successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save business.';
      toast.error(msg);
    }
  };

  const confirmDeleteBusiness = async () => {
    if (!profile || !bizToDelete) return;
    try {
      setIsDeletingItem(true);
      const res = await fetch(`/api/v1/profiles/${id}/businesses/${bizToDelete}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete business');
      setProfile({
        ...profile,
        businesses: profile.businesses.filter((b) => b.id !== bizToDelete),
      });
      toast.success('Business removed successfully');
      setBizToDelete(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error removing business');
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleDeleteBusiness = (bizId: string) => {
    setBizToDelete(bizId);
  };

  // Catalogue Handlers
  const handleOpenCatModal = (cat?: CatalogueItem) => {
    if (cat) {
      setEditingCatId(cat.id);
      setCatForm({
        type: cat.type,
        title: cat.title,
        description: cat.description || '',
        price: cat.price || '',
        imageUrl: cat.imageUrl || '',
        actionUrl: cat.actionUrl || '',
        actionLabel: cat.actionLabel || 'Enquire',
      });
    } else {
      setEditingCatId(null);
      setCatForm({
        type: 'product',
        title: '',
        description: '',
        price: '',
        imageUrl: '',
        actionUrl: '',
        actionLabel: 'Enquire',
      });
    }
    setIsCatModalOpen(true);
  };

  const handleSaveCatalogue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const url = editingCatId
        ? `/api/v1/profiles/${id}/catalogue/${editingCatId}`
        : `/api/v1/profiles/${id}/catalogue`;
      const method = editingCatId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catForm),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to save catalogue item.');
      }

      if (editingCatId) {
        setProfile({
          ...profile,
          catalogue: profile.catalogue.map((c) =>
            c.id === editingCatId ? { ...c, ...catForm } : c
          ),
        });
      } else {
        setProfile({
          ...profile,
          catalogue: [...profile.catalogue, json.data],
        });
      }

      setIsCatModalOpen(false);
      toast.success(editingCatId ? 'Catalogue item updated' : 'Catalogue item added');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save catalogue item.';
      toast.error(msg);
    }
  };

  const confirmDeleteCatalogue = async () => {
    if (!profile || !catToDelete) return;
    try {
      setIsDeletingItem(true);
      const res = await fetch(`/api/v1/profiles/${id}/catalogue/${catToDelete}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete catalogue item');
      setProfile({
        ...profile,
        catalogue: profile.catalogue.filter((c) => c.id !== catToDelete),
      });
      toast.success('Catalogue item deleted');
      setCatToDelete(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error deleting item');
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleDeleteCatalogue = (catId: string) => {
    setCatToDelete(catId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground">Loading Profile Editor...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center max-w-md p-6 bg-white border border-slate-200 rounded-xl">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold tracking-tight">Profile Unavailable</h2>
          <p className="text-xs text-muted-foreground mt-1">{errorMessage || 'Could not find profile.'}</p>
          <Link href="/dashboard" className="mt-4 inline-block">
            <Button size="sm">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = profile.themeConfig?.primaryColor || '#D4AF37';

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {hasChanges ? (
            <button
              type="button"
              onClick={() => setShowExitWarning(true)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              ← Dashboard
            </button>
          ) : (
            <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
              ← Dashboard
            </Link>
          )}
          <span className="text-muted-foreground">/</span>
          <span className="text-xs font-semibold truncate max-w-[180px]">{profile.displayName}</span>
          <Badge variant={profile.status === 'published' ? 'gold' : 'secondary'} className="text-[10px]">
            {profile.status === 'published' ? 'Live' : 'Draft'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saveStatus}
            </span>
          )}

          {errorMessage && (
            <span className="text-xs text-destructive font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMessage}
            </span>
          )}

          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetChanges}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
              title="Revert unsaved changes"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          )}

          <LoadingButton
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            loading={isSaving}
            className="text-xs h-8"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Save
          </LoadingButton>

          <LoadingButton
            size="sm"
            onClick={handleInitiatePublish}
            loading={isPublishing}
            className="text-xs h-8 bg-blue-600 text-white hover:bg-blue-700 font-semibold"
          >
            Publish
          </LoadingButton>

          {profile.status === 'published' && (
            <Link href={`/p/${profile.slug}`} target="_blank">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                View
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* 3-Pane Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Left Sections Navigator */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sections
            </span>
          </div>
          <nav className="p-2 space-y-1">
            {SECTION_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90 text-blue-600' : 'opacity-40'}`} />
                </button>
              );
            })}
          </nav>

          <div className="mt-auto p-4 border-t border-slate-200 bg-muted/20">
            <div className="text-[11px] text-muted-foreground">Public URL:</div>
            <div className="font-mono text-xs text-foreground truncate mt-0.5">
              /p/{profile.slug}
            </div>
          </div>
        </aside>

        {/* Pane 2: Center Content & Form Editor */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-2xl border-r border-slate-200">
          {/* Identity Tab */}
          {activeTab === 'identity' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold">Identity</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Display Name</label>
                  <Input
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Headline</label>
                  <Input
                    value={profile.headline || ''}
                    onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                    placeholder="Managing Director & Tech Investor"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Bio</label>
                  <Textarea
                    rows={4}
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="text-xs"
                    placeholder="About your background and mission..."
                  />
                </div>

                <ImageUploadOrUrl
                  label="Profile Avatar"
                  description="Recommended: 400x400 square portrait"
                  value={profile.avatarUrl}
                  onChange={(url) => setProfile({ ...profile, avatarUrl: url })}
                  mediaCategory="avatar"
                  aspectRatio="square"
                  profileId={profile.id}
                />

                <ImageUploadOrUrl
                  label="Cover Banner"
                  description="Recommended: 1200x400 wide banner highlighting your brand or practice"
                  value={profile.coverUrl}
                  onChange={(url) => setProfile({ ...profile, coverUrl: url })}
                  mediaCategory="cover"
                  aspectRatio="banner"
                  profileId={profile.id}
                />

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleSaveSection('Identity', {
                        displayName: profile.displayName,
                        headline: profile.headline || null,
                        bio: profile.bio || null,
                        avatarUrl: profile.avatarUrl || null,
                        coverUrl: profile.coverUrl || null,
                      })
                    }
                    disabled={savingSection === 'Identity'}
                    className="text-xs h-8 bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {savingSection === 'Identity' ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Theme / Styles Studio Tab */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold">Luxury Style Studio</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select an art-directed aesthetic. Your profile information, contacts, and businesses are 100% preserved.
                </p>
              </div>

              {/* 6 Luxury Style Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {LUXURY_TEMPLATES.map((tpl) => {
                  const isSelected = (profile.templateId || 'obsidian-luxury') === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        setProfile({
                          ...profile,
                          templateId: tpl.id,
                          themeConfig: {
                            ...profile.themeConfig,
                            primaryColor: tpl.defaultTheme.primaryColor,
                            background: tpl.defaultTheme.background,
                            cardBg: tpl.defaultTheme.cardBg,
                          },
                        });
                        toast.success(`Applied ${tpl.name} style`);
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground">{tpl.name}</span>
                            {isSelected && (
                              <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-blue-600 text-white font-semibold">
                                Active
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground font-medium block mt-0.5">
                            {tpl.tagline}
                          </span>
                        </div>

                        {/* Palette Swatches */}
                        <div className="flex items-center -space-x-1.5 shrink-0">
                          {tpl.palette.map((c, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-white shadow-xs"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-500 truncate max-w-[150px]">{tpl.target}</span>
                        <span className="font-semibold text-slate-700 uppercase font-mono">{tpl.plan}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Curated Customization Controls */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-4">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  Customization Controls
                </h3>

                <div>
                  <label className="block text-xs font-semibold mb-2">Primary Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          themeConfig: { ...profile.themeConfig, primaryColor: e.target.value },
                        })
                      }
                      className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          themeConfig: { ...profile.themeConfig, primaryColor: e.target.value },
                        })
                      }
                      className="w-28 font-mono text-xs h-8"
                    />

                    {/* Quick Preset Swatches */}
                    <div className="flex items-center gap-1.5 ml-2">
                      {['#D4AF37', '#8C6D3B', '#A855F7', '#2563EB', '#059669', '#10B981'].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() =>
                            setProfile({
                              ...profile,
                              themeConfig: { ...profile.themeConfig, primaryColor: hex },
                            })
                          }
                          className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition-transform cursor-pointer"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const cur = LUXURY_TEMPLATES.find((t) => t.id === profile.templateId) || LUXURY_TEMPLATES[0];
                      setProfile({
                        ...profile,
                        themeConfig: { ...cur.defaultTheme },
                      });
                      toast.success('Restored style defaults');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Restore Defaults
                  </Button>

                  <Button
                    size="sm"
                    onClick={() =>
                      handleSaveSection('Theme', {
                        templateId: profile.templateId,
                        themeConfig: profile.themeConfig,
                      })
                    }
                    disabled={savingSection === 'Theme'}
                    className="text-xs h-8 bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {savingSection === 'Theme' ? 'Saving...' : 'Save Style'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold">Contact</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Phone</label>
                  <Input
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Email</label>
                  <Input
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">WhatsApp</label>
                  <Input
                    value={profile.whatsapp || ''}
                    onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Website</label>
                  <Input
                    value={profile.website || ''}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Address</label>
                  <Input
                    value={profile.address || ''}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Bengaluru, Karnataka, India"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleSaveSection('Contacts', {
                        phone: profile.phone || null,
                        email: profile.email || null,
                        whatsapp: profile.whatsapp || null,
                        website: profile.website || null,
                        address: profile.address || null,
                      })
                    }
                    disabled={savingSection === 'Contacts'}
                    className="text-xs h-8 bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {savingSection === 'Contacts' ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Ventures & Multiple Businesses Tab */}
          {activeTab === 'businesses' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Businesses</h2>
                <Button
                  size="sm"
                  onClick={() => handleOpenBizModal()}
                  className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>

              {profile.businesses.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">No businesses added.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenBizModal()}
                    className="mt-3 text-xs"
                  >
                    Add Business
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.businesses.map((biz) => (
                    <div
                      key={biz.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{biz.name}</h4>
                        {biz.tagline && <p className="text-xs text-muted-foreground mt-0.5">{biz.tagline}</p>}
                        {biz.website && (
                          <span className="text-[11px] text-blue-600 font-mono block mt-1">
                            {biz.website}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenBizModal(biz)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBusiness(biz.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Catalogue Tab (Products & Services) */}
          {activeTab === 'catalogue' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Catalogue</h2>
                <Button
                  size="sm"
                  onClick={() => handleOpenCatModal()}
                  className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>

              {profile.catalogue.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">No items added.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenCatModal()}
                    className="mt-3 text-xs"
                  >
                    Add Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.catalogue.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{cat.title}</span>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {cat.type}
                          </Badge>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                        )}
                        {cat.price && (
                          <div className="text-xs font-semibold text-blue-600 mt-1">
                            {cat.price} {cat.currency}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCatModal(cat)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCatalogue(cat.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Socials Tab */}
          {activeTab === 'socials' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold">Social Networks & Links</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect your networking channels. Enter your username (e.g. @sanoof) or full profile URL.
                </p>
              </div>

              {/* Add / Update Social Form */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Platform</label>
                    <select
                      value={newSocialPlatform}
                      onChange={(e) => setNewSocialPlatform(e.target.value)}
                      className="w-full h-8 text-xs rounded-lg border border-slate-200 px-2.5 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden"
                    >
                      {Object.values(SOCIAL_PLATFORMS).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Username or Profile URL
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={newSocialInput}
                        onChange={(e) => setNewSocialInput(e.target.value)}
                        placeholder={SOCIAL_PLATFORMS[newSocialPlatform]?.placeholder || 'username or URL'}
                        className="text-xs h-8 flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (!newSocialInput.trim()) return;
                          const normalized = normalizeSocialUrl(newSocialPlatform, newSocialInput);
                          setProfile({
                            ...profile,
                            socialLinks: {
                              ...profile.socialLinks,
                              [newSocialPlatform]: normalized,
                            },
                          });
                          setNewSocialInput('');
                          toast.success(`Linked ${SOCIAL_PLATFORMS[newSocialPlatform]?.name}`);
                        }}
                        className="text-xs h-8 bg-blue-600 text-white hover:bg-blue-700 px-3 shrink-0 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Link
                      </Button>
                    </div>
                  </div>
                </div>

                {newSocialInput.trim() && (
                  <div className="text-[11px] text-muted-foreground font-mono bg-muted/40 p-2 rounded-lg">
                    Destination URL: {normalizeSocialUrl(newSocialPlatform, newSocialInput)}
                  </div>
                )}
              </div>

              {/* Linked Accounts List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground">
                  Linked Channels ({Object.values(profile.socialLinks || {}).filter(Boolean).length})
                </span>
                {profile.socialLinks && Object.entries(profile.socialLinks).filter(([, url]) => Boolean(url)).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(profile.socialLinks)
                      .filter(([, url]) => Boolean(url))
                      .map(([platform, url]) => {
                        const platConfig = SOCIAL_PLATFORMS[platform];
                        const handle = extractSocialHandle(platform, url as string);
                        return (
                          <div
                            key={platform}
                            className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="min-w-0 flex items-center gap-2.5">
                              <span className="text-xs font-bold text-foreground capitalize">
                                {platConfig?.name || platform}
                              </span>
                              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-foreground truncate max-w-[180px]">
                                {handle}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <a
                                href={url as string}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                                title="Open profile"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...profile.socialLinks };
                                  delete updated[platform];
                                  setProfile({ ...profile, socialLinks: updated });
                                  toast.success(`Removed ${platConfig?.name || platform}`);
                                }}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive cursor-pointer"
                                title="Remove link"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-muted-foreground bg-slate-50">
                    No social profiles linked yet. Select a platform above to connect.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <Button
                  size="sm"
                  onClick={() =>
                    handleSaveSection('Social Networks', {
                      socialLinks: profile.socialLinks || {},
                    })
                  }
                  disabled={savingSection === 'Social Networks'}
                  className="text-xs h-8 bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {savingSection === 'Social Networks' ? 'Saving...' : 'Save Socials'}
                </Button>
              </div>
            </div>
          )}

          {/* UPI Payment Tab */}
          {activeTab === 'upi' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold">UPI Payment & Direct Settlement</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure direct bank payments via Indian UPI protocol. Visitors can scan or tap to transfer funds directly.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-foreground">Enable UPI Payment on Profile</label>
                    <p className="text-[11px] text-muted-foreground">Show payment action and QR code on your live card</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(profile.customFields?.upiConfig?.isEnabled)}
                    onChange={(e) => {
                      const cur = profile.customFields?.upiConfig || { upiId: '' };
                      setProfile({
                        ...profile,
                        customFields: {
                          ...profile.customFields,
                          upiConfig: { ...cur, isEnabled: e.target.checked },
                        },
                      });
                    }}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">UPI ID / VPA *</label>
                  <Input
                    placeholder="merchant@upi or yourname@okhdfcbank"
                    value={profile.customFields?.upiConfig?.upiId || ''}
                    onChange={(e) => {
                      const cur = profile.customFields?.upiConfig || { upiId: '', isEnabled: true };
                      setProfile({
                        ...profile,
                        customFields: {
                          ...profile.customFields,
                          upiConfig: { ...cur, upiId: e.target.value },
                        },
                      });
                    }}
                    className="text-xs font-mono"
                  />
                  {profile.customFields?.upiConfig?.upiId && (
                    <div className="mt-1">
                      {isValidUpiId(profile.customFields.upiConfig.upiId) ? (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid UPI VPA address
                        </span>
                      ) : (
                        <span className="text-[11px] text-destructive font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Invalid UPI format (e.g. name@bank)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Payee Name</label>
                  <Input
                    placeholder={profile.displayName}
                    value={profile.customFields?.upiConfig?.payeeName || ''}
                    onChange={(e) => {
                      const cur = profile.customFields?.upiConfig || { upiId: '', isEnabled: true };
                      setProfile({
                        ...profile,
                        customFields: {
                          ...profile.customFields,
                          upiConfig: { ...cur, payeeName: e.target.value },
                        },
                      });
                    }}
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Default Amount (₹ optional)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      value={profile.customFields?.upiConfig?.defaultAmount || ''}
                      onChange={(e) => {
                        const cur = profile.customFields?.upiConfig || { upiId: '', isEnabled: true };
                        setProfile({
                          ...profile,
                          customFields: {
                            ...profile.customFields,
                            upiConfig: { ...cur, defaultAmount: e.target.value },
                          },
                        });
                      }}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Payment Purpose / Note</label>
                    <Input
                      placeholder="Consulting / Order"
                      value={profile.customFields?.upiConfig?.note || ''}
                      onChange={(e) => {
                        const cur = profile.customFields?.upiConfig || { upiId: '', isEnabled: true };
                        setProfile({
                          ...profile,
                          customFields: {
                            ...profile.customFields,
                            upiConfig: { ...cur, note: e.target.value },
                          },
                        });
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleSaveSection('UPI Payment', {
                        customFields: profile.customFields || {},
                      })
                    }
                    disabled={savingSection === 'UPI Payment'}
                    className="text-xs h-8 bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {savingSection === 'UPI Payment' ? 'Saving...' : 'Save UPI Settings'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews & Leads Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold">Extras</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Google Review URL</label>
                  <Input
                    value={profile.googleReviewUrl || ''}
                    onChange={(e) => setProfile({ ...profile, googleReviewUrl: e.target.value })}
                    placeholder="https://g.page/r/your-review-link/review"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Brochure URL</label>
                  <Input
                    value={profile.brochureUrl || ''}
                    onChange={(e) => setProfile({ ...profile, brochureUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleSaveSection('Reviews & Leads', {
                        customFields: {
                          googleReviewUrl: profile.googleReviewUrl || null,
                          brochureUrl: profile.brochureUrl || null,
                        },
                      })
                    }
                    disabled={savingSection === 'Reviews & Leads'}
                    className="text-xs h-8 bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {savingSection === 'Reviews & Leads' ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Pane 3: Right Live Preview Screen */}
        <aside className="w-[420px] xl:w-[480px] bg-slate-100/70 p-4 flex flex-col items-center shrink-0 border-l border-slate-200 overflow-hidden">
          {/* Viewport & Device Switcher Bar */}
          <div className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-white shadow-xs font-bold text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Mobile Preview (375px)"
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('tablet')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  previewDevice === 'tablet'
                    ? 'bg-white shadow-xs font-bold text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Tablet Preview (680px)"
              >
                <Tablet className="w-3 h-3" />
                <span>Tablet</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-white shadow-xs font-bold text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Desktop Preview (Full Width)"
              >
                <Monitor className="w-3 h-3" />
                <span>Desktop</span>
              </button>
            </div>

            <Link
              href={`/p/${profile.slug}`}
              target="_blank"
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              title="Open full page preview"
            >
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Live Preview Canvas with Real ProfileRenderer */}
          <div className="flex-1 w-full overflow-y-auto flex justify-center items-start pb-6">
            {renderProfileData && (
              <div
                className={`transition-all duration-300 ${
                  previewDevice === 'mobile'
                    ? 'w-[360px] sm:w-[375px] min-h-[680px] rounded-[44px] border-[10px] border-neutral-900 bg-black shadow-2xl overflow-hidden relative ring-1 ring-white/10 shrink-0 my-2'
                    : previewDevice === 'tablet'
                    ? 'w-[440px] min-h-[640px] rounded-[32px] border-[8px] border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden shrink-0 my-2'
                    : 'w-full rounded-2xl border border-border bg-neutral-950 shadow-xl overflow-hidden my-2'
                }`}
              >
                {/* Device Camera Pill on Mobile */}
                {previewDevice === 'mobile' && (
                  <div className="w-24 h-4 bg-neutral-900 mx-auto rounded-b-xl z-20 relative flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-neutral-800" />
                  </div>
                )}
                <div className="w-full">
                  <ProfileRenderer profile={renderProfileData as any} />
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Business Modal */}
      {isBizModalOpen && (
        <Dialog open={isBizModalOpen} onOpenChange={setIsBizModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingBizId ? 'Edit Business' : 'Add Business'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveBusiness} className="space-y-3 mt-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Company Name *</label>
                <Input
                  required
                  value={bizForm.name}
                  onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                  placeholder="ABC Technologies"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tagline</label>
                <Input
                  value={bizForm.tagline}
                  onChange={(e) => setBizForm({ ...bizForm, tagline: e.target.value })}
                  placeholder="Enterprise Cloud Architecture"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Website URL</label>
                <Input
                  value={bizForm.website}
                  onChange={(e) => setBizForm({ ...bizForm, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <ImageUploadOrUrl
                label="Company Logo"
                description="Upload company brand logo"
                value={bizForm.logoUrl}
                onChange={(url) => setBizForm({ ...bizForm, logoUrl: url || '' })}
                mediaCategory="logo"
                aspectRatio="square"
                profileId={profile.id}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Phone</label>
                  <Input
                    value={bizForm.phone}
                    onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">WhatsApp</label>
                  <Input
                    value={bizForm.whatsapp}
                    onChange={(e) => setBizForm({ ...bizForm, whatsapp: e.target.value })}
                    placeholder="+91..."
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsBizModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  Save
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Catalogue Item Modal */}
      {isCatModalOpen && (
        <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingCatId ? 'Edit Item' : 'Add Item'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveCatalogue} className="space-y-3 mt-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Type</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={catForm.type === 'product' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setCatForm({ ...catForm, type: 'product' })}
                  >
                    Product
                  </Button>
                  <Button
                    type="button"
                    variant={catForm.type === 'service' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setCatForm({ ...catForm, type: 'service' })}
                  >
                    Service
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Title *</label>
                <Input
                  required
                  value={catForm.title}
                  onChange={(e) => setCatForm({ ...catForm, title: e.target.value })}
                  placeholder="Product name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Price</label>
                <Input
                  value={catForm.price}
                  onChange={(e) => setCatForm({ ...catForm, price: e.target.value })}
                  placeholder="₹2,999"
                />
              </div>

              <ImageUploadOrUrl
                label="Item Image"
                description="Upload product or service showcase image"
                value={catForm.imageUrl}
                onChange={(url) => setCatForm({ ...catForm, imageUrl: url || '' })}
                mediaCategory={catForm.type === 'product' ? 'product' : 'service'}
                aspectRatio="square"
                profileId={profile.id}
              />

              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <Textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="text-xs"
                  placeholder="Description..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Action URL</label>
                <Input
                  value={catForm.actionUrl}
                  onChange={(e) => setCatForm({ ...catForm, actionUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCatModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  Save
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Pre-Flight Validation Modal */}
      {showValidationModal && validationResult && (
        <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>Profile Pre-Publish Readiness</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {validationResult.score}% Ready
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 my-2 max-h-[60vh] overflow-y-auto pr-1">
              {/* Blocking Errors */}
              {validationResult.blockingErrors.length > 0 && (
                <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationResult.blockingErrors.length} Issue(s) Must Be Fixed</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-destructive/90 pl-5 list-disc">
                    {validationResult.blockingErrors.map((err) => (
                      <li key={err.id}>
                        <div className="flex items-center justify-between gap-2">
                          <span>{err.message}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab(err.tab);
                              setShowValidationModal(false);
                            }}
                            className="text-[11px] underline font-semibold text-destructive hover:text-destructive/80 cursor-pointer shrink-0"
                          >
                            Fix in {err.tab}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quality Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Quality Recommendations</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-300 pl-5 list-disc">
                    {validationResult.warnings.map((w) => (
                      <li key={w.id}>
                        <div className="flex items-center justify-between gap-2">
                          <span>{w.message}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab(w.tab);
                              setShowValidationModal(false);
                            }}
                            className="text-[11px] underline font-semibold cursor-pointer shrink-0"
                          >
                            Add in {w.tab}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Readiness Summary Checklist */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-muted/30 space-y-2 text-xs">
                <span className="font-semibold text-foreground block">Profile Checklist</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${validationResult.summary.hasAvatar ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>Avatar Photo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${validationResult.summary.contactStatus === 'complete' ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>Contact Info</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${validationResult.summary.socialCount > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>Socials ({validationResult.summary.socialCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${validationResult.summary.hasUpi ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>UPI Payment</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowValidationModal(false)}>
                Cancel
              </Button>
              <LoadingButton
                size="sm"
                onClick={handleConfirmPublish}
                loading={isPublishing}
                disabled={!validationResult.canPublish}
                className="bg-blue-600 text-white hover:bg-blue-700 font-semibold"
              >
                Confirm &amp; Publish Live
              </LoadingButton>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Publish Success Celebration Modal */}
      {showPublishSuccessModal && (
        <Dialog open={showPublishSuccessModal} onOpenChange={setShowPublishSuccessModal}>
          <DialogContent className="max-w-md text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground">
                Your Profile is Live!
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Your digital identity is now accessible worldwide with sub-second performance.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold truncate text-foreground">
                {typeof window !== 'undefined' ? `${window.location.origin}/p/${profile.slug}` : `/p/${profile.slug}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`${window.location.origin}/p/${profile.slug}`);
                    setCopiedLiveLink(true);
                    toast.success('Public URL copied to clipboard');
                    setTimeout(() => setCopiedLiveLink(false), 2000);
                  }
                }}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-background border border-border hover:bg-muted text-foreground flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedLiveLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLiveLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPublishSuccessModal(false)}
                className="flex-1 text-xs"
              >
                Keep Editing
              </Button>
              <Link href={`/p/${profile.slug}`} target="_blank" className="flex-1">
                <Button
                  type="button"
                  size="sm"
                  className="w-full text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  View Live Profile
                </Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Unsaved Changes Confirmation Dialog */}
      <UnsavedChangesDialog
        open={showExitWarning}
        onOpenChange={setShowExitWarning}
        onDiscard={() => {
          setShowExitWarning(false);
          router.push('/dashboard');
        }}
      />

      {/* Delete Business Confirmation Dialog */}
      <DeleteDialog
        open={!!bizToDelete}
        onOpenChange={(open) => !open && setBizToDelete(null)}
        title="Remove Business"
        description="Are you sure you want to remove this business? Contact info and services linked to this business will be removed from your digital profile."
        onConfirm={confirmDeleteBusiness}
        loading={isDeletingItem}
      />

      {/* Delete Catalogue Item Confirmation Dialog */}
      <DeleteDialog
        open={!!catToDelete}
        onOpenChange={(open) => !open && setCatToDelete(null)}
        title="Delete Catalogue Item"
        description="Are you sure you want to delete this catalogue product or service? This action cannot be undone."
        onConfirm={confirmDeleteCatalogue}
        loading={isDeletingItem}
      />
    </div>
  );
}

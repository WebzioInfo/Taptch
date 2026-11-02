'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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

interface ProfileData {
  id: string;
  slug: string;
  profileType: 'personal' | 'business';
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  templateId: string;
  themeConfig: {
    primaryColor?: string;
    background?: string;
    cardBg?: string;
    fontFamily?: string;
    [key: string]: unknown;
  };
  status: 'draft' | 'published';
  businesses: BusinessItem[];
  catalogue: CatalogueItem[];
  sections: ProfileSection[];
}

const SECTION_TABS = [
  { id: 'identity', label: 'Identity & Bio', icon: User },
  { id: 'theme', label: 'Theme & Styling', icon: Palette },
  { id: 'contacts', label: 'Contact Info', icon: Phone },
  { id: 'businesses', label: 'Ventures & Businesses', icon: Building2 },
  { id: 'catalogue', label: 'Products & Services', icon: Package },
  { id: 'socials', label: 'Social Networks', icon: Share2 },
  { id: 'reviews', label: 'Reviews & Leads', icon: Star },
];

export default function ProfileBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState('identity');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Business Modal State
  const [isBizModalOpen, setIsBizModalOpen] = useState(false);
  const [editingBizId, setEditingBizId] = useState<string | null>(null);
  const [bizForm, setBizForm] = useState({
    name: '',
    tagline: '',
    description: '',
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
          setProfile(json.data);
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

  // Save general profile draft
  const handleSaveDraft = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      setSaveStatus(null);
      setErrorMessage(null);

      const res = await fetch(`/api/v1/profiles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: profile.displayName,
          headline: profile.headline,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          coverUrl: profile.coverUrl,
          templateId: profile.templateId,
          themeConfig: profile.themeConfig,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Save failed');
      }

      setSaveStatus('Draft saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An error occurred while saving.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Publish profile
  const handlePublish = async () => {
    if (!profile) return;
    try {
      setIsPublishing(true);
      setErrorMessage(null);

      const res = await fetch(`/api/v1/profiles/${id}/publish`, {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Publishing failed');
      }

      setProfile((prev) => (prev ? { ...prev, status: 'published' } : null));
      setSaveStatus('Profile published successfully!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to publish profile.');
      }
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const handleDeleteBusiness = async (bizId: string) => {
    if (!profile || !confirm('Are you sure you want to remove this business?')) return;
    try {
      const res = await fetch(`/api/v1/profiles/${id}/businesses/${bizId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProfile({
          ...profile,
          businesses: profile.businesses.filter((b) => b.id !== bizId),
        });
      }
    } catch (err) {
      console.error(err);
    }
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const handleDeleteCatalogue = async (catId: string) => {
    if (!profile || !confirm('Are you sure you want to delete this catalogue item?')) return;
    try {
      const res = await fetch(`/api/v1/profiles/${id}/catalogue/${catId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProfile({
          ...profile,
          catalogue: profile.catalogue.filter((c) => c.id !== catId),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground">Loading Profile Editor...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center max-w-md p-6 bg-card border border-border rounded-xl">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-bold">Profile Unavailable</h2>
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
      <header className="h-14 border-b border-border/80 bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
            ← Dashboard
          </Link>
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

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="text-xs h-8"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>

          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
            className="text-xs h-8 bg-gold text-gold-foreground hover:bg-gold-light font-semibold"
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>

          {profile.status === 'published' && (
            <Link href={`/p/${profile.slug}`} target="_blank">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                View Live
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* 3-Pane Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Left Sections Navigator */}
        <aside className="w-64 border-r border-border/80 bg-card/60 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-border/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Profile Sections
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
                      ? 'bg-gold/15 text-gold font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90 text-gold' : 'opacity-40'}`} />
                </button>
              );
            })}
          </nav>

          <div className="mt-auto p-4 border-t border-border/60 bg-muted/20">
            <div className="text-[11px] text-muted-foreground">Public URL:</div>
            <div className="font-mono text-xs text-foreground truncate mt-0.5">
              /p/{profile.slug}
            </div>
          </div>
        </aside>

        {/* Pane 2: Center Content & Form Editor */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-2xl border-r border-border/80">
          {/* Identity Tab */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold">Identity & Narrative</h2>
                <p className="text-xs text-muted-foreground">
                  Personal and brand profile information shown at the top of your card.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Display Name</label>
                  <Input
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Professional Headline</label>
                  <Input
                    value={profile.headline || ''}
                    onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                    placeholder="e.g. Managing Director & Tech Investor"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">About / Bio</label>
                  <textarea
                    rows={4}
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Tell visitors about your background, career, and mission..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Avatar Image URL</label>
                    <Input
                      value={profile.avatarUrl || ''}
                      onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Cover Banner URL</label>
                    <Input
                      value={profile.coverUrl || ''}
                      onChange={(e) => setProfile({ ...profile, coverUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold">Theme & Styling</h2>
                <p className="text-xs text-muted-foreground">
                  Customize the palette and visual feel across all device viewports.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2">Accent / Primary Color</label>
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
                      className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          themeConfig: { ...profile.themeConfig, primaryColor: e.target.value },
                        })
                      }
                      className="w-32 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Active Template</label>
                  <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase font-mono">{profile.templateId}</span>
                    <Link href={`/templates`}>
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        Change Template
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold">Contact Channels</h2>
                <p className="text-xs text-muted-foreground">
                  Direct communication channels displayed on your smart digital card.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Phone Number</label>
                  <Input placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Email Address</label>
                  <Input type="email" placeholder="contact@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">WhatsApp Number</label>
                  <Input placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Primary Website</label>
                  <Input placeholder="https://example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Physical Address / City</label>
                  <Input placeholder="Bengaluru, Karnataka, India" />
                </div>
              </div>
            </div>
          )}

          {/* Ventures & Multiple Businesses Tab */}
          {activeTab === 'businesses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Ventures & Businesses</h2>
                  <p className="text-xs text-muted-foreground">
                    Multiple business ownership showcase for personal profiles.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleOpenBizModal()}
                  className="bg-gold text-gold-foreground hover:bg-gold-light text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Venture
                </Button>
              </div>

              {profile.businesses.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-xl bg-card/40">
                  <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">No ventures added yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenBizModal()}
                    className="mt-3 text-xs"
                  >
                    Add Your First Company
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.businesses.map((biz) => (
                    <div
                      key={biz.id}
                      className="p-4 rounded-xl border border-border bg-card flex items-start justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{biz.name}</h4>
                        {biz.tagline && <p className="text-xs text-muted-foreground mt-0.5">{biz.tagline}</p>}
                        {biz.website && (
                          <span className="text-[11px] text-gold font-mono block mt-1">
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Products & Services</h2>
                  <p className="text-xs text-muted-foreground">
                    Items, pricing, and enquiry links showcased on your profile.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleOpenCatModal()}
                  className="bg-gold text-gold-foreground hover:bg-gold-light text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Item
                </Button>
              </div>

              {profile.catalogue.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-xl bg-card/40">
                  <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">No catalogue items added yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenCatModal()}
                    className="mt-3 text-xs"
                  >
                    Add Product / Service
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.catalogue.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-xl border border-border bg-card flex items-start justify-between gap-4"
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
                          <div className="text-xs font-semibold text-gold mt-1">
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
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold">Social Media Profiles</h2>
                <p className="text-xs text-muted-foreground">
                  Add links to your professional and creator profiles.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">LinkedIn Profile</label>
                  <Input placeholder="https://linkedin.com/in/username" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">X (Twitter)</label>
                  <Input placeholder="https://x.com/username" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Instagram</label>
                  <Input placeholder="https://instagram.com/username" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">YouTube Channel</label>
                  <Input placeholder="https://youtube.com/@channel" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">GitHub</label>
                  <Input placeholder="https://github.com/username" />
                </div>
              </div>
            </div>
          )}

          {/* Reviews & Leads Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold">Google Reviews & Lead Capture</h2>
                <p className="text-xs text-muted-foreground">
                  Boost trust and collect inbound contacts from your profile visitors.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Google Review Link</label>
                  <Input placeholder="https://g.page/r/your-review-link/review" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Brochure PDF Download URL</label>
                  <Input placeholder="https://..." />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Pane 3: Right Live Preview Screen */}
        <aside className="w-96 bg-neutral-950 p-6 flex flex-col items-center justify-center shrink-0 border-l border-border/80 overflow-y-auto">
          <div className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1.5 uppercase font-semibold">
            <Smartphone className="w-3.5 h-3.5" />
            Live Reactive Preview
          </div>

          {/* Phone Frame */}
          <div className="w-[310px] h-[580px] rounded-[36px] border-4 border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col relative">
            {/* Notch */}
            <div className="h-5 bg-neutral-900 flex items-center justify-center shrink-0">
              <div className="w-20 h-3 bg-neutral-800 rounded-b-lg" />
            </div>

            {/* Screen Content Live Reactivity */}
            <div
              className="flex-1 p-4 overflow-y-auto"
              style={{
                backgroundColor: profile.themeConfig?.background?.toString() || '#0A0A0C',
                color: profile.themeConfig?.background === '#FDFBF7' ? '#1A202C' : '#FFFFFF',
              }}
            >
              {/* Cover Banner */}
              <div
                className="h-16 w-full rounded-xl -mt-1 mb-4 flex items-center justify-center text-[10px] font-medium opacity-70"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}10 100%)`,
                }}
              />

              {/* Avatar & Header */}
              <div className="text-center -mt-9">
                <div
                  className="w-14 h-14 rounded-full mx-auto flex items-center justify-center font-bold text-sm shadow-md border-2 border-background"
                  style={{
                    backgroundColor: primaryColor,
                    color: '#FFFFFF',
                  }}
                >
                  {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <h4 className="mt-2 text-sm font-bold truncate">{profile.displayName || 'Your Name'}</h4>
                <p className="text-[11px] opacity-70 truncate">{profile.headline || 'Your Professional Title'}</p>
              </div>

              {/* Save Contact CTA */}
              <button
                type="button"
                className="w-full mt-4 py-2 rounded-xl text-xs font-semibold shadow-md"
                style={{
                  backgroundColor: primaryColor,
                  color: profile.themeConfig?.background === '#FDFBF7' ? '#FFFFFF' : '#0A0A0C',
                }}
              >
                Save Contact
              </button>

              {/* Multiple Ventures / Businesses */}
              {profile.businesses.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-[10px] uppercase font-semibold opacity-60">Ventures</div>
                  {profile.businesses.map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm"
                    >
                      <div className="text-xs font-bold truncate">{b.name}</div>
                      {b.tagline && <div className="text-[10px] opacity-70 truncate">{b.tagline}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Catalogue items */}
              {profile.catalogue.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-[10px] uppercase font-semibold opacity-60">Catalogue</div>
                  {profile.catalogue.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{c.title}</div>
                        {c.price && <div className="text-[10px] text-gold font-mono">{c.price}</div>}
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 ml-2">
                        {c.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Business Modal */}
      {isBizModalOpen && (
        <Dialog open={isBizModalOpen} onOpenChange={setIsBizModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingBizId ? 'Edit Business Venture' : 'Add Business Venture'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Associate another company or enterprise with this personal profile.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveBusiness} className="space-y-3 mt-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Company / Venture Name *</label>
                <Input
                  required
                  value={bizForm.name}
                  onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                  placeholder="e.g. ABC Technologies Pvt Ltd"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tagline</label>
                <Input
                  value={bizForm.tagline}
                  onChange={(e) => setBizForm({ ...bizForm, tagline: e.target.value })}
                  placeholder="e.g. Enterprise Cloud Architecture"
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

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsBizModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-gold text-gold-foreground hover:bg-gold-light">
                  Save Venture
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
                {editingCatId ? 'Edit Catalogue Item' : 'Add Catalogue Item'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add a product or service offered by your business.
              </DialogDescription>
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
                  placeholder="e.g. Executive NFC Smart Card"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Price / Fee</label>
                <Input
                  value={catForm.price}
                  onChange={(e) => setCatForm({ ...catForm, price: e.target.value })}
                  placeholder="e.g. ₹2,999"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs"
                  placeholder="Short description..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Action URL (CTA Link)</label>
                <Input
                  value={catForm.actionUrl}
                  onChange={(e) => setCatForm({ ...catForm, actionUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCatModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-gold text-gold-foreground hover:bg-gold-light">
                  Save Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

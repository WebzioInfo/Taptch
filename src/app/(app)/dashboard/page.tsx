'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Eye,
  Users,
  Plus,
  Share2,
  ArrowRight,
  ExternalLink,
  Edit3,
  Loader2,
  Palette,
  CheckCircle,
  Clock,
  Send,
  QrCode,
  Smartphone,
  Copy,
  Check,
  User,
} from 'lucide-react';
import { CopyButton, ShareButton } from '@/components/ui/copy-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';

interface ProfileData {
  id: string;
  slug: string;
  displayName: string;
  headline?: string;
  profileType: string;
  templateId: string;
  status: string;
  avatarUrl?: string;
  publishedJson?: Record<string, unknown>;
  createdAt: string;
}

interface CardData {
  id: string;
  serialNumber: string;
  material: string;
  status: string;
  profileId: string | null;
}

interface LeadData {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [profiles, setProfiles] = React.useState<ProfileData[]>([]);
  const [cards, setCards] = React.useState<CardData[]>([]);
  const [leads, setLeads] = React.useState<LeadData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedSlug, setCopiedSlug] = React.useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isRequestingPublication, setIsRequestingPublication] = React.useState(false);
  const [publicationStatusMsg, setPublicationStatusMsg] = React.useState<string | null>(null);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Member';

  React.useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [profilesRes, cardsRes, leadsRes] = await Promise.all([
          fetch('/api/v1/profiles').then((r) => r.json()).catch(() => ({ data: [] })),
          fetch('/api/v1/cards').then((r) => r.json()).catch(() => ({ data: [] })),
          fetch('/api/v1/leads').then((r) => r.json()).catch(() => ({ data: [] })),
        ]);

        if (profilesRes.data) setProfiles(profilesRes.data);
        if (cardsRes.data) setCards(cardsRes.data);
        if (leadsRes.data) setLeads(leadsRes.data);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const [selectedProfileId, setSelectedProfileId] = React.useState<string | null>(null);
  const activeProfile = (selectedProfileId ? profiles.find((p) => p.id === selectedProfileId) : profiles[0]) ?? null;

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 antialiased">
      {/* 1. Page Header with Direct Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, {displayName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/builder/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 px-3.5">
              <Plus className="h-4 w-4" />
              <span>Create Profile</span>
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      ) : (
        <>
          {/* 2. Key Metrics - Clean & Professional */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Profiles</span>
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-3xl font-semibold font-mono tracking-tight text-slate-900 mt-2">{profiles.length}</div>
              <div className="text-xs text-slate-500 mt-1">
                {profiles.filter((p) => p.status === 'published' || p.status === 'PUBLISHED').length} published and live
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Contacts & Leads</span>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-3xl font-semibold font-mono tracking-tight text-slate-900 mt-2">{leads.length}</div>
              <div className="text-xs text-slate-500 mt-1">
                Received via contact exchange
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Connected Cards</span>
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-3xl font-semibold font-mono tracking-tight text-slate-900 mt-2">{cards.length}</div>
              <div className="text-xs text-slate-500 mt-1">
                {cards.filter((c) => c.status === 'active' || c.profileId).length} active NFC cards
              </div>
            </div>
          </div>

          {/* 3. Primary Section: Profile Status & Sharing Card */}
          {activeProfile ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      {activeProfile.displayName}
                    </h2>
                    <StatusBadge status={activeProfile.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {activeProfile.headline || 'Digital Identity Profile'}
                  </p>
                </div>

                {/* Profile Selector if user has multiple profiles */}
                {profiles.length > 1 && (
                  <select
                    value={activeProfile.id}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="h-8 text-xs rounded-md border border-slate-200 bg-slate-50 px-2.5 text-slate-700 font-medium"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName} ({p.slug})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Profile Link Bar with Copy Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2 text-xs truncate">
                  <span className="font-semibold text-slate-600">Profile Link:</span>
                  <span className="font-mono text-blue-600 truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/p/${activeProfile.slug}` : `/p/${activeProfile.slug}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CopyButton
                    value={typeof window !== 'undefined' ? `${window.location.origin}/p/${activeProfile.slug}` : `/p/${activeProfile.slug}`}
                    label="Copy link"
                    className="h-8 text-xs"
                  />
                  <ShareButton
                    url={typeof window !== 'undefined' ? `${window.location.origin}/p/${activeProfile.slug}` : `/p/${activeProfile.slug}`}
                    title={activeProfile.displayName}
                    text={activeProfile.headline || `Connect with ${activeProfile.displayName}`}
                    label="Share"
                    className="h-8 text-xs"
                  />
                  <a
                    href={`/p/${activeProfile.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-white gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View</span>
                    </Button>
                  </a>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                <Link href={`/builder/${activeProfile.id}`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 font-semibold">
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewOpen(true)}
                  className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Profile Preview</span>
                </Button>

                <Link href="/qr">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>QR Code</span>
                  </Button>
                </Link>

                <Link href="/cards">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Link NFC Card</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Clean Standard Empty State */
            <EmptyState
              icon={User}
              title="No profile created yet"
              description="Create your professional digital profile to start sharing your contact details, portfolio, and NFC links."
              actionLabel="Create Profile"
              actionHref="/builder/new"
              className="py-12"
            />
          )}

          {/* 4. Recent Contacts or Quick Navigation */}
          {leads.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Contacts & Leads</h3>
                  <p className="text-xs text-slate-500">People who exchanged their details with you</p>
                </div>
                <Link href="/leads">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 px-2 h-7 font-semibold">
                    <span>View all ({leads.length})</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {leads.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">{lead.name}</span>
                      {lead.company && (
                        <span className="text-slate-500 ml-2">({lead.company})</span>
                      )}
                      {lead.email && (
                        <span className="text-slate-500 ml-2 font-mono text-[11px]">
                          {lead.email}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Profile Styles</div>
                    <div className="text-[11px] text-slate-500">Choose your design</div>
                  </div>
                </div>
                <Link href="/templates">
                  <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50">
                    Browse
                  </Button>
                </Link>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">NFC Cards</div>
                    <div className="text-[11px] text-slate-500">Connect smart hardware</div>
                  </div>
                </div>
                <Link href="/cards">
                  <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50">
                    Manage
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* Profile Preview Modal with User Data */}
      {isPreviewOpen && activeProfile && (
        <TemplatePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          initialTemplateId={activeProfile.templateId}
          customerProfile={{
            id: activeProfile.id,
            slug: activeProfile.slug,
            displayName: activeProfile.displayName,
            headline: activeProfile.headline,
            profileType: activeProfile.profileType,
            templateId: activeProfile.templateId,
            avatarUrl: activeProfile.avatarUrl,
            publishedJson: activeProfile.publishedJson,
          }}
          onSelectTemplate={async (newTemplateId) => {
            const res = await fetch(`/api/v1/profiles/${activeProfile.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ templateId: newTemplateId }),
            });
            if (res.ok) {
              setProfiles((prev) =>
                prev.map((p) => (p.id === activeProfile.id ? { ...p, templateId: newTemplateId } : p))
              );
            }
          }}
        />
      )}
    </div>
  );
}

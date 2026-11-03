'use client';

import * as React from 'react';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Eye,
  Users,
  Plus,
  Share2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Edit3,
  Loader2,
  Palette,
  CheckCircle,
  FileCheck2,
  Clock,
  Send,
} from 'lucide-react';
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

  const displayName = user?.name || user?.email?.split('@')[0] || 'Executive Member';

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

  const activeProfile = profiles.length > 0 ? profiles[0] : null;

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {displayName}
            </h1>
            <Badge variant="gold" className="text-xs">
              Executive Tier
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your {brandConfig.name} digital identity, smart NFC hardware, and captured leads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/builder/new">
            <Button variant="gold" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create New Profile</span>
            </Button>
          </Link>
          <Link href="/templates">
            <Button variant="outline" size="sm" className="gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <span>Browse Templates</span>
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* KPI Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Digital Profiles */}
            <Card className="border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Digital Profiles
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Eye className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{profiles.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {profiles.filter((p) => p.status === 'published').length} published live
                </p>
              </CardContent>
            </Card>

            {/* Metric 2: Active Cards */}
            <Card className="border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Linked NFC Cards
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{cards.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hardware tokens active
                </p>
              </CardContent>
            </Card>

            {/* Metric 3: Reciprocal Leads */}
            <Card className="border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Captured Leads
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Users className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{leads.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Reciprocal contacts saved
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Profile Spotlight or Create First Profile Hero */}
          {activeProfile ? (
            <Card className="border-primary/40 bg-gradient-to-br from-card via-card/90 to-primary/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="gold" className="text-xs">
                      Primary Active Profile
                    </Badge>
                    <Badge variant={activeProfile.status === 'published' ? 'outline' : 'secondary'} className="text-xs capitalize">
                      {activeProfile.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(activeProfile.slug)}
                      className="gap-1.5 text-xs"
                    >
                      {copiedSlug === activeProfile.slug ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Copied URL!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Share Link</span>
                        </>
                      )}
                    </Button>
                    <Link href={`/p/${activeProfile.slug}`} target="_blank">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View Live</span>
                      </Button>
                    </Link>
                    <Link href={`/builder/${activeProfile.id}`}>
                      <Button variant="gold" size="sm" className="gap-1.5 text-xs">
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit Profile</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="pt-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                    {activeProfile.displayName.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                      {activeProfile.displayName}
                    </CardTitle>
                    <CardDescription className="text-sm mt-0.5">
                      {activeProfile.headline || 'Digital Identity & Executive Card'}
                    </CardDescription>
                    <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
                      <span>Public Slug: <code className="text-primary font-mono">/p/{activeProfile.slug}</code></span>
                      <span>•</span>
                      <span className="capitalize">Type: {activeProfile.profileType}</span>
                    </div>
                  </div>
                </div>

                {/* Selected Template & Publishing Action Bar */}
                <div className="mt-6 pt-5 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Template Overview Box */}
                  <div className="p-4 rounded-2xl bg-card/80 border border-border/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shrink-0">
                        <Palette className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Active Template
                        </div>
                        <div className="font-bold text-sm text-foreground truncate capitalize">
                          {activeProfile.templateId.replace(/-/g, ' ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPreviewOpen(true)}
                        className="text-xs h-8 gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span>Preview</span>
                      </Button>
                      <Link href="/templates">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 text-gold hover:text-gold-light"
                        >
                          Change
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Publishing Status Box */}
                  <div className="p-4 rounded-2xl bg-card/80 border border-border/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center shrink-0">
                        {activeProfile.status === 'published' ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : activeProfile.status === 'review_pending' ? (
                          <Clock className="h-5 w-5 text-amber-400" />
                        ) : (
                          <FileCheck2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Publishing Workflow
                        </div>
                        <div className="font-bold text-sm text-foreground truncate capitalize">
                          {activeProfile.status === 'published'
                            ? 'Approved & Published'
                            : activeProfile.status === 'review_pending'
                            ? 'Pending Admin Review'
                            : 'Draft (Unpublished)'}
                        </div>
                      </div>
                    </div>

                    {activeProfile.status === 'draft' && (
                      <Button
                        size="sm"
                        disabled={isRequestingPublication}
                        onClick={async () => {
                          try {
                            setIsRequestingPublication(true);
                            const res = await fetch(`/api/v1/profiles/${activeProfile.id}/request-publication`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({}),
                            });
                            if (!res.ok) {
                              const err = await res.json();
                              throw new Error(err.error?.message || 'Failed to submit publication request.');
                            }
                            setPublicationStatusMsg('Publication request submitted for admin review!');
                            setProfiles((prev) =>
                              prev.map((p) =>
                                p.id === activeProfile.id ? { ...p, status: 'review_pending' } : p
                              )
                            );
                            setTimeout(() => setPublicationStatusMsg(null), 4000);
                          } catch (e: unknown) {
                            alert(e instanceof Error ? e.message : 'Error submitting request');
                          } finally {
                            setIsRequestingPublication(false);
                          }
                        }}
                        className="text-xs h-8 font-bold bg-gold text-neutral-950 hover:bg-gold-light gap-1.5 shrink-0 shadow-sm"
                      >
                        {isRequestingPublication ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
                        <span>Submit for Publication</span>
                      </Button>
                    )}
                  </div>
                </div>

                {publicationStatusMsg && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{publicationStatusMsg}</span>
                  </div>
                )}
              </CardHeader>
            </Card>
          ) : (
            <Card className="border-border/80 bg-card/60 text-center py-12 relative overflow-hidden">
              <CardContent className="space-y-4 max-w-lg mx-auto">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-xl text-foreground">
                  Build Your Digital Identity
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create your first customizable digital profile with executive themes, multiple business cards, and instant vCard downloads.
                </p>
                <div className="pt-2">
                  <Link href="/builder/new">
                    <Button variant="gold" size="lg" className="gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Start Profile Builder</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Leads or Quick Action Shortcuts */}
          {leads.length > 0 ? (
            <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Recent Leads
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Latest contacts captured from your profile and card taps.
                  </CardDescription>
                </div>
                <Link href="/leads">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:text-primary/90">
                    <span>View All ({leads.length})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/40">
                  {leads.slice(0, 4).map((lead) => (
                    <div key={lead.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{lead.name}</span>
                        {lead.company && (
                          <span className="text-muted-foreground ml-2">({lead.company})</span>
                        )}
                        {lead.email && (
                          <span className="text-muted-foreground ml-2 font-mono text-[11px]">
                            {lead.email}
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground text-[11px]">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-border/80 bg-card/60 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Explore Templates</div>
                    <div className="text-xs text-muted-foreground">Select and switch themes at any time</div>
                  </div>
                </div>
                <Link href="/templates">
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    Browse
                  </Button>
                </Link>
              </Card>
              <Card className="border-border/80 bg-card/60 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Physical NFC Cards</div>
                    <div className="text-xs text-muted-foreground">Link existing card or order new hardware</div>
                  </div>
                </div>
                <Link href="/cards">
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    Manage
                  </Button>
                </Link>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Interactive Template Preview Modal with Customer Data */}
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

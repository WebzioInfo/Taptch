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
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/60">
        <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
          {displayName}
        </h1>

        <div className="flex items-center gap-2">
          <Link href="/builder/new">
            <Button variant="gold" size="sm" className="h-8 text-xs font-semibold gap-1.5 px-3">
              <Plus className="h-3.5 w-3.5" />
              <span>Create</span>
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* KPI Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-border/60 bg-card/40 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Profiles</span>
                <Eye className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">{profiles.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {profiles.filter((p) => p.status === 'published').length} live
              </div>
            </Card>

            <Card className="border-border/60 bg-card/40 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Cards</span>
                <CreditCard className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">{cards.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {cards.filter((c) => c.status === 'active').length} active
              </div>
            </Card>

            <Card className="border-border/60 bg-card/40 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Leads</span>
                <Users className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">{leads.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Contacts captured
              </div>
            </Card>
          </div>

          {/* Active Profile Spotlight */}
          {activeProfile ? (
            <Card className="border-border/70 bg-card/40 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0">
                    {activeProfile.displayName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-foreground truncate">
                        {activeProfile.displayName}
                      </span>
                      <Badge
                        variant={activeProfile.status === 'published' ? 'gold' : 'secondary'}
                        className="text-[10px] px-1.5 py-0 h-4 capitalize"
                      >
                        {activeProfile.status === 'published' ? 'Live' : activeProfile.status === 'review_pending' ? 'Pending' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      /p/{activeProfile.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(activeProfile.slug)}
                    className="h-7 text-xs px-2.5 gap-1"
                  >
                    {copiedSlug === activeProfile.slug ? (
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Share2 className="h-3 w-3" />
                    )}
                    <span>{copiedSlug === activeProfile.slug ? 'Copied' : 'Share'}</span>
                  </Button>
                  <Link href={`/p/${activeProfile.slug}`} target="_blank">
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 gap-1">
                      <ExternalLink className="h-3 w-3" />
                      <span>View</span>
                    </Button>
                  </Link>
                  <Link href={`/builder/${activeProfile.id}`}>
                    <Button variant="gold" size="sm" className="h-7 text-xs px-2.5 gap-1 font-semibold">
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Template & Status Strip */}
              <div className="pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/40">
                  <div className="flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Template:</span>
                    <span className="font-medium text-foreground capitalize">
                      {activeProfile.templateId.replace(/-/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPreviewOpen(true)}
                      className="h-6 text-[11px] px-2 text-primary"
                    >
                      Preview
                    </Button>
                    <Link href="/templates">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                      >
                        Change
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/40">
                  <div className="flex items-center gap-2">
                    {activeProfile.status === 'published' ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    ) : activeProfile.status === 'review_pending' ? (
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                    ) : (
                      <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                    )}
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium text-foreground capitalize">
                      {activeProfile.status === 'published'
                        ? 'Published'
                        : activeProfile.status === 'review_pending'
                        ? 'Under Review'
                        : 'Draft'}
                    </span>
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
                            throw new Error(err.error?.message || 'Failed to submit.');
                          }
                          setPublicationStatusMsg('Submitted for review');
                          setProfiles((prev) =>
                            prev.map((p) =>
                              p.id === activeProfile.id ? { ...p, status: 'review_pending' } : p
                            )
                          );
                          setTimeout(() => setPublicationStatusMsg(null), 3000);
                        } catch (e: unknown) {
                          alert(e instanceof Error ? e.message : 'Error submitting request');
                        } finally {
                          setIsRequestingPublication(false);
                        }
                      }}
                      className="h-6 text-[11px] px-2.5 font-semibold bg-gold text-neutral-950 hover:bg-gold-light gap-1"
                    >
                      {isRequestingPublication ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
                      <span>Submit</span>
                    </Button>
                  )}
                </div>
              </div>

              {publicationStatusMsg && (
                <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{publicationStatusMsg}</span>
                </div>
              )}
            </Card>
          ) : (
            <Card className="border-border/60 bg-card/40 text-center py-10">
              <CardContent className="space-y-3 max-w-sm mx-auto">
                <div className="mx-auto h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base text-foreground">No Profile Created</h3>
                <p className="text-xs text-muted-foreground">
                  Create your digital profile to get started.
                </p>
                <div className="pt-1">
                  <Link href="/builder/new">
                    <Button variant="gold" size="sm" className="h-8 text-xs font-semibold gap-1.5 px-3">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Profile</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Leads or Quick Action Shortcuts */}
          {leads.length > 0 ? (
            <Card className="border-border/60 bg-card/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Recent Leads</h3>
                <Link href="/leads">
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-primary hover:text-primary/90 gap-1 px-2">
                    <span>View all ({leads.length})</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              <div className="divide-y divide-border/40 text-xs">
                {leads.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">{lead.name}</span>
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
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="border-border/60 bg-card/40 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Palette className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-xs font-medium text-foreground">Templates</div>
                    <div className="text-[11px] text-muted-foreground">Explore designs</div>
                  </div>
                </div>
                <Link href="/templates">
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                    Browse
                  </Button>
                </Link>
              </Card>

              <Card className="border-border/60 bg-card/40 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-xs font-medium text-foreground">Cards</div>
                    <div className="text-[11px] text-muted-foreground">Manage NFC hardware</div>
                  </div>
                </div>
                <Link href="/cards">
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
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

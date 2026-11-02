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
} from 'lucide-react';

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Metric 4: Luxury Templates */}
            <Card className="border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Template Engine
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">6</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Obsidian, Ivory, Aurora & more
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
                      <span>•</span>
                      <span className="capitalize">Template: {activeProfile.templateId.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>
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

          {/* Quick Access Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Card 1: Templates */}
            <Card className="border-border/80 bg-card/60 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Palette className="h-5 w-5" />
                  <CardTitle className="text-base font-semibold">Luxury Template Showcase</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Browse modern luxury templates: Obsidian, Ivory, Aurora, Zenith, and Catalyst.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/templates">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <span>Explore Template Gallery</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Card 2: Smart Hardware */}
            <Card className="border-border/80 bg-card/60 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <CreditCard className="h-5 w-5" />
                  <CardTitle className="text-base font-semibold">NFC Smart Cards</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Link your physical cards or request custom matte PVC or laser-engraved metal hardware.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/cards">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <span>Manage NFC Cards</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Card 3: Captured Leads */}
            <Card className="border-border/80 bg-card/60 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  <CardTitle className="text-base font-semibold">Reciprocal Networking Leads</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Review and export contacts gathered through your profile contact exchange form.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/leads">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <span>View Contacts ({leads.length})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

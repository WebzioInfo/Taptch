'use client';

import * as React from 'react';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  Download,
  Mail,
  Phone,
  Calendar,
  Loader2,
} from 'lucide-react';

interface Lead {
  id: string;
  profileId: string;
  profileName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  notes: string | null;
  source: string;
  createdAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/v1/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setLeads(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredLeads = React.useMemo(() => {
    if (!search.trim()) return leads;
    const term = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        (l.email && l.email.toLowerCase().includes(term)) ||
        (l.company && l.company.toLowerCase().includes(term)) ||
        (l.jobTitle && l.jobTitle.toLowerCase().includes(term))
    );
  }, [leads, search]);

  const handleExportCsv = () => {
    if (leads.length === 0) return;
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Job Title', 'Profile', 'Notes', 'Date'];
    const rows = leads.map((l) => [
      `"${l.name}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.company || ''}"`,
      `"${l.jobTitle || ''}"`,
      `"${l.profileName || ''}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${new Date(l.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Captured Leads & Contacts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reciprocal contact exchanges from your {brandConfig.name} digital profiles and smart NFC taps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={leads.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, or email..."
            className="pl-9 h-10 bg-card/60 border-border text-xs"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Showing {filteredLeads.length} of {leads.length} contacts
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card className="border-border/60 bg-card/40 text-center py-16">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">
              {search ? 'No contacts match your query' : 'No captured contacts yet'}
            </h3>
            <p className="text-xs text-muted-foreground">
              When clients or prospects tap your NFC card and fill out the &quot;Exchange Contact&quot; form on your profile, their details appear here instantly.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-base text-foreground tracking-tight">
                    {lead.name}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {lead.profileName || 'Profile'}
                  </Badge>
                </div>
                {(lead.jobTitle || lead.company) && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                    {lead.jobTitle && <span>{lead.jobTitle}</span>}
                    {lead.jobTitle && lead.company && <span>•</span>}
                    {lead.company && <span className="font-medium text-foreground">{lead.company}</span>}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-3 space-y-2 text-xs">
                {lead.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                    <a href={`mailto:${lead.email}`} className="hover:text-foreground truncate transition-colors">
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                    <a href={`tel:${lead.phone}`} className="hover:text-foreground transition-colors">
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.notes && (
                  <div className="mt-2 p-2 rounded bg-background/50 border border-border/40 text-[11px] text-muted-foreground italic">
                    &quot;{lead.notes}&quot;
                  </div>
                )}
                <div className="pt-2 text-[10px] text-muted-foreground/80 flex items-center justify-between border-t border-border/30">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </span>
                  <span className="capitalize">{lead.source.replace('_', ' ')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

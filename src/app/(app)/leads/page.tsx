'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Leads
        </h1>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={leads.length === 0}
          className="h-8 text-xs gap-1.5 px-3"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="pl-8 h-8 bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-blue-600 text-xs"
          />
        </div>
        <div className="text-xs text-slate-500">
          {filteredLeads.length} leads
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card className="border-slate-200 bg-white text-center py-12">
          <CardContent className="space-y-3 max-w-sm mx-auto">
            <div className="mx-auto h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base text-slate-900">
              {search ? 'No Matches' : 'No Leads'}
            </h3>
            <p className="text-xs text-slate-500">
              Contacts exchanged through cards and profiles will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="border-slate-200/70 bg-white p-4 space-y-3 hover:border-blue-600/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-slate-900 truncate">
                  {lead.name}
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {lead.profileName || 'Profile'}
                </Badge>
              </div>

              {(lead.jobTitle || lead.company) && (
                <div className="text-xs text-slate-500 truncate">
                  {[lead.jobTitle, lead.company].filter(Boolean).join(' • ')}
                </div>
              )}

              <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
                {lead.email && (
                  <div className="flex items-center gap-2 text-slate-500 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-500 text-[11px] pt-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { CopyButton } from '@/components/ui/copy-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { toast } from '@/components/ui/use-toast';
import {
  Users,
  Download,
  Mail,
  Phone,
  Calendar,
  Building2,
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

const PAGE_SIZE = 9;

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    fetch('/api/v1/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setLeads(data.data);
        }
      })
      .catch(() => {
        toast.error('Unable to fetch leads. Please check your connection.');
      })
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

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE) || 1;
  const paginatedLeads = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLeads.slice(start, start + PAGE_SIZE);
  }, [filteredLeads, currentPage]);

  const handleExportCsv = () => {
    if (leads.length === 0) return;
    setExporting(true);

    try {
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

      const csvContent =
        'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `taptch-leads-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${leads.length} leads to CSV`);
    } catch {
      toast.error('Failed to export leads');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Contacts & Leads
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Exchange contacts effortlessly via your smart NFC cards and profiles
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={leads.length === 0 || exporting}
          className="h-8 text-xs gap-1.5 px-3"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
        </Button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, company..."
          className="w-full sm:max-w-xs"
        />

        <div className="text-xs text-slate-500">
          Showing <strong className="font-semibold text-slate-800">{filteredLeads.length}</strong> of{' '}
          <strong className="font-semibold text-slate-800">{leads.length}</strong> total leads
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3 bg-white border-slate-200">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-44" />
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-28" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No matching contacts' : 'No leads captured yet'}
          description={
            search
              ? `No contacts match "${search}". Try searching by another keyword.`
              : 'Contacts exchanged via your digital profiles and NFC cards will automatically appear here.'
          }
          actionLabel={search ? 'Clear search' : undefined}
          onAction={search ? () => setSearch('') : undefined}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedLeads.map((lead) => (
              <Card
                key={lead.id}
                className="border-slate-200/80 bg-white p-4 space-y-3 hover:border-blue-500/50 hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm text-slate-900 truncate">
                    {lead.name}
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 bg-slate-50 text-slate-600">
                    {lead.profileName || 'Default'}
                  </Badge>
                </div>

                {(lead.jobTitle || lead.company) && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {[lead.jobTitle, lead.company].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  {lead.email && (
                    <div className="flex items-center justify-between gap-2 text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      <CopyButton
                        value={lead.email}
                        label="Copy"
                        successLabel="Copied"
                        toastMessage="Email copied"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-[11px]"
                      />
                    </div>
                  )}

                  {lead.phone && (
                    <div className="flex items-center justify-between gap-2 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>{lead.phone}</span>
                      </div>
                      <CopyButton
                        value={lead.phone}
                        label="Copy"
                        successLabel="Copied"
                        toastMessage="Phone number copied"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-[11px]"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pt-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>Connected on {new Date(lead.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredLeads.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
    </div>
  );
}

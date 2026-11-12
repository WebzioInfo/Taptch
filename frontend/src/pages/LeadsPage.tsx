import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import {
  Users,
  Mail,
  Phone,
  Building,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  X,
  ExternalLink,
  Save,
  Trash2,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface LeadItem {
  id: string;
  profileId: string;
  profileSlug?: string;
  profileName?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  subject?: string | null;
  message?: string | null;
  notes?: string | null;
  source?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST' | 'ARCHIVED';
  createdAt: string;
  updatedAt?: string;
}

export function LeadsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string>('NEW');

  // Fetch leads
  const { data: leads = [], isLoading } = useQuery<LeadItem[]>({
    queryKey: ['leads', statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      return ApiClient.get<LeadItem[]>(`/api/v1/leads?${params.toString()}`);
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['leads', 'stats'],
    queryFn: () => ApiClient.get<any>('/api/v1/leads/stats'),
  });

  // Status & notes update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status?: string; notes?: string }) =>
      ApiClient.patch<LeadItem>(`/api/v1/leads/${id}`, { status, notes }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      if (selectedLead && selectedLead.id === updated.id) {
        setSelectedLead({ ...selectedLead, ...updated });
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/api/v1/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLead(null);
    },
  });

  const handleOpenDetail = (lead: LeadItem) => {
    setSelectedLead(lead);
    setEditingNotes(lead.notes || '');
    setUpdatingStatus(lead.status || 'NEW');
  };

  const handleSaveDetail = () => {
    if (!selectedLead) return;
    updateMutation.mutate({
      id: selectedLead.id,
      status: updatingStatus,
      notes: editingNotes,
    });
  };

  const handleExportCsv = () => {
    if (leads.length === 0) return;
    const headers = ['Full Name', 'Email', 'Phone', 'Company', 'Job Title', 'Subject', 'Message', 'Status', 'Date', 'Internal Notes'];
    const rows = leads.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.jobTitle || '').replace(/"/g, '""')}"`,
      `"${(l.subject || '').replace(/"/g, '""')}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${new Date(l.createdAt).toISOString()}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `taptch-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusBadge = (st: string) => {
    switch (st) {
      case 'NEW':
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">NEW</Badge>;
      case 'CONTACTED':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">CONTACTED</Badge>;
      case 'QUALIFIED':
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">QUALIFIED</Badge>;
      case 'CONVERTED':
        return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">CONVERTED</Badge>;
      case 'LOST':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px]">LOST</Badge>;
      default:
        return <Badge className="bg-neutral-800 text-neutral-400 text-[10px]">{st}</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Lead Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Capture, qualify, and convert contacts generated from your digital profiles and NFC cards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={leads.length === 0}
            className="text-xs border-border/60 gap-1.5 h-9"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-border/40 bg-[#121216] p-3.5 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase">Total Leads</p>
          <p className="text-xl font-bold text-white font-mono">{stats?.total || leads.length}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-[#121216] p-3.5 space-y-1">
          <p className="text-[11px] font-semibold text-amber-400 uppercase">New Leads</p>
          <p className="text-xl font-bold text-amber-300 font-mono">{stats?.new || 0}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-[#121216] p-3.5 space-y-1">
          <p className="text-[11px] font-semibold text-blue-400 uppercase">Contacted</p>
          <p className="text-xl font-bold text-blue-300 font-mono">{stats?.contacted || 0}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-[#121216] p-3.5 space-y-1">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase">Qualified</p>
          <p className="text-xl font-bold text-emerald-300 font-mono">{stats?.qualified || 0}</p>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-[#121216] p-3.5 space-y-1">
          <p className="text-[11px] font-semibold text-purple-400 uppercase">Converted</p>
          <p className="text-xl font-bold text-purple-300 font-mono">{stats?.converted || 0}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-[#121216] p-3.5 space-y-1">
          <p className="text-[11px] font-semibold text-red-400 uppercase">Lost</p>
          <p className="text-xl font-bold text-red-300 font-mono">{stats?.lost || 0}</p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, company, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-[#121216] border-border/60"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-primary text-black'
                  : 'bg-[#18181D] text-muted-foreground hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-xl border border-border/60 bg-[#121216] overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Leads Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              {search || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'When visitors fill out your contact form or exchange details, leads will populate here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181D] text-muted-foreground border-b border-border/40 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Name &amp; Organization</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Subject &amp; Message</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {leads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => handleOpenDetail(l)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white text-sm">{l.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        {l.company && <span>{l.company}</span>}
                        {l.jobTitle && <span>({l.jobTitle})</span>}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      {l.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate max-w-[160px]">{l.email}</span>
                        </div>
                      )}
                      {l.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{l.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {l.subject && <p className="font-semibold text-slate-200 truncate">{l.subject}</p>}
                      <p className="text-muted-foreground line-clamp-1 text-[11px]">{l.message || '—'}</p>
                    </td>

                    <td className="py-3.5 px-4">{statusBadge(l.status)}</td>

                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(l.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDetail(l)}
                        className="text-xs h-8 text-primary hover:text-white"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Lead Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-border/60 bg-[#121216] p-6 text-white space-y-6 relative shadow-2xl my-8">
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 pr-8">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{selectedLead.name}</h3>
                  {statusBadge(updatingStatus)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedLead.company || 'Individual Professional'}
                  {selectedLead.jobTitle ? ` • ${selectedLead.jobTitle}` : ''}
                </p>
              </div>
            </div>

            {/* Quick Contact Action Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-b border-border/40 py-3">
              {selectedLead.email && (
                <a
                  href={`mailto:${selectedLead.email}?subject=Re:%20${encodeURIComponent(selectedLead.subject || 'Your enquiry')}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Lead</span>
                </a>
              )}
              {selectedLead.phone && (
                <>
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Phone</span>
                  </a>
                </>
              )}
            </div>

            {/* Complete Submitted Content */}
            <div className="space-y-3 bg-[#18181D] p-4 rounded-xl border border-border/40 text-xs">
              {selectedLead.subject && (
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Subject</span>
                  <p className="text-slate-100 font-bold mt-0.5">{selectedLead.subject}</p>
                </div>
              )}
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Submitted Message</span>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed mt-0.5">
                  {selectedLead.message || 'No additional message provided.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30 text-[11px] text-muted-foreground">
                <div>Source: <span className="text-slate-200 capitalize">{selectedLead.source}</span></div>
                <div>Submitted: <span className="text-slate-200">{new Date(selectedLead.createdAt).toLocaleString()}</span></div>
              </div>
            </div>

            {/* Lead Status & Internal Notes */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Update Lead Pipeline Status
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST', 'ARCHIVED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setUpdatingStatus(st)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        updatingStatus === st
                          ? 'bg-primary text-black border-primary shadow-md'
                          : 'bg-[#18181D] text-muted-foreground border-border/40 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Internal Notes &amp; Follow-up Details
                </label>
                <Textarea
                  placeholder="Record call notes, proposal sent date, next meeting action items..."
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  rows={3}
                  className="text-xs bg-[#18181D] border-border/60 resize-none"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this lead?')) {
                    deleteMutation.mutate(selectedLead.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="text-xs h-9 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Lead</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedLead(null)}
                  className="text-xs h-9 border-border/60"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="gold"
                  onClick={handleSaveDetail}
                  disabled={updateMutation.isPending}
                  className="text-xs h-9 gap-1.5 font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Headphones, Plus, MessageSquare, Send, X, AlertCircle } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { AdminPageHeader } from '../../components/common/AdminPageHeader';
import { DataTable, type ColumnDef } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';

interface TicketRow {
  id: string;
  ticketNumber: string;
  userId: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userEmail: string | null;
}

interface TicketsResponse {
  items: TicketRow[];
  total: number;
  page: number;
  pageSize: number;
}

interface TicketDetailResponse {
  ticket: TicketRow;
  messages: Array<{
    id: string;
    senderId: string | null;
    senderRole: string;
    senderName: string | null;
    message: string;
    createdAt: string;
  }>;
}

export function AdminTicketsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [initialMessage, setInitialMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery<TicketsResponse>({
    queryKey: ['admin-tickets', q, statusFilter, priorityFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      params.set('page', String(page));
      params.set('pageSize', '20');
      return ApiClient.get<TicketsResponse>(`/api/v1/admin/tickets?${params.toString()}`);
    },
  });

  const detailQuery = useQuery<TicketDetailResponse>({
    queryKey: ['admin-ticket-detail', selectedTicketId],
    queryFn: () => ApiClient.get<TicketDetailResponse>(`/api/v1/admin/tickets/${selectedTicketId}`),
    enabled: Boolean(selectedTicketId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      ApiClient.post('/api/v1/admin/tickets', {
        subject: subject.trim(),
        category,
        priority,
        message: initialMessage.trim(),
      }),
    onSuccess: () => {
      setErrorMsg(null);
      setCreateOpen(false);
      setSubject('');
      setInitialMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: (err: Error) => setErrorMsg(err.message || 'Failed to create ticket.'),
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      ApiClient.post(`/api/v1/admin/tickets/${selectedTicketId}/reply`, {
        message: replyText.trim(),
      }),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-detail', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: (err: Error) => setErrorMsg(err.message || 'Failed to send reply.'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ApiClient.patch(`/api/v1/admin/tickets/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-detail', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: (err: Error) => setErrorMsg(err.message || 'Failed to update ticket status.'),
  });

  const columns: ColumnDef<TicketRow>[] = [
    {
      key: 'ticketNumber',
      header: 'Ticket',
      render: (t) => (
        <div>
          <div className="font-mono font-semibold text-[var(--ink)]">{t.ticketNumber}</div>
          <div className="text-[11px] text-[var(--ink-muted)] truncate max-w-[240px]">
            {t.subject}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (t) => (
        <div>
          <div className="font-medium text-[var(--ink)]">{t.userName || 'Customer'}</div>
          <div className="text-[11px] text-[var(--ink-muted)]">{t.userEmail || '—'}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => (
        <StatusBadge
          status={t.priority === 'urgent' || t.priority === 'high' ? 'failed' : t.priority === 'medium' ? 'pending' : 'inactive'}
          label={t.priority.toUpperCase()}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: (t) => (
        <span className="text-[var(--ink-muted)]">
          {new Date(t.updatedAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },
  ];

  return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        <AdminPageHeader
          title="Support Tickets"
          subtitle="Track customer inquiries, reply to threads, and update ticket resolution status"
          action={
            <Button variant="accent" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Ticket
            </Button>
          }
        />

        {errorMsg && (
          <div className="p-3 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isError && (
          <div className="p-4 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)]">
            {(error as Error)?.message || 'Failed to load support tickets.'}
          </div>
        )}

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          keyExtractor={(t) => t.id}
          searchValue={q}
          onSearchChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          searchPlaceholder="Search ticket number, subject, or customer..."
          filters={[
            {
              key: 'status',
              value: statusFilter,
              onChange: (v) => {
                setStatusFilter(v);
                setPage(1);
              },
              options: [
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Open', value: 'open' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Resolved', value: 'resolved' },
                { label: 'Closed', value: 'closed' },
              ],
            },
            {
              key: 'priority',
              value: priorityFilter,
              onChange: (v) => {
                setPriorityFilter(v);
                setPage(1);
              },
              options: [
                { label: 'All Priorities', value: 'ALL' },
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' },
                { label: 'Urgent', value: 'urgent' },
              ],
            },
          ]}
          page={page}
          pageSize={data?.pageSize ?? 20}
          total={data?.total ?? 0}
          onPageChange={setPage}
          emptyIcon={<Headphones className="w-7 h-7" />}
          emptyTitle="No support tickets found"
          emptyDescription="There are no open or matching support tickets right now."
          emptyAction={
            <Button variant="accent" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create first ticket
            </Button>
          }
          rowActions={(t) => (
            <Button variant="secondary" size="sm" onClick={() => setSelectedTicketId(t.id)}>
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              Open
            </Button>
          )}
        />

        {/* Ticket Thread Modal */}
        {selectedTicketId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)]">
                    {detailQuery.data?.ticket.ticketNumber || 'Support Ticket'}
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {detailQuery.data?.ticket.subject}
                  </p>
                </div>
                <button type="button" onClick={() => setSelectedTicketId(null)}>
                  <X className="w-4 h-4 text-[var(--ink-muted)]" />
                </button>
              </div>

              {detailQuery.isLoading || !detailQuery.data ? (
                <div className="p-8 text-center text-xs text-[var(--ink-muted)]">Loading thread...</div>
              ) : (
                <>
                  <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-raised)] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={detailQuery.data.ticket.status} />
                      <span className="text-[var(--ink-muted)]">
                        {detailQuery.data.ticket.userName || detailQuery.data.ticket.userEmail}
                      </span>
                    </div>
                    <select
                      value={detailQuery.data.ticket.status}
                      onChange={(e) =>
                        statusMutation.mutate({
                          id: detailQuery.data.ticket.id,
                          status: e.target.value,
                        })
                      }
                      className="px-2.5 py-1 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px] text-xs"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {detailQuery.data.messages.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-raised)] space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
                          <span className="font-semibold text-[var(--ink)]">
                            {m.senderName || m.senderRole}
                          </span>
                          <span>{new Date(m.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-[var(--ink)] whitespace-pre-wrap">{m.message}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-[var(--border)] flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                    />
                    <Button
                      variant="accent"
                      size="sm"
                      disabled={replyMutation.isPending || !replyText.trim()}
                      onClick={() => replyMutation.mutate()}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      Reply
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Create Ticket Modal */}
        {createOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--ink)]">Create Support Ticket</h3>
                <button type="button" onClick={() => setCreateOpen(false)}>
                  <X className="w-4 h-4 text-[var(--ink-muted)]" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[var(--ink)] mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue"
                    className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-[var(--ink)] mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                    >
                      <option value="general">General</option>
                      <option value="order">Order</option>
                      <option value="card">Card</option>
                      <option value="billing">Billing</option>
                      <option value="profile">Profile</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[var(--ink)] mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-[var(--ink)] mb-1">Message</label>
                  <textarea
                    rows={3}
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="Describe the issue..."
                    className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  disabled={createMutation.isPending || !subject.trim() || !initialMessage.trim()}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutTemplate, RefreshCw, AlertCircle } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { AdminPageHeader } from '../../components/common/AdminPageHeader';
import { DataTable, type ColumnDef } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';

interface TemplateRow {
  id: string;
  name: string;
  category: string;
  style: string;
  previewUrl: string;
  isGlobal: boolean;
  createdAt: string;
}

interface TemplatesResponse {
  items: TemplateRow[];
  total: number;
  page: number;
  pageSize: number;
}

export function AdminTemplatesPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery<TemplatesResponse>({
    queryKey: ['admin-templates', q, category, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (category !== 'ALL') params.set('category', category);
      params.set('page', String(page));
      params.set('pageSize', '20');
      return ApiClient.get<TemplatesResponse>(`/api/v1/admin/templates?${params.toString()}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isGlobal }: { id: string; isGlobal: boolean }) =>
      ApiClient.patch(`/api/v1/admin/templates/${id}`, { isGlobal }),
    onSuccess: () => {
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
    },
    onError: (err: Error) => setErrorMsg(err.message || 'Failed to update template.'),
  });

  const columns: ColumnDef<TemplateRow>[] = [
    {
      key: 'name',
      header: 'Template',
      render: (t) => (
        <div className="flex items-center gap-3">
          {t.previewUrl ? (
            <img
              src={t.previewUrl}
              alt={t.name}
              className="w-12 h-8 object-cover rounded border border-[var(--border)] bg-[var(--bg-raised)] shrink-0"
            />
          ) : (
            <div className="w-12 h-8 rounded border border-[var(--border)] bg-[var(--bg-raised)] flex items-center justify-center shrink-0">
              <LayoutTemplate className="w-4 h-4 text-[var(--ink-subtle)]" />
            </div>
          )}
          <div>
            <div className="font-semibold text-[var(--ink)]">{t.name}</div>
            <div className="text-[11px] text-[var(--ink-muted)]">{t.style}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (t) => <span className="text-[var(--ink-muted)]">{t.category}</span>,
    },
    {
      key: 'isGlobal',
      header: 'Availability',
      render: (t) => (
        <StatusBadge
          status={t.isGlobal ? 'active' : 'inactive'}
          label={t.isGlobal ? 'Active (Global)' : 'Inactive'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (t) => (
        <span className="text-[var(--ink-muted)]">
          {new Date(t.createdAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },
  ];

  return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        <AdminPageHeader
          title="Templates"
          subtitle="Manage card design templates and global studio availability"
          action={
            <Button variant="accent" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
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
            {(error as Error)?.message || 'Failed to load templates.'}
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
          searchPlaceholder="Search template name or style..."
          filters={[
            {
              key: 'category',
              value: category,
              onChange: (v) => {
                setCategory(v);
                setPage(1);
              },
              options: [
                { label: 'All Categories', value: 'ALL' },
                { label: 'Corporate', value: 'Corporate' },
                { label: 'Luxury', value: 'Luxury' },
                { label: 'Minimal', value: 'Minimal' },
                { label: 'Creative', value: 'Creative' },
              ],
            },
          ]}
          page={page}
          pageSize={data?.pageSize ?? 20}
          total={data?.total ?? 0}
          onPageChange={setPage}
          emptyIcon={<LayoutTemplate className="w-7 h-7" />}
          emptyTitle="No templates found"
          emptyDescription="No card design templates match your current filter."
          rowActions={(t) => (
            <Button
              variant="secondary"
              size="sm"
              disabled={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate({ id: t.id, isGlobal: !t.isGlobal })}
            >
              {t.isGlobal ? 'Disable' : 'Enable'}
            </Button>
          )}
        />
      </div>
      );
}

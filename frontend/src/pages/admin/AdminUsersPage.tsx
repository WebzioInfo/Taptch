import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, UserX, UserCheck, Shield, X, Users, AlertCircle } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { useSession } from '../../lib/auth/client';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { AdminPageHeader } from '../../components/common/AdminPageHeader';
import { DataTable, type ColumnDef } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  systemRole: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

interface UsersResponse {
  items: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

interface UserDetailsResponse {
  user: AdminUserRow & { updatedAt: string };
  profiles: Array<{
    id: string;
    slug: string;
    displayName: string;
    profileType: string;
    status: string;
    createdAt: string;
  }>;
  activityLogs: Array<{
    id: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    createdAt: string;
  }>;
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { can } = useAdminPermissions();
  const canSuspend = can('users.suspend');
  const isSuperAdmin = session?.user?.systemRole === 'super_admin';

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    user: AdminUserRow;
    nextStatus: 'active' | 'suspended';
  } | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUserRow | null>(null);
  const [nextRole, setNextRole] = useState('user');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery<UsersResponse>({
    queryKey: ['admin-users', q, statusFilter, roleFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      params.set('page', String(page));
      params.set('pageSize', '20');
      return ApiClient.get<UsersResponse>(`/api/v1/admin/users?${params.toString()}`);
    },
  });

  const { data: detailData, isLoading: detailLoading } = useQuery<UserDetailsResponse>({
    queryKey: ['admin-user-detail', selectedUserId],
    queryFn: () => ApiClient.get<UserDetailsResponse>(`/api/v1/admin/users/${selectedUserId}`),
    enabled: Boolean(selectedUserId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'suspended' }) =>
      ApiClient.patch(`/api/v1/admin/users/${userId}/status`, { status }),
    onSuccess: () => {
      setActionError(null);
      setConfirmTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (err: Error) => setActionError(err.message || 'Failed to update user status.'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      ApiClient.patch(`/api/v1/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      setActionError(null);
      setRoleTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] });
    },
    onError: (err: Error) => setActionError(err.message || 'Failed to change user role.'),
  });

  const columns: ColumnDef<AdminUserRow>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div>
          <div className="font-semibold text-[var(--ink)]">{u.name}</div>
          <div className="text-[11px] text-[var(--ink-muted)]">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'systemRole',
      header: 'Role',
      render: (u) => (
        <span className="inline-flex px-2 py-0.5 rounded-md bg-[var(--bg-raised)] border border-[var(--border)] text-[11px] font-medium text-[var(--ink)]">
          {u.systemRole}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <StatusBadge
          status={u.status === 'suspended' ? 'blocked' : u.status}
          label={u.status === 'suspended' ? 'Blocked' : u.status === 'active' ? 'Active' : u.status}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (u) => (
        <span className="text-[var(--ink-muted)]">
          {new Date(u.createdAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },
  ];

  return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        <AdminPageHeader
          title="Users"
          subtitle="Search accounts, inspect profiles, block or unblock users, and manage roles"
          action={
            <Button variant="accent" size="sm" onClick={() => refetch()}>
              Refresh Users
            </Button>
          }
        />

        {actionError && (
          <div className="p-3 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button type="button" onClick={() => setActionError(null)} className="font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {isError && (
          <div className="p-4 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)]">
            {(error as Error)?.message || 'Failed to load users.'}
          </div>
        )}

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          keyExtractor={(u) => u.id}
          searchValue={q}
          onSearchChange={(val) => {
            setQ(val);
            setPage(1);
          }}
          searchPlaceholder="Search by name, email, or phone..."
          filters={[
            {
              key: 'status',
              label: 'Filter by status',
              value: statusFilter,
              onChange: (v) => {
                setStatusFilter(v);
                setPage(1);
              },
              options: [
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Active', value: 'active' },
                { label: 'Blocked', value: 'suspended' },
                { label: 'Inactive', value: 'deactivated' },
              ],
            },
            {
              key: 'role',
              label: 'Filter by role',
              value: roleFilter,
              onChange: (v) => {
                setRoleFilter(v);
                setPage(1);
              },
              options: [
                { label: 'All Roles', value: 'ALL' },
                { label: 'User', value: 'user' },
                { label: 'Support Admin', value: 'support_admin' },
                { label: 'Admin', value: 'admin' },
                { label: 'Super Admin', value: 'super_admin' },
              ],
            },
          ]}
          page={page}
          pageSize={data?.pageSize ?? 20}
          total={data?.total ?? 0}
          onPageChange={setPage}
          emptyIcon={<Users className="w-7 h-7" />}
          emptyTitle="No users found"
          emptyDescription="Try adjusting your search query or status filters."
          rowActions={(u) => (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedUserId(u.id)}
                title="View user details"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                View
              </Button>
              {canSuspend && (
                u.status === 'active' ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmTarget({ user: u, nextStatus: 'suspended' })}
                  >
                    <UserX className="w-3.5 h-3.5 mr-1" />
                    Block
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmTarget({ user: u, nextStatus: 'active' })}
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    Unblock
                  </Button>
                )
              )}
              {isSuperAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setRoleTarget(u);
                    setNextRole(u.systemRole);
                  }}
                >
                  <Shield className="w-3.5 h-3.5 mr-1" />
                  Role
                </Button>
              )}
            </>
          )}
        />

        {/* User Detail Modal */}
        {selectedUserId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--ink)]">User Account Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedUserId(null)}
                  className="p-1 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                {detailLoading || !detailData ? (
                  <div className="py-8 text-center text-[var(--ink-muted)]">Loading details...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[10px] bg-[var(--bg-raised)] border border-[var(--border)]">
                      <div>
                        <div className="text-[var(--ink-muted)]">Name</div>
                        <div className="font-semibold text-[var(--ink)] mt-0.5">{detailData.user.name}</div>
                      </div>
                      <div>
                        <div className="text-[var(--ink-muted)]">Email</div>
                        <div className="font-semibold text-[var(--ink)] mt-0.5">{detailData.user.email}</div>
                      </div>
                      <div>
                        <div className="text-[var(--ink-muted)]">System Role</div>
                        <div className="font-semibold text-[var(--ink)] mt-0.5">{detailData.user.systemRole}</div>
                      </div>
                      <div>
                        <div className="text-[var(--ink-muted)]">Status</div>
                        <div className="mt-0.5">
                          <StatusBadge status={detailData.user.status === 'suspended' ? 'blocked' : detailData.user.status} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--ink)] mb-2">
                        Profiles ({detailData.profiles.length})
                      </h4>
                      {detailData.profiles.length === 0 ? (
                        <p className="text-[var(--ink-muted)]">No digital profiles created.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {detailData.profiles.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)]"
                            >
                              <div>
                                <span className="font-medium text-[var(--ink)]">{p.displayName}</span>
                                <span className="text-[var(--ink-muted)] ml-2">/{p.slug}</span>
                              </div>
                              <StatusBadge status={p.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Block / Unblock Confirm Modal */}
        {confirmTarget && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-[var(--ink)]">
                {confirmTarget.nextStatus === 'suspended' ? 'Block User Account?' : 'Unblock User Account?'}
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                Are you sure you want to set <strong>{confirmTarget.user.email}</strong> to{' '}
                <strong>{confirmTarget.nextStatus === 'suspended' ? 'blocked' : 'active'}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setConfirmTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant={confirmTarget.nextStatus === 'suspended' ? 'destructive' : 'accent'}
                  size="sm"
                  disabled={statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate({
                      userId: confirmTarget.user.id,
                      status: confirmTarget.nextStatus,
                    })
                  }
                >
                  {statusMutation.isPending ? 'Saving...' : 'Confirm'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Change Role Modal (super_admin only) */}
        {roleTarget && isSuperAdmin && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-[var(--ink)]">Change User Role</h3>
              <p className="text-xs text-[var(--ink-muted)]">
                Assign system role for <strong>{roleTarget.email}</strong>
              </p>
              <select
                value={nextRole}
                onChange={(e) => setNextRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
              >
                <option value="user">user</option>
                <option value="support_admin">support_admin</option>
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setRoleTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  disabled={roleMutation.isPending}
                  onClick={() => roleMutation.mutate({ userId: roleTarget.id, role: nextRole })}
                >
                  {roleMutation.isPending ? 'Updating...' : 'Save Role'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      );
}

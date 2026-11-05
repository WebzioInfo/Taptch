'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PortalXHeader } from '@/components/admin/PortalXHeader';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Ban,
  TrendingUp,
  Loader2,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: string | null;
  phoneNumber: string | null;
  createdAt: string;
}

export default function PortalXStaffManagementPage() {
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'suspended'>('all');

  // Modal State
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [role, setRole] = React.useState<'sales_staff' | 'admin'>('sales_staff');
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = React.useState<{ email: string; tempPass: string } | null>(null);

  // Status Action state
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const fetchStaff = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setStaff(data.data);
      }
    } catch {
      // Squelch fetch error
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          role,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to provision staff member.');
      }

      setShowAddModal(false);
      if (result.data?.temporaryPassword) {
        setCreatedCredentials({
          email: result.data.email,
          tempPass: result.data.temporaryPassword,
        });
      }
      setName('');
      setEmail('');
      setPassword('');
      setPhoneNumber('');
      setRole('sales_staff');
      fetchStaff();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error adding staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: StaffMember) => {
    const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
    setTogglingId(member.id);

    try {
      const res = await fetch(`/api/admin/staff/${member.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to update status');
      }

      setStaff((prev) =>
        prev.map((s) => (s.id === member.id ? { ...s, status: newStatus } : s))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating staff status');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.phoneNumber && s.phoneNumber.includes(search));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.status === 'active') ||
      (statusFilter === 'suspended' && s.status === 'suspended');
    return matchesSearch && matchesStatus;
  });

  const totalStaffCount = staff.length;
  const salesStaffCount = staff.filter((s) => s.role === 'sales_staff').length;
  const adminCount = staff.filter((s) => s.role === 'admin').length;
  const activeCount = staff.filter((s) => s.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-foreground p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <PortalXHeader
        title="Field Staff RBAC & Provisioning"
        subtitle="Manage field sales reps, administrators, operational permissions, and status controls"
        actions={
          <Button
            variant="gold"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="text-xs font-bold gap-1.5 h-9"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </Button>
        }
      />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121216] border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Staff</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalStaffCount}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Provisioned accounts</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121216] border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Field Agents</span>
            <Briefcase className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{salesStaffCount}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Sales & activation staff</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121216] border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Admins</span>
            <Shield className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{adminCount}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Portal-X operators</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121216] border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{activeCount}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Authorized for field scan</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121216]/60 p-3 rounded-xl border border-neutral-800/60">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#18181D] border-neutral-800 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'suspended'
                ? 'bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            Suspended
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="border border-neutral-800/80 rounded-xl overflow-hidden bg-[#121216]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-neutral-500 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs font-medium">Loading staff accounts...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="h-10 w-10 text-neutral-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No staff accounts found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {search
                ? 'No staff member matched your search query. Try another keyword or clear filters.'
                : 'No field sales agents or admin users provisioned yet. Add your first staff member to enable field activation.'}
            </p>
            {!search && (
              <Button
                variant="gold"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-xs font-bold"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Add Staff Member
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#18181D] text-neutral-400 font-mono text-[11px] uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="px-5 py-3">Staff Member</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-900/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{member.name}</div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-neutral-500" />
                        {member.email}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {member.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          <Briefcase className="h-3 w-3" />
                          Sales Staff
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {member.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <Ban className="h-3 w-3" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-400 font-mono text-[11px]">
                      {member.phoneNumber ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-neutral-500" />
                          {member.phoneNumber}
                        </span>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-400 text-[11px]">
                      {new Date(member.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Link
                        href={`/portal-x/staff/${member.id}/analytics`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-700 transition-colors text-[11px] font-medium"
                      >
                        <TrendingUp className="h-3 w-3 text-primary" />
                        <span>Audit & Analytics</span>
                      </Link>

                      <Button
                        size="sm"
                        variant={member.status === 'suspended' ? 'outline' : 'ghost'}
                        onClick={() => handleToggleStatus(member)}
                        disabled={togglingId === member.id}
                        className={`text-[11px] h-7 px-2.5 ${
                          member.status === 'suspended'
                            ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                            : 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
                        }`}
                      >
                        {togglingId === member.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : member.status === 'suspended' ? (
                          'Activate'
                        ) : (
                          'Suspend'
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121216] border border-neutral-800 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-white">Provision Field Staff</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-300">Full Name *</Label>
                <Input
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#18181D] border-neutral-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-300">Email Address *</Label>
                <Input
                  required
                  type="email"
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#18181D] border-neutral-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-300">Temporary Password (Optional)</Label>
                <Input
                  type="password"
                  placeholder="Leave empty to auto-generate"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#18181D] border-neutral-800 text-xs"
                />
                <p className="text-[10px] text-neutral-500">
                  Minimum 6 characters. If empty, a secure password will be generated automatically.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-300">Phone Number (Optional)</Label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-[#18181D] border-neutral-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-300">Role & Access Tier</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'sales_staff' | 'admin')}
                  className="w-full h-9 rounded-md bg-[#18181D] border border-neutral-800 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="sales_staff">Field Sales Staff (Mobile scanner & assignment)</option>
                  <option value="admin">Administrator (Full batch & staff controls)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={submitting}
                  className="text-xs font-bold gap-1.5"
                >
                  {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Provision Account</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Success Credentials Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121216] border border-neutral-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Staff Account Provisioned</h3>
            </div>
            <p className="text-xs text-neutral-300">
              Share these credentials with the field staff member for logging in at <span className="font-mono text-white">/staff/login</span>.
            </p>
            <div className="p-3 bg-[#18181D] border border-neutral-800 rounded-lg space-y-2 font-mono text-xs">
              <div>
                <span className="text-neutral-500">Email:</span>{' '}
                <span className="text-white font-semibold">{createdCredentials.email}</span>
              </div>
              <div>
                <span className="text-neutral-500">Password:</span>{' '}
                <span className="text-primary font-bold">{createdCredentials.tempPass}</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="gold"
                size="sm"
                onClick={() => setCreatedCredentials(null)}
                className="text-xs font-bold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

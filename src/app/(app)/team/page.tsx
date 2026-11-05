'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building2,
  Mail,
  Sliders,
  Trash2,
  History,
  Loader2,
  X,
  Briefcase,
} from 'lucide-react';
import type { StaffMemberRecord, InvitationRecord, OrgRole } from '@/modules/orgs/types';

interface UserOrg {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: OrgRole;
  status: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  actorName: string;
  actorEmail: string;
  ipAddress: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export default function TeamStaffManagementPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [orgs, setOrgs] = React.useState<UserOrg[]>([]);
  const [selectedOrgId, setSelectedOrgId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'staff' | 'invitations' | 'audit'>('staff');

  const [staffList, setStaffList] = React.useState<StaffMemberRecord[]>([]);
  const [invitationsList, setInvitationsList] = React.useState<InvitationRecord[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<StaffMemberRecord | null>(null);

  // Invite Form
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [invitePhone, setInvitePhone] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'admin' | 'manager' | 'staff' | 'viewer'>('staff');
  const [inviteResponsibilities, setInviteResponsibilities] = React.useState('');
  const [submittingInvite, setSubmittingInvite] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);

  // Create Org Form
  const [newOrgName, setNewOrgName] = React.useState('');
  const [creatingOrg, setCreatingOrg] = React.useState(false);

  // Edit Staff Form
  const [editRole, setEditRole] = React.useState<'admin' | 'manager' | 'staff' | 'viewer'>('staff');
  const [editStatus, setEditStatus] = React.useState<'active' | 'suspended'>('active');
  const [editResponsibilities, setEditResponsibilities] = React.useState('');
  const [submittingEdit, setSubmittingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  // 1. Load user organizations
  const loadUserOrgs = React.useCallback(async () => {
    try {
      const res = await fetch('/api/v1/orgs');
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        setOrgs(data.data);
        if (!selectedOrgId) {
          setSelectedOrgId(data.data[0].orgId);
        }
      }
    } catch (err) {
      console.error('Failed to load user organizations:', err);
    }
  }, [selectedOrgId]);

  // 2. Load staff roster & audit logs for selected org
  const loadOrgData = React.useCallback(async (orgId: string) => {
    try {
      setLoading(true);
      const [staffRes, auditRes] = await Promise.all([
        fetch(`/api/v1/orgs/${orgId}/staff`).then((r) => r.json()),
        fetch(`/api/v1/orgs/${orgId}/audit`).then((r) => r.json()),
      ]);

      if (staffRes.data) {
        setStaffList(staffRes.data.staff || []);
        setInvitationsList(staffRes.data.invitations || []);
      }
      if (auditRes.data) {
        setAuditLogs(auditRes.data);
      }
    } catch (err) {
      console.error('Failed to load org staff details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      loadUserOrgs();
    }
  }, [user, loadUserOrgs]);

  React.useEffect(() => {
    if (selectedOrgId) {
      loadOrgData(selectedOrgId);
    }
  }, [selectedOrgId, loadOrgData]);

  const activeOrg = orgs.find((o) => o.orgId === selectedOrgId);
  const isOwnerOrAdmin = activeOrg?.role === 'owner' || activeOrg?.role === 'admin';

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreatingOrg(true);

    try {
      const res = await fetch('/api/v1/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create organization');

      setNewOrgName('');
      setShowCreateOrgModal(false);
      await loadUserOrgs();
      if (data.data?.id) setSelectedOrgId(data.data.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating organization');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !inviteEmail.trim()) return;
    setSubmittingInvite(true);
    setInviteError(null);

    try {
      const res = await fetch(`/api/v1/orgs/${selectedOrgId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          phoneNumber: invitePhone.trim() || undefined,
          role: inviteRole,
          assignedResponsibilities: inviteResponsibilities.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to send invitation');

      setShowInviteModal(false);
      setInviteEmail('');
      setInvitePhone('');
      setInviteResponsibilities('');
      await loadOrgData(selectedOrgId);
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Error inviting staff');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const openEditModal = (member: StaffMemberRecord) => {
    setEditingMember(member);
    setEditRole(member.role === 'owner' ? 'admin' : (member.role as 'admin' | 'manager' | 'staff' | 'viewer'));
    setEditStatus(member.status === 'suspended' ? 'suspended' : 'active');
    setEditResponsibilities(member.assignedResponsibilities || '');
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !editingMember) return;
    setSubmittingEdit(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/v1/orgs/${selectedOrgId}/staff/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          status: editStatus,
          assignedResponsibilities: editResponsibilities.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update staff member');

      setEditingMember(null);
      await loadOrgData(selectedOrgId);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Error updating staff member');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleRemoveMember = async (member: StaffMemberRecord) => {
    if (!selectedOrgId) return;
    if (!confirm(`Are you sure you want to remove ${member.name} (${member.email}) from this organization?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/orgs/${selectedOrgId}/staff/${member.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to remove member');

      await loadOrgData(selectedOrgId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error removing member');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Staff & Team Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage organization members, assign operational roles, control permissions, and review audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedOrgId && (
            <Link href={`/team/my-work?orgId=${selectedOrgId}`}>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
                <Briefcase className="h-3.5 w-3.5" />
                <span>My Workspace</span>
              </Button>
            </Link>
          )}

          {isOwnerOrAdmin && (
            <Button
              variant="gold"
              size="sm"
              onClick={() => setShowInviteModal(true)}
              className="h-8 text-xs font-semibold gap-1.5 px-3"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite Staff</span>
            </Button>
          )}
        </div>
      </div>

      {/* Organization Selector Bar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-card/50 border border-border/60">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Organization:</span>

          {orgs.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">No organizations found</span>
          ) : (
            orgs.map((org) => {
              const isSelected = org.orgId === selectedOrgId;
              return (
                <button
                  key={org.orgId}
                  onClick={() => setSelectedOrgId(org.orgId)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary/20 text-primary border border-primary/40 font-semibold'
                      : 'bg-background/80 text-muted-foreground border border-border/40 hover:text-foreground'
                  }`}
                >
                  <span>{org.orgName}</span>
                  <Badge variant="outline" className="text-[9px] uppercase font-mono px-1 py-0">
                    {org.role}
                  </Badge>
                </button>
              );
            })
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateOrgModal(true)}
          className="h-7 text-xs px-2.5 gap-1 shrink-0"
        >
          <span>+ New Org</span>
        </Button>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-border/60 gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-2.5 transition-all relative ${
            activeTab === 'staff' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Staff Members ({staffList.length})
          {activeTab === 'staff' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`pb-2.5 transition-all relative ${
            activeTab === 'invitations' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pending Invitations ({invitationsList.length})
          {activeTab === 'invitations' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 transition-all relative ${
            activeTab === 'audit' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Activity & Audit Logs ({auditLogs.length})
          {activeTab === 'audit' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading staff roster and permissions...</p>
        </div>
      ) : activeTab === 'staff' ? (
        <div className="space-y-3">
          {staffList.length === 0 ? (
            <Card className="border-border/60 bg-card/40 p-8 text-center max-w-md mx-auto my-6">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground">No Staff Members</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Invite team members to collaborate on digital profiles and dynamic QRs.
              </p>
              {isOwnerOrAdmin && (
                <Button variant="gold" size="sm" onClick={() => setShowInviteModal(true)} className="text-xs font-semibold">
                  Invite Staff
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {staffList.map((member) => {
                const isMemberOwner = member.role === 'owner';
                const isSuspended = member.status === 'suspended';

                return (
                  <Card key={member.id} className="border-border/60 bg-card/40 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground truncate">{member.name}</span>
                            <Badge
                              variant={isMemberOwner ? 'gold' : 'secondary'}
                              className="text-[9px] uppercase px-1 py-0 h-4"
                            >
                              {member.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </div>

                      <Badge
                        variant={isSuspended ? 'destructive' : 'outline'}
                        className="text-[9px] capitalize px-1.5 py-0 h-4"
                      >
                        {member.status}
                      </Badge>
                    </div>

                    {member.assignedResponsibilities && (
                      <div className="p-2 rounded-lg bg-background/60 border border-border/40 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground mr-1">Role Focus:</span>
                        {member.assignedResponsibilities}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                      <span className="text-[10px] text-muted-foreground">
                        Joined: {new Date(member.createdAt).toLocaleDateString()}
                      </span>

                      {isOwnerOrAdmin && !isMemberOwner && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(member)}
                            className="h-6 text-[11px] px-2 gap-1"
                          >
                            <Sliders className="h-3 w-3" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member)}
                            className="h-6 text-[11px] px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'invitations' ? (
        <div className="space-y-3">
          {invitationsList.length === 0 ? (
            <Card className="border-border/60 bg-card/40 p-8 text-center max-w-md mx-auto my-6">
              <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground">No Pending Invitations</h3>
              <p className="text-xs text-muted-foreground mt-1">
                All invitations have been accepted or no new invitations have been sent.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {invitationsList.map((inv) => (
                <Card key={inv.id} className="border-border/60 bg-card/40 p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground truncate">{inv.email}</span>
                        <Badge variant="outline" className="text-[9px] uppercase px-1 py-0">
                          {inv.role}
                        </Badge>
                      </div>
                      {inv.phoneNumber && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{inv.phoneNumber}</p>
                      )}
                    </div>

                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 capitalize">
                      Pending
                    </Badge>
                  </div>

                  <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-2 border-t border-border/40">
                    <span>Invited by: {inv.inviterName || 'Administrator'}</span>
                    <span>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* AUDIT & ACTIVITY LOGS TAB */
        <div className="space-y-3">
          {auditLogs.length === 0 ? (
            <Card className="border-border/60 bg-card/40 p-8 text-center max-w-md mx-auto my-6">
              <History className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground">No Activity Recorded</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Organization and staff actions will automatically appear here.
              </p>
            </Card>
          ) : (
            <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden divide-y divide-border/40 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-primary text-[11px] uppercase">
                        {log.action}
                      </span>
                      <span className="text-muted-foreground text-[11px]">on</span>
                      <span className="font-mono text-foreground text-[11px]">
                        {log.resourceType}:{log.resourceId?.slice(0, 12)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      by <span className="font-medium text-foreground">{log.actorName}</span> ({log.actorEmail})
                    </p>
                  </div>

                  <div className="text-right shrink-0 text-[10px] text-muted-foreground font-mono">
                    <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                    <div>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INVITE STAFF MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border/70 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-foreground">Invite Staff Member</h2>

            {inviteError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-foreground mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+919876543210"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'manager' | 'staff' | 'viewer')}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary"
                >
                  <option value="staff">Staff (QR assignment, leads, profile editing)</option>
                  <option value="manager">Manager (Staff invites, batch operations, reports)</option>
                  <option value="admin">Administrator (Full team management & settings)</option>
                  <option value="viewer">Viewer (Read-only analytics and profiles)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Assigned Responsibilities / Focus</label>
                <input
                  type="text"
                  placeholder="e.g. South Region NFC Card Pairing, Hospitality Standees"
                  value={inviteResponsibilities}
                  onChange={(e) => setInviteResponsibilities(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                  disabled={submittingInvite}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={submittingInvite}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {submittingInvite && <Loader2 className="h-3 w-3 animate-spin" />}
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border/70 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setEditingMember(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h2 className="text-base font-bold text-foreground">Edit Staff Member</h2>
              <p className="text-muted-foreground text-xs">{editingMember.name} ({editingMember.email})</p>
            </div>

            {editError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-foreground mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'manager' | 'staff' | 'viewer')}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'suspended')}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary"
                >
                  <option value="active">Active (Full access)</option>
                  <option value="suspended">Suspended (Access revoked)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Assigned Responsibilities</label>
                <input
                  type="text"
                  value={editResponsibilities}
                  onChange={(e) => setEditResponsibilities(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMember(null)}
                  disabled={submittingEdit}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={submittingEdit}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {submittingEdit && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ORG MODAL */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border/70 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowCreateOrgModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-foreground">Create Organization</h2>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block font-medium text-foreground mb-1">Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Hospitality Group"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateOrgModal(false)}
                  disabled={creatingOrg}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={creatingOrg}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {creatingOrg && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create Org
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

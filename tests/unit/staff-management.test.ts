import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/db';
import { users, organizations, members, invitations } from '@/db/schema/auth';
import {
  createOrganization,
  listUserOrganizations,
  inviteStaff,
  listOrganizationStaff,
  updateStaffMember,
  removeStaffMember,
  acceptInvitation,
  rejectInvitation,
  getStaffDashboardData,
  PrivilegeEscalationError,
  UserAlreadyMemberError,
  InvitationExpiredError,
} from '@/modules/orgs';
import { can } from '@/modules/authz';

describe('Organization & Staff Management Subsystem', () => {
  const ownerUserId = `usr_owner_${Date.now()}`;
  const adminUserId = `usr_admin_${Date.now()}`;
  const managerUserId = `usr_mgr_${Date.now()}`;
  const staffUserId = `usr_staff_${Date.now()}`;
  const viewerUserId = `usr_view_${Date.now()}`;

  let testOrgId: string;

  beforeAll(async () => {
    // Seed initial users
    await db.insert(users).values([
      { id: ownerUserId, name: 'Alice Owner', email: `alice-${Date.now()}@test.com`, status: 'active' },
      { id: adminUserId, name: 'Bob Admin', email: `bob-${Date.now()}@test.com`, status: 'active' },
      { id: managerUserId, name: 'Charlie Manager', email: `charlie-${Date.now()}@test.com`, status: 'active' },
      { id: staffUserId, name: 'Dave Staff', email: `dave-${Date.now()}@test.com`, status: 'active' },
      { id: viewerUserId, name: 'Eve Viewer', email: `eve-${Date.now()}@test.com`, status: 'active' },
    ]);
  });

  describe('1. Organization Lifecycle & Ownership', () => {
    it('creates an organization and automatically registers creator as owner', async () => {
      const org = await createOrganization({
        name: 'OmniCorp Solutions',
        ownerUserId,
      });

      testOrgId = org.id;
      expect(org.id).toBeDefined();
      expect(org.slug).toContain('omnicorp-solutions');

      const userOrgs = await listUserOrganizations(ownerUserId);
      expect(userOrgs.length).toBeGreaterThanOrEqual(1);
      const found = userOrgs.find((o: { orgId: string }) => o.orgId === testOrgId);
      expect(found).toBeDefined();
      expect(found?.role).toBe('owner');
      expect(found?.status).toBe('active');
    });
  });

  describe('2. Staff Invitation & Privilege Escalation Protection', () => {
    it('allows owner to invite an administrator', async () => {
      const invite = await inviteStaff({
        organizationId: testOrgId,
        inviterUserId: ownerUserId,
        email: `bob-${Date.now()}@test.com`,
        role: 'admin',
        assignedResponsibilities: 'System Infrastructure and Team Leads',
      });

      expect(invite.id).toBeDefined();
      expect(invite.status).toBe('pending');
      expect(invite.role).toBe('admin');
    });

    it('allows invited user to accept invitation and become an active member', async () => {
      const invite = await inviteStaff({
        organizationId: testOrgId,
        inviterUserId: ownerUserId,
        email: `admin-member-${Date.now()}@test.com`,
        role: 'admin',
      });

      const acceptRes = await acceptInvitation(invite.id, adminUserId);
      expect(acceptRes.membership.role).toBe('admin');
      expect(acceptRes.membership.status).toBe('active');

      const staffList = await listOrganizationStaff(testOrgId);
      const bob = staffList.find((s) => s.userId === adminUserId);
      expect(bob).toBeDefined();
      expect(bob?.role).toBe('admin');
    });

    it('allows admin to invite a manager', async () => {
      const invite = await inviteStaff({
        organizationId: testOrgId,
        inviterUserId: adminUserId,
        email: `manager-member-${Date.now()}@test.com`,
        role: 'manager',
      });

      const acceptRes = await acceptInvitation(invite.id, managerUserId);
      expect(acceptRes.membership.role).toBe('manager');
    });

    it('prevents a manager from inviting other staff members (only Owner and Admin can invite)', async () => {
      await expect(
        inviteStaff({
          organizationId: testOrgId,
          inviterUserId: managerUserId,
          email: 'unauthorized-staff@test.com',
          role: 'staff',
        })
      ).rejects.toThrow(PrivilegeEscalationError);
    });

    it('prevents inviting an email that is already a member', async () => {
      // Find owner email
      const staffList = await listOrganizationStaff(testOrgId);
      const owner = staffList.find((s) => s.userId === ownerUserId);

      await expect(
        inviteStaff({
          organizationId: testOrgId,
          inviterUserId: adminUserId,
          email: owner!.email,
          role: 'staff',
        })
      ).rejects.toThrow(UserAlreadyMemberError);
    });
  });

  describe('3. Staff Administration & Role Modifications', () => {
    let staffMemberId: string;

    beforeAll(async () => {
      const invite = await inviteStaff({
        organizationId: testOrgId,
        inviterUserId: ownerUserId,
        email: `dave-field-${Date.now()}@test.com`,
        role: 'staff',
        assignedResponsibilities: 'Hospitality Standee Deployments',
      });

      const acceptRes = await acceptInvitation(invite.id, staffUserId);
      staffMemberId = acceptRes.membership.id;
    });

    it('allows owner to update staff responsibilities and role', async () => {
      const updated = await updateStaffMember({
        organizationId: testOrgId,
        actorUserId: ownerUserId,
        memberId: staffMemberId,
        role: 'manager',
        assignedResponsibilities: 'Promoted to Regional Deployment Lead',
      });

      expect(updated.role).toBe('manager');
      expect(updated.assignedResponsibilities).toBe('Promoted to Regional Deployment Lead');
    });

    it('allows owner to suspend staff member access', async () => {
      const updated = await updateStaffMember({
        organizationId: testOrgId,
        actorUserId: ownerUserId,
        memberId: staffMemberId,
        status: 'suspended',
      });

      expect(updated.status).toBe('suspended');
    });

    it('prevents an administrator from modifying or removing the owner', async () => {
      const staffList = await listOrganizationStaff(testOrgId);
      const ownerMember = staffList.find((s) => s.userId === ownerUserId)!;

      await expect(
        updateStaffMember({
          organizationId: testOrgId,
          actorUserId: adminUserId,
          memberId: ownerMember.id,
          role: 'staff',
        })
      ).rejects.toThrow(PrivilegeEscalationError);

      await expect(
        removeStaffMember({
          organizationId: testOrgId,
          actorUserId: adminUserId,
          memberId: ownerMember.id,
        })
      ).rejects.toThrow(PrivilegeEscalationError);
    });

    it('allows owner to remove a staff member', async () => {
      const removeRes = await removeStaffMember({
        organizationId: testOrgId,
        actorUserId: ownerUserId,
        memberId: staffMemberId,
      });

      expect(removeRes.success).toBe(true);

      const staffList = await listOrganizationStaff(testOrgId);
      const found = staffList.find((s) => s.id === staffMemberId);
      expect(found).toBeUndefined();
    });
  });

  describe('4. Staff Workspace & Dashboard Metrics', () => {
    it('returns assigned responsibilities, role, and asset counters for active staff', async () => {
      const summary = await getStaffDashboardData({
        organizationId: testOrgId,
        userId: adminUserId,
      });

      expect(summary.organization.name).toBe('OmniCorp Solutions');
      expect(summary.membership.role).toBe('admin');
      expect(summary.membership.status).toBe('active');
      expect(summary.assignedAssets).toBeDefined();
      expect(typeof summary.assignedAssets.totalQRs).toBe('number');
    });
  });

  describe('5. Fine-Grained Authorization Matrix with Staff Roles', () => {
    it('evaluates role permissions correctly across Owner, Admin, Staff, and Viewer', () => {
      // Owner has full control
      expect(can({ userId: 'u1', role: 'owner' }, 'org:manage')).toBe(true);
      expect(can({ userId: 'u1', role: 'owner' }, 'staff:manage')).toBe(true);
      expect(can({ userId: 'u1', role: 'owner' }, 'qr:assign')).toBe(true);

      // Admin can manage staff and edit profiles, but not delete organization
      expect(can({ userId: 'u2', role: 'admin' }, 'staff:manage')).toBe(true);
      expect(can({ userId: 'u2', role: 'admin' }, 'profile:publish')).toBe(true);

      // Staff can assign QRs and edit profile, but cannot manage other staff
      expect(can({ userId: 'u3', role: 'staff' }, 'qr:assign')).toBe(true);
      expect(can({ userId: 'u3', role: 'staff' }, 'staff:manage')).toBe(false);

      // Viewer has read-only permissions
      expect(can({ userId: 'u4', role: 'viewer' }, 'profile:view')).toBe(true);
      expect(can({ userId: 'u4', role: 'viewer' }, 'profile:edit')).toBe(false);
      expect(can({ userId: 'u4', role: 'viewer' }, 'qr:assign')).toBe(false);
    });

    it('honors granular permissions override on staff actor', () => {
      const staffWithCustomQrExport = {
        userId: 'u_special',
        role: 'staff',
        permissions: ['qr:export'],
      };

      // Standard staff does not have qr:export
      expect(can({ userId: 'u_norm', role: 'staff' }, 'qr:export')).toBe(false);

      // Staff with explicit granted permission has access
      expect(can(staffWithCustomQrExport, 'qr:export')).toBe(true);
    });
  });
});

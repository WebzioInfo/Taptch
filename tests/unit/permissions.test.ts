import { describe, it, expect } from 'vitest';
import { can, PermissionAction } from '@/modules/authz';
import { ActorContext } from '@/db';

describe('Centralized Permission Engine: can(actor, action, resource)', () => {
  const allActions: PermissionAction[] = [
    'profile:create',
    'profile:edit',
    'profile:publish',
    'profile:delete',
    'card:claim',
    'card:reassign',
    'card:deactivate',
    'lead:view',
    'lead:export',
    'org:manage',
    'dept:manage',
    'member:invite',
    'admin:access',
    'plan:assign',
  ];

  it('super_admin should have access to ALL permissions across any resource', () => {
    const actor: ActorContext = { userId: 'admin-1', role: 'super_admin', isAdmin: true };
    for (const action of allActions) {
      expect(can(actor, action), `super_admin should allow ${action}`).toBe(true);
      expect(can(actor, action, { organizationId: 'other-org', isFieldLocked: true })).toBe(true);
    }
  });

  it('support_admin should have limited access (profile:edit, card:reassign, lead:view, admin:access)', () => {
    const actor: ActorContext = { userId: 'support-1', role: 'support_admin' };
    expect(can(actor, 'profile:edit')).toBe(true);
    expect(can(actor, 'card:reassign')).toBe(true);
    expect(can(actor, 'lead:view')).toBe(true);
    expect(can(actor, 'admin:access')).toBe(true);

    // Forbidden actions
    expect(can(actor, 'org:manage')).toBe(false);
    expect(can(actor, 'plan:assign')).toBe(false);
    expect(can(actor, 'profile:delete')).toBe(false);
    expect(can(actor, 'member:invite')).toBe(false);
  });

  it('org owner should have full management inside their organization, but not super admin controls', () => {
    const actor: ActorContext = { userId: 'owner-1', orgId: 'apex-capital', role: 'owner' };
    expect(can(actor, 'org:manage', { organizationId: 'apex-capital' })).toBe(true);
    expect(can(actor, 'dept:manage', { organizationId: 'apex-capital' })).toBe(true);
    expect(can(actor, 'member:invite', { organizationId: 'apex-capital' })).toBe(true);
    expect(can(actor, 'lead:export', { organizationId: 'apex-capital' })).toBe(true);

    // Cross-tenant access denied
    expect(can(actor, 'org:manage', { organizationId: 'competing-firm' })).toBe(false);
    // Platform admin forbidden
    expect(can(actor, 'admin:access')).toBe(false);
    expect(can(actor, 'plan:assign')).toBe(false);
  });

  it('dept manager should view and export department leads, but not invite members or manage org', () => {
    const actor: ActorContext = { userId: 'mgr-1', orgId: 'apex-capital', role: 'manager' };
    expect(can(actor, 'lead:view', { organizationId: 'apex-capital' })).toBe(true);
    expect(can(actor, 'lead:export', { organizationId: 'apex-capital' })).toBe(true);
    expect(can(actor, 'profile:edit', { organizationId: 'apex-capital' })).toBe(true);

    expect(can(actor, 'member:invite')).toBe(false);
    expect(can(actor, 'org:manage')).toBe(false);
    expect(can(actor, 'dept:manage')).toBe(false);
  });

  it('employee role should view leads and edit profile, but cannot export or modify locked fields', () => {
    const actor: ActorContext = { userId: 'emp-1', orgId: 'apex-capital', role: 'employee' };
    expect(can(actor, 'lead:view', { organizationId: 'apex-capital' })).toBe(true);
    expect(can(actor, 'profile:edit', { organizationId: 'apex-capital' })).toBe(true);

    // Cannot export leads
    expect(can(actor, 'lead:export')).toBe(false);
    // Cannot modify brand-locked fields
    expect(can(actor, 'profile:edit', { organizationId: 'apex-capital', isFieldLocked: true })).toBe(false);
  });

  it('individual user should own personal profiles, but cannot access corporate org operations', () => {
    const actor: ActorContext = { userId: 'user-1', role: 'user' };
    expect(can(actor, 'profile:create')).toBe(true);
    expect(can(actor, 'profile:edit', { ownerId: 'user-1' })).toBe(true);
    expect(can(actor, 'profile:delete', { ownerId: 'user-1' })).toBe(true);

    // Cannot delete someone else's profile
    expect(can(actor, 'profile:delete', { ownerId: 'user-2' })).toBe(false);
    // Cannot manage corporate features
    expect(can(actor, 'org:manage')).toBe(false);
    expect(can(actor, 'dept:manage')).toBe(false);
  });

  it('org admin should have management rights within their org, but CANNOT access competing orgs or platform controls', () => {
    const adminActor: ActorContext = { userId: 'admin-corp-1', orgId: 'org-alpha', role: 'admin' };

    // Allowed within org-alpha
    expect(can(adminActor, 'dept:manage', { organizationId: 'org-alpha' })).toBe(true);
    expect(can(adminActor, 'member:invite', { organizationId: 'org-alpha' })).toBe(true);
    expect(can(adminActor, 'staff:manage', { organizationId: 'org-alpha' })).toBe(true);
    expect(can(adminActor, 'lead:export', { organizationId: 'org-alpha' })).toBe(true);

    // Cross-tenant boundaries strictly enforced: access to org-beta is DENIED
    expect(can(adminActor, 'dept:manage', { organizationId: 'org-beta' })).toBe(false);
    expect(can(adminActor, 'staff:manage', { organizationId: 'org-beta' })).toBe(false);
    expect(can(adminActor, 'lead:view', { organizationId: 'org-beta' })).toBe(false);

    // Platform-level sovereignty forbidden
    expect(can(adminActor, 'plan:assign')).toBe(false);
    expect(can(adminActor, 'admin:access')).toBe(false);
  });

  it('org viewer should only have read-only analytics/viewing rights and zero write permissions', () => {
    const viewerActor: ActorContext = { userId: 'viewer-1', orgId: 'org-alpha', role: 'viewer' };

    expect(can(viewerActor, 'profile:view', { organizationId: 'org-alpha' })).toBe(true);
    expect(can(viewerActor, 'qr:view', { organizationId: 'org-alpha' })).toBe(true);
    expect(can(viewerActor, 'lead:view', { organizationId: 'org-alpha' })).toBe(true);
    expect(can(viewerActor, 'analytics:view', { organizationId: 'org-alpha' })).toBe(true);

    // Mutation actions strictly forbidden
    expect(can(viewerActor, 'profile:edit', { organizationId: 'org-alpha' })).toBe(false);
    expect(can(viewerActor, 'profile:create')).toBe(false);
    expect(can(viewerActor, 'member:invite')).toBe(false);
    expect(can(viewerActor, 'staff:manage')).toBe(false);
  });

  it('field sales staff should activate/assign QRs, but cannot manage organizations or assign plans', () => {
    const salesActor: ActorContext = { userId: 'sales-1', role: 'staff' };

    expect(can(salesActor, 'qr:assign')).toBe(true);
    expect(can(salesActor, 'qr:activate')).toBe(true);
    expect(can(salesActor, 'qr:scan_verify')).toBe(true);

    // Forbidden administrative actions
    expect(can(salesActor, 'org:manage')).toBe(false);
    expect(can(salesActor, 'member:invite')).toBe(false);
    expect(can(salesActor, 'plan:assign')).toBe(false);
    expect(can(salesActor, 'admin:access')).toBe(false);
  });
});


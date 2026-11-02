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
});


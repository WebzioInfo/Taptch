import { ActorContext } from '@/db';

export type PermissionAction =
  | 'profile:create'
  | 'profile:edit'
  | 'profile:publish'
  | 'profile:delete'
  | 'card:claim'
  | 'card:reassign'
  | 'card:deactivate'
  | 'lead:view'
  | 'lead:export'
  | 'org:manage'
  | 'dept:manage'
  | 'member:invite'
  | 'admin:access'
  | 'plan:assign';

export interface ResourceContext {
  ownerId?: string | null;
  organizationId?: string | null;
  isFieldLocked?: boolean;
}

// In-memory statically cached permission matrix (backed by DB seeds)
const ROLE_PERMISSIONS: Record<string, Set<PermissionAction>> = {
  super_admin: new Set([
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
  ]),
  support_admin: new Set([
    'profile:edit',
    'card:reassign',
    'lead:view',
    'admin:access',
  ]),
  owner: new Set([
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
  ]),
  admin: new Set([
    'profile:create',
    'profile:edit',
    'profile:publish',
    'card:claim',
    'card:reassign',
    'lead:view',
    'lead:export',
    'dept:manage',
    'member:invite',
  ]),
  manager: new Set([
    'profile:edit',
    'lead:view',
    'lead:export',
  ]),
  employee: new Set([
    'profile:edit',
    'lead:view',
  ]),
  user: new Set([
    'profile:create',
    'profile:edit',
    'profile:publish',
    'profile:delete',
    'card:claim',
    'card:reassign',
    'card:deactivate',
    'lead:view',
    'lead:export',
  ]),
};

/**
 * Centralized Pure Authorization Engine
 *
 * Evaluates: can(actor, action, resource)
 * Guarantees zero scattered role string comparisons across controllers.
 */
export function can(
  actor: ActorContext,
  action: PermissionAction,
  resource?: ResourceContext
): boolean {
  if (!actor || !actor.userId) {
    return false;
  }

  // 1. Super Admin bypass: Global administrative sovereignty
  if (actor.isAdmin || actor.role === 'super_admin') {
    return true;
  }

  // 2. Check if actor's role grants this permission
  const grantedPermissions = ROLE_PERMISSIONS[actor.role];
  if (!grantedPermissions || !grantedPermissions.has(action)) {
    return false;
  }

  // 3. Resource-level multi-tenant boundaries
  if (resource) {
    // If resource is bound to an organization, actor must belong to that organization
    if (resource.organizationId && actor.orgId && resource.organizationId !== actor.orgId) {
      return false;
    }

    // Enterprise Brand Lock: employee and manager roles cannot modify locked fields
    if (resource.isFieldLocked && (actor.role === 'employee' || actor.role === 'manager')) {
      return false;
    }

    // Owner checks: for destructive mutations (delete), individual users must own the resource
    if (action === 'profile:delete' && resource.ownerId && resource.ownerId !== actor.userId) {
      if (actor.role !== 'owner' && actor.role !== 'admin') {
        return false;
      }
    }
  }

  return true;
}


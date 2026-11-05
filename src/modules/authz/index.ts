import { ActorContext } from '@/db';

export type PermissionAction =
  | 'profile:view'
  | 'profile:create'
  | 'profile:edit'
  | 'profile:publish'
  | 'profile:delete'
  | 'card:claim'
  | 'card:reassign'
  | 'card:deactivate'
  | 'qr:view'
  | 'qr:create'
  | 'qr:edit'
  | 'qr:assign'
  | 'qr:activate'
  | 'qr:deactivate'
  | 'qr:export'
  | 'qr:scan_verify'
  | 'nfc:manage'
  | 'lead:view'
  | 'lead:export'
  | 'analytics:view'
  | 'org:manage'
  | 'dept:manage'
  | 'member:invite'
  | 'staff:manage'
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
    'profile:view',
    'profile:create',
    'profile:edit',
    'profile:publish',
    'profile:delete',
    'card:claim',
    'card:reassign',
    'card:deactivate',
    'qr:view',
    'qr:create',
    'qr:edit',
    'qr:assign',
    'qr:activate',
    'qr:deactivate',
    'qr:export',
    'qr:scan_verify',
    'nfc:manage',
    'lead:view',
    'lead:export',
    'analytics:view',
    'org:manage',
    'dept:manage',
    'member:invite',
    'staff:manage',
    'admin:access',
    'plan:assign',
  ]),
  support_admin: new Set([
    'profile:view',
    'profile:edit',
    'card:reassign',
    'qr:view',
    'lead:view',
    'admin:access',
  ]),
  owner: new Set([
    'profile:view',
    'profile:create',
    'profile:edit',
    'profile:publish',
    'profile:delete',
    'card:claim',
    'card:reassign',
    'card:deactivate',
    'qr:view',
    'qr:create',
    'qr:edit',
    'qr:assign',
    'qr:activate',
    'qr:deactivate',
    'qr:export',
    'qr:scan_verify',
    'nfc:manage',
    'lead:view',
    'lead:export',
    'analytics:view',
    'org:manage',
    'dept:manage',
    'member:invite',
    'staff:manage',
  ]),
  admin: new Set([
    'profile:view',
    'profile:create',
    'profile:edit',
    'profile:publish',
    'card:claim',
    'card:reassign',
    'card:deactivate',
    'qr:view',
    'qr:create',
    'qr:edit',
    'qr:assign',
    'qr:activate',
    'qr:deactivate',
    'qr:export',
    'qr:scan_verify',
    'nfc:manage',
    'lead:view',
    'lead:export',
    'analytics:view',
    'dept:manage',
    'member:invite',
    'staff:manage',
  ]),
  manager: new Set([
    'profile:view',
    'profile:create',
    'profile:edit',
    'profile:publish',
    'card:claim',
    'card:reassign',
    'qr:view',
    'qr:create',
    'qr:edit',
    'qr:assign',
    'qr:activate',
    'qr:deactivate',
    'qr:export',
    'qr:scan_verify',
    'nfc:manage',
    'lead:view',
    'lead:export',
    'analytics:view',
  ]),
  staff: new Set([
    'profile:view',
    'profile:edit',
    'card:claim',
    'qr:view',
    'qr:assign',
    'qr:activate',
    'qr:scan_verify',
    'lead:view',
  ]),
  employee: new Set([
    'profile:view',
    'profile:edit',
    'card:claim',
    'qr:view',
    'qr:assign',
    'qr:activate',
    'qr:scan_verify',
    'lead:view',
  ]),
  viewer: new Set([
    'profile:view',
    'qr:view',
    'lead:view',
    'analytics:view',
  ]),
  user: new Set([
    'profile:view',
    'profile:create',
    'profile:edit',
    'profile:publish',
    'profile:delete',
    'card:claim',
    'card:reassign',
    'card:deactivate',
    'qr:view',
    'qr:create',
    'qr:edit',
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

  // 1. Super Admin bypass: Global administrative sovereignty strictly for super_admin
  if (actor.role === 'super_admin') {
    return true;
  }

  // 1.5. Direct granular staff permissions override
  if (actor.permissions && Array.isArray(actor.permissions) && actor.permissions.includes(action)) {
    return true;
  }

  // 2. Check if actor's memberRole or role grants this permission
  const effectiveRole = actor.memberRole || actor.role;
  const grantedPermissions = ROLE_PERMISSIONS[effectiveRole];
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


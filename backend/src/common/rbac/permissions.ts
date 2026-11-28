export const ADMIN_ROLES = ['super_admin', 'admin', 'support_admin', 'staff'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ALL_PERMISSIONS = [
  'dashboard.view',
  'users.view',
  'users.create',
  'users.edit',
  'users.suspend',
  'profiles.view',
  'profiles.edit',
  'orders.view',
  'orders.manage',
  'finance.view',
  'finance.manage',
  'products.view',
  'products.manage',
  'cards.view',
  'cards.manage',
  'staff.view',
  'staff.manage',
  'roles.view',
  'roles.manage',
  'settings.manage',
  'activity_logs.view',
  'inventory.view',
  'inventory.manage',
  'reports.view',
  'reports.export',
  'notifications.view',
  'notifications.manage',
  'security.login_history.view',
  'security.sessions.view',
  'security.sessions.manage',
  'security.alerts.view',
  'tickets.view',
  'tickets.manage',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const ROLE_PERMISSION_MATRIX: Record<AdminRole, readonly Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: [
    'dashboard.view',
    'users.view',
    'users.create',
    'users.edit',
    'users.suspend',
    'profiles.view',
    'profiles.edit',
    'orders.view',
    'orders.manage',
    'finance.view',
    'finance.manage',
    'products.view',
    'products.manage',
    'cards.view',
    'cards.manage',
    'staff.view',
    'staff.manage',
    'roles.view',
    'settings.manage',
    'activity_logs.view',
    'inventory.view',
    'inventory.manage',
    'reports.view',
    'reports.export',
    'notifications.view',
    'notifications.manage',
    'security.login_history.view',
    'security.sessions.view',
    'security.alerts.view',
    'tickets.view',
    'tickets.manage',
  ],
  support_admin: [
    'dashboard.view',
    'users.view',
    'users.suspend',
    'profiles.view',
    'profiles.edit',
    'orders.view',
    'orders.manage',
    'cards.view',
    'products.view',
    'activity_logs.view',
    'notifications.view',
    'security.alerts.view',
    'tickets.view',
    'tickets.manage',
  ],
  staff: [
    'dashboard.view',
    'orders.view',
    'products.view',
    'cards.view',
    'inventory.view',
    'reports.view',
  ],
};

export function getPermissionsForRole(role?: string | null): Permission[] {
  if (!role) return [];
  const normalized = role.trim().toLowerCase() as AdminRole;
  const list = ROLE_PERMISSION_MATRIX[normalized];
  return list ? [...list] : [];
}

export function hasRolePermission(role: string | null | undefined, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

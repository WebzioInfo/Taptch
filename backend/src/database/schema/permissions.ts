import { pgTable, text, timestamp, varchar, primaryKey } from 'drizzle-orm/pg-core';

export const permissions = pgTable('permissions', {
  id: varchar('id', { length: 64 }).primaryKey(), // e.g. 'profile:create', 'card:assign', 'org:manage'
  name: varchar('name', { length: 128 }).notNull(),
  description: text('description').notNull(),
  module: varchar('module', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    role: varchar('role', { length: 32 }).notNull(), // 'super_admin' | 'support_admin' | 'owner' | 'admin' | 'manager' | 'employee' | 'user'
    permissionId: varchar('permission_id', { length: 64 })
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.role, table.permissionId] }),
  ]
);


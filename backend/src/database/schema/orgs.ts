import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { organizations, users } from './auth';

export const departments = pgTable('departments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 128 }).notNull(),
  managerId: text('manager_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});


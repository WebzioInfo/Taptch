import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

/**
 * Lead Capture & Reciprocal Contact Exchange Table
 * Stores contacts shared by visitors directly on a public digital profile.
 */
export const leads = pgTable('leads', {
  id: varchar('id', { length: 64 }).primaryKey(),
  profileId: varchar('profile_id', { length: 64 })
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 128 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 32 }),
  company: varchar('company', { length: 128 }),
  jobTitle: varchar('job_title', { length: 128 }),
  notes: text('notes'),
  source: varchar('source', { length: 32 }).notNull().default('profile_exchange'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

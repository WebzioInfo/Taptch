import { and, isNull, sql } from 'drizzle-orm';
import { profiles } from './schema/profiles';

/**
 * Shared active-only scope for profiles.
 * Every query that reads profiles MUST include this filter so soft-deleted
 * profiles (status = 'DELETED' or deleted_at IS NOT NULL) never leak.
 */
export function activeProfiles() {
  return and(sql`upper(${profiles.status}) <> 'DELETED'`, isNull(profiles.deletedAt))!;
}

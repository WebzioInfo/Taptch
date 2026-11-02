import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

export interface AuditLogEntry {
  actorId: string;
  organizationId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      id: randomUUID(),
      actorId: entry.actorId,
      organizationId: entry.organizationId ?? null,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
      metadata: entry.metadata ?? {},
      createdAt: new Date(),
    });
  } catch (err) {
    // Audit logging should never crash the primary business transaction, but should alert
    logger.error({ err, entry }, 'Failed to record audit log entry');
  }
}


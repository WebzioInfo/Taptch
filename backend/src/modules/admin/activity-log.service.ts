import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { desc, eq, and, or, ilike, sql } from 'drizzle-orm';
import * as crypto from 'crypto';

const SENSITIVE_KEY_PATTERN =
  /(password|pass|token|access_token|refresh_token|secret|apikey|api_key|signature|cookie|authorization|cvv|cardnumber|card_number)/i;

    export function sanitizeMetadata(input: unknown): any {
      if (input === null || input === undefined) {
        return input;
      }
          if (Array.isArray(input)) {
            return input.map((item) => sanitizeMetadata(item));
          }
          if (typeof input === 'object') {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
              if (SENSITIVE_KEY_PATTERN.test(k)) {
                out[k] = '[REDACTED]';
              } else {
                out[k] = sanitizeMetadata(v);
              }
            }
            return out;
          }
          return input;
        }

        export interface RecordActivityLogInput {
          actorId: string;
          actorRole?: string | null;
          action: string;
          resourceType: string;
          resourceId?: string | null;
          before?: Record<string, unknown> | null;
          after?: Record<string, unknown> | null;
          correlationId?: string | null;
          ipAddress?: string | null;
          userAgent?: string | null;
        }

        @Injectable()
        export class ActivityLogService {
          constructor(private dbService: DatabaseService) { }

  async record(entry: RecordActivityLogInput, tx ?: any) {
              const metadata = sanitizeMetadata({
                actorRole: entry.actorRole || 'unknown',
                correlationId: entry.correlationId || null,
                before: entry.before || null,
                after: entry.after || null,
              });

              const executor = tx || this.dbService.db;
              const [created] = await executor
                .insert(schema.auditLogs)
                .values({
                  id: crypto.randomUUID(),
                  actorId: entry.actorId,
                  action: entry.action,
                  resourceType: entry.resourceType,
                  resourceId: entry.resourceId || null,
                  ipAddress: entry.ipAddress || null,
                  userAgent: entry.userAgent || null,
                  metadata,
                  createdAt: new Date(),
                })
                .returning();

              return created;
            }

  async queryLogs(filters ?: {
              q?: string;
              action?: string;
              resourceType?: string;
              page?: number;
              pageSize?: number;
            }) {
              const page = Math.max(1, Number(filters?.page || 1));
              const pageSize = Math.min(100, Math.max(1, Number(filters?.pageSize || 25)));
              const offset = (page - 1) * pageSize;

              const conditions = [];
              if (filters?.action && filters.action !== 'ALL') {
                conditions.push(eq(schema.auditLogs.action, filters.action));
              }
              if (filters?.resourceType && filters.resourceType !== 'ALL') {
                conditions.push(eq(schema.auditLogs.resourceType, filters.resourceType));
              }
              if (filters?.q && filters.q.trim()) {
                const q = `%${filters.q.trim()}%`;
                conditions.push(
                  or(
                    ilike(schema.auditLogs.action, q),
                    ilike(schema.auditLogs.resourceType, q),
                    ilike(schema.auditLogs.resourceId, q),
                    ilike(schema.users.email, q),
                    ilike(schema.users.name, q),
                  ),
                );
              }

              const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

              const [rows, countRes] = await Promise.all([
                this.dbService.db
                  .select({
                    id: schema.auditLogs.id,
                    actorId: schema.auditLogs.actorId,
                    actorName: schema.users.name,
                    actorEmail: schema.users.email,
                    actorRole: schema.users.systemRole,
                    action: schema.auditLogs.action,
                    resourceType: schema.auditLogs.resourceType,
                    resourceId: schema.auditLogs.resourceId,
                    metadata: schema.auditLogs.metadata,
                    createdAt: schema.auditLogs.createdAt,
                  })
                  .from(schema.auditLogs)
                  .leftJoin(schema.users, eq(schema.auditLogs.actorId, schema.users.id))
                  .where(whereClause)
                  .orderBy(desc(schema.auditLogs.createdAt))
                  .limit(pageSize)
                  .offset(offset),
                this.dbService.db
                  .select({ count: sql<number>`count(*)` })
                  .from(schema.auditLogs)
                  .leftJoin(schema.users, eq(schema.auditLogs.actorId, schema.users.id))
                  .where(whereClause),
              ]);

              return {
                items: rows,
                total: Number(countRes[0]?.count || 0),
                page,
                pageSize,
              };
            }
          }

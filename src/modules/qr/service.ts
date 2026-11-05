import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { qrCodes, qrBatches, qrGroups } from '@/db/schema/qr';
import { users } from '@/db/schema/auth';
import { redis } from '@/lib/redis';
import { CreateQRInput, UpdateQRInput } from './types';
import { generateQRToken, generateQRSerial, interpolateUrlTemplate } from './token';
import { validateTargetUrl } from './resolution';

export class InvalidDestinationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDestinationError';
  }
}

export class QRNotFoundError extends Error {
  constructor(identifier: string) {
    super(`QR Code with identifier "${identifier}" was not found.`);
    this.name = 'QRNotFoundError';
  }
}

export class QRAlreadyAssignedError extends Error {
  constructor(message: string = 'This QR Code has already been assigned.') {
    super(message);
    this.name = 'QRAlreadyAssignedError';
  }
}

/**
 * Normalizes destination URL with https:// prefix if missing
 */
export function normalizeDestinationUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, ''); // Strip trailing slashes
}

/**
 * Creates an individual dynamic QR code.
 */
export async function createQRCode(input: CreateQRInput) {
  if (input.destinationType === 'url') {
    if (!input.targetUrl) {
      throw new InvalidDestinationError('Target URL is required for destination type "url".');
    }
    const validated = validateTargetUrl(input.targetUrl);
    if (!validated.isValid) {
      throw new InvalidDestinationError(validated.error || 'Invalid target URL.');
    }
  }

  // Generate unique token
  let token = generateQRToken();
  let attempts = 0;
  while (attempts < 5) {
    const [existing] = await db.select({ id: qrCodes.id }).from(qrCodes).where(eq(qrCodes.token, token)).limit(1);
    if (!existing) break;
    token = generateQRToken();
    attempts++;
  }

  const id = `qr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const serial = generateQRSerial(Math.floor(100000 + Math.random() * 900000));
  const normalizedUrl = input.targetUrl ? normalizeDestinationUrl(input.targetUrl) : null;

  const [created] = await db
    .insert(qrCodes)
    .values({
      id,
      serialNumber: serial,
      token,
      label: input.name || `QR ${token}`,
      batchId: input.batchId || null,
      organizationId: input.organizationId || null,
      ownerUserId: input.ownerUserId || null,
      destinationType: input.destinationType,
      profileId: input.profileId || null,
      targetUrl: normalizedUrl,
      manualRedirectUrl: normalizedUrl,
      destinationPayload: input.destinationPayload ? JSON.stringify(input.destinationPayload) : null,
      status: input.targetUrl || input.profileId ? 'assigned' : 'unassigned',
      isDynamic: input.isDynamic ?? true,
      designConfig: input.designConfig ? JSON.stringify(input.designConfig) : null,
      createdBy: input.ownerUserId || null,
    })
    .returning();

  return created;
}

/**
 * Updates destination or design configuration of an existing QR code.
 */
export async function updateQRCode(id: string, input: UpdateQRInput) {
  const [existing] = await db.select().from(qrCodes).where(eq(qrCodes.id, id)).limit(1);
  if (!existing) {
    throw new QRNotFoundError(id);
  }

  let normalizedUrl: string | undefined;
  if (input.destinationType === 'url' && input.targetUrl) {
    normalizedUrl = normalizeDestinationUrl(input.targetUrl);
    const validated = validateTargetUrl(normalizedUrl);
    if (!validated.isValid) {
      throw new InvalidDestinationError(validated.error || 'Invalid target URL.');
    }
  }

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.destinationType !== undefined) updateValues.destinationType = input.destinationType;
  if (input.profileId !== undefined) updateValues.profileId = input.profileId;
  if (input.targetUrl !== undefined || normalizedUrl !== undefined) {
    const finalUrl = normalizedUrl ?? input.targetUrl;
    updateValues.targetUrl = finalUrl;
    updateValues.manualRedirectUrl = finalUrl;
  }
  if (input.destinationPayload !== undefined) {
    updateValues.destinationPayload = input.destinationPayload ? JSON.stringify(input.destinationPayload) : null;
  }
  if (input.status !== undefined) updateValues.status = input.status;
  if (input.designConfig !== undefined) {
    updateValues.designConfig = input.designConfig ? JSON.stringify(input.designConfig) : null;
  }

  const [updated] = await db
    .update(qrCodes)
    .set(updateValues)
    .where(eq(qrCodes.id, id))
    .returning();

  // Invalidate Redis cache for immediate propagation
  try {
    await redis.del(`qr:token:${existing.token}`);
  } catch {
    // Ignore Redis error
  }

  return updated;
}

/**
 * Retrieves a single QR code by ID.
 */
export async function getQRCodeById(id: string) {
  const [qr] = await db.select().from(qrCodes).where(eq(qrCodes.id, id)).limit(1);
  if (!qr) throw new QRNotFoundError(id);
  return qr;
}

/**
 * Retrieves a single QR code by Token.
 */
export async function getQRCodeByToken(token: string) {
  const [qr] = await db.select().from(qrCodes).where(eq(qrCodes.token, token.toLowerCase().trim())).limit(1);
  if (!qr) throw new QRNotFoundError(token);
  return qr;
}

/**
 * Lists QR codes owned by a user or organization with pagination.
 */
export async function listQRCodes(params: {
  userId?: string;
  organizationId?: string;
  batchId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.min(params.limit || 50, 200);
  const offset = params.offset || 0;

  const conditions = [];
  if (params.userId) conditions.push(eq(qrCodes.ownerUserId, params.userId));
  if (params.organizationId) conditions.push(eq(qrCodes.organizationId, params.organizationId));
  if (params.batchId) conditions.push(eq(qrCodes.batchId, params.batchId));
  if (params.status) conditions.push(eq(qrCodes.status, params.status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
    .select()
    .from(qrCodes)
    .where(whereClause)
    .orderBy(desc(qrCodes.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(qrCodes)
    .where(whereClause);

  return {
    items,
    total: countResult?.count || 0,
    limit,
    offset,
  };
}

/**
 * Subsystem 2.1: Mints a bulk batch of unassigned dynamic QR codes with collision-free tokens and sequential tracking.
 */
export async function createQRBatch(params: {
  name: string;
  quantity: number;
  startFrom?: number;
  batchCodePrefix?: string;
  productType?: string;
  destinationCategory?: string;
  manualRedirectUrl?: string | null;
  paramName?: string | null;
  valuePrefix?: string | null;
  sep?: string;
  groupId?: string | null;
  organizationId?: string | null;
  createdBy: string;
}) {
  const quantity = Math.min(Math.max(params.quantity, 1), 2000);
  const startFrom = Math.max(params.startFrom || 1, 1);
  const timestamp = Date.now();
  const batchCode = `${params.batchCodePrefix || 'QRB'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const batchId = `qrb_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;

  // Create or update group if requested
  let groupId = params.groupId || null;
  if (!groupId) {
    const groupRecordId = `qrg_${timestamp}_${Math.random().toString(36).slice(2, 7)}`;
    const [createdGroup] = await db
      .insert(qrGroups)
      .values({
        id: groupRecordId,
        label: params.name,
        qrCount: quantity,
        createdBy: params.createdBy,
      })
      .returning();
    groupId = createdGroup.id;
  }

  // Insert batch metadata
  const [batch] = await db
    .insert(qrBatches)
    .values({
      id: batchId,
      batchCode,
      name: params.name,
      quantity,
      startFrom,
      qrType: 'single',
      destinationCategory: params.destinationCategory || 'profile',
      productType: params.productType || 'sticker',
      paramName: params.paramName || null,
      valuePrefix: params.valuePrefix || null,
      sep: params.sep || '-',
      templateUrl: params.manualRedirectUrl || null,
      groupId,
      organizationId: params.organizationId || null,
      createdBy: params.createdBy,
    })
    .returning();

  // Generate tokens with database collision check
  const tokens = new Set<string>();
  while (tokens.size < quantity) {
    tokens.add(generateQRToken());
  }
  const tokenArray = Array.from(tokens);

  // Check if any collision exists in DB (extremely rare for 8-char hex, but strictly enforced)
  const existingTokens = await db
    .select({ token: qrCodes.token })
    .from(qrCodes)
    .where(inArray(qrCodes.token, tokenArray));

  if (existingTokens.length > 0) {
    const taken = new Set(existingTokens.map((r: { token: string }) => r.token));
    for (let i = 0; i < tokenArray.length; i++) {
      while (taken.has(tokenArray[i])) {
        const fresh = generateQRToken();
        if (!tokens.has(fresh)) {
          tokens.add(fresh);
          tokenArray[i] = fresh;
        }
      }
    }
  }

  // Build batch items
  const qrRecords = [];
  for (let i = 0; i < quantity; i++) {
    const sequence = startFrom + i;
    const token = tokenArray[i];
    const serial = `${batchCode}-${String(sequence).padStart(4, '0')}`;
    const label = `${params.name} #${sequence}`;

    let interpolatedUrl: string | null = null;
    if (params.manualRedirectUrl) {
      interpolatedUrl = interpolateUrlTemplate(
        params.manualRedirectUrl,
        params.paramName,
        params.valuePrefix,
        params.sep || '-',
        sequence
      );
    }

    qrRecords.push({
      id: `qr_${timestamp}_${sequence}_${Math.random().toString(36).slice(2, 7)}`,
      serialNumber: serial,
      token,
      label,
      groupId,
      batchId: batch.id,
      batchLabel: params.name,
      batchSize: quantity,
      batchSequence: sequence,
      organizationId: params.organizationId || null,
      status: interpolatedUrl ? 'assigned' : 'unassigned',
      isDynamic: true,
      qrType: 'single',
      destinationType: 'url',
      manualRedirectUrl: interpolatedUrl,
      targetUrl: interpolatedUrl,
      createdBy: params.createdBy,
    });
  }

  // Chunked batch insertion (100 items per chunk)
  const CHUNK_SIZE = 100;
  for (let i = 0; i < qrRecords.length; i += CHUNK_SIZE) {
    const chunk = qrRecords.slice(i, i + CHUNK_SIZE);
    await db.insert(qrCodes).values(chunk);
  }

  return {
    batch,
    totalGenerated: quantity,
    groupId,
  };
}

/**
 * Subsystem 2.3: "Assign QR After Generated" Field Workflow
 * Executed on-field by sales staff or administrators when pairing physical QR with customer.
 */
export async function assignQRInField(params: {
  qrToken: string;
  name: string;
  mobileNumber?: string | null;
  place?: string | null;
  business?: string | null;
  destinationUrl: string;
  isReassign?: boolean;
  staffUserId: string;
}) {
  const token = params.qrToken.toLowerCase().trim();
  const [qr] = await db.select().from(qrCodes).where(eq(qrCodes.token, token)).limit(1);

  if (!qr) {
    throw new QRNotFoundError(`QR code with token "${token}" does not exist.`);
  }

  // Guard against accidental overwrites unless explicitly reassigning
  if (qr.status === 'assigned' && !params.isReassign) {
    throw new QRAlreadyAssignedError('This QR Code has already been assigned.');
  }

  // Sanitize destination URL
  const normalizedUrl = normalizeDestinationUrl(params.destinationUrl);
  const validated = validateTargetUrl(normalizedUrl);
  if (!validated.isValid) {
    throw new InvalidDestinationError(validated.error || 'Destination URL failed security validation.');
  }

  // Customer Entity Handling: search users by mobile number or create customer
  let customerUserId: string | null = null;
  const cleanMobile = params.mobileNumber?.trim() || null;

  if (cleanMobile) {
    const [existingCustomer] = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, cleanMobile))
      .limit(1);

    if (existingCustomer) {
      customerUserId = existingCustomer.id;
      // Update missing fields
      const updateFields: Record<string, unknown> = {};
      if (!existingCustomer.place && params.place) updateFields.place = params.place.trim();
      if (!existingCustomer.business && params.business) updateFields.business = params.business.trim();
      if (Object.keys(updateFields).length > 0) {
        await db.update(users).set(updateFields).where(eq(users.id, existingCustomer.id));
      }
    } else {
      // Create new customer account
      const newCustomerId = `usr_cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const customerEmail = `${cleanMobile.replace(/[^0-9]/g, '')}@customer.tappzio.com`;
      const [newCustomer] = await db
        .insert(users)
        .values({
          id: newCustomerId,
          name: params.name.trim(),
          email: customerEmail,
          phoneNumber: cleanMobile,
          place: params.place?.trim() || null,
          business: params.business?.trim() || null,
          systemRole: 'user',
        })
        .returning();
      customerUserId = newCustomer.id;
    }
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    status: 'assigned',
    manualRedirectUrl: normalizedUrl,
    targetUrl: normalizedUrl,
    destinationType: 'url',
    ownerUserId: customerUserId || qr.ownerUserId,
    updatedAt: now,
  };

  if (!params.isReassign) {
    updateData.assignedBy = params.staffUserId;
    updateData.assignedAt = now;
  } else {
    updateData.lastReassignedAt = now;
  }

  const [updatedQR] = await db
    .update(qrCodes)
    .set(updateData)
    .where(eq(qrCodes.id, qr.id))
    .returning();

  // Invalidate edge cache immediately
  try {
    await redis.del(`qr:token:${token}`);
  } catch {
    // Ignore Redis error
  }

  return {
    success: true,
    qr: updatedQR,
    customerUserId,
  };
}

/**
 * Subsystem 3.3: Staff Performance Audit & History
 */
export async function getStaffAnalytics(staffUserId: string, limit: number = 50) {
  const assignedQRs = await db
    .select({
      id: qrCodes.id,
      token: qrCodes.token,
      label: qrCodes.label,
      serialNumber: qrCodes.serialNumber,
      manualRedirectUrl: qrCodes.manualRedirectUrl,
      status: qrCodes.status,
      assignedAt: qrCodes.assignedAt,
      scanCount: qrCodes.scanCount,
      customerName: users.name,
      customerPhone: users.phoneNumber,
      customerBusiness: users.business,
      customerPlace: users.place,
    })
    .from(qrCodes)
    .leftJoin(users, eq(qrCodes.ownerUserId, users.id))
    .where(eq(qrCodes.assignedBy, staffUserId))
    .orderBy(desc(qrCodes.assignedAt))
    .limit(limit);

  const [countResult] = await db
    .select({ totalConfigured: sql<number>`count(*)::int` })
    .from(qrCodes)
    .where(eq(qrCodes.assignedBy, staffUserId));

  return {
    totalConfigured: countResult?.totalConfigured || 0,
    history: assignedQRs,
  };
}

/**
 * Subsystem 3.4: Calendar Heatmap Analytics Engine
 * Returns daily assignment counts for GitHub-style luminous calendar heatmap.
 */
export async function getCalendarHeatmapAnalytics(params: {
  year: number;
  month: number; // 1-12
  organizationId?: string;
}) {
  const startDate = new Date(Date.UTC(params.year, params.month - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(params.year, params.month, 0, 23, 59, 59));

  const conditions = [
    gte(qrCodes.assignedAt, startDate),
    lte(qrCodes.assignedAt, endDate),
    eq(qrCodes.status, 'assigned'),
  ];

  if (params.organizationId) {
    conditions.push(eq(qrCodes.organizationId, params.organizationId));
  }

  // PostgreSQL date grouping
  const rows = await db
    .select({
      dateStr: sql<string>`TO_CHAR(${qrCodes.assignedAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(qrCodes)
    .where(and(...conditions))
    .groupBy(sql`TO_CHAR(${qrCodes.assignedAt}, 'YYYY-MM-DD')`);

  const dailyCounts: Record<string, number> = {};
  let totalAssigned = 0;
  let maxDaily = 0;

  for (const r of rows) {
    dailyCounts[r.dateStr] = r.count;
    totalAssigned += r.count;
    if (r.count > maxDaily) maxDaily = r.count;
  }

  const dailyAssignments = rows.map((r: { dateStr: string; count: number }) => ({
    date: r.dateStr,
    count: r.count,
  }));

  return {
    year: params.year,
    month: params.month,
    totalAssigned,
    maxDaily,
    dailyCounts,
    dailyAssignments,
  };
}

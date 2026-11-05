import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '@/db';
import { qrCodes, qrBatches } from '@/db/schema/qr';
import { redis } from '@/lib/redis';
import { CreateQRInput, UpdateQRInput } from './types';
import { generateQRToken, generateQRSerial } from './token';
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

  const token = generateQRToken();
  const id = `qr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const serial = generateQRSerial(Math.floor(100000 + Math.random() * 900000));

  const [created] = await db
    .insert(qrCodes)
    .values({
      id,
      serialNumber: serial,
      token,
      batchId: input.batchId || null,
      organizationId: input.organizationId || null,
      ownerUserId: input.ownerUserId || null,
      destinationType: input.destinationType,
      profileId: input.profileId || null,
      targetUrl: input.targetUrl || null,
      destinationPayload: input.destinationPayload ? JSON.stringify(input.destinationPayload) : null,
      status: 'active',
      isDynamic: input.isDynamic ?? true,
      designConfig: input.designConfig ? JSON.stringify(input.designConfig) : null,
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

  if (input.destinationType === 'url' && input.targetUrl) {
    const validated = validateTargetUrl(input.targetUrl);
    if (!validated.isValid) {
      throw new InvalidDestinationError(validated.error || 'Invalid target URL.');
    }
  }

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.destinationType !== undefined) updateValues.destinationType = input.destinationType;
  if (input.profileId !== undefined) updateValues.profileId = input.profileId;
  if (input.targetUrl !== undefined) updateValues.targetUrl = input.targetUrl;
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
 * Lists QR codes owned by a user or organization with pagination.
 */
export async function listQRCodes(params: {
  userId?: string;
  organizationId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.min(params.limit || 50, 100);
  const offset = params.offset || 0;

  const conditions = [];
  if (params.userId) conditions.push(eq(qrCodes.ownerUserId, params.userId));
  if (params.organizationId) conditions.push(eq(qrCodes.organizationId, params.organizationId));
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
 * Mints a bulk batch of unassigned dynamic QR codes with collision-free tokens.
 */
export async function createQRBatch(params: {
  name: string;
  quantity: number;
  batchCodePrefix?: string;
  productType?: string;
  destinationCategory?: string;
  organizationId?: string | null;
  createdBy: string;
}) {
  const quantity = Math.min(Math.max(params.quantity, 1), 1000); // Guard batch ceiling to 1,000 per request
  const timestamp = Date.now();
  const batchCode = `${params.batchCodePrefix || 'QRB'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const batchId = `qrb_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;

  // Insert batch metadata
  const [batch] = await db
    .insert(qrBatches)
    .values({
      id: batchId,
      batchCode,
      name: params.name,
      quantity,
      qrType: 'dynamic',
      destinationCategory: params.destinationCategory || 'profile',
      productType: params.productType || 'sticker',
      organizationId: params.organizationId || null,
      createdBy: params.createdBy,
    })
    .returning();

  // Mint bulk QR codes in chunks of 100
  const qrRecords = [];
  for (let i = 1; i <= quantity; i++) {
    qrRecords.push({
      id: `qr_${timestamp}_${i}_${Math.random().toString(36).slice(2, 7)}`,
      serialNumber: `${batchCode}-${String(i).padStart(4, '0')}`,
      token: generateQRToken(),
      batchId: batch.id,
      organizationId: params.organizationId || null,
      status: 'available',
      isDynamic: true,
      destinationType: 'profile',
    });
  }

  // Chunked batch insertion
  const CHUNK_SIZE = 100;
  for (let i = 0; i < qrRecords.length; i += CHUNK_SIZE) {
    const chunk = qrRecords.slice(i, i + CHUNK_SIZE);
    await db.insert(qrCodes).values(chunk);
  }

  return {
    batch,
    totalGenerated: quantity,
  };
}


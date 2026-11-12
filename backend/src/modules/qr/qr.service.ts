import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../database/redis.service';
import * as schema from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { ActorContext, DynamicQRResolution } from '@taptch/shared';
import * as crypto from 'crypto';

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);

  constructor(
    private dbService: DatabaseService,
    private redisService: RedisService,
  ) {}

  async resolveToken(token: string, ip?: string, userAgent?: string): Promise<DynamicQRResolution> {
    const cacheKey = `qr:token:${token}`;

    // 1. Edge Redis lookup (<50ms)
    const cached = await this.redisService.get(cacheKey);
    let resolution: DynamicQRResolution | null = null;

    if (cached) {
      try {
        resolution = JSON.parse(cached);
      } catch {
        // Fall back to database
      }
    }

    if (!resolution) {
      // 2. Database lookup
      const rows = await this.dbService.db
        .select()
        .from(schema.qrCodes)
        .where(eq(schema.qrCodes.token, token))
        .limit(1);

      if (rows.length === 0) {
        throw new NotFoundException(`QR Token "${token}" does not exist.`);
      }

      const qr = rows[0];

      if (qr.status === 'unassigned') {
        resolution = {
          token,
          destinationUrl: `/claim/${token}`,
          type: 'UNCLAIMED_CARD',
          targetId: qr.id,
        };
      } else if (qr.destinationType === 'profile' && qr.profileId) {
        // Find profile slug
        const prof = await this.dbService.db
          .select({ slug: schema.profiles.slug })
          .from(schema.profiles)
          .where(eq(schema.profiles.id, qr.profileId))
          .limit(1);

        const slug = prof[0]?.slug || qr.profileId;
        resolution = {
          token,
          destinationUrl: `/p/${slug}`,
          type: 'PROFILE',
          targetId: qr.profileId,
        };
      } else {
        resolution = {
          token,
          destinationUrl: qr.manualRedirectUrl || qr.targetUrl || '/',
          type: 'EXTERNAL_URL',
          targetId: qr.id,
        };
      }

      // Cache for 24 hours
      await this.redisService.set(cacheKey, JSON.stringify(resolution), 86400);
    }

    // 3. Asynchronously record scan event (non-blocking, privacy-safe)
    this.recordScanEvent(token, ip, userAgent).catch((err) => {
      this.logger.warn(`Failed to record scan metric: ${err.message}`);
    });

    return resolution;
  }

  private async recordScanEvent(token: string, ip?: string, userAgent?: string) {
    const qrRows = await this.dbService.db
      .select({ id: schema.qrCodes.id, profileId: schema.qrCodes.profileId, manualRedirectUrl: schema.qrCodes.manualRedirectUrl })
      .from(schema.qrCodes)
      .where(eq(schema.qrCodes.token, token))
      .limit(1);

    if (qrRows.length === 0) return;

    // Daily rotating salt for IP anonymization under DPDP Act compliance
    const dateStr = new Date().toISOString().slice(0, 10);
    const salt = process.env.VISITOR_SALT_SECRET || 'taptch-salt-2026';
    const visitorHash = ip ? crypto.createHash('sha256').update(`${ip}-${dateStr}-${salt}`).digest('hex') : 'anonymous-visitor';

    await this.dbService.db.insert(schema.qrScanEvents).values({
      id: crypto.randomUUID(),
      qrId: qrRows[0].id,
      profileId: qrRows[0].profileId,
      destinationType: 'url',
      resolvedUrl: qrRows[0].manualRedirectUrl || '/',
      visitorHash,
      createdAt: new Date(),
    });
  }

  async findAllForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      return tx
        .select()
        .from(schema.qrCodes)
        .where(eq(schema.qrCodes.ownerUserId, actor.userId))
        .orderBy(desc(schema.qrCodes.createdAt));
    });
  }

  async createDynamicQr(actor: ActorContext, data: any) {
    if (!data.destinationUrl) {
      throw new BadRequestException('A destination URL is required.');
    }

    const token = crypto.randomBytes(4).toString('hex');
    const serialNumber = `QR-${Date.now().toString().slice(-6)}`;
    const id = crypto.randomUUID();

    const [created] = await this.dbService.withActor(actor, async (tx) => {
      return tx
        .insert(schema.qrCodes)
        .values({
          id,
          serialNumber,
          ownerUserId: actor.userId,
          token,
          label: data.title || 'Dynamic QR',
          destinationType: 'url',
          manualRedirectUrl: data.destinationUrl,
          targetUrl: data.destinationUrl,
          status: 'assigned',
          isDynamic: true,
        })
        .returning();
    });

    return created;
  }
}

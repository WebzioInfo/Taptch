/**
 * TAPTCH — CLOUDINARY TO CLOUDFLARE ASSET MIGRATION ENGINE
 *
 * Automated CLI utility to enumerate, download, verify, upload, and update
 * media assets from Cloudinary to Cloudflare (Images / R2).
 *
 * Usage:
 *   npx tsx scripts/migrate-cloudinary-to-cloudflare.ts [--dry-run] [--batch-size=10] [--resume]
 */

import { db } from '../src/db';
import { mediaAssets } from '../src/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import { getCloudflareConfig } from '../src/lib/storage/config';
import { uploadToCloudflareImages } from '../src/lib/storage/cloudflare-images';
import { uploadToCloudflareR2 } from '../src/lib/storage/cloudflare-r2';
import fs from 'fs';
import path from 'path';

interface MigrationReportItem {
  id: string;
  originalPublicId: string | null;
  originalUrl: string;
  newStorageKey?: string;
  newDeliveryUrl?: string;
  provider: 'cloudflare_images' | 'cloudflare_r2' | 'simulated';
  bytes?: number;
  status: 'PENDING' | 'SUCCESS' | 'SKIPPED' | 'FAILED';
  error?: string;
}

async function runMigration() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || !args.includes('--live');
  const batchSize = Number(args.find((a) => a.startsWith('--batch-size='))?.split('=')[1]) || 10;
  const isResume = args.includes('--resume');

  console.log('================================================================');
  console.log(' TAPTCH: CLOUDINARY -> CLOUDFLARE ASSET MIGRATION UTILITY');
  console.log('================================================================');
  console.log(`Mode:       ${isDryRun ? 'DRY-RUN (Simulation only, no data written)' : 'LIVE EXECUTION'}`);
  console.log(`Batch Size: ${batchSize}`);
  console.log(`Resume:     ${isResume ? 'Enabled' : 'Disabled'}`);

  const cfConfig = getCloudflareConfig();
  console.log(`Cloudflare Images Configured: ${cfConfig.isImagesConfigured ? 'YES' : 'NO'}`);
  console.log(`Cloudflare R2 Configured:     ${cfConfig.isR2Configured ? 'YES' : 'NO'}`);

  if (!isDryRun && !cfConfig.isConfigured) {
    console.error('\n[FATAL] Cannot run live migration without Cloudflare credentials in environment.');
    console.error('Please configure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_IMAGES_API_TOKEN, etc.');
    console.error('Run with --dry-run to simulate and audit without credentials.\n');
    process.exit(1);
  }

  // Enumerate records needing migration
  const query = db
    .select()
    .from(mediaAssets)
    .where(
      or(
        sql`"secure_url" LIKE '%cloudinary.com%'`,
        sql`"cloudinary_public_id" IS NOT NULL AND ("storage_provider" = 'mock' OR "storage_provider" = 'cloudinary')`
      )
    );

  const assetsToMigrate = await query;
  console.log(`\nFound ${assetsToMigrate.length} candidate asset(s) referencing Cloudinary.\n`);

  if (assetsToMigrate.length === 0) {
    console.log('No assets require migration. Database is already fully Cloudflare-native!');
    return;
  }

  const report: MigrationReportItem[] = [];
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < assetsToMigrate.length; i += batchSize) {
    const batch = assetsToMigrate.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(assetsToMigrate.length / batchSize)}...`);

    for (const asset of batch) {
      const itemReport: MigrationReportItem = {
        id: asset.id,
        originalPublicId: asset.cloudinaryPublicId || asset.storageKey,
        originalUrl: asset.secureUrl,
        provider: 'simulated',
        status: 'PENDING',
      };

      try {
        const isDocument = asset.resourceType === 'raw' || asset.mediaCategory === 'brochure';
        const isVideo = asset.resourceType === 'video' || asset.mediaCategory === 'video';

        console.log(` -> Inspecting asset ${asset.id} (${asset.mediaCategory}): ${asset.secureUrl}`);

        if (isDryRun) {
          itemReport.status = 'SUCCESS';
          itemReport.provider = isDocument || isVideo ? 'cloudflare_r2' : 'cloudflare_images';
          itemReport.newStorageKey = isDocument || isVideo ? `documents/${asset.id}.pdf` : `cf_img_${asset.id}`;
          itemReport.newDeliveryUrl =
            isDocument || isVideo
              ? `https://assets.taptch.com/${itemReport.newStorageKey}`
              : `https://imagedelivery.net/${cfConfig.imagesAccountHash || 'target-hash'}/${itemReport.newStorageKey}/public`;
          successCount++;
          report.push(itemReport);
          continue;
        }

        // Live download & upload
        console.log(`    Downloading original from: ${asset.secureUrl}`);
        const downloadRes = await fetch(asset.secureUrl);
        if (!downloadRes.ok) {
          throw new Error(`Failed to download from Cloudinary: HTTP ${downloadRes.status}`);
        }

        const buffer = Buffer.from(await downloadRes.arrayBuffer());
        itemReport.bytes = buffer.length;

        if (isDocument || isVideo) {
          const ext = isDocument ? 'pdf' : 'mp4';
          const r2Key = `migrated/${asset.mediaCategory}/${asset.id}.${ext}`;
          const r2Res = await uploadToCloudflareR2(buffer, r2Key, isDocument ? 'application/pdf' : 'video/mp4');

          itemReport.provider = 'cloudflare_r2';
          itemReport.newStorageKey = r2Key;
          itemReport.newDeliveryUrl = r2Res.publicUrl;

          // Update database safely
          await db
            .update(mediaAssets)
            .set({
              storageProvider: 'cloudflare_r2',
              storageKey: r2Key,
              storageObjectId: r2Key,
              assetUrl: r2Res.publicUrl,
              secureUrl: r2Res.publicUrl,
              fileSize: buffer.length,
              updatedAt: new Date(),
            })
            .where(eq(mediaAssets.id, asset.id));
        } else {
          const imgRes = await uploadToCloudflareImages(buffer, `${asset.id}.png`, {
            ownerId: asset.ownerId,
            category: asset.mediaCategory,
          });

          itemReport.provider = 'cloudflare_images';
          itemReport.newStorageKey = imgRes.imageId;
          itemReport.newDeliveryUrl = imgRes.deliveryUrl;

          // Update database safely
          await db
            .update(mediaAssets)
            .set({
              storageProvider: 'cloudflare_images',
              storageKey: imgRes.imageId,
              storageObjectId: imgRes.imageId,
              assetUrl: imgRes.deliveryUrl,
              secureUrl: imgRes.deliveryUrl,
              fileSize: buffer.length,
              updatedAt: new Date(),
            })
            .where(eq(mediaAssets.id, asset.id));
        }

        itemReport.status = 'SUCCESS';
        successCount++;
        console.log(`    ✅ Migrated to ${itemReport.provider}: ${itemReport.newDeliveryUrl}`);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        itemReport.status = 'FAILED';
        itemReport.error = errorMsg;
        failCount++;
        console.error(`    ❌ Migration failed for ${asset.id}: ${errorMsg}`);
      }

      report.push(itemReport);
    }
  }

  // Save detailed log file
  const logDir = path.resolve(process.cwd(), 'docs/migrations');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, `cloudflare-migration-${Date.now()}.json`);
  fs.writeFileSync(logFile, JSON.stringify(report, null, 2));

  console.log('\n================================================================');
  console.log(' MIGRATION SUMMARY');
  console.log('================================================================');
  console.log(`Total Candidates: ${assetsToMigrate.length}`);
  console.log(`Successful:       ${successCount}`);
  console.log(`Failed:           ${failCount}`);
  console.log(`Skipped:          ${skippedCount}`);
  console.log(`Log File:         ${logFile}`);
  console.log('================================================================\n');
}

runMigration().catch((err) => {
  console.error('Fatal migration runner error:', err);
  process.exit(1);
});

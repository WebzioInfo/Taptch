/**
 * Cloudflare Storage Configuration Resolver
 * Loads and validates Cloudflare Images & Cloudflare R2 credentials.
 */

export interface CloudflareConfig {
  accountId: string;
  imagesApiToken: string;
  imagesAccountHash: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketName: string;
  r2Endpoint: string;
  r2PublicBaseUrl: string;
  isImagesConfigured: boolean;
  isR2Configured: boolean;
  isConfigured: boolean;
}

export function getCloudflareConfig(): CloudflareConfig {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
  const imagesApiToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN || '';
  const imagesAccountHash = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH || '';

  const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
  const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
  const r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'taptch-media';
  const r2Endpoint =
    process.env.CLOUDFLARE_R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
  const r2PublicBaseUrl =
    process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL || 'https://assets.taptch.com';

  const isImagesConfigured = Boolean(accountId && imagesApiToken && imagesAccountHash);
  const isR2Configured = Boolean(accountId && r2AccessKeyId && r2SecretAccessKey);
  const isConfigured = isImagesConfigured || isR2Configured;

  return {
    accountId,
    imagesApiToken,
    imagesAccountHash,
    r2AccessKeyId,
    r2SecretAccessKey,
    r2BucketName,
    r2Endpoint,
    r2PublicBaseUrl,
    isImagesConfigured,
    isR2Configured,
    isConfigured,
  };
}

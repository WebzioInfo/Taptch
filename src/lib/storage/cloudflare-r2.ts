/**
 * Cloudflare R2 Object Storage Adapter
 * Handles non-image assets (PDF documents, video files, raw media) using Cloudflare R2.
 * https://developers.cloudflare.com/r2/
 */

import { getCloudflareConfig } from './config';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * Generates an AWS Signature V4 authorization header for Cloudflare R2 S3-compatible API.
 */
function signAwsV4({
  method,
  url,
  region = 'auto',
  service = 's3',
  accessKey,
  secretKey,
  bodyHash,
  datetime,
  headersToSign,
}: {
  method: string;
  url: URL;
  region?: string;
  service?: string;
  accessKey: string;
  secretKey: string;
  bodyHash: string;
  datetime: string;
  headersToSign: Record<string, string>;
}): string {
  const dateOnly = datetime.substring(0, 8);
  const credentialScope = `${dateOnly}/${region}/${service}/aws4_request`;

  const sortedHeaderKeys = Object.keys(headersToSign).sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((k) => `${k.toLowerCase()}:${headersToSign[k].trim()}\n`)
    .join('');
  const signedHeaders = sortedHeaderKeys.map((k) => k.toLowerCase()).join(';');

  const canonicalRequest = [
    method,
    url.pathname,
    url.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    datetime,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  const kDate = crypto.createHmac('sha256', `AWS4${secretKey}`).update(dateOnly).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();

  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

/**
 * Uploads a document, video, or raw file buffer to Cloudflare R2.
 */
export async function uploadToCloudflareR2(
  buffer: Buffer,
  key: string,
  contentType: string = 'application/octet-stream'
): Promise<{ key: string; publicUrl: string }> {
  const config = getCloudflareConfig();
  if (!config.isR2Configured) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const endpointUrl = new URL(`${config.r2Endpoint}/${config.r2BucketName}/${key}`);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const bodyHash = crypto.createHash('sha256').update(buffer).digest('hex');

  const headers: Record<string, string> = {
    host: endpointUrl.host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': bodyHash,
    'content-type': contentType,
    'content-length': String(buffer.length),
  };

  const authHeader = signAwsV4({
    method: 'PUT',
    url: endpointUrl,
    region: 'auto',
    service: 's3',
    accessKey: config.r2AccessKeyId,
    secretKey: config.r2SecretAccessKey,
    bodyHash,
    datetime: amzDate,
    headersToSign: headers,
  });

  const response = await fetch(endpointUrl.toString(), {
    method: 'PUT',
    headers: {
      ...headers,
      Authorization: authHeader,
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ status: response.status, errorText }, 'Cloudflare R2 upload failed');
    throw new Error(`R2 upload failed with status ${response.status}: ${errorText}`);
  }

  const publicUrl = `${config.r2PublicBaseUrl.replace(/\/$/, '')}/${key}`;
  return {
    key,
    publicUrl,
  };
}

/**
 * Deletes an object from Cloudflare R2.
 */
export async function deleteFromCloudflareR2(key: string): Promise<boolean> {
  const config = getCloudflareConfig();
  if (!config.isR2Configured) {
    return true;
  }

  const endpointUrl = new URL(`${config.r2Endpoint}/${config.r2BucketName}/${key}`);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const bodyHash = crypto.createHash('sha256').update('').digest('hex');

  const headers: Record<string, string> = {
    host: endpointUrl.host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': bodyHash,
  };

  const authHeader = signAwsV4({
    method: 'DELETE',
    url: endpointUrl,
    region: 'auto',
    service: 's3',
    accessKey: config.r2AccessKeyId,
    secretKey: config.r2SecretAccessKey,
    bodyHash,
    datetime: amzDate,
    headersToSign: headers,
  });

  try {
    const response = await fetch(endpointUrl.toString(), {
      method: 'DELETE',
      headers: {
        ...headers,
        Authorization: authHeader,
      },
    });

    return response.ok;
  } catch (err) {
    logger.warn({ err, key }, 'Error deleting asset from Cloudflare R2');
    return false;
  }
}

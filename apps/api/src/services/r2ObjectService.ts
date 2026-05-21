import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getR2Config } from '../config/r2Config.js';

export interface R2ObjectDeleteFailure {
  key: string;
  message: string;
}

export interface R2ObjectsDeleteResult {
  deleted: string[];
  failed: R2ObjectDeleteFailure[];
}

function createR2Client(): S3Client {
  const config = getR2Config();
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/**
 * Normalize a raw value into an R2 object key.
 * Rejects URLs and strips bucket/query/leading slash prefixes.
 */
export function normalizeR2ObjectKey(
  raw: string | null | undefined,
  bucketName: string,
): string | null {
  if (!raw?.trim()) {
    return null;
  }

  let key = raw.trim();
  const queryIndex = key.indexOf('?');
  if (queryIndex >= 0) {
    key = key.slice(0, queryIndex);
  }

  if (key.startsWith('http://') || key.startsWith('https://')) {
    return null;
  }

  key = key.replace(/^\/+/, '');
  const bucketPrefix = `${bucketName}/`;
  if (key.startsWith(bucketPrefix)) {
    key = key.slice(bucketPrefix.length);
  }

  return key || null;
}

export async function deleteR2ObjectByKey(storageKey: string): Promise<void> {
  const config = getR2Config();
  const key = normalizeR2ObjectKey(storageKey, config.bucketName);
  if (!key) {
    return;
  }

  const client = createR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}

export async function deleteR2ObjectsByKeys(
  storageKeys: string[],
): Promise<R2ObjectsDeleteResult> {
  const config = getR2Config();
  const uniqueKeys = [
    ...new Set(
      storageKeys
        .map((raw) => normalizeR2ObjectKey(raw, config.bucketName))
        .filter((key): key is string => Boolean(key)),
    ),
  ];

  const deleted: string[] = [];
  const failed: R2ObjectDeleteFailure[] = [];

  if (uniqueKeys.length === 0) {
    return { deleted, failed };
  }

  const client = createR2Client();

  for (const key of uniqueKeys) {
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: key,
        }),
      );
      deleted.push(key);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown delete error';
      failed.push({ key, message });
      console.warn('[r2-delete] failed', { key, message });
    }
  }

  return { deleted, failed };
}

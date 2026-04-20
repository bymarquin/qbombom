const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const CDN_URL = process.env.R2_CDN_URL;

function getCacheControlByKey(key) {
  if (key.startsWith('products/')) {
    return 'public, max-age=31536000, immutable'
  }

  return 'public, max-age=86400'
}

/**
 * Faz upload de um buffer para o R2 e retorna a URL pública.
 * @param {Buffer} buffer
 * @param {string} key  - caminho dentro do bucket (ex: receipts/receipt_xxx.png)
 * @param {string} contentType - MIME type do arquivo
 * @returns {Promise<string>} URL pública do arquivo
 */
async function uploadFile(buffer, key, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: getCacheControlByKey(key),
  }));

  return `${CDN_URL}/${key}`;
}

/**
 * Remove um arquivo do R2.
 * @param {string} key - caminho dentro do bucket
 */
async function deleteFile(key) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Lista arquivos de um prefixo no bucket.
 * @param {{ prefix?: string, maxKeys?: number }} options
 */
async function listFiles({ prefix = '', maxKeys = 200, continuationToken } = {}) {
  const response = await r2.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: Math.min(Math.max(Number(maxKeys) || 200, 1), 1000),
      ContinuationToken: continuationToken || undefined,
    }),
  );

  const files = (response.Contents || []).map((item) => ({
    key: item.Key,
    size: item.Size || 0,
    lastModified: item.LastModified ? item.LastModified.toISOString() : null,
    url: CDN_URL ? `${CDN_URL}/${item.Key}` : null,
  }));

  return {
    files,
    isTruncated: !!response.IsTruncated,
    nextContinuationToken: response.NextContinuationToken || null,
  };
}

async function moveFile(sourceKey, destinationKey) {
  await r2.send(new CopyObjectCommand({
    Bucket: BUCKET,
    CopySource: `${BUCKET}/${sourceKey}`,
    Key: destinationKey,
  }));

  await deleteFile(sourceKey);

  return {
    key: destinationKey,
    url: CDN_URL ? `${CDN_URL}/${destinationKey}` : null,
  };
}

async function getFile(key) {
  const response = await r2.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));

  const bytes = await response.Body.transformToByteArray();

  return {
    buffer: Buffer.from(bytes),
    contentType: response.ContentType || 'application/octet-stream',
    cacheControl: response.CacheControl || 'public, max-age=86400',
  };
}

module.exports = { uploadFile, deleteFile, listFiles, moveFile, getFile };

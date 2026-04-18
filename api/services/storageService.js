const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

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

module.exports = { uploadFile, deleteFile };

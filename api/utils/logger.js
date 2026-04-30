'use strict';

const isProduction = process.env.NODE_ENV === 'production';

function sanitizeMeta(meta = {}) {
  const sanitized = { ...meta };
  delete sanitized.authorization;
  delete sanitized.accessToken;
  delete sanitized.token;
  delete sanitized.customerPhone;
  delete sanitized.qrCode;
  delete sanitized.qrCodeBase64;
  return sanitized;
}

function info(event, meta = {}) {
  if (isProduction) return;
  console.info(`[${event}]`, sanitizeMeta(meta));
}

function warn(event, meta = {}) {
  console.warn(`[${event}]`, sanitizeMeta(meta));
}

function error(event, err, meta = {}) {
  const payload = {
    ...sanitizeMeta(meta),
    message: err?.message || String(err),
    status: err?.response?.status || null,
  };
  console.error(`[${event}]`, payload);
}

module.exports = {
  info,
  warn,
  error,
};

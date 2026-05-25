'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = process.env.MERCADOPAGO_API_URL || 'https://api.mercadopago.com';

function isEnabled() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function buildHeaders(idempotencyKey) {
  const headers = {
    Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };

  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }

  return headers;
}

function buildNotificationUrl() {
  if (!process.env.API_URL) return null;
  const rawBase = process.env.API_URL.replace(/\/$/, '');
  const base = rawBase.endsWith('/api') ? rawBase.slice(0, -4) : rawBase;
  const webhookToken = process.env.MERCADOPAGO_WEBHOOK_TOKEN;
  const tokenQuery = webhookToken ? `?token=${encodeURIComponent(webhookToken)}` : '';
  return `${base}/api/orders/webhooks/pix-gateway${tokenQuery}`;
}

function normalizePixData(payment) {
  const tx = payment?.point_of_interaction?.transaction_data || {};
  return {
    paymentId: payment?.id ? String(payment.id) : null,
    status: payment?.status || null,
    qrCode: tx.qr_code || null,
    qrCodeBase64: tx.qr_code_base64 || null,
    ticketUrl: tx.ticket_url || null,
    expiresAt: payment?.date_of_expiration || null,
  };
}

async function createPixPayment({ order, payerEmail, description, amount }) {
  if (!isEnabled()) return null;

  const expirationMinutes = Number(process.env.PIX_EXPIRATION_MINUTES || 30);
  const dateOfExpiration = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();

  const notificationUrl = buildNotificationUrl();
  const payload = {
    transaction_amount: Number(amount),
    description,
    payment_method_id: 'pix',
    date_of_expiration: dateOfExpiration,
    payer: {
      email: payerEmail,
    },
    external_reference: order.id,
    metadata: {
      orderId: order.id,
      trackingCode: order.trackingCode,
    },
  };

  logger.info('pix_gateway.pix.create_start', {
    orderId: order.id,
    trackingCode: order.trackingCode,
    amount: Number(amount),
    hasNotificationUrl: Boolean(notificationUrl),
  });

  if (notificationUrl) {
    payload.notification_url = notificationUrl;
  }

  const idempotencyKey = `order-${order.id}`;
  const { data } = await axios.post(`${BASE_URL}/v1/payments`, payload, {
    headers: buildHeaders(idempotencyKey),
    timeout: 15000,
  });

  logger.info('pix_gateway.pix.create_done', {
    orderId: order.id,
    paymentId: data?.id,
    status: data?.status,
  });

  return normalizePixData(data);
}

async function getPayment(paymentId) {
  if (!isEnabled()) return null;
  const { data } = await axios.get(`${BASE_URL}/v1/payments/${paymentId}`, {
    headers: buildHeaders(),
    timeout: 15000,
  });
  return data;
}

module.exports = {
  isEnabled,
  createPixPayment,
  getPayment,
  normalizePixData,
};

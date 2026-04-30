'use strict';

const mercadoPagoService = require('./mercadoPagoService');
const logger = require('../utils/logger');

function isPendingPix(order) {
  return order?.paymentMethod === 'PIX' && order?.paymentStatus === 'pendente';
}

function canSyncPixStatus(order) {
  if (!order) return false;
  if (order.paymentMethod !== 'PIX') return false;
  if (order.paymentStatus === 'pago') return false;
  if (order.paymentProvider !== 'mercadopago') return false;
  if (!order.paymentProviderReference) return false;
  return mercadoPagoService.isEnabled();
}

async function ensurePixPayment(order) {
  if (!isPendingPix(order) || !mercadoPagoService.isEnabled()) return order;
  if (order.paymentProviderReference && order.pixQrCode) return order;

  const payerEmail = order.customerPhone
    ? `cliente-${order.customerPhone.replace(/\D/g, '').slice(-8) || 'pix'}@qbombom.com`
    : `pedido-${order.id.slice(0, 8)}@qbombom.com`;

  const payment = await mercadoPagoService.createPixPayment({
    order,
    payerEmail,
    description: `Pedido Qbombom #${order.trackingCode || order.id.slice(0, 8)}`,
    amount: order.total,
  });

  if (!payment) return order;

  order.paymentProvider = 'mercadopago';
  order.paymentProviderReference = payment.paymentId;
  order.pixQrCode = payment.qrCode;
  order.pixQrCodeBase64 = payment.qrCodeBase64;
  order.pixExpiresAt = payment.expiresAt ? new Date(payment.expiresAt) : null;
  await order.save();

  logger.info('orders.pix.created', { orderId: order.id, status: order.status });
  return order;
}

async function applyPaymentToOrder(order, payment) {
  const pixData = mercadoPagoService.normalizePixData(payment);
  let changed = false;
  let paymentApprovedNow = false;

  if (pixData.paymentId && order.paymentProviderReference !== pixData.paymentId) {
    order.paymentProviderReference = pixData.paymentId;
    changed = true;
  }

  if (pixData.qrCode && order.pixQrCode !== pixData.qrCode) {
    order.pixQrCode = pixData.qrCode;
    changed = true;
  }

  if (pixData.qrCodeBase64 && order.pixQrCodeBase64 !== pixData.qrCodeBase64) {
    order.pixQrCodeBase64 = pixData.qrCodeBase64;
    changed = true;
  }

  if (pixData.expiresAt) {
    const nextExpiry = new Date(pixData.expiresAt);
    if (!Number.isNaN(nextExpiry.getTime()) && String(order.pixExpiresAt) !== String(nextExpiry)) {
      order.pixExpiresAt = nextExpiry;
      changed = true;
    }
  }

  if (payment.status === 'approved' && order.paymentStatus !== 'pago') {
    order.paymentStatus = 'pago';
    if (order.status === 'aguardando_pagamento') order.status = 'novo';
    paymentApprovedNow = true;
    changed = true;
  }

  order.paymentProvider = 'mercadopago';
  if (changed) await order.save();
  return { changed, paymentApprovedNow };
}

async function syncPixPaymentStatus(order, { onOrderUpdated } = {}) {
  if (!canSyncPixStatus(order)) return order;

  try {
    const payment = await mercadoPagoService.getPayment(order.paymentProviderReference);
    if (!payment) return order;

    const result = await applyPaymentToOrder(order, payment);
    if (result.changed && onOrderUpdated) {
      await onOrderUpdated(order, result);
    }
  } catch (error) {
    logger.error('orders.pix.sync_failed', error, { orderId: order.id });
  }

  return order;
}

module.exports = {
  ensurePixPayment,
  applyPaymentToOrder,
  syncPixPaymentStatus,
};

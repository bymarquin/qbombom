'use strict';

// ESC/POS command bytes
const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

const CMD = {
  INIT:         Buffer.from([ESC, 0x40]),
  ALIGN_LEFT:   Buffer.from([ESC, 0x61, 0x00]),
  ALIGN_CENTER: Buffer.from([ESC, 0x61, 0x01]),
  ALIGN_RIGHT:  Buffer.from([ESC, 0x61, 0x02]),
  BOLD_ON:      Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF:     Buffer.from([ESC, 0x45, 0x00]),
  DOUBLE_ON:    Buffer.from([GS,  0x21, 0x11]),
  DOUBLE_OFF:   Buffer.from([GS,  0x21, 0x00]),
  FEED_3:       Buffer.from([ESC, 0x64, 0x03]),
  FEED_5:       Buffer.from([ESC, 0x64, 0x05]),
  CUT:          Buffer.from([GS,  0x56, 0x41, 0x03]),
};

// 72mm representa a largura util de impressao da GT-710 (bobina 72x210mm).
const COLS = { '80mm': 48, '72mm': 42, '58mm': 32 };

// Remove acentos e substitui chars problemáticos para CP437/CP850
function sanitize(str) {
  return String(str ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '?');
}

function line(text) {
  return Buffer.from(sanitize(text) + '\n', 'ascii');
}

function pad(left, right, cols) {
  const leftS  = sanitize(left);
  const rightS = sanitize(right);
  const spaces = Math.max(1, cols - leftS.length - rightS.length);
  return Buffer.from(leftS + ' '.repeat(spaces) + rightS + '\n', 'ascii');
}

function divider(cols, char = '-') {
  return Buffer.from(char.repeat(cols) + '\n', 'ascii');
}

function center(text, cols) {
  const s = sanitize(text);
  const pad = Math.max(0, Math.floor((cols - s.length) / 2));
  return Buffer.from(' '.repeat(pad) + s + '\n', 'ascii');
}

function wrap(text, cols, indent = 0) {
  const words = sanitize(text).split(' ');
  const lines = [];
  let current = ' '.repeat(indent);

  for (const word of words) {
    if (current.length + word.length + 1 > cols && current.trim().length > 0) {
      lines.push(current.trimEnd());
      current = ' '.repeat(indent) + word;
    } else {
      current += (current.trim() ? ' ' : '') + word;
    }
  }
  if (current.trim()) lines.push(current.trimEnd());
  return Buffer.from(lines.join('\n') + '\n', 'ascii');
}

function buildDeliveryAccessUrl(order, storeConfig = {}) {
  if (order.type !== 'Entrega') return '';
  const tracking = String(order.trackingCode || '').trim();
  if (!tracking) return '';

  const configBase = String(storeConfig?.profile?.deliveryUrlBase || '').trim();
  const envBase = String(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const base = configBase || envBase;
  return `${base}/delivery?track=${encodeURIComponent(tracking)}`;
}

function buildEscposQrBuffers(data) {
  const payload = Buffer.from(String(data || ''), 'ascii');
  if (!payload.length) return [];

  const storeLen = payload.length + 3;
  const pL = storeLen & 0xff;
  const pH = (storeLen >> 8) & 0xff;

  return [
    Buffer.from([GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]), // model 2
    Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]),       // module size
    Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]),       // EC level M
    Buffer.concat([Buffer.from([GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]), payload]),
    Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]),       // print
  ];
}

/**
 * Constrói Buffer ESC/POS de comanda para pedido.
 * @param {object} order - objeto de pedido com items populados
 * @param {object} storeConfig - configuração da loja (profile, print)
 * @returns {Buffer}
 */
function buildOrderBuffer(order, storeConfig = {}) {
  const paperSize = storeConfig?.print?.paperSize || '72mm';
  const cols = COLS[paperSize] || 48;

  const storeName  = sanitize(storeConfig?.profile?.name  || 'Qbombom');
  const storeSub   = sanitize(storeConfig?.profile?.phone || '');

  const typeLabel = order.type === 'Entrega'
    ? 'ENTREGA'
    : order.type === 'Balcao' || order.type === 'Balcao' || order.type === 'Balcão'
      ? 'BALCAO / RETIRADA'
      : order.type === 'Mesa'
        ? 'MESA'
        : sanitize(order.type || '').toUpperCase();

  const trackCode = order.trackingCode || (order.id || '').slice(0, 8);
  const deliveryAccessUrl = buildDeliveryAccessUrl(order, storeConfig);
  const tableLabel = order.type === 'Mesa' && order.tableNumber
    ? String(order.tableNumber).trim()
    : '';
  const createdAt = new Date(order.createdAt || new Date()).toLocaleString('pt-BR', {
    timeZone: 'America/Fortaleza',
  });

  const parts = [];

  // Init
  parts.push(CMD.INIT);

  // Store header
  parts.push(CMD.ALIGN_CENTER);
  parts.push(CMD.BOLD_ON, CMD.DOUBLE_ON);
  parts.push(center(storeName, cols));
  parts.push(CMD.DOUBLE_OFF, CMD.BOLD_OFF);
  if (storeSub) parts.push(center(storeSub, cols));
  parts.push(divider(cols));

  // Order number (destaque)
  parts.push(CMD.BOLD_ON, CMD.DOUBLE_ON);
  parts.push(center(`#${trackCode}`, cols));
  parts.push(CMD.DOUBLE_OFF, CMD.BOLD_OFF);
  parts.push(CMD.BOLD_ON);
  parts.push(center(typeLabel, cols));
  if (tableLabel) {
    parts.push(center(tableLabel.toLowerCase().startsWith('mesa') ? tableLabel.toUpperCase() : `MESA ${tableLabel}`, cols));
  }
  parts.push(CMD.BOLD_OFF);
  parts.push(center(createdAt, cols));
  parts.push(divider(cols));

  // Customer
  parts.push(CMD.ALIGN_LEFT);
  parts.push(CMD.BOLD_ON);
  parts.push(line('CLIENTE'));
  parts.push(CMD.BOLD_OFF);
  parts.push(line(order.customerName || 'Nao informado'));
  if (order.customerPhone) parts.push(line(order.customerPhone));
  if (order.type === 'Entrega' && order.deliveryAddress) {
    parts.push(CMD.BOLD_ON);
    parts.push(line('ENDERECO:'));
    parts.push(CMD.BOLD_OFF);
    parts.push(wrap(order.deliveryAddress, cols, 2));
  }
  parts.push(divider(cols));

  // Items
  parts.push(CMD.ALIGN_CENTER);
  parts.push(CMD.BOLD_ON);
  parts.push(center('ITENS DO PEDIDO', cols));
  parts.push(CMD.BOLD_OFF);
  parts.push(CMD.ALIGN_LEFT);
  parts.push(divider(cols));

  const items = Array.isArray(order.items) ? order.items : [];
  if (items.length === 0) {
    parts.push(line('Itens nao detalhados.'));
  } else {
    for (const item of items) {
      const name     = sanitize(item.product?.name || 'Produto');
      const varName  = item.variation?.name ? ` (${sanitize(item.variation.name)})` : '';
      const qty      = String(item.quantity || 1);
      const price    = `R$${Number(item.totalPrice || 0).toFixed(2).replace('.', ',')}`;

      parts.push(CMD.BOLD_ON);
      parts.push(pad(`${qty}x ${name}${varName}`, price, cols));
      parts.push(CMD.BOLD_OFF);

      // Adicionais
      let additionals = [];
      try {
        additionals = typeof item.selectedAdditionals === 'string'
          ? JSON.parse(item.selectedAdditionals)
          : (Array.isArray(item.selectedAdditionals) ? item.selectedAdditionals : []);
      } catch { /* ignore */ }

      for (const a of additionals) {
        parts.push(line(`  + ${sanitize(a.name)}`));
      }

      if (item.observation) {
        parts.push(line(`  * ${sanitize(item.observation)}`));
      }
    }
  }

  parts.push(divider(cols));

  // Totals
  if (order.discount && Number(order.discount) > 0) {
    parts.push(pad('Desconto', `-R$${Number(order.discount).toFixed(2).replace('.', ',')}`, cols));
  }

  parts.push(pad('Pagamento', sanitize(order.paymentMethod || 'Nao informado'), cols));
  parts.push(pad('Situacao', order.paymentStatus === 'pago' ? 'PAGO' : 'PENDENTE', cols));

  parts.push(CMD.BOLD_ON, CMD.DOUBLE_ON);
  parts.push(pad('TOTAL', `R$${Number(order.total || 0).toFixed(2).replace('.', ',')}`, cols));
  parts.push(CMD.DOUBLE_OFF, CMD.BOLD_OFF);

  // Observation
  if (order.observation) {
    parts.push(divider(cols, '='));
    parts.push(CMD.BOLD_ON);
    parts.push(line('OBS GERAL:'));
    parts.push(CMD.BOLD_OFF);
    parts.push(wrap(order.observation, cols, 2));
    parts.push(divider(cols, '='));
  }

  if (deliveryAccessUrl) {
    parts.push(divider(cols));
    parts.push(CMD.ALIGN_CENTER);
    parts.push(CMD.BOLD_ON);
    parts.push(center('ACESSO ENTREGADOR', cols));
    parts.push(CMD.BOLD_OFF);
    for (const chunk of buildEscposQrBuffers(deliveryAccessUrl)) {
      parts.push(chunk);
    }
    parts.push(Buffer.from([LF]));
    parts.push(wrap(deliveryAccessUrl, cols, 0));
  }

  // Footer
  parts.push(CMD.ALIGN_CENTER);
  parts.push(CMD.FEED_3);
  parts.push(line('Obrigado pela preferencia!'));
  parts.push(Buffer.from([LF]));
  parts.push(CMD.FEED_5);
  parts.push(CMD.CUT);

  return Buffer.concat(parts);
}

module.exports = { buildOrderBuffer };

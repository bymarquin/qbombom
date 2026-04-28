const PAPER_SIZES = new Set(['58mm', '72mm', '80mm']);
const LOAD_TIMEOUT_MS = 8000;
const FALLBACK_FINISH_MS = 15000;

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const normalizePaperSize = (paperSize) => (
  PAPER_SIZES.has(String(paperSize || '').trim()) ? String(paperSize).trim() : '80mm'
);

const parseAdditionals = (raw) => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const groupAdditionals = (additionals) => {
  const map = new Map();
  for (const add of additionals) {
    const key = add.groupName || add.grupoName || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(add);
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }));
};

const buildAdditionalsHtml = (additionals) => {
  if (!additionals.length) return '';
  const groups = groupAdditionals(additionals);
  const lines = [];
  for (const group of groups) {
    if (group.name) lines.push(`  <span class="item-group">${esc(group.name)}:</span>`);
    for (const a of group.items) {
      const price = a.price > 0 ? ` +R$ ${Number(a.price).toFixed(2).replace('.', ',')}` : '';
      lines.push(`  ${esc(a.name)}${price}`);
    }
  }
  return `<div class="item-adds">${lines.join('<br>')}</div>`;
};

const buildItemsHtml = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p class="empty">Itens nao detalhados.</p>';
  }

  return items.map((item) => {
    const additionals = parseAdditionals(item.selectedAdditionals);
    const productName = esc(item.product?.name || 'Produto');
    const varName = item.variation?.name || item.variationName ? ` (${esc(item.variation?.name || item.variationName)})` : '';
    const price = `R$ ${Number(item.totalPrice || 0).toFixed(2).replace('.', ',')}`;

    return `
      <div class="item">
        <div class="item-line">
          <span class="item-qty">${item.quantity}x</span>
          <span class="item-name">${productName}${varName}</span>
          <span class="item-price">${price}</span>
        </div>
        ${additionals.length ? buildAdditionalsHtml(additionals) : ''}
        ${item.observation ? `<div class="item-obs">* ${esc(item.observation)}</div>` : ''}
      </div>
    `;
  }).join('');
};

const buildTypeLabel = (type) => {
  if (type === 'Entrega') return 'ENTREGA';
  if (type === 'Balcao' || type === 'Balcão') return 'BALCAO / RETIRADA';
  if (type === 'Mesa') return 'MESA';
  return (type || '').toUpperCase();
};

const buildTableLabel = (order) => {
  if (order.type !== 'Mesa' || !order.tableNumber) return '';
  const tableNumber = String(order.tableNumber).trim();
  if (!tableNumber) return '';
  return tableNumber.toLowerCase().startsWith('mesa') ? tableNumber.toUpperCase() : `MESA ${tableNumber}`;
};

const buildReceiptHtml = (order, paperSize) => {
  const itemsHtml = buildItemsHtml(order.items);
  const typeLabel = buildTypeLabel(order.type);
  const tableLabel = buildTableLabel(order);
  const tracking = order.trackingCode || (order.id ? order.id.slice(0, 8) : '0000');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Comanda #${tracking}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            font-weight: 800;
            width: ${paperSize};
            color: #000;
            background: #fff;
            padding: 4mm 10mm;
          }

          .center { text-align: center; }
          .right { text-align: right; }
          .bold { color: #000; font-weight: 800; }

          /* Texto normal */
          .store-sub,
          .datetime,
          .customer-box,
          .address-block,
          .item,
          .item-price,
          .item-adds,
          .total-row,
          .footer {
            color: #000;
            font-weight: 800;
          }

          /* Texto em negrito */
          .store-name,
          .order-number,
          .type-badge,
          .customer-box .label,
          .section-title,
          .item-qty,
          .item-name,
          .item-obs,
          .total-row.grand,
          .obs-box,
          .obs-box .label,
          strong {
            color: #000;
            font-weight: 800;
          }

          .store-name {
            font-size: 20px;
            letter-spacing: 1px;
            text-align: center;
            text-transform: uppercase;
          }

          .store-sub {
            font-size: 11px;
            text-align: center;
            margin-bottom: 4px;
          }

          .divider {
            border: none;
            border-top: 1px dashed #000;
            margin: 5px 0;
          }

          .order-number {
            font-size: 22px;
            text-align: center;
            letter-spacing: 2px;
            margin: 4px 0;
          }

          .type-badge {
            font-size: 14px;
            text-align: center;
            border: 2px solid #000;
            padding: 3px 0;
            margin: 4px 0;
            letter-spacing: 1px;
          }

          .datetime {
            font-size: 11px;
            text-align: center;
            margin-bottom: 2px;
          }

          .customer-box {
            border: 1px solid #000;
            padding: 4px 5px;
            margin: 5px 0;
            font-size: 12px;
            line-height: 1.5;
          }

          .customer-box .label {
            font-size: 10px;
            text-transform: uppercase;
          }

          .address-block {
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px dashed #000;
            font-size: 12px;
            line-height: 1.5;
          }

          .section-title {
            font-size: 11px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 3px 0;
          }

          .item {
            margin: 5px 0;
            font-size: 13px;
          }

          .item-line {
            display: flex;
            align-items: baseline;
            gap: 3px;
          }

          .item-qty {
            min-width: 18px;
            flex-shrink: 0;
          }

          .item-name {
            flex: 1;
          }

          .item-price {
            flex-shrink: 0;
            text-align: right;
          }

          .item-adds {
            padding-left: 22px;
            font-size: 11px;
            line-height: 1.5;
          }

          .item-group {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
            margin-top: 3px;
          }

          .item-obs {
            padding-left: 22px;
            font-size: 11px;
            font-style: italic;
          }

          .totals {
            margin-top: 4px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            padding: 1px 0;
          }

          .total-row.grand {
            font-size: 17px;
            margin-top: 3px;
          }

          .obs-box {
            border: 2px solid #000;
            padding: 4px 5px;
            margin: 5px 0;
            font-size: 13px;
          }

          .obs-box .label {
            font-size: 10px;
            text-transform: uppercase;
            display: block;
            margin-bottom: 2px;
          }

          .footer {
            text-align: center;
            font-size: 11px;
            margin-top: 8px;
            padding-top: 4px;
            line-height: 1.6;
          }

          @media print {
            body { width: 100%; padding: 0; }
            @page { margin: 4mm 10mm; size: ${paperSize} auto; }
          }
        </style>
      </head>
      <body>
        <p class="store-name">Qbombom</p>
        <p class="store-sub">Sorvetes</p>

        <hr class="divider">

        <p class="order-number">#${tracking}</p>
        <div class="type-badge">${typeLabel}</div>
        ${tableLabel ? `<div class="type-badge">${esc(tableLabel)}</div>` : ''}
        <p class="datetime">${new Date(order.createdAt || new Date()).toLocaleString('pt-BR')}</p>

        <div class="customer-box">
          <span class="label">Cliente</span><br>
          <strong>${esc(order.customerName || 'Nao informado')}</strong>
          ${order.customerPhone ? `<br>${esc(order.customerPhone)}` : ''}
          ${order.deliveryAddress ? `
            <div class="address-block">
              <span class="label">Endereco de entrega</span><br>
              ${esc(order.deliveryAddress)}
            </div>
          ` : ''}
        </div>

        <hr class="divider">
        <p class="section-title">Itens do Pedido</p>
        <hr class="divider">

        ${itemsHtml}

        <hr class="divider">

        <div class="totals">
          <div class="total-row">
            <span>Pagamento</span>
            <span>${order.paymentMethod || 'Nao informado'}</span>
          </div>
          <div class="total-row">
            <span>Situacao</span>
            <span>${order.paymentStatus === 'pago' ? 'PAGO' : 'PENDENTE'}</span>
          </div>
          <div class="total-row grand">
            <span>TOTAL</span>
            <span>R$ ${Number(order.total || 0).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        ${order.observation ? `
          <hr class="divider">
          <div class="obs-box">
            <span class="label">Observacao Geral</span>
            ${esc(order.observation)}
          </div>
        ` : ''}

        <hr class="divider">

        <div class="footer">
          <p>Obrigado pela preferencia!</p>
          <p>Volte sempre :)</p>
        </div>
      </body>
    </html>
  `;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const printReceipt = (order, options = {}) => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('Impressão disponível apenas no navegador.'));
      return;
    }

    if (!order || typeof order !== 'object') {
      reject(new Error('Pedido inválido para impressão.'));
      return;
    }

    const paperSize = normalizePaperSize(options.paperSize || order.paperSize || '80mm');
    const html = buildReceiptHtml(order, paperSize);
    const iframe = document.createElement('iframe');

    iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;visibility:hidden;';
    document.body.appendChild(iframe);

    let done = false;
    let loadTimer = null;
    let fallbackTimer = null;
    let afterPrintHandler = null;

    const cleanup = () => {
      if (loadTimer) clearTimeout(loadTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);

      const win = iframe.contentWindow;
      if (win && afterPrintHandler) {
        win.removeEventListener('afterprint', afterPrintHandler);
      }

      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    const finish = (ok, error = null) => {
      if (done) return;
      done = true;
      cleanup();

      if (ok) resolve(true);
      else reject(error || new Error('Falha ao imprimir.'));
    };

    loadTimer = setTimeout(() => {
      finish(false, new Error('Tempo excedido ao preparar a impressão.'));
    }, LOAD_TIMEOUT_MS);

    iframe.onload = async () => {
      if (loadTimer) clearTimeout(loadTimer);

      try {
        const win = iframe.contentWindow;
        const doc = win?.document;
        if (!win || !doc) {
          finish(false, new Error('Janela de impressão indisponível.'));
          return;
        }

        if (doc.fonts?.ready) {
          await doc.fonts.ready;
        }
        await delay(30);

        afterPrintHandler = () => finish(true);
        win.addEventListener('afterprint', afterPrintHandler, { once: true });

        fallbackTimer = setTimeout(() => {
          finish(true);
        }, FALLBACK_FINISH_MS);

        win.focus();
        win.print();
      } catch (error) {
        finish(false, error instanceof Error ? error : new Error('Erro ao abrir diálogo de impressão.'));
      }
    };

    try {
      const doc = iframe.contentWindow?.document;
      if (!doc) {
        finish(false, new Error('Não foi possível iniciar o iframe de impressão.'));
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();
    } catch (error) {
      finish(false, error instanceof Error ? error : new Error('Erro ao montar comanda para impressão.'));
    }
  });
};

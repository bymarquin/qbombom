export const printReceipt = (order) => {
  return new Promise((resolve) => {
    let itemsHtml;

    if (order.items && order.items.length) {
      itemsHtml = order.items.map(item => {
        let addText = '';
        if (item.selectedAdditionals) {
          try {
            const parsed = typeof item.selectedAdditionals === 'string' ? JSON.parse(item.selectedAdditionals) : item.selectedAdditionals;
            addText = parsed.map(a => `  + ${a.name}`).join('\n');
          } catch {
            // ignore
          }
        }

        const productName = item.product?.name || 'Produto';
        const varName = item.variation?.name ? ` (${item.variation.name})` : '';
        const price = `R$ ${Number(item.totalPrice).toFixed(2).replace('.', ',')}`;

        return `
          <div class="item">
            <div class="item-line">
              <span class="item-qty">${item.quantity}x</span>
              <span class="item-name">${productName}${varName}</span>
              <span class="item-price">${price}</span>
            </div>
            ${addText ? `<div class="item-adds">${addText.replace(/\n/g, '<br>')}</div>` : ''}
            ${item.observation ? `<div class="item-obs">* ${item.observation}</div>` : ''}
          </div>
        `;
      }).join('');
    } else {
      itemsHtml = '<p class="empty">Itens nao detalhados.</p>';
    }

    const typeLabel = order.type === 'Entrega'
      ? 'ENTREGA'
      : order.type === 'Balcao' || order.type === 'Balcão'
        ? 'BALCAO / RETIRADA'
        : order.type === 'Mesa'
          ? 'MESA'
          : (order.type || '').toUpperCase();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Comanda #${order.trackingCode || (order.id ? order.id.slice(0, 8) : '0000')}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }

            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 13px;
              width: 80mm;
              color: #000;
              background: #fff;
              padding: 4mm 3mm;
            }

            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }

            .store-name {
              font-size: 20px;
              font-weight: bold;
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
              font-weight: bold;
              text-align: center;
              letter-spacing: 2px;
              margin: 4px 0;
            }

            .type-badge {
              font-size: 14px;
              font-weight: bold;
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
              font-weight: bold;
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
              font-weight: bold;
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
              font-weight: bold;
              min-width: 18px;
              flex-shrink: 0;
            }

            .item-name {
              flex: 1;
              font-weight: bold;
            }

            .item-price {
              flex-shrink: 0;
              text-align: right;
            }

            .item-adds {
              padding-left: 22px;
              font-size: 11px;
              color: #333;
              line-height: 1.5;
            }

            .item-obs {
              padding-left: 22px;
              font-size: 11px;
              font-style: italic;
              font-weight: bold;
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
              font-weight: bold;
              margin-top: 3px;
            }

            .obs-box {
              border: 2px solid #000;
              padding: 4px 5px;
              margin: 5px 0;
              font-size: 13px;
              font-weight: bold;
            }

            .obs-box .label {
              font-size: 10px;
              text-transform: uppercase;
              font-weight: bold;
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
              @page { margin: 0; size: 80mm auto; }
            }
          </style>
        </head>
        <body>
          <p class="store-name">Qbombom</p>
          <p class="store-sub">Sorvetes</p>

          <hr class="divider">

          <p class="order-number">#${order.trackingCode || (order.id ? order.id.slice(0, 8) : '0000')}</p>
          <div class="type-badge">${typeLabel}</div>
          <p class="datetime">${new Date(order.createdAt || new Date()).toLocaleString('pt-BR')}</p>

          <div class="customer-box">
            <span class="label">Cliente</span><br>
            <strong>${order.customerName || 'Nao informado'}</strong>
            ${order.customerPhone ? `<br>${order.customerPhone}` : ''}
            ${order.deliveryAddress ? `
              <div class="address-block">
                <span class="label">Endereco de entrega</span><br>
                ${order.deliveryAddress}
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
              ${order.observation}
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

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;visibility:hidden;';
    document.body.appendChild(iframe);

    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        resolve(true);
      }, 500);
    };
  });
};

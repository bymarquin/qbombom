export const printReceipt = (order) => {
  return new Promise((resolve) => {
    let itemsHtml;

    if (order.items && order.items.length) {
      itemsHtml = order.items.map(item => {
        let addText = '';
        if (item.selectedAdditionals) {
          try {
            const parsed = typeof item.selectedAdditionals === 'string' ? JSON.parse(item.selectedAdditionals) : item.selectedAdditionals;
            addText = parsed.map(a => `+ ${a.name}`).join('<br>');
          } catch {
            // Ignore parse errors on print
          }
        }

        let obsText = item.observation ? `<div class="obs">Obs: ${item.observation}</div>` : '';
        let addsHtml = addText ? `<div class="add">${addText}</div>` : '';

        const productName = item.product?.name || 'Produto';
        const varName = item.variation?.name ? ` - ${item.variation.name}` : '';

        return `
          <div class="item">
            <div class="item-line">
              <span class="item-name">${item.quantity}x ${productName}${varName}</span>
              <span>R$ ${Number(item.totalPrice).toFixed(2).replace('.', ',')}</span>
            </div>
            ${addsHtml}
            ${obsText}
          </div>
        `;
      }).join('');
    } else {
      itemsHtml = '<p>Itens não detalhados.</p>';
    }

    const html = `
      <html>
        <head>
          <title>Comanda #${order.trackingCode || (order.id ? order.id.slice(0, 8) : '0000')}</title>
          <style>
            body { font-family: monospace; font-size: 14px; width: 300px; margin: 0 auto; color: #000; padding: 0 5px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            h2 { margin: 0 0 5px 0; font-size: 20px; text-transform: uppercase; }
            h3 { margin: 0 0 5px 0; font-size: 16px; }
            p { margin: 2px 0; }
            .bold { font-weight: bold; }
            .items { margin: 10px 0; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item { margin-bottom: 8px; }
            .item-line { display: flex; justify-content: space-between; }
            .item-name { font-weight: bold; font-size: 15px; }
            .add { padding-left: 10px; font-size: 12px; }
            .obs { padding-left: 10px; font-size: 12px; font-style: italic; }
            .totals { text-align: right; margin-top: 10px; }
            .totals p { font-size: 16px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; padding-bottom: 20px;}

            /* Print specific adjustments */
            @media print {
              body { width: 100%; margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>QBomBom</h2>
            <h3>PEDIDO #${order.trackingCode || (order.id ? order.id.slice(0, 8) : '0000')}</h3>
            <p class="bold" style="font-size: 16px;">${order.type === 'Entrega' ? '🚚 ENTREGA' : (order.type === 'Balcão' ? '🛍️ RETIRADA / BALCÃO' : (order.type === 'Mesa' ? '🍽️ MESA' : order.type))}</p>
            <p>${new Date(order.createdAt || new Date()).toLocaleString('pt-BR')}</p>

            <div style="margin-top: 10px; text-align: left; padding: 5px; border: 1px solid #000;">
              <p class="bold">Cliente: ${order.customerName || 'Não informado'}</p>
              ${order.customerPhone ? `<p>Tel: ${order.customerPhone}</p>` : ''}
              ${order.deliveryAddress ? `<p style="margin-top:5px; border-top:1px dashed #000; padding-top:5px;"><strong>Endereço:</strong><br>${order.deliveryAddress}</p>` : ''}
            </div>
          </div>

          <div class="items">
            <p class="bold" style="margin-bottom: 8px; text-align: center; text-decoration: underline;">ITENS DO PEDIDO</p>
            ${itemsHtml}
          </div>

          <div class="totals">
            <p>Total: R$ ${Number(order.total || 0).toFixed(2).replace('.', ',')}</p>
            <p style="font-size: 12px; font-weight: normal; margin-top: 5px;">Forma de Pag.: ${order.paymentMethod || 'Não informado'}</p>
            <p style="font-size: 12px; font-weight: normal;">Status Pag.: ${order.paymentStatus === 'pago' ? 'Pago' : 'Pendente'}</p>
          </div>

          <div class="footer">
            ${order.observation ? `<p style="font-size: 14px; font-weight: bold; text-align: left; border: 1px solid #000; padding: 5px;">Obs Geral: ${order.observation}</p>` : ''}
            <p>Obrigado pela preferência!</p>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();

    // Fix specific for Vue / Modern browsers where iframe loading can be tricky
    iframe.onload = () => {
      // Focus iframe so printing works universally (specifically useful for Chrome/Edge)
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Cleanup after print dialog is closed
      setTimeout(() => {
        document.body.removeChild(iframe);
        resolve(true);
      }, 500); // reduced timeout to make UI flow faster
    };
  });
};

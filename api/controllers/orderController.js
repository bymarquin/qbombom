const { Order, OrderItem, Product, ProductVariation, Customer, sequelize } = require('../models')
const whatsappService = require('../services/whatsappService');

exports.index = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = status ? { status } : {};

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name'] },
            { model: ProductVariation, as: 'variation', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error listing orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.show = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name'] },
            { model: ProductVariation, as: 'variation', attributes: ['id', 'name'] }
          ]
        }
      ]
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { 
      type, 
      customerName, 
      customerPhone,
      deliveryAddress,
      paymentStatus, 
      paymentMethod, 
      subtotal, 
      discount, 
      total, 
      observation, 
      items 
    } = req.body;
    
    // Ghost Login / Identificação do Cliente
    let customerId = null;
    if (customerPhone) {
      // Limpa a formatação do telefone para buscar de forma uniforme
      const rawPhone = customerPhone.replace(/D/g, '');
      let customer = await Customer.findOne({ where: { phone: rawPhone } });
      
      if (!customer && customerName) {
        // Se não existir, cria o cliente (Ghost Register)
        customer = await Customer.create({
          name: customerName,
          phone: rawPhone,
          address: deliveryAddress
        }, { transaction });
      } else if (customer) {
        // Se existir, apenas atualiza as infos se vierem coisas novas
        if (deliveryAddress) customer.address = deliveryAddress;
        if (customerName) customer.name = customerName;
        // Opcional: já incrementar as estatisticas do cliente (ou deixar isso pro hook depois)
        customer.totalOrders = (customer.totalOrders || 0) + 1;
        customer.totalSpent = parseFloat(customer.totalSpent || 0) + parseFloat(total);
        await customer.save({ transaction });
      }
      if (customer) customerId = customer.id;
    }


    // Gera um código de rastreio único de 6 caracteres
    const trackingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Criar o cabeçalho do Pedido
    let initialStatus = 'novo';
    if (paymentMethod === 'PIX' && (!paymentStatus || paymentStatus === 'pendente')) {
      initialStatus = 'aguardando_pagamento';
    }

    const order = await Order.create({
      trackingCode,
      type: type || 'Mesa',
      customerName,
      customerId,
      customerPhone,
      deliveryAddress,
      status: initialStatus, // 'novo' ou 'aguardando_pagamento'
      paymentStatus: paymentStatus || 'pendente',
      paymentMethod,
      subtotal,
      discount: discount || 0,
      total,
      observation
    }, { transaction });

    // 2. Preparar e criar os itens do pedido
    if (items && items.length > 0) {
      const orderItemsData = items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        productVariationId: item.productVariationId || null,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        observation: item.observation || '',
        selectedAdditionals: item.selectedAdditionals || [] // JSONB salvo diretamente
      }));

      await OrderItem.bulkCreate(orderItemsData, { transaction });

      // Atualizar Estoque
      for (const item of items) {
        const qty = item.quantity || 1;
        // Decrementar do Produto Base
        if (item.productId) {
          const product = await Product.findByPk(item.productId, { transaction });
          if (product && product.manageStock) {
            product.stock = product.stock - qty;
            await product.save({ transaction });
          }
        }
        
        // Decrementar da Variação (se aplicável e se gerenciar estoque independentemente)
        if (item.productVariationId) {
          const variation = await ProductVariation.findByPk(item.productVariationId, { transaction });
          if (variation && variation.manageStock) {
            variation.stock = variation.stock - qty;
            await variation.save({ transaction });
          }
        }
      }
    }

    // 3. Confirmar a transação
    
    // ----------------------------------------------------------------------------------
    // TODO: PIX AUTOMÁTICO (MERCADO PAGO / ASAAS / ETC) - ENGATILHADO
    // ----------------------------------------------------------------------------------
    // let pixInfo = null;
    // if (paymentMethod === 'PIX_ONLINE') {
    //   try {
    //     // 1. Chamar API do Gateway (ex: MercadoPago) enviando o valor (order.total)
    //     // const paymentData = await MercadoPagoAPI.createPayment({
    //     //   transaction_amount: Number(order.total),
    //     //   description: `Pedido #${trackingCode}`,
    //     //   payment_method_id: 'pix',
    //     //   payer: { email: 'cliente@email.com', first_name: customerName } // Pegar do profile se existir
    //     // });
    //     
    //     // 2. Receber o QR Code e o Copia e Cola gerados pelo banco
    //     // pixInfo = {
    //     //   qrCode: paymentData.point_of_interaction.transaction_data.qr_code,
    //     //   qrCodeBase64: paymentData.point_of_interaction.transaction_data.qr_code_base64,
    //     //   paymentId: paymentData.id // Salvar isso no BD para o webhook do MercadoPago atualizar o status depois
    //     // };
    //     
    //     // 3. Opcional: Atualizar o pedido com o paymentId externo
    //     // await order.update({ externalPaymentId: paymentData.id }, { transaction });
    //   } catch (gatewayErr) {
    //     console.error('Erro ao gerar PIX Automático:', gatewayErr);
    //     // Tratar erro: avisar cliente ou cair para PIX manual
    //   }
    // }
    // ----------------------------------------------------------------------------------

    await transaction.commit();

    // 4. Buscar o pedido recém-criado com os relacionamentos para retornar
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name'] },
            { model: ProductVariation, as: 'variation', attributes: ['id', 'name'] }
          ]
        }
      ]
    });

    // Dispara via WebSocket pro KDS
    const io = req.app.get('io');
    if (io) {
      io.emit('orderCreated', createdOrder);
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    // Em caso de erro, desfaz tudo que foi feito no banco nesta requisição
    await transaction.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error while creating order' });
  }
};

exports.track = async (req, res) => {
  try {
    const { code } = req.params;
    const order = await Order.findOne({
      where: { trackingCode: code },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name'] },
            { model: ProductVariation, as: 'variation', attributes: ['id', 'name'] }
          ]
        }
      ]
    });

    if (!order) return res.status(404).json({ error: 'Order not found or invalid code' });
    res.json(order);
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.cancelByTracking = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { code } = req.params;

    const order = await Order.findOne({
      where: { trackingCode: code },
      include: [{ model: OrderItem, as: 'items' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found or invalid code' });
    }

    if (order.status === 'cancelado') {
      await transaction.commit();
      return res.json(order);
    }

    const customerCancelableStatuses = new Set(['aguardando_pagamento', 'novo']);
    if (!customerCancelableStatuses.has(order.status)) {
      await transaction.rollback();
      return res.status(409).json({
        error: 'Pedido não pode mais ser cancelado. Entre em contato com a loja.'
      });
    }

    if (order.paymentStatus === 'pago') {
      await transaction.rollback();
      return res.status(409).json({
        error: 'Pedido já consta como pago e não pode ser cancelado por aqui.'
      });
    }

    for (const item of order.items || []) {
      const qty = item.quantity || 0;

      if (item.productId) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (product && product.manageStock) {
          product.stock = Number(product.stock || 0) + qty;
          await product.save({ transaction });
        }
      }

      if (item.productVariationId) {
        const variation = await ProductVariation.findByPk(item.productVariationId, { transaction });
        if (variation && variation.manageStock) {
          variation.stock = Number(variation.stock || 0) + qty;
          await variation.save({ transaction });
        }
      }
    }

    order.status = 'cancelado';
    await order.save({ transaction });
    await transaction.commit();

    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', {
        id: order.id,
        trackingCode: order.trackingCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        receiptUrl: order.receiptUrl,
        message: 'Pedido cancelado pelo cliente'
      });
    }

    return res.json(order);
  } catch (error) {
    await transaction.rollback();
    console.error('Error cancelling order by tracking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Atualiza apenas os campos que vieram no body
    const previousStatus = order.status;
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', order);
    }

    // Notifica cliente via WhatsApp se o status mudou e tem cliente com telefone
    if (status && status !== previousStatus && order.customerId) {
      const customer = await Customer.findByPk(order.customerId, { attributes: ['phone'] });
      if (customer?.phone) {
        whatsappService.sendStatusMessage(customer.phone, status, order.id.slice(-6).toUpperCase());
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status === 'cancelado') {
      return res.status(400).json({ error: 'Pedido já está cancelado.' });
    }
    if (['finalizado', 'entregue'].includes(order.status)) {
      return res.status(400).json({ error: 'Não é possível cancelar um pedido já finalizado.' });
    }

    const previousStatus = order.status;
    order.status = 'cancelado';
    await order.save();

    const io = req.app.get('io');
    if (io) io.emit('orderUpdated', order);

    if (order.customerId) {
      const customer = await Customer.findByPk(order.customerId, { attributes: ['phone'] });
      if (customer?.phone) {
        whatsappService.sendStatusMessage(customer.phone, 'cancelado', order.id.slice(-6).toUpperCase());
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.uploadReceipt = async (req, res) => {
  try {
    const { code } = req.params;
    const { receiptBase64 } = req.body;

    const order = await Order.findOne({ where: { trackingCode: code } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!receiptBase64) return res.status(400).json({ error: 'Missing image data' });

    const matches = receiptBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 string' });
    }

    const contentType = matches[1];
    const ext = contentType.split('/')[1] || 'png';
    const buffer = Buffer.from(matches[2], 'base64');
    const key = `receipts/receipt_${order.id}_${Date.now()}.${ext}`;

    const { uploadFile } = require('../services/storageService');
    const receiptUrl = await uploadFile(buffer, key, contentType);

    order.receiptUrl = receiptUrl;
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', {
        trackingCode: order.trackingCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        receiptUrl: order.receiptUrl,
        message: 'Novo comprovante anexado'
      });
    }

    res.json(order);
  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'controllers', 'orderController.js');
let code = fs.readFileSync(file, 'utf-8');

if (!code.includes("const { Order, OrderItem, Product, ProductVariation, Customer, sequelize } = require('../models');")) {
  code = code.replace("const { Order, OrderItem, Product, ProductVariation, sequelize } = require('../models');", "const { Order, OrderItem, Product, ProductVariation, Customer, sequelize } = require('../models');");
}

const oldBodyDestructuring = `    const { 
      type, 
      customerName, 
      paymentStatus, 
      paymentMethod, 
      subtotal, 
      discount, 
      total, 
      observation, 
      items 
    } = req.body;`;

const newBodyDestructuring = `    const { 
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
      const rawPhone = customerPhone.replace(/\D/g, '');
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
`;

code = code.replace(oldBodyDestructuring, newBodyDestructuring);

const oldOrderCreate = `    // 1. Criar o cabeçalho do Pedido
    const order = await Order.create({
      trackingCode,
      type: type || 'Mesa',
      customerName,
      status: 'novo', // Todo pedido nasce como 'novo'
      paymentStatus: paymentStatus || 'pendente',
      paymentMethod,
      subtotal,
      discount: discount || 0,
      total,
      observation
    }, { transaction });`;

const newOrderCreate = `    // 1. Criar o cabeçalho do Pedido
    const order = await Order.create({
      trackingCode,
      type: type || 'Mesa',
      customerName,
      customerId,
      customerPhone,
      deliveryAddress,
      status: 'novo', // Todo pedido nasce como 'novo'
      paymentStatus: paymentStatus || 'pendente',
      paymentMethod,
      subtotal,
      discount: discount || 0,
      total,
      observation
    }, { transaction });`;

code = code.replace(oldOrderCreate, newOrderCreate);

fs.writeFileSync(file, code);

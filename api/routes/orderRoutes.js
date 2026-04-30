const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const checkStoreOpen = require('../middlewares/checkStoreOpen');

// ---- ROTAS PÚBLICAS (CLIENTES) ----
router.post('/webhooks/mercadopago', orderController.mercadoPagoWebhook);

// Permite que um cliente final faça um pedido pelo Cardápio Digital (sem precisar de token)
router.post('/public', checkStoreOpen, orderController.create);

// Permite o cliente consultar o andamento do pedido com base no código secreto
router.get('/track/:code', orderController.track);
router.patch('/track/:code/cancel', orderController.cancelByTracking);
router.patch('/track/:code/confirm', orderController.confirmDeliveryByTracking);
router.patch('/track/:code/whatsapp-optout', orderController.optOutWhatsappByTracking);

// ---- ROTAS PRIVADAS (FUNCIONÁRIOS) ----
// Listar pedidos e ver detalhes (Permissão: orders.view)
router.get('/', auth, checkPermission('orders.view'), orderController.index);
router.get('/:id', auth, checkPermission('orders.view'), orderController.show);

// Criar pedido pelo PDV (Permissão: orders.create)
router.post('/', auth, checkPermission('orders.create'), orderController.create);

// Alterar status do pedido, ex: de novo para em_preparo (Permissão: orders.change_status)
router.patch('/:id/status', auth, checkPermission('orders.change_status'), orderController.updateStatus);

// Cancelar pedido (Permissão: orders.cancel — disponível também para CASHIER)
router.patch('/:id/cancel', auth, checkPermission('orders.cancel'), orderController.cancelOrder);

// Imprimir comanda via impressora térmica (Permissão: orders.view)
router.post('/:id/print', auth, checkPermission('orders.view'), orderController.printOrder);

module.exports = router;

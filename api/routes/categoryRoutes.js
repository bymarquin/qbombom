const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

// Rotas públicas (ou que podem ser abertas para clientes verem o cardápio num totem/QR)
router.get('/', categoryController.index);
router.get('/:id', categoryController.show);

// Rotas de Admin: Requerem o token e a permissão específica!
router.post('/', auth, checkPermission('products.create'), categoryController.create);
router.put('/:id', auth, checkPermission('products.update'), categoryController.update);
router.delete('/:id', auth, checkPermission('products.toggle_active'), categoryController.destroy);

module.exports = router;

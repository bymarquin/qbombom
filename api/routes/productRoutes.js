const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

// Listar produtos
router.get('/', productController.index);
router.get('/:id', productController.show);

// MÉTODOS CRUD ADMIN com bloqueios de perfil
router.post('/', auth, checkPermission('products.create'), productController.create);
router.put('/:id', auth, checkPermission('products.update'), productController.update);
router.delete('/:id', auth, checkPermission('products.toggle_active'), productController.destroy);

module.exports = router;

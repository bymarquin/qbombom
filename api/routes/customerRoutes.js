const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const customerAuthController = require('../controllers/customerAuthController');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

// ---- ROTAS PÚBLICAS (CLIENTES) ----
// Cadastro e Login de clientes pelo cardápio
router.post('/auth/register', customerAuthController.register);
router.post('/auth/login', customerAuthController.login);

// Todas rotas restritas ao dashboard B2B
router.use(auth);

router.get('/', checkPermission('customers.view'), customerController.index);
router.get('/:id', checkPermission('customers.view'), customerController.show);
router.post('/', checkPermission('customers.manage'), customerController.create);
router.put('/:id', checkPermission('customers.manage'), customerController.update);
router.delete('/:id', checkPermission('customers.manage'), customerController.destroy);

module.exports = router;

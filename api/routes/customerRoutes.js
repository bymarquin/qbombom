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

router.get('/', checkPermission('users.manage'), customerController.index);
router.get('/:id', checkPermission('users.manage'), customerController.show);
router.post('/', checkPermission('users.create'), customerController.create);
router.put('/:id', checkPermission('users.update'), customerController.update);
router.delete('/:id', checkPermission('users.manage'), customerController.destroy);

module.exports = router;

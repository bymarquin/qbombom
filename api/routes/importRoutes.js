const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

router.post('/', auth, checkPermission('products.create'), importController.importCatalog);

module.exports = router;

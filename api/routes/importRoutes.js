const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

router.get('/export', auth, checkPermission('products.read'), importController.exportCatalog);
router.post('/', auth, checkPermission('products.create'), importController.importCatalog);
router.post('/deduplicate-groups', auth, checkPermission('products.create'), importController.deduplicateGroups);

module.exports = router;

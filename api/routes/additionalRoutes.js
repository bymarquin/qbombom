const express = require('express');
const router = express.Router();
const additionalController = require('../controllers/additionalController');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

// GROUPS
router.post('/groups', auth, checkPermission('products.update'), additionalController.createGroup);
router.put('/groups/:id', auth, checkPermission('products.update'), additionalController.updateGroup);
router.delete('/groups/:id', auth, checkPermission('products.update'), additionalController.destroyGroup);

// ITEMS
router.post('/items', auth, checkPermission('products.update'), additionalController.createItem);
router.put('/items/:id', auth, checkPermission('products.update'), additionalController.updateItem);
router.delete('/items/:id', auth, checkPermission('products.update'), additionalController.destroyItem);

module.exports = router;

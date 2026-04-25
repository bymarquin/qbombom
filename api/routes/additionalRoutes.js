const express = require('express');
const router = express.Router();
const additionalController = require('../controllers/additionalController');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

// GROUPS globais
router.get('/groups', auth, checkPermission('products.update'), additionalController.getAllGroups);
router.post('/groups', auth, checkPermission('products.update'), additionalController.createGroup);
router.put('/groups/:id', auth, checkPermission('products.update'), additionalController.updateGroup);
router.delete('/groups/:id', auth, checkPermission('products.update'), additionalController.destroyGroup);

// Assign / unassign / reorder grupos por produto
router.post('/groups/:id/assign', auth, checkPermission('products.update'), additionalController.assignGroup);
router.delete('/groups/:id/assign/:productId', auth, checkPermission('products.update'), additionalController.unassignGroup);
router.patch('/groups/reorder/:productId', auth, checkPermission('products.update'), additionalController.reorderGroups);

// ITEMS
router.post('/items', auth, checkPermission('products.update'), additionalController.createItem);
router.put('/items/:id', auth, checkPermission('products.update'), additionalController.updateItem);
router.delete('/items/:id', auth, checkPermission('products.update'), additionalController.destroyItem);

module.exports = router;

const express = require('express');
const router = express.Router();
const additionalController = require('../controllers/additionalController');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

const guard = [auth, checkPermission('products.update')];

// GROUPS globais
router.get('/groups', auth, checkPermission('products.update'), additionalController.getAllGroups);
router.post('/groups', ...guard, additionalController.createGroup);
router.put('/groups/:id', ...guard, additionalController.updateGroup);
router.delete('/groups/:id', ...guard, additionalController.destroyGroup);

// Assign / unassign grupo a produto
router.post('/groups/:id/assign', ...guard, additionalController.assignGroup);
router.delete('/groups/:id/assign/:productId', ...guard, additionalController.unassignGroup);

// ITEMS
router.post('/items', ...guard, additionalController.createItem);
router.put('/items/:id', ...guard, additionalController.updateItem);
router.delete('/items/:id', ...guard, additionalController.destroyItem);

module.exports = router;

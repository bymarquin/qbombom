const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { requireRoles } = require('../middlewares/roles');

router.use(auth);
router.use(requireRoles(['SUPER_ADMIN', 'MANAGER']));

router.get('/', userController.index);
router.post('/', userController.create);
router.get('/:id', userController.show);
router.put('/:id', userController.update);
router.delete('/:id', userController.destroy);

module.exports = router;
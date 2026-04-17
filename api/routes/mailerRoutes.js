const express = require('express');
const router = express.Router();
const mailerController = require('../controllers/mailerController');
const auth = require('../middlewares/auth');
const { requireRoles } = require('../middlewares/roles');

router.post('/test', auth, requireRoles(['SUPER_ADMIN', 'MANAGER']), mailerController.sendTestEmail);

module.exports = router;

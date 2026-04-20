const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const r2Controller = require('../controllers/r2Controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get('/files', auth, checkPermission('users.manage'), r2Controller.list);
router.get('/files/proxy', r2Controller.proxy);
router.post('/files', auth, checkPermission('users.manage'), upload.single('file'), r2Controller.upload);
router.delete('/files', auth, checkPermission('users.manage'), r2Controller.destroy);
router.patch('/files/move', auth, checkPermission('users.manage'), r2Controller.move);

module.exports = router;

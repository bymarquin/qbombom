const express = require('express')
const router = express.Router()
const whatsappController = require('../controllers/whatsappController')
const { authenticate } = require('../middlewares/auth')
const { checkPermission } = require('../middlewares/checkPermission')

router.use(authenticate)
router.use(checkPermission('users.manage'))

router.get('/status', whatsappController.getStatus)
router.get('/qrcode', whatsappController.getQRCode)
router.post('/instance', whatsappController.createInstance)

module.exports = router

const express = require('express')
const router = express.Router()
const whatsappController = require('../controllers/whatsappController')
const auth = require('../middlewares/auth')
const { requireRoles } = require('../middlewares/roles')

router.use(auth)
router.use(requireRoles(['SUPER_ADMIN', 'MANAGER']))

router.get('/status', whatsappController.getStatus)
router.get('/qrcode', whatsappController.getQRCode)
router.post('/instance', whatsappController.createInstance)

module.exports = router

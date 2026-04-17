const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');

router.post('/register', authController.register);
router.post('/login', authController.login); // Login completo (Gestor/Início do dia)
router.post('/login/pin', authController.loginPin); // Login rápido do PDV
router.post('/refresh', authController.refreshToken); // Trocar token vencido por novo

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.post('/logout', auth, authController.logout); // Invalida a sessão
router.get('/me', auth, authController.me);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { autenticar } = require('../middlewares/auth');

// Rotas Públicas
router.post('/register', authController.registar);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.post('/verificar-telefone', authController.verificarTelefone);

// Rotas Protegidas (precisam de token)
router.get('/me', autenticar, authController.me);

module.exports = router;
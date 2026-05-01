const express = require('express');
const authController = require('../controllers/authController');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', authController.registar);
router.post('/login', authController.login);
router.get('/me', autenticar, authController.me);

module.exports = router;

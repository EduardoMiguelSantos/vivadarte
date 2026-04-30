const express = require('express');
const router = express.Router();
const { login, pedidoRegisto } = require('../controllers/autController');

router.post('/login', login);
router.post('/pedido-registo', pedidoRegisto);

module.exports = router;
const express = require('express');
const router = express.Router();
const coachingController = require('../controllers/coachingController');
const pedidoController = require('../controllers/pedidoCoachingController');

// Rotas de Pedidos
router.get('/vagas', pedidoController.consultarVagas);
router.post('/pedidos', pedidoController.criarPedido);
router.get('/pedidos/pendentes', pedidoController.listarPedidos);

// Rotas de Agenda e Gestão
router.get('/agenda', coachingController.consultarAgenda);
router.post('/aprovar', coachingController.aprovarCoaching);

module.exports = router;
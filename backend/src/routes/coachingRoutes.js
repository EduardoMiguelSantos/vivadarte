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

// Nova rota do Professor
router.get('/professor/:id_professor', coachingController.listarPedidosProfessor);

// Usamos PATCH porque estamos apenas a modificar uma pequena parte (o estado) de um registo que já existe
router.patch('/decisao/:id_pedido', coachingController.decidirPedido);

module.exports = router;
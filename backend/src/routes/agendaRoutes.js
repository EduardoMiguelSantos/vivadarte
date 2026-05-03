const express = require('express');
const { autenticar, autorizar } = require('../middlewares/auth');

const eeAgenda = require('../controllers/eeAgendaController');
const professorAgenda = require('../controllers/professorAgendaController');
const coordenacaoAgenda = require('../controllers/coordenacaoAgendaController');

const router = express.Router();

// --- Encarregado de Educação (EE) ---
router.get(
    '/ee/disponibilidade',
    autenticar,
    autorizar('EE'),
    eeAgenda.getDisponibilidade
);
router.post('/ee/pedidos', autenticar, autorizar('EE'), eeAgenda.criarPedido);
router.get('/ee/pedidos', autenticar, autorizar('EE'), eeAgenda.listarMeusPedidos);
router.delete('/ee/pedidos/:idPedido', autenticar, autorizar('EE'), eeAgenda.cancelarPedidoPendente);
router.get('/ee/alunos', autenticar, autorizar('EE'), eeAgenda.listarMeusAlunos);

// --- Professor ---
router.get(
    '/professor/disponibilidades',
    autenticar,
    autorizar('Professor'),
    professorAgenda.getDisponibilidades
);
router.post(
    '/professor/disponibilidades',
    autenticar,
    autorizar('Professor'),
    professorAgenda.postDisponibilidade
);
router.delete(
    '/professor/disponibilidades/:idDisponibilidade',
    autenticar,
    autorizar('Professor'),
    professorAgenda.deleteDisponibilidade
);
router.get('/professor/agenda', autenticar, autorizar('Professor'), professorAgenda.getAgenda);
router.get(
    '/professor/pedidos',
    autenticar,
    autorizar('Professor'),
    professorAgenda.listarPedidosOndeSouProfessor
);
router.post(
    '/professor/coachings/:idCoaching/validacao',
    autenticar,
    autorizar('Professor'),
    professorAgenda.validarRealizacaoAula
);

// --- Coordenação / Admin ---
router.get(
    '/coordenacao/pedidos-pendentes',
    autenticar,
    autorizar('Admin'),
    coordenacaoAgenda.listarPedidosPendentes
);
router.post(
    '/coordenacao/aprovar-agendar',
    autenticar,
    autorizar('Admin'),
    coordenacaoAgenda.aprovarPedidoEAgendar
);
router.post(
    '/coordenacao/pedidos/:idPedido/rejeitar',
    autenticar,
    autorizar('Admin'),
    coordenacaoAgenda.rejeitarPedido
);
router.post(
    '/coordenacao/coachings/:idCoaching/finalizar-validacao',
    autenticar,
    autorizar('Admin'),
    coordenacaoAgenda.finalizarValidacaoCoordenacao
);

module.exports = router;

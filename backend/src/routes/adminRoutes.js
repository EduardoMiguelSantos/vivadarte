const express = require('express');
const router = express.Router();
const { listarPendentes, aprovar, rejeitar, listarUtilizadores } = require('../controllers/adminController');
const { autenticar, autorizar } = require('../middlewares/auth');

router.use(autenticar);
router.use(autorizar('Admin', 'Coordenação'));

router.get('/pendentes', listarPendentes);
router.put('/aprovar/:id', aprovar);
router.delete('/rejeitar/:id', rejeitar);
router.get('/utilizadores', listarUtilizadores);

module.exports = router;

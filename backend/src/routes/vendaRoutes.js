const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');

// Define as rotas HTTP para as operações usando os nomes corretos do Rafael
router.get('/', vendaController.listarVendasAtivas);
router.post('/', vendaController.colocarVenda);
router.post('/:id_venda/concluir', vendaController.concluirVenda);

module.exports = router;
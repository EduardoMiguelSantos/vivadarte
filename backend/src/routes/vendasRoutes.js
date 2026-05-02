const express = require('express');
const router = express.Router();
const vendasController = require('../controllers/vendasController');

// Define as rotas (ficam penduradas em /api/vendas no app.js)
router.get('/', vendasController.getVendas);
router.post('/', vendasController.createVenda);
router.put('/:id_venda/comprar', vendasController.comprarFigurino);

module.exports = router;
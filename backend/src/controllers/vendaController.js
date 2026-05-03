const InventarioModel = require('../models/inventarioModel');

const colocarVenda = async (req, res) => {
    try {
        const { id_peca, id_vendedor, preco } = req.body;

        if (!id_peca || !id_vendedor || preco === undefined || preco <= 0) {
            return res.status(400).json({ erro: 'A identificação da peça, do vendedor e um preço válido são obrigatórios.' });
        }

        // Nome corrigido para bater certo com o Model do Rafael
        const idVendaCriada = await InventarioModel.colocarPecaAVenda(id_peca, preco, id_vendedor);

        return res.status(201).json({ mensagem: 'Peça colocada à venda com sucesso.', id_venda: idVendaCriada });
    } catch (erro) {
        console.error('Erro ao colocar peça à venda:', erro);
        return res.status(500).json({ erro: 'Erro interno ao tentar processar a colocação para venda.' });
    }
};

const concluirVenda = async (req, res) => {
    try {
        const { id_venda } = req.params;
        const { id_comprador, metodo_pagamento } = req.body;

        if (!id_comprador || !metodo_pagamento) {
            return res.status(400).json({ erro: 'É obrigatório fornecer a identificação do comprador e o método de pagamento.' });
        }

        // Nome corrigido para bater certo com o Model do Rafael
        await InventarioModel.registarConclusaoVenda(id_venda, id_comprador, metodo_pagamento);

        return res.status(200).json({ mensagem: 'Venda concluída e inventário atualizado com sucesso.' });
    } catch (erro) {
        console.error('Erro ao concluir a venda:', erro);
        return res.status(500).json({ erro: 'Erro interno ao registar a conclusão da venda.' });
    }
};

const listarVendasAtivas = async (req, res) => {
    try {
        // Nome corrigido para bater certo com o Model do Rafael
        const vendas = await InventarioModel.getPecasAVenda();
        return res.status(200).json(vendas);
    } catch (erro) {
        console.error('Erro ao listar vendas ativas:', erro);
        return res.status(500).json({ erro: 'Erro interno ao consultar as peças à venda.' });
    }
};

module.exports = { colocarVenda, concluirVenda, listarVendasAtivas };
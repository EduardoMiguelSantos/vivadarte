// src/controllers/vendaController.js

const InventarioModel = require('../models/inventarioModel');

/**
 * Coloca uma peça específica à venda no inventário digital.
 * Implementa a US27.
 */
const colocarVenda = async (req, res) => {
    try {
        const { id_peca, id_vendedor, preco } = req.body;

        // 1. Validação dos dados obrigatórios para iniciar uma venda
        if (!id_peca || !id_vendedor || preco === undefined || preco <= 0) {
            return res.status(400).json({ 
                erro: 'A identificação da peça, do vendedor e um preço válido são obrigatórios.' 
            });
        }

        // 2. Construção do objeto de domínio mapeado para a tabela VENDA_PECA
        const novaVenda = {
            preco,
            data_colocacao: new Date().toISOString().split('T')[0], // Data atual (YYYY-MM-DD)
            data_venda: null, // Ainda não foi vendida
            estado: 'Disponível', // Estado inicial do processo de venda
            PECAid_peca: id_peca,
            UTILIZADORid_utilizador: id_vendedor // Mapeia para a FK do vendedor
        };

        // 3. Delegação para o Model (que irá inserir em VENDA_PECA e atualizar a tabela PECA)
        const idVendaCriada = await InventarioModel.inserirVenda(novaVenda);

        return res.status(201).json({
            mensagem: 'Peça colocada à venda com sucesso.',
            id_venda: idVendaCriada
        });

    } catch (erro) {
        console.error('Erro ao colocar peça à venda:', erro);
        // Proteção contra a restrição UNIQUE definida na tabela VENDA_PECA para o id_peca
        if (erro.message && erro.message.includes('UNIQUE')) {
            return res.status(409).json({ erro: 'Esta peça já se encontra registada num processo de venda.' });
        }
        return res.status(500).json({ erro: 'Erro interno ao tentar processar a colocação para venda.' });
    }
};

/**
 * Conclui o processo de venda, registando o comprador e o pagamento.
 * Implementa a US28.
 */
const concluirVenda = async (req, res) => {
    try {
        const { id_venda } = req.params;
        const { id_comprador, metodo_pagamento } = req.body;

        // 1. Validação de dados de fecho de negócio
        if (!id_comprador || !metodo_pagamento) {
            return res.status(400).json({ 
                erro: 'É obrigatório fornecer a identificação do comprador e o método de pagamento.' 
            });
        }

        // 2. Estruturação dos dados para o update
        const dadosFechoVenda = {
            data_venda: new Date().toISOString().split('T')[0],
            estado: 'Concluída',
            UTILIZADORid_utilizador2: id_comprador, // Mapeia para a FK do comprador na DB
            metodo_pagamento
        };

        // 3. Delegação para o Model (atualiza VENDA_PECA e remove a disponibilidade na tabela PECA)
        const linhasAfetadas = await InventarioModel.atualizarConclusaoVenda(id_venda, dadosFechoVenda);

        if (linhasAfetadas === 0) {
            return res.status(404).json({ erro: 'Processo de venda não encontrado ou já concluído.' });
        }

        return res.status(200).json({ mensagem: 'Venda concluída e inventário atualizado com sucesso.' });

    } catch (erro) {
        console.error('Erro ao concluir a venda:', erro);
        return res.status(500).json({ erro: 'Erro interno ao registar a conclusão da venda.' });
    }
};

/**
 * Lista as peças que estão ativas no mercado de vendas.
 * Pode ser útil para a visualização geral do inventário por parte de potenciais compradores.
 */
const listarVendasAtivas = async (req, res) => {
    try {
        // Delegação para o Model para fazer um SELECT com JOIN entre VENDA_PECA e PECA
        const vendas = await InventarioModel.obterVendasAtivas();

        return res.status(200).json(vendas);

    } catch (erro) {
        console.error('Erro ao listar vendas ativas:', erro);
        return res.status(500).json({ erro: 'Erro interno ao consultar as peças à venda.' });
    }
};

module.exports = {
    colocarVenda,
    concluirVenda,
    listarVendasAtivas
};
// src/controllers/emprestimoController.js

// Alteração: Importação centralizada no modelo do Inventário Digital
const InventarioModel = require('../models/inventarioModel');

/**
 * Solicita um novo empréstimo de uma ou mais peças.
 * Implementa a US23.
 */
const solicitarEmprestimo = async (req, res) => {
    try {
        const {
            id_utilizador,
            data_inicio,
            data_fim,
            observacoes,
            itens // Array de objetos contendo { id_peca, estado_entrega }
        } = req.body;

        if (!id_utilizador || !data_inicio || !data_fim || !itens || itens.length === 0) {
            return res.status(400).json({
                erro: 'Os campos id_utilizador, data_inicio, data_fim e uma lista de itens são obrigatórios.'
            });
        }

        const novoEmprestimo = {
            data_pedido: new Date().toISOString().split('T')[0], // Data atual do sistema
            data_inicio,
            data_fim,
            data_devolucao: null,
            estado: 'Pendente', 
            observacoes: observacoes || null,
            valor: null, 
            metodo_pagamento: null,
            estado_pagamento: 'Pendente',
            data_pagamento: null,
            id_utilizador
        };

        // Delegação para o Model centralizado do Inventário
        const idEmprestimoCriado = await InventarioModel.inserirEmprestimo(novoEmprestimo, itens);

        return res.status(201).json({
            mensagem: 'Pedido de empréstimo registado com sucesso.',
            id_emprestimo: idEmprestimoCriado
        });

    } catch (erro) {
        console.error('Erro ao solicitar empréstimo:', erro);
        return res.status(500).json({ erro: 'Erro interno ao processar a solicitação de empréstimo.' });
    }
};

/**
 * Regista a devolução das peças de um empréstimo, atualizando o seu estado.
 * Implementa a US24.
 */
const registarDevolucao = async (req, res) => {
    try {
        const { id_emprestimo } = req.params;
        const { data_devolucao, itens_devolvidos } = req.body; 

        if (!data_devolucao || !itens_devolvidos || itens_devolvidos.length === 0) {
            return res.status(400).json({ erro: 'A data de devolução e a lista do estado dos itens são obrigatórias.' });
        }

        // Delegação para o Model centralizado do Inventário
        const linhasAfetadas = await InventarioModel.atualizarDevolucaoEmprestimo(id_emprestimo, data_devolucao, itens_devolvidos);

        if (linhasAfetadas === 0) {
            return res.status(404).json({ erro: 'Empréstimo não encontrado ou já processado.' });
        }

        return res.status(200).json({ mensagem: 'Devolução registada com sucesso e inventário atualizado.' });

    } catch (erro) {
        console.error('Erro ao registar devolução:', erro);
        return res.status(500).json({ erro: 'Erro interno ao tentar registar a devolução.' });
    }
};

/**
 * Regista uma penalização associada a um item de um empréstimo (por dano ou atraso).
 * Implementa a US25.
 */
const registarPenalizacao = async (req, res) => {
    try {
        const { id_emprestimo } = req.params;
        const { id_peca, tipo, valor, descricao } = req.body;

        if (!id_peca || !tipo || valor === undefined) {
            return res.status(400).json({ erro: 'A identificação da peça, o tipo de penalização e o valor são obrigatórios.' });
        }

        const novaPenalizacao = {
            tipo, 
            valor,
            descricao: descricao || null,
            data_registo: new Date().toISOString().split('T')[0],
            id_peca,
            id_emprestimo
        };

        // Delegação para o Model centralizado do Inventário
        const idPenalizacao = await InventarioModel.inserirPenalizacao(novaPenalizacao);

        return res.status(201).json({
            mensagem: 'Penalização registada com sucesso.',
            id_penalizacao: idPenalizacao
        });

    } catch (erro) {
        console.error('Erro ao registar penalização:', erro);
        return res.status(500).json({ erro: 'Erro interno ao processar a penalização.' });
    }
};

/**
 * Regista o pagamento de taxas ou penalizações de um empréstimo.
 * Implementa a US26.
 */
const registarPagamentoEmprestimo = async (req, res) => {
    try {
        const { id_emprestimo } = req.params;
        const { valor, metodo_pagamento, estado_pagamento, data_pagamento } = req.body;

        if (!valor || !metodo_pagamento || !estado_pagamento) {
            return res.status(400).json({ erro: 'Os dados de valor, método e estado de pagamento são obrigatórios.' });
        }

        const dadosPagamento = {
            valor,
            metodo_pagamento,
            estado_pagamento,
            data_pagamento: data_pagamento || new Date().toISOString().split('T')[0]
        };

        // Delegação para o Model centralizado do Inventário
        const linhasAfetadas = await InventarioModel.atualizarPagamentoEmprestimo(id_emprestimo, dadosPagamento);

        if (linhasAfetadas === 0) {
            return res.status(404).json({ erro: 'Empréstimo não encontrado para registo de pagamento.' });
        }

        return res.status(200).json({ mensagem: 'Dados de pagamento atualizados com sucesso.' });

    } catch (erro) {
        console.error('Erro ao registar pagamento do empréstimo:', erro);
        return res.status(500).json({ erro: 'Erro interno ao registar o pagamento.' });
    }
};

module.exports = {
    solicitarEmprestimo,
    registarDevolucao,
    registarPenalizacao,
    registarPagamentoEmprestimo
};
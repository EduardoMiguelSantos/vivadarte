// src/controllers/pecaController.js

// 1. Importação do Model correto (conforme a tua estrutura de pastas)
const InventarioModel = require('../models/inventarioModel.js');

/**
 * Consulta o inventário de peças.
 * Suporta filtragem por categoria (Figurinos, Acessórios, etc.) através de query params.
 * Implementa a US20.
 */
const listarPecas = async (req, res) => {
    try {
        const { id_categoria_peca, disponivel_para_emprestimo, disponivel_para_venda } = req.query;

        // O Model deve lidar com a construção dinâmica da query SQL caso estes filtros existam
        const pecas = await InventarioModel.obterPecas(id_categoria_peca, disponivel_para_emprestimo, disponivel_para_venda);

        return res.status(200).json(pecas);

    } catch (erro) {
        console.error('Erro ao listar peças do inventário:', erro);
        return res.status(500).json({ erro: 'Erro interno ao consultar o inventário digital.' });
    }
};

/**
 * Consulta os detalhes específicos de uma peça, incluindo fotografias.
 * Implementa a US21.
 */
const obterDetalhesPeca = async (req, res) => {
    try {
        const { id_peca } = req.params;

        // O Model deve fazer um JOIN entre a tabela PECA e FOTO_PECA
        const detalhesPeca = await InventarioModel.obterPecaPorId(id_peca);

        if (!detalhesPeca) {
            return res.status(404).json({ erro: 'Peça não encontrada no inventário.' });
        }

        return res.status(200).json(detalhesPeca);

    } catch (erro) {
        console.error('Erro ao obter detalhes da peça:', erro);
        return res.status(500).json({ erro: 'Erro interno ao obter os detalhes da peça solicitada.' });
    }
};

/**
 * Regista uma nova peça no inventário digital.
 * Implementa a primeira parte da US22.
 */
const registarPeca = async (req, res) => {
    try {
        const {
            nome,
            descricao,
            tamanho,
            estado, // ex: 'Novo', 'Usado', 'A Necessitar de Reparação'
            origem,
            localizacao, // Onde está guardada fisicamente (ex: Armário 3, Prateleira B)
            disponivel_para_emprestimo, // bit (0 ou 1)
            disponivel_para_venda, // bit (0 ou 1)
            id_utilizador, // Quem está a registar
            id_categoria_peca
        } = req.body;

        // 1. Validação de dados obrigatórios
        if (!nome || !estado || !id_utilizador || !id_categoria_peca) {
            return res.status(400).json({
                erro: 'Os campos nome, estado, id_utilizador e id_categoria_peca são obrigatórios.'
            });
        }

        // 2. Preparação do objeto para o Model mapeando para a tabela PECA
        const novaPeca = {
            nome,
            descricao: descricao || null,
            tamanho: tamanho || null,
            estado,
            origem: origem || null,
            localizacao: localizacao || null,
            disponivel_para_emprestimo: disponivel_para_emprestimo !== undefined ? disponivel_para_emprestimo : 0,
            disponivel_para_venda: disponivel_para_venda !== undefined ? disponivel_para_venda : 0,
            data_registo: new Date().toISOString().split('T')[0], // Gera a data atual YYYY-MM-DD
            id_utilizador,
            id_categoria_peca
        };

        const idPecaCriada = await InventarioModel.inserirPeca(novaPeca);

        return res.status(201).json({
            mensagem: 'Peça registada com sucesso no inventário digital.',
            id_peca: idPecaCriada
        });

    } catch (erro) {
        console.error('Erro ao registar nova peça:', erro);
        return res.status(500).json({ erro: 'Erro interno ao tentar registar a peça.' });
    }
};

/**
 * Atualiza os dados de uma peça existente (estado, localização, disponibilidade).
 * Implementa a segunda parte da US22.
 */
const atualizarPeca = async (req, res) => {
    try {
        const { id_peca } = req.params;
        
        // Extraímos apenas os campos que podem ser frequentemente atualizados
        const { estado, localizacao, disponivel_para_emprestimo, disponivel_para_venda } = req.body;

        // Validamos se pelo menos um campo foi enviado para atualização
        if (!estado && !localizacao && disponivel_para_emprestimo === undefined && disponivel_para_venda === undefined) {
            return res.status(400).json({ erro: 'Nenhum dado válido fornecido para atualização.' });
        }

        const dadosAtualizacao = { estado, localizacao, disponivel_para_emprestimo, disponivel_para_venda };

        const linhasAfetadas = await InventarioModel.atualizarDadosPeca(id_peca, dadosAtualizacao);

        if (linhasAfetadas === 0) {
            return res.status(404).json({ erro: 'Peça não encontrada para atualização.' });
        }

        return res.status(200).json({ mensagem: 'Estado da peça atualizado com sucesso.' });

    } catch (erro) {
        console.error('Erro ao atualizar peça:', erro);
        return res.status(500).json({ erro: 'Erro interno ao processar a atualização da peça.' });
    }
};

module.exports = {
    listarPecas,
    obterDetalhesPeca,
    registarPeca,
    atualizarPeca
};
// src/controllers/faturacaoController.js

const FaturacaoModel = require('../models/faturacaoModel');

/**
 * Gera a faturação mensal agregando os coachings concluídos.
 * Implementa a US17.
 */
const gerarFaturacaoMensal = async (req, res) => {
    try {
        const { ano, mes, id_ano_letivo, id_utilizador } = req.body;

        // 1. Validação de dados obrigatórios
        if (!ano || !mes || !id_ano_letivo) {
            return res.status(400).json({ 
                erro: 'Os parâmetros ano, mes e id_ano_letivo são obrigatórios para gerar a faturação.' 
            });
        }

        // 2. Preparação dos dados base para a geração
        const dadosFaturacao = {
            ano,
            mes,
            data_geracao: new Date().toISOString().split('T')[0], // Data do sistema
            id_ano_letivo,
            id_utilizador: id_utilizador || null // Se null, gera para todos os utilizadores com atividade
        };

        // 3. Delegação para o Model (que fará o SUM(valor_final) dos coachings e o INSERT na FATURACAO_MENSAL)
        const resultadoGeracao = await FaturacaoModel.processarFaturacaoMensal(dadosFaturacao);

        return res.status(201).json({
            mensagem: 'Faturação mensal processada com sucesso.',
            detalhes: resultadoGeracao
        });

    } catch (erro) {
        console.error('Erro na geração da faturação mensal:', erro);
        return res.status(500).json({ erro: 'Erro interno ao processar a faturação do mês.' });
    }
};

/**
 * Consulta a lista de faturas geradas, permitindo filtros por utilizador ou estado de pagamento.
 * Implementa a vertente de consulta da US19.
 */
const listarFaturas = async (req, res) => {
    try {
        const { id_utilizador, estado_pagamento, mes, ano } = req.query;

        // O Model constrói a query de forma dinâmica consoante os filtros recebidos
        const faturas = await FaturacaoModel.obterFaturas(id_utilizador, estado_pagamento, mes, ano);

        return res.status(200).json(faturas);

    } catch (erro) {
        console.error('Erro ao listar faturas:', erro);
        return res.status(500).json({ erro: 'Erro interno ao consultar o histórico de faturação.' });
    }
};

/**
 * Atualiza os dados de liquidação de uma fatura específica.
 * Implementa a vertente de registo da US19.
 */
const registarPagamento = async (req, res) => {
    try {
        const { id_faturacao } = req.params;
        const { metodo_pagamento, estado_pagamento, data_pagamento } = req.body;

        // 1. Validação de segurança
        if (!metodo_pagamento || !estado_pagamento) {
            return res.status(400).json({ 
                erro: 'É obrigatório informar o método e o estado do pagamento.' 
            });
        }

        // 2. Mapeamento para a tabela FATURACAO_MENSAL
        const dadosPagamento = {
            metodo_pagamento,
            estado_pagamento,
            data_pagamento: data_pagamento || new Date().toISOString().split('T')[0]
        };

        // 3. Execução do UPDATE no Model
        const linhasAfetadas = await FaturacaoModel.atualizarEstadoPagamento(id_faturacao, dadosPagamento);

        if (linhasAfetadas === 0) {
            return res.status(404).json({ erro: 'Fatura não encontrada no sistema.' });
        }

        return res.status(200).json({ mensagem: 'Pagamento registado e atualizado com sucesso.' });

    } catch (erro) {
        console.error('Erro ao registar pagamento:', erro);
        return res.status(500).json({ erro: 'Erro interno ao tentar registar a liquidação da fatura.' });
    }
};

/**
 * Prepara e devolve os dados de faturação num formato otimizado para exportação (ex: CSV/Excel).
 * Implementa a US18.
 */
const exportarFaturacao = async (req, res) => {
    try {
        const { mes, ano } = req.query;

        if (!mes || !ano) {
            return res.status(400).json({ erro: 'É necessário especificar o mês e o ano para exportação.' });
        }

        const dadosExportacao = await FaturacaoModel.obterDadosParaExportacao(mes, ano);

        if (!dadosExportacao || dadosExportacao.length === 0) {
            return res.status(404).json({ erro: 'Não existem registos de faturação para o período selecionado.' });
        }

        return res.status(200).json({
            mensagem: 'Dados preparados para exportação.',
            dados: dadosExportacao
        });

    } catch (erro) {
        console.error('Erro ao exportar faturação:', erro);
        return res.status(500).json({ erro: 'Erro interno ao gerar o ficheiro de exportação.' });
    }
};

module.exports = {
    gerarFaturacaoMensal,
    listarFaturas,
    registarPagamento,
    exportarFaturacao
};
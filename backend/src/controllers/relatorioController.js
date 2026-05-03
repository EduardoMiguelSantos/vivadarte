// src/controllers/relatorioController.js

// Importação centralizada no modelo de Faturação
const FaturacaoModel = require('../models/faturacaoModel');

/**
 * Consulta o histórico global de um utilizador (aulas, coachings, despesas).
 * Implementa a US29.
 */
const consultarHistorico = async (req, res) => {
    try {
        const { id_utilizador, id_ano_letivo, tipo_historico } = req.query;

        // 1. Validação de segurança e integridade
        if (!id_utilizador || !id_ano_letivo) {
            return res.status(400).json({ 
                erro: 'A identificação do utilizador e o ano letivo são parâmetros obrigatórios para a consulta do histórico.' 
            });
        }

        // 2. Delegação para o Model centralizado
        const dadosHistorico = await FaturacaoModel.obterHistoricoUtilizador(id_utilizador, id_ano_letivo, tipo_historico);

        if (!dadosHistorico || dadosHistorico.length === 0) {
            return res.status(404).json({ mensagem: 'Não foram encontrados registos históricos para os parâmetros fornecidos.' });
        }

        return res.status(200).json(dadosHistorico);

    } catch (erro) {
        console.error('Erro ao consultar o histórico:', erro);
        return res.status(500).json({ erro: 'Erro interno ao tentar compilar os dados do histórico.' });
    }
};

/**
 * Gera um relatório contabilístico das aulas realizadas por cada professor.
 * Implementa a US30.
 */
const relatorioAulasProfessor = async (req, res) => {
    try {
        const { mes, ano, id_professor } = req.query;

        // 1. Validação temporal estrita
        if (!mes || !ano) {
            return res.status(400).json({ 
                erro: 'É obrigatório fornecer o mês e o ano para gerar o relatório operacional.' 
            });
        }

        // 2. Delegação para o Model centralizado
        const relatorio = await FaturacaoModel.obterRelatorioProfessores(mes, ano, id_professor);

        return res.status(200).json({
            mensagem: `Relatório gerado com sucesso para o período ${mes}/${ano}.`,
            dados: relatorio
        });

    } catch (erro) {
        console.error('Erro na geração do relatório de professores:', erro);
        return res.status(500).json({ erro: 'Erro interno ao processar a estatística de aulas por professor.' });
    }
};

module.exports = {
    consultarHistorico,
    relatorioAulasProfessor
};
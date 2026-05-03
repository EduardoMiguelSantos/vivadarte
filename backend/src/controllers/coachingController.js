// src/controllers/coachingController.js

const CoachingModel = require('../models/coachingModel');

/**
 * Consulta a agenda de um professor ou a agenda global (se for Coordenação).
 * Implementa a US10.
 */
const consultarAgenda = async (req, res) => {
    try {
        const { id_professor, data_inicio, data_fim } = req.query;

        // Se o id_professor for passado, filtramos a agenda desse professor.
        // Se não for passado, podemos assumir que a Coordenação quer ver a agenda global (dependendo do perfil).
        const agenda = await CoachingModel.obterAgenda(id_professor, data_inicio, data_fim);

        return res.status(200).json(agenda);

    } catch (erro) {
        console.error('Erro na consulta da agenda de coachings:', erro);
        return res.status(500).json({ erro: 'Erro interno ao consultar a agenda.' });
    }
};

/**
 * Aprova um pedido Pendente, transformando-o num Coaching marcado (e bloqueia estúdio).
 * Implementa a US07 e US08 (e indiretamente a US09 se for Coordenação a forçar o prof).
 */
const aprovarCoaching = async (req, res) => {
    try {
        const { id_pedido_coaching } = req.params;
        const { id_sala, id_professor } = req.body; 

        // A Coordenação precisa de alocar um estúdio para aprovar a aula
        if (!id_sala) {
            return res.status(400).json({ erro: 'É obrigatório atribuir uma sala (estúdio) para aprovar o coaching.' });
        }

        // O Model deve:
        // 1. Verificar conflitos de sala/professor na data/hora do pedido
        // 2. Mudar o estado do PEDIDO_COACHING para 'Aprovado'
        // 3. Inserir o registo na tabela COACHING (copiando dados do pedido e guardando o custo final)
        const idCoachingCriado = await CoachingModel.aprovarPedidoParaCoaching(id_pedido_coaching, id_sala, id_professor);

        if (!idCoachingCriado) {
            return res.status(409).json({ erro: 'Não foi possível aprovar. Verifique se existem conflitos de horário para a sala ou professor selecionados.' });
        }

        return res.status(201).json({
            mensagem: 'Coaching aprovado e agendado com sucesso.',
            id_coaching: idCoachingCriado
        });

    } catch (erro) {
        console.error('Erro ao aprovar coaching:', erro);
        return res.status(500).json({ erro: 'Erro interno ao processar a aprovação do coaching.' });
    }
};

/**
 * Permite ao Professor e/ou Encarregado de Educação confirmar que a aula decorreu.
 * Implementa a US13.
 */
const confirmarRealizacao = async (req, res) => {
    try {
        const { id_coaching } = req.params;
        const { id_utilizador, observacoes } = req.body; // Identificador de quem está a confirmar

        if (!id_utilizador) {
            return res.status(400).json({ erro: 'Identificação do utilizador obrigatória para a confirmação.' });
        }

        // Delegação ao Model para registar a validação
        // O Model insere na tabela VALIDACAO_COACHING
        const idValidacao = await CoachingModel.registarConfirmacaoParticipante(id_coaching, id_utilizador, 'Realizado', observacoes);

        return res.status(201).json({ 
            mensagem: 'Confirmação de realização registada com sucesso.',
            id_validacao: idValidacao
        });

    } catch (erro) {
        console.error('Erro ao confirmar realização do coaching:', erro);
        return res.status(500).json({ erro: 'Erro interno ao tentar registar a confirmação.' });
    }
};

/**
 * Ação exclusiva da Coordenação para validar a conclusão e fechar o coaching para contabilidade.
 * Implementa a US14.
 */
const validarConclusao = async (req, res) => {
    try {
        const { id_coaching } = req.params;
        const { id_utilizador_coordenacao, observacoes_finais, valor_final_ajustado } = req.body;

        if (!id_utilizador_coordenacao) {
            return res.status(400).json({ erro: 'Identificação da coordenação obrigatória para a validação final.' });
        }

        // O Model deve:
        // 1. Inserir registo na tabela VALIDACAO_COACHING (tipo_validador = 'Coordenacao')
        // 2. Atualizar o estado na tabela COACHING para 'Concluído'
        // 3. Atualizar o valor_final (caso haja ajuste manual por falta/tempo extra)
        const sucesso = await CoachingModel.validarConclusaoCoaching(id_coaching, id_utilizador_coordenacao, observacoes_finais, valor_final_ajustado);

        if (!sucesso) {
             return res.status(404).json({ erro: 'Coaching não encontrado ou erro na atualização do estado final.' });
        }

        return res.status(200).json({ mensagem: 'Coaching validado e fechado para faturação.' });

    } catch (erro) {
        console.error('Erro ao validar a conclusão do coaching:', erro);
        return res.status(500).json({ erro: 'Erro interno ao tentar validar a conclusão.' });
    }
};

module.exports = {
    consultarAgenda,
    aprovarCoaching,
    confirmarRealizacao,
    validarConclusao
};
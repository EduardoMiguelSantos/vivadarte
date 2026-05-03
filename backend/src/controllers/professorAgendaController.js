const coachingModel = require('../models/coachingModel');

/**
 * Agenda e disponibilidades do Professor.
 * Validação pós-aula: regista confirmação em VALIDACAO_COACHING (tipo Professor).
 */

async function getDisponibilidades(req, res, next) {
    try {
        const lista = await coachingModel.getDisponibilidadesProfessor(req.utilizador.id);
        return res.json({ disponibilidades: lista });
    } catch (err) {
        return next(err);
    }
}

async function postDisponibilidade(req, res, next) {
    try {
        const { diaSemana, horaInicio, horaFim } = req.body;
        if (diaSemana == null || !horaInicio || !horaFim) {
            return res.status(400).json({ error: 'diaSemana, horaInicio e horaFim são obrigatórios' });
        }

        await coachingModel.adicionarDisponibilidadeProfessor({
            diaSemana: Number(diaSemana),
            horaInicio,
            horaFim,
            idProfessor: req.utilizador.id
        });

        return res.status(201).json({ mensagem: 'Disponibilidade registada.' });
    } catch (err) {
        return next(err);
    }
}

async function deleteDisponibilidade(req, res, next) {
    try {
        const id = parseInt(req.params.idDisponibilidade, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'id inválido' });
        }

        const ok = await coachingModel.removerDisponibilidadeProfessor(id, req.utilizador.id);
        if (!ok) {
            return res.status(404).json({ error: 'Disponibilidade não encontrada ou não é sua.' });
        }

        return res.json({ mensagem: 'Disponibilidade removida.' });
    } catch (err) {
        return next(err);
    }
}

async function getAgenda(req, res, next) {
    try {
        const { dataInicio, dataFim } = req.query;
        const agenda = await coachingModel.getAgendaProfessor(
            req.utilizador.id,
            dataInicio || null,
            dataFim || null
        );
        return res.json({ agenda });
    } catch (err) {
        return next(err);
    }
}

async function listarPedidosOndeSouProfessor(req, res, next) {
    try {
        const pedidos = await coachingModel.getPedidosAtribuidosAoProfessor(req.utilizador.id);
        return res.json({ pedidos });
    } catch (err) {
        return next(err);
    }
}

async function validarRealizacaoAula(req, res, next) {
    try {
        const idCoaching = parseInt(req.params.idCoaching, 10);
        if (Number.isNaN(idCoaching)) {
            return res.status(400).json({ error: 'idCoaching inválido' });
        }

        const { estadoValidacao, observacoes } = req.body;
        if (!estadoValidacao || !['Confirmado', 'Nao_Realizado'].includes(estadoValidacao)) {
            return res.status(400).json({ error: 'estadoValidacao deve ser Confirmado ou Nao_Realizado' });
        }

        const autorizado = await coachingModel.coachingPertenceAProfessorAtivo(
            idCoaching,
            req.utilizador.id
        );
        if (!autorizado) {
            return res.status(404).json({ error: 'Coaching não encontrado ou não é o professor desta aula.' });
        }

        await coachingModel.registarValidacaoAula(
            idCoaching,
            req.utilizador.id,
            'Professor',
            estadoValidacao,
            observacoes || null
        );

        return res.status(201).json({ mensagem: 'Validação registada.' });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getDisponibilidades,
    postDisponibilidade,
    deleteDisponibilidade,
    getAgenda,
    listarPedidosOndeSouProfessor,
    validarRealizacaoAula
};

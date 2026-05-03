const coachingModel = require('../models/coachingModel');

/**
 * Coordenação / Admin: fila de pedidos pendentes, aprovar agendamento (cria COACHING),
 * rejeitar pedido, validação final pós-aula (Admin).
 */

async function listarPedidosPendentes(req, res, next) {
    try {
        const lista = await coachingModel.getPedidosPendentes();
        return res.json({ pedidos: lista });
    } catch (err) {
        return next(err);
    }
}

async function aprovarPedidoEAgendar(req, res, next) {
    try {
        const {
            idPedido,
            formatoAula,
            duracaoMinutos,
            numeroParticipantes,
            dataAula,
            horaInicio,
            idProfessor,
            idAnoLetivo,
            idModalidade,
            idSala,
            valorFinal
        } = req.body;

        if (
            idPedido == null ||
            !formatoAula ||
            duracaoMinutos == null ||
            numeroParticipantes == null ||
            !dataAula ||
            !horaInicio ||
            !idProfessor ||
            !idAnoLetivo ||
            !idModalidade ||
            !idSala ||
            valorFinal == null
        ) {
            return res.status(400).json({
                error:
                    'Campos obrigatórios: idPedido, formatoAula, duracaoMinutos, numeroParticipantes, dataAula, horaInicio, idProfessor, idAnoLetivo, idModalidade, idSala, valorFinal'
            });
        }

        const idCoaching = await coachingModel.aprovarEAgendarCoaching({
            idPedido: Number(idPedido),
            formatoAula,
            duracaoMinutos: Number(duracaoMinutos),
            numeroParticipantes: Number(numeroParticipantes),
            dataAula: new Date(`${dataAula}T12:00:00`),
            horaInicio,
            idProfessor: Number(idProfessor),
            idAnoLetivo: Number(idAnoLetivo),
            idModalidade: Number(idModalidade),
            idSala: Number(idSala),
            valorFinal: Number(valorFinal),
            idValidador: req.utilizador.id
        });

        return res.status(201).json({ id_coaching: idCoaching, mensagem: 'Coaching agendado.' });
    } catch (err) {
        return next(err);
    }
}

async function rejeitarPedido(req, res, next) {
    try {
        const idPedido = parseInt(req.params.idPedido, 10);
        const { justificacao } = req.body;

        if (Number.isNaN(idPedido) || !justificacao) {
            return res.status(400).json({ error: 'justificacao é obrigatória' });
        }

        const ok = await coachingModel.rejeitarPedidoCoaching(idPedido, justificacao);
        if (!ok) {
            return res.status(404).json({ error: 'Pedido não encontrado ou já não está pendente.' });
        }

        return res.json({ mensagem: 'Pedido rejeitado.' });
    } catch (err) {
        return next(err);
    }
}

async function finalizarValidacaoCoordenacao(req, res, next) {
    try {
        const idCoaching = parseInt(req.params.idCoaching, 10);
        if (Number.isNaN(idCoaching)) {
            return res.status(400).json({ error: 'idCoaching inválido' });
        }

        const { estadoFinal, observacoes } = req.body;
        if (!estadoFinal || !['Realizado', 'Nao_Realizado'].includes(estadoFinal)) {
            return res.status(400).json({ error: 'estadoFinal deve ser Realizado ou Nao_Realizado' });
        }

        await coachingModel.concluirCoachingPelaCoordenacao(
            idCoaching,
            req.utilizador.id,
            estadoFinal,
            observacoes || null
        );

        return res.json({ mensagem: 'Validação final registada e estado do coaching atualizado.' });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    listarPedidosPendentes,
    aprovarPedidoEAgendar,
    rejeitarPedido,
    finalizarValidacaoCoordenacao
};

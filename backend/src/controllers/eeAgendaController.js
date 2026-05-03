const coachingModel = require('../models/coachingModel');
const utilizadorModel = require('../models/utilizadorModel');

/**
 * Agenda / marcação do lado do Encarregado de Educação (EE).
 * Fluxo na BD: PEDIDO_COACHING (Pendente) → aprovação na coordenação → COACHING.
 */

async function getDisponibilidade(req, res, next) {
    try {
        const idModalidade = parseInt(req.query.idModalidade, 10);
        const diaSemana = parseInt(req.query.diaSemana, 10);
        const dataEspecifica = req.query.data;

        if (Number.isNaN(idModalidade) || Number.isNaN(diaSemana) || !dataEspecifica) {
            return res.status(400).json({
                error: 'Parâmetros obrigatórios: idModalidade, diaSemana (0–6), data (YYYY-MM-DD)'
            });
        }

        const data = new Date(`${dataEspecifica}T12:00:00`);
        const resultado = await coachingModel.getDisponibilidadeEfetiva(
            idModalidade,
            diaSemana,
            data
        );

        return res.json(resultado);
    } catch (err) {
        return next(err);
    }
}

async function criarPedido(req, res, next) {
    try {
        const idEncarregado = req.utilizador.id;
        const {
            formatoAula,
            duracaoMinutos,
            dataAula,
            horaInicio,
            custoEstimado,
            idAnoLetivo,
            idModalidade,
            idProfessor,
            alunosIds
        } = req.body;

        if (
            !formatoAula ||
            duracaoMinutos == null ||
            !dataAula ||
            !horaInicio ||
            custoEstimado == null ||
            !idAnoLetivo ||
            !idModalidade ||
            !idProfessor
        ) {
            return res.status(400).json({
                error:
                    'formatoAula, duracaoMinutos, dataAula, horaInicio, custoEstimado, idAnoLetivo, idModalidade, idProfessor e alunosIds são obrigatórios'
            });
        }

        const ids = Array.isArray(alunosIds) ? alunosIds.map(Number) : [];
        if (ids.length === 0) {
            return res.status(400).json({ error: 'Indique pelo menos um aluno (alunosIds).' });
        }

        const alunosPermitidos = await utilizadorModel.getAlunosPorEncarregado(idEncarregado);
        const permitidosSet = new Set(alunosPermitidos.map((a) => a.id_aluno));
        const todosValidos = ids.every((id) => permitidosSet.has(id));
        if (!todosValidos) {
            return res.status(403).json({ error: 'Um ou mais alunos não pertencem a este encarregado.' });
        }

        const idPedido = await coachingModel.criarPedidoCoaching(
            {
                formatoAula,
                duracaoMinutos: Number(duracaoMinutos),
                dataAula: new Date(`${dataAula}T12:00:00`),
                horaInicio,
                custoEstimado: Number(custoEstimado),
                idEncarregado,
                idAnoLetivo: Number(idAnoLetivo),
                idModalidade: Number(idModalidade),
                idProfessor: Number(idProfessor)
            },
            ids
        );

        return res.status(201).json({ id_pedido_coaching: idPedido, estado: 'Pendente' });
    } catch (err) {
        return next(err);
    }
}

async function listarMeusPedidos(req, res, next) {
    try {
        const pedidos = await coachingModel.getPedidosPorEncarregado(req.utilizador.id);
        return res.json({ pedidos });
    } catch (err) {
        return next(err);
    }
}

async function cancelarPedidoPendente(req, res, next) {
    try {
        const idPedido = parseInt(req.params.idPedido, 10);
        if (Number.isNaN(idPedido)) {
            return res.status(400).json({ error: 'idPedido inválido' });
        }

        const resultado = await coachingModel.cancelarPedidoPendenteEncarregado(
            idPedido,
            req.utilizador.id
        );

        if (resultado === 'nao_encontrado') {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }
        if (resultado === 'nao_pendente') {
            return res.status(400).json({ error: 'Só pode cancelar pedidos ainda pendentes.' });
        }

        return res.json({ mensagem: 'Pedido cancelado.' });
    } catch (err) {
        return next(err);
    }
}

async function listarMeusAlunos(req, res, next) {
    try {
        const alunos = await utilizadorModel.getAlunosPorEncarregado(req.utilizador.id);
        return res.json({ alunos });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getDisponibilidade,
    criarPedido,
    listarMeusPedidos,
    cancelarPedidoPendente,
    listarMeusAlunos
};

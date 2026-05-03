const CoachingModel = require('../models/coachingModel');

const consultarVagas = async (req, res) => {
    try {
        const { id_modalidade, dia_semana, data_especifica } = req.query;
        if (!id_modalidade || !dia_semana || !data_especifica) {
            return res.status(400).json({ erro: 'Parâmetros id_modalidade, dia_semana e data_especifica são obrigatórios.' });
        }
        // Nome corrigido para getDisponibilidadeEfetiva
        const vagas = await CoachingModel.getDisponibilidadeEfetiva(id_modalidade, dia_semana, data_especifica);
        return res.status(200).json(vagas);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao consultar vagas.' });
    }
};

const criarPedido = async (req, res) => {
    try {
        // TRUQUE: Tenta apanhar os nomes novos do SQL. Se não existirem, usa os nomes antigos do Frontend.
        const dataAula = req.body.data_aula_pretendida || req.body.data_sugerida;
        const horaInicio = req.body.hora_inicio_pretendida || req.body.hora_sugerida;
        const idAluno = req.body.UTILIZADORid_utilizador || req.body.id_utilizador_cliente;
        const idProfessor = req.body.UTILIZADORid_utilizador2 || req.body.id_professor_preferencial;
        const idModalidade = req.body.MODALIDADEid_modalidade || req.body.id_modalidade;
        
        // Se a hora não vier em nenhum dos formatos, paramos tudo e avisamos!
        if (!horaInicio) {
            return res.status(400).json({ erro: 'A hora é obrigatória no formato hora_inicio_pretendida ou hora_sugerida.' });
        }

        // TRATAMENTO DA HORA: Se não tiver segundos, nós acrescentamos
        const horaFormatada = horaInicio.split(':').length === 2 
            ? `${horaInicio}:00` 
            : horaInicio;

        // Criamos um objeto Date para a hora, que o mssql aceita melhor para sql.Time
        const [h, m, s] = horaFormatada.split(':');
        const dataHoraObj = new Date();
        dataHoraObj.setHours(h, m, s, 0);

        const dadosPedido = { 
            idEncarregado: idAluno,
            idModalidade: idModalidade,
            idProfessor: idProfessor,
            dataAula: dataAula, 
            horaInicio: dataHoraObj, 
            formatoAula: req.body.formato_aula,
            duracaoMinutos: req.body.duracao_minutos || 60,
            custoEstimado: 25.00,
            idAnoLetivo: req.body.ANO_LETIVOid_ano_letivo || 1
        };

        const idPedido = await CoachingModel.criarPedidoCoaching(dadosPedido, req.body.alunosIds || []);
        return res.status(201).json({ mensagem: 'Pedido submetido!', id_pedido: idPedido });
    } catch (erro) {
        console.error('Erro detalhado:', erro);
        return res.status(500).json({ erro: 'Erro ao submeter o pedido.' });
    }
};

const listarPedidos = async (req, res) => {
    try {
        // Nome corrigido para getPedidosPendentes
        const pedidos = await CoachingModel.getPedidosPendentes();
        return res.status(200).json(pedidos);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao listar pedidos.' });
    }
};

module.exports = { consultarVagas, criarPedido, listarPedidos };
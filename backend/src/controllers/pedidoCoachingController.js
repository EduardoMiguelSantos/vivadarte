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
        const { 
            id_utilizador_cliente, id_modalidade, id_professor_preferencial, 
            data_sugerida, hora_sugerida, formato_aula, objetivos, alunosIds 
        } = req.body;

        // TRATAMENTO DA HORA: Se não tiver segundos, nós acrescentamos
        const horaFormatada = hora_sugerida.split(':').length === 2 
            ? `${hora_sugerida}:00` 
            : hora_sugerida;

        // Criamos um objeto Date para a hora, que o mssql aceita melhor para sql.Time
        const [h, m, s] = horaFormatada.split(':');
        const dataHoraObj = new Date();
        dataHoraObj.setHours(h, m, s, 0);

        const dadosPedido = { 
            idEncarregado: id_utilizador_cliente,
            idModalidade: id_modalidade,
            idProfessor: id_professor_preferencial,
            dataAula: data_sugerida, 
            horaInicio: dataHoraObj, // Passamos o objeto Date em vez de string
            formatoAula: formato_aula,
            duracaoMinutos: 60,
            custoEstimado: 25.00,
            idAnoLetivo: 1 // Garante que este ID existe na BD do Eduardo!
        };

        const idPedido = await CoachingModel.criarPedidoCoaching(dadosPedido, alunosIds);
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
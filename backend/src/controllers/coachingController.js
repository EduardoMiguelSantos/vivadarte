const CoachingModel = require('../models/coachingModel');

const consultarAgenda = async (req, res) => {
    try {
        const { id_professor, data_inicio, data_fim } = req.query;
        if (!id_professor) return res.status(400).json({ erro: 'id_professor obrigatório.' });
        // Nome corrigido para getAgendaProfessor
        const agenda = await CoachingModel.getAgendaProfessor(id_professor, data_inicio, data_fim);
        return res.status(200).json(agenda);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao consultar agenda.' });
    }
};

const aprovarCoaching = async (req, res) => {
    try {
        const { dadosAgendamento } = req.body;
        // Nome corrigido para aprovarEAgendarCoaching
        const idCoaching = await CoachingModel.aprovarEAgendarCoaching(dadosAgendamento);
        return res.status(201).json({ mensagem: 'Coaching aprovado!', id_coaching: idCoaching });
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao aprovar coaching.' });
    }
};

module.exports = { consultarAgenda, aprovarCoaching };
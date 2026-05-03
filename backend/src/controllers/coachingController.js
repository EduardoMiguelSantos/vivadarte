const CoachingModel = require('../models/coachingModel');
const { poolPromise } = require('../config/db'); // Subimos o import para o topo!

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

const listarPedidosProfessor = async (req, res) => {
    const { id_professor } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_prof', id_professor)
            .query(`
                SELECT 
                    pc.id_pedido_coaching AS id_pedido,
                    pc.data_aula_pretendida AS data_sugerida,
                    pc.hora_inicio_pretendida AS hora_sugerida,
                    pc.estado,
                    pc.formato_aula,
                    pc.duracao_minutos,
                    u.nome AS nome_aluno,
                    u.email AS email_aluno
                FROM [vivadarte].[dbo].[PEDIDO_COACHING] pc
                -- Assumimos que UTILIZADORid_utilizador é o Aluno que fez o pedido
                INNER JOIN [vivadarte].[dbo].[UTILIZADOR] u ON pc.UTILIZADORid_utilizador = u.id_utilizador
                -- Assumimos que UTILIZADORid_utilizador2 é o Professor
                WHERE pc.UTILIZADORid_utilizador2 = @id_prof
                ORDER BY pc.data_aula_pretendida ASC
            `);

        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Erro ao buscar pedidos do professor:', error.message);
        return res.status(500).json({ error: 'Erro ao consultar a base de dados.' });
    }
};

const decidirPedido = async (req, res) => {
    const { id_pedido } = req.params;     // O ID do pedido vem no URL
    const { novo_estado } = req.body;     // O novo estado vem no corpo (body) do pedido

    try {
        // Validação de segurança: só aceitamos estes dois estados
        if (!['Aceite', 'Recusado'].includes(novo_estado)) {
            return res.status(400).json({ error: "O estado deve ser 'Aceite' ou 'Recusado'." });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('estado', novo_estado)
            .input('id', id_pedido)
            .query(`
                UPDATE [vivadarte].[dbo].[PEDIDO_COACHING]
                SET estado = @estado
                WHERE id_pedido_coaching = @id
            `);

        // Se o rowsAffected for 0, significa que o ID do pedido não existia no SQL
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        return res.status(200).json({ mensagem: `Pedido ${id_pedido} atualizado para ${novo_estado} com sucesso!` });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error.message);
        return res.status(500).json({ error: 'Erro ao atualizar a base de dados.' });
    }
};

// Exportamos as três funções juntas para as rotas as encontrarem
module.exports = { consultarAgenda, aprovarCoaching, listarPedidosProfessor, decidirPedido };
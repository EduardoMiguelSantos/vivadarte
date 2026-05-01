const { pool, poolConnect, sql } = require('../config/db');

// GET /api/admin/pendentes
async function listarPendentes(req, res) {
    try {
        await poolConnect;

        const result = await pool.request().query(`
            SELECT 
                u.id_utilizador,
                u.nome,
                u.email,
                u.telefone,
                u.data_criacao,
                p.nome AS perfil
            FROM UTILIZADOR u
            JOIN UTILIZADOR_PERFIL up ON up.UTILIZADOR_id = u.id_utilizador
            JOIN PERFIL p ON p.id_perfil = up.PERFIL_id
            WHERE u.ativo = 0
            ORDER BY u.data_criacao
        `);

        return res.json(result.recordset);

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// PUT /api/admin/aprovar/:id
async function aprovar(req, res) {
    try {
        const { id } = req.params;
        await poolConnect;

        await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE UTILIZADOR SET ativo = 1 WHERE id_utilizador = @id');

        return res.json({ success: true, message: 'Utilizador aprovado!' });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// DELETE /api/admin/rejeitar/:id
async function rejeitar(req, res) {
    try {
        const { id } = req.params;
        await poolConnect;

        // Apaga perfil primeiro (FK)
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM UTILIZADOR_PERFIL WHERE UTILIZADOR_id = @id');

        // Apaga utilizador
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM UTILIZADOR WHERE id_utilizador = @id AND ativo = 0');

        return res.json({ success: true, message: 'Pedido rejeitado!' });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
    
}

// GET /api/admin/utilizadores
async function listarUtilizadores(req, res) {
    try {
        await poolConnect;

        const result = await pool.request().query(`
            SELECT
                u.id_utilizador,
                u.nome,
                u.email,
                u.telefone,
                u.ativo,
                u.data_criacao,
                p.nome AS perfil
            FROM UTILIZADOR u
            LEFT JOIN UTILIZADOR_PERFIL up ON up.UTILIZADOR_id = u.id_utilizador
            LEFT JOIN PERFIL p ON p.id_perfil = up.PERFIL_id
            ORDER BY u.nome
        `);

        return res.json(result.recordset);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { listarPendentes, aprovar, rejeitar, listarUtilizadores };
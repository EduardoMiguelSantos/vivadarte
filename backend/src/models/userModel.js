const { pool, sql } = require('../config/db');

async function getPerfilIdByNome(nomePerfil) {
    const result = await pool
        .request()
        .input('nome', sql.NVarChar(100), nomePerfil)
        .query('SELECT id_perfil FROM PERFIL WHERE nome = @nome');

    return result.recordset[0]?.id_perfil || null;
}

async function getUtilizadorByEmail(email) {
    const result = await pool
        .request()
        .input('email', sql.NVarChar(255), email)
        .query(`
            SELECT
                u.id_utilizador,
                u.nome,
                u.email,
                u.password_hash,
                u.ativo
            FROM UTILIZADOR u
            WHERE u.email = @email
        `);

    return result.recordset[0] || null;
}

async function getPerfisDoUtilizador(utilizadorId) {
    const result = await pool
        .request()
        .input('utilizadorId', sql.Int, utilizadorId)
        .query(`
            SELECT p.nome
            FROM UTILIZADOR_PERFIL up
            INNER JOIN PERFIL p ON p.id_perfil = up.PERFIL_id
            WHERE up.UTILIZADOR_id = @utilizadorId
        `);

    return result.recordset.map((row) => row.nome);
}

async function criarUtilizador({ nome, email, passwordHash, telefone = null, perfilNome }) {
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        const perfilId = await transaction
            .request()
            .input('nomePerfil', sql.NVarChar(100), perfilNome)
            .query('SELECT id_perfil FROM PERFIL WHERE nome = @nomePerfil');

        const perfilEncontrado = perfilId.recordset[0]?.id_perfil;
        if (!perfilEncontrado) {
            throw new Error('Perfil inválido');
        }

        const novoUtilizadorResult = await transaction
            .request()
            .input('nome', sql.NVarChar(255), nome)
            .input('email', sql.NVarChar(255), email)
            .input('passwordHash', sql.NVarChar(255), passwordHash)
            .input('telefone', sql.NVarChar(30), telefone)
            .query(`
                INSERT INTO UTILIZADOR (nome, email, password_hash, telefone)
                OUTPUT INSERTED.id_utilizador, INSERTED.nome, INSERTED.email, INSERTED.ativo
                VALUES (@nome, @email, @passwordHash, @telefone)
            `);

        const utilizador = novoUtilizadorResult.recordset[0];

        await transaction
            .request()
            .input('utilizadorId', sql.Int, utilizador.id_utilizador)
            .input('perfilId', sql.Int, perfilEncontrado)
            .query(`
                INSERT INTO UTILIZADOR_PERFIL (UTILIZADOR_id, PERFIL_id)
                VALUES (@utilizadorId, @perfilId)
            `);

        await transaction.commit();

        return utilizador;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

module.exports = {
    getPerfilIdByNome,
    getUtilizadorByEmail,
    getPerfisDoUtilizador,
    criarUtilizador
};

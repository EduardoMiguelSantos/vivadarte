const { poolPromise } = require('../config/db');
const sql = require('mssql');

// ============================================================================
// 1. GESTÃO DO CALENDÁRIO LETIVO
// ============================================================================

async function getAnosLetivos() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                id_ano_letivo, 
                ano 
            FROM ANO_LETIVO
            ORDER BY ano DESC;
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getAnosLetivos):', error);
        throw error;
    }
}

// ============================================================================
// 2. CATÁLOGO DE RECURSOS (SALAS E MODALIDADES)
// ============================================================================

async function getModalidadesAtivas() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                id_modalidade, 
                nome 
            FROM MODALIDADE 
            WHERE ativo = 1
            ORDER BY nome ASC;
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getModalidadesAtivas):', error);
        throw error;
    }
}

async function getSalas() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                id_sala, 
                nome, 
                capacidade_maxima 
            FROM SALA
            ORDER BY nome ASC;
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getSalas):', error);
        throw error;
    }
}

// ============================================================================
// 3. MATRIZES DE CRUZAMENTO (REGRAS FÍSICAS E HUMANAS)
// ============================================================================

async function getCompatibilidadeSalasModalidades() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                s.id_sala,
                s.nome AS nome_sala,
                m.id_modalidade,
                m.nome AS modalidade_permitida
            FROM SALA s
            JOIN SALA_MODALIDADE sm ON s.id_sala = sm.SALAid_sala
            JOIN MODALIDADE m ON sm.MODALIDADEid_modalidade = m.id_modalidade
            WHERE m.ativo = 1
            ORDER BY s.nome ASC, m.nome ASC;
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getCompatibilidadeSalasModalidades):', error);
        throw error;
    }
}

async function getModalidadesPorProfessor(idProfessor) {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                m.id_modalidade,
                m.nome AS modalidade
            FROM UTILIZADOR u
            JOIN PROFESSOR_MODALIDADE pm ON u.id_utilizador = pm.UTILIZADORid_utilizador
            JOIN MODALIDADE m ON pm.MODALIDADEid_modalidade = m.id_modalidade
            WHERE u.id_utilizador = @IdProfessor 
              AND u.ativo = 1 
              AND m.ativo = 1
            ORDER BY m.nome ASC;
        `;
        const result = await pool.request()
            .input('IdProfessor', sql.Int, idProfessor)
            .query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getModalidadesPorProfessor):', error);
        throw error;
    }
}

async function getProfessoresPorModalidade(idModalidade) {
    try {
        const pool = await poolPromise;
        // Esta query é fundamental para a US05: quando um encarregado escolhe a modalidade, 
        // o frontend necessita de saber quais os professores que a lecionam para preencher a dropdown.
        const query = `
            SELECT 
                u.id_utilizador AS id_professor,
                u.nome AS nome_professor
            FROM MODALIDADE m
            JOIN PROFESSOR_MODALIDADE pm ON m.id_modalidade = pm.MODALIDADEid_modalidade
            JOIN UTILIZADOR u ON pm.UTILIZADORid_utilizador = u.id_utilizador
            WHERE m.id_modalidade = @IdModalidade 
              AND u.ativo = 1
            ORDER BY u.nome ASC;
        `;
        const result = await pool.request()
            .input('IdModalidade', sql.Int, idModalidade)
            .query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getProfessoresPorModalidade):', error);
        throw error;
    }
}

module.exports = {
    getAnosLetivos,
    getModalidadesAtivas,
    getSalas,
    getCompatibilidadeSalasModalidades,
    getModalidadesPorProfessor,
    getProfessoresPorModalidade
};
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// ============================================================================
// 1. GESTÃO DO CALENDÁRIO LETIVO E PREÇOS (US15 / RF17)
// ============================================================================

async function getAnosLetivos() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT id_ano_letivo, ano 
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

/**
 * Obtém o Ano Letivo corrente. 
 * Garante que novos registos assumem o ano letivo atual automaticamente.
 */
async function getAnoLetivoAtivo() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT TOP 1 id_ano_letivo, ano 
            FROM ANO_LETIVO 
            ORDER BY id_ano_letivo DESC;
        `;
        const result = await pool.request().query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Erro no Modelo (getAnoLetivoAtivo):', error);
        throw error;
    }
}

/**
 * Obtém a tabela de preços atual cruzada por formato, duração e dia.
 */
async function getTabelaPrecos() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT id_preco, formato_aula, duracao_minutos, dia_semana, preco 
            FROM TABELA_PRECO 
            WHERE ativo = 1 
            ORDER BY dia_semana ASC, duracao_minutos ASC, preco ASC;
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getTabelaPrecos):', error);
        throw error;
    }
}

// ============================================================================
// 2. CATÁLOGO DE RECURSOS FÍSICOS E PEDAGÓGICOS
// ============================================================================

async function getModalidadesAtivas() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT id_modalidade, nome 
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
            SELECT id_sala, nome, capacidade_maxima 
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
// 3. MATRIZES DE CRUZAMENTO (REGRAS FÍSICAS E HUMANAS - RF10, RF13)
// ============================================================================

/**
 * Devolve a matriz completa de quais modalidades podem ser dadas em quais salas.
 */
async function getCompatibilidadeSalasModalidades() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                s.id_sala, s.nome AS nome_sala,
                m.id_modalidade, m.nome AS modalidade_permitida
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

/**
 * Consulta otimizada para filtrar as salas aptas com base numa modalidade específica.
 */
async function getSalasPorModalidade(idModalidade) {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT s.id_sala, s.nome, s.capacidade_maxima
            FROM SALA s
            JOIN SALA_MODALIDADE sm ON s.id_sala = sm.SALAid_sala
            WHERE sm.MODALIDADEid_modalidade = @IdModalidade
            ORDER BY s.nome ASC;
        `;
        const result = await pool.request()
            .input('IdModalidade', sql.Int, idModalidade)
            .query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getSalasPorModalidade):', error);
        throw error;
    }
}

async function getModalidadesPorProfessor(idProfessor) {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT m.id_modalidade, m.nome AS modalidade
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

/**
 * Alimenta as dropdowns do frontend durante o agendamento (US05).
 */
async function getProfessoresPorModalidade(idModalidade) {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT u.id_utilizador AS id_professor, u.nome AS nome_professor
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
    getAnoLetivoAtivo,
    getTabelaPrecos,
    getModalidadesAtivas,
    getSalas,
    getCompatibilidadeSalasModalidades,
    getSalasPorModalidade,
    getModalidadesPorProfessor,
    getProfessoresPorModalidade
};
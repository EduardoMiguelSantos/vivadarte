const { poolPromise } = require('../config/db');
const sql = require('mssql');

// ============================================================================
// 1. GESTÃO E CÁLCULO DE CUSTOS (US15, US16 / RF17, RF18)
// ============================================================================

async function getTabelaPrecos() {
    try {
        const pool = await poolPromise;
        // Usa aliases curtos (tp, m, u) e LEFT JOINs porque o preço pode ser universal (NULL na modalidade/professor)
        const query = `
            SELECT 
                tp.id_preco,
                tp.formato_aula,
                tp.duracao_minutos,
                tp.dia_semana,
                tp.preco,
                tp.ativo,
                m.nome AS modalidade_excecao,
                u.nome AS professor_excecao
            FROM TABELA_PRECO tp
            LEFT JOIN MODALIDADE m 
                ON tp.MODALIDADEid_modalidade = m.id_modalidade
            LEFT JOIN UTILIZADOR u 
                ON tp.UTILIZADORid_utilizador = u.id_utilizador
            WHERE tp.ativo = 1
            ORDER BY tp.dia_semana ASC, tp.duracao_minutos ASC;
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getTabelaPrecos):', error);
        throw error;
    }
}

async function calcularCustoAutomatico(formato, duracao, diaSemana, idModalidade, idProfessor) {
    try {
        const pool = await poolPromise;
        // Esta query procura o preço exato. A ordenação (DESC) garante que preços com exceções 
        // (ex: um preço específico para um professor) aparecem primeiro do que os genéricos (NULL).
        const query = `
            SELECT TOP 1 preco
            FROM TABELA_PRECO
            WHERE formato_aula = @Formato
              AND duracao_minutos = @Duracao
              AND dia_semana = @DiaSemana
              AND ativo = 1
              AND (MODALIDADEid_modalidade = @IdModalidade OR MODALIDADEid_modalidade IS NULL)
              AND (UTILIZADORid_utilizador = @IdProfessor OR UTILIZADORid_utilizador IS NULL)
            ORDER BY 
              UTILIZADORid_utilizador DESC, 
              MODALIDADEid_modalidade DESC;
        `;
        const result = await pool.request()
            .input('Formato', sql.VarChar(50), formato)
            .input('Duracao', sql.Int, duracao)
            .input('DiaSemana', sql.Int, diaSemana)
            .input('IdModalidade', sql.Int, idModalidade)
            .input('IdProfessor', sql.Int, idProfessor)
            .query(query);

        return result.recordset[0]?.preco || null;
    } catch (error) {
        console.error('Erro no Modelo (calcularCustoAutomatico):', error);
        throw error;
    }
}

// ============================================================================
// 2. GESTÃO DE FATURAÇÃO MENSAL (US17, US18, US19 / RF18, RF19, RF20)
// ============================================================================

async function getResumoFaturacaoMensal(ano, mes) {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                fm.id_faturacao,
                u.nome AS encarregado_educacao,
                u.email AS contacto,
                fm.ano,
                fm.mes,
                fm.total AS valor_faturado,
                fm.estado_pagamento,
                fm.metodo_pagamento,
                fm.data_pagamento,
                fm.data_geracao
            FROM FATURACAO_MENSAL fm
            JOIN UTILIZADOR u 
                ON fm.UTILIZADORid_utilizador = u.id_utilizador
            WHERE fm.ano = @Ano 
              AND fm.mes = @Mes
            ORDER BY 
                fm.estado_pagamento ASC, 
                u.nome ASC;
        `;
        const result = await pool.request()
            .input('Ano', sql.Int, ano)
            .input('Mes', sql.Int, mes)
            .query(query);
            
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getResumoFaturacaoMensal):', error);
        throw error;
    }
}

async function atualizarPagamentoFatura(idFaturacao, novoEstado, metodoPagamento) {
    try {
        const pool = await poolPromise;
        const query = `
            UPDATE FATURACAO_MENSAL 
            SET 
                estado_pagamento = @NovoEstado,
                metodo_pagamento = @Metodo,
                data_pagamento = GETDATE()
            WHERE id_faturacao = @IdFaturacao;
        `;
        const result = await pool.request()
            .input('NovoEstado', sql.VarChar(50), novoEstado)
            .input('Metodo', sql.VarChar(50), metodoPagamento)
            .input('IdFaturacao', sql.Int, idFaturacao)
            .query(query);
            
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error('Erro no Modelo (atualizarPagamentoFatura):', error);
        throw error;
    }
}

// ============================================================================
// 3. RELATÓRIOS DA ADMINISTRAÇÃO E PRODUTIVIDADE (US30 / RF28)
// ============================================================================

async function getRelatorioAulasReceita(ano, mes) {
    try {
        const pool = await poolPromise;
        // Estrutura de agrupamento com aliases simplificados (c, m, u)
        const query = `
            SELECT 
                u.nome AS nome_professor,
                m.nome AS modalidade,
                YEAR(c.data_aula) AS ano,
                MONTH(c.data_aula) AS mes,
                COUNT(c.id_coaching) AS total_aulas_realizadas,
                SUM(c.valor_final) AS total_receita_gerada
            FROM COACHING c
            JOIN MODALIDADE m 
                ON c.MODALIDADEid_modalidade = m.id_modalidade
            JOIN UTILIZADOR u 
                ON c.UTILIZADORid_utilizador = u.id_utilizador
            WHERE c.estado IN ('Concluido', 'Realizado') 
              AND YEAR(c.data_aula) = @Ano 
              AND MONTH(c.data_aula) = @Mes
            GROUP BY 
                u.nome, 
                m.nome, 
                YEAR(c.data_aula), 
                MONTH(c.data_aula)
            ORDER BY 
                total_receita_gerada DESC;
        `;
        const result = await pool.request()
            .input('Ano', sql.Int, ano)
            .input('Mes', sql.Int, mes)
            .query(query);
            
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getRelatorioAulasReceita):', error);
        throw error;
    }
}

module.exports = {
    getTabelaPrecos,
    calcularCustoAutomatico,
    getResumoFaturacaoMensal,
    atualizarPagamentoFatura,
    getRelatorioAulasReceita
};
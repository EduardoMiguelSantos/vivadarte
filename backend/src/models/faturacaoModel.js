const { poolPromise } = require('../config/db');
const sql = require('mssql');

// ============================================================================
// 1. CÁLCULO E GERAÇÃO DE FATURAÇÃO (US16, US17 / RF18)
// ============================================================================

/**
 * Calcula o valor total devido por um utilizador num determinado mês/ano e gera a fatura.
 * Agrega os custos de coachings realizados e empréstimos de inventário.
 */
async function gerarFaturacaoMensal(mes, ano, idUtilizador, idAnoLetivo) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        // 1. Calcular o sumatório cruzando Coachings e Empréstimos
        const queryTotal = `
            SELECT 
                ISNULL((SELECT SUM(c.valor_final) 
                 FROM COACHING c 
                 JOIN PEDIDO_COACHING pc ON c.PEDIDO_COACHINGid_pedido_coaching = pc.id_pedido_coaching 
                 WHERE pc.UTILIZADORid_utilizador2 = @IdUtilizador 
                   AND MONTH(c.data_aula) = @Mes 
                   AND YEAR(c.data_aula) = @Ano 
                   AND c.estado = 'Realizado'), 0)
                +
                ISNULL((SELECT SUM(e.valor) 
                 FROM EMPRESTIMO e 
                 WHERE e.UTILIZADORid_utilizador = @IdUtilizador 
                   AND MONTH(e.data_inicio) = @Mes 
                   AND YEAR(e.data_inicio) = @Ano
                   AND e.estado NOT IN ('Cancelado', 'Rejeitado')), 0) AS total_apurado;
        `;
        
        const resultCalculo = await transaction.request()
            .input('IdUtilizador', sql.Int, idUtilizador)
            .input('Mes', sql.Int, mes)
            .input('Ano', sql.Int, ano)
            .query(queryTotal);

        const totalMes = resultCalculo.recordset[0].total_apurado;

        if (totalMes === 0) {
            await transaction.commit();
            return null; // Não gera fatura se não houver consumo
        }

        // 2. Inserir o registo na tabela FATURACAO_MENSAL
        const queryInsert = `
            INSERT INTO FATURACAO_MENSAL 
            (ano, mes, data_geracao, total, estado_pagamento, UTILIZADORid_utilizador, ANO_LETIVOid_ano_letivo)
            OUTPUT INSERTED.id_faturacao
            VALUES 
            (@Ano, @Mes, GETDATE(), @Total, 'Pendente', @IdUtilizador, @IdAnoLetivo);
        `;
        
        const resultFatura = await transaction.request()
            .input('Ano', sql.Int, ano)
            .input('Mes', sql.Int, mes)
            .input('Total', sql.Decimal(10, 2), totalMes)
            .input('IdUtilizador', sql.Int, idUtilizador)
            .input('IdAnoLetivo', sql.Int, idAnoLetivo)
            .query(queryInsert);

        await transaction.commit();
        return resultFatura.recordset[0].id_faturacao;
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no Modelo Transacional (gerarFaturacaoMensal):', error);
        throw error;
    }
}

// ============================================================================
// 2. CONSULTA E GESTÃO DE PAGAMENTOS (US18, US19 / RF19, RF20)
// ============================================================================

/**
 * Consulta as faturas de um utilizador específico ou de todos (caso idUtilizador seja null).
 */
async function getFaturacao(idUtilizador = null) {
    try {
        const pool = await poolPromise;
        let query = `
            SELECT f.*, u.nome AS cliente, a.ano AS ano_letivo_nome
            FROM FATURACAO_MENSAL f
            JOIN UTILIZADOR u ON f.UTILIZADORid_utilizador = u.id_utilizador
            JOIN ANO_LETIVO a ON f.ANO_LETIVOid_ano_letivo = a.id_ano_letivo
        `;
        
        if (idUtilizador) {
            query += ` WHERE f.UTILIZADORid_utilizador = @IdUtilizador`;
        }
        query += ` ORDER BY f.ano DESC, f.mes DESC;`;

        const request = pool.request();
        if (idUtilizador) request.input('IdUtilizador', sql.Int, idUtilizador);
        
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getFaturacao):', error);
        throw error;
    }
}

/**
 * Atualiza o estado da fatura quando o pagamento é liquidado pela Coordenação/Contabilidade.
 */
async function registarPagamentoFatura(idFaturacao, metodoPagamento) {
    try {
        const pool = await poolPromise;
        const query = `
            UPDATE FATURACAO_MENSAL 
            SET estado_pagamento = 'Pago', metodo_pagamento = @Metodo, data_pagamento = GETDATE()
            WHERE id_faturacao = @IdFaturacao AND estado_pagamento = 'Pendente';
        `;
        const result = await pool.request()
            .input('Metodo', sql.VarChar(50), metodoPagamento)
            .input('IdFaturacao', sql.Int, idFaturacao)
            .query(query);
            
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error('Erro no Modelo (registarPagamentoFatura):', error);
        throw error;
    }
}

// ============================================================================
// 3. RELATÓRIOS E HISTÓRICO GERAL (US29, US30 / RF27, RF28)
// ============================================================================

/**
 * Agrega o histórico de todas as atividades (Coachings e Empréstimos) de um utilizador.
 * Serve a US29 para que EE's e Professores consultem as suas atividades passadas.
 */
async function getHistoricoAtividades(idUtilizador) {
    try {
        const pool = await poolPromise;
        // Utilização de UNION ALL para unificar as linhas do tempo de tabelas diferentes num feed coerente
        const query = `
            SELECT 'Coaching' AS tipo_atividade, c.data_aula AS data_registo, m.nome AS detalhe, c.valor_final AS valor, c.estado
            FROM COACHING c
            JOIN MODALIDADE m ON c.MODALIDADEid_modalidade = m.id_modalidade
            JOIN PEDIDO_COACHING pc ON c.PEDIDO_COACHINGid_pedido_coaching = pc.id_pedido_coaching
            WHERE pc.UTILIZADORid_utilizador2 = @IdUtilizador OR c.UTILIZADORid_utilizador = @IdUtilizador
            
            UNION ALL
            
            SELECT 'Empréstimo Inventário' AS tipo_atividade, e.data_inicio AS data_registo, 'Levantamento de Peças' AS detalhe, e.valor AS valor, e.estado
            FROM EMPRESTIMO e
            WHERE e.UTILIZADORid_utilizador = @IdUtilizador
            
            ORDER BY data_registo DESC;
        `;
        const result = await pool.request()
            .input('IdUtilizador', sql.Int, idUtilizador)
            .query(query);
            
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getHistoricoAtividades):', error);
        throw error;
    }
}

/**
 * Gera o relatório mensal agregado para a Administração com o volume de aulas dadas por cada professor.
 */
async function getRelatorioAulasProfessor(mes, ano) {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                u.nome AS professor, 
                m.nome AS modalidade, 
                COUNT(c.id_coaching) AS total_aulas, 
                SUM(c.duracao_minutos) AS total_minutos
            FROM COACHING c
            JOIN UTILIZADOR u ON c.UTILIZADORid_utilizador = u.id_utilizador
            JOIN MODALIDADE m ON c.MODALIDADEid_modalidade = m.id_modalidade
            WHERE MONTH(c.data_aula) = @Mes 
              AND YEAR(c.data_aula) = @Ano 
              AND c.estado = 'Realizado'
            GROUP BY u.nome, m.nome
            ORDER BY u.nome ASC;
        `;
        const result = await pool.request()
            .input('Mes', sql.Int, mes)
            .input('Ano', sql.Int, ano)
            .query(query);
            
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getRelatorioAulasProfessor):', error);
        throw error;
    }
}

module.exports = {
    gerarFaturacaoMensal,
    getFaturacao,
    registarPagamentoFatura,
    getHistoricoAtividades,
    getRelatorioAulasProfessor
};
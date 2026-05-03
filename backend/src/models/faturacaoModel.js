const { poolPromise } = require('../config/db');
const sql = require('mssql');
 
// ============================================================================
// 1. TABELA DE PREÇOS (US15 / RF17)
// ============================================================================
 
/**
 * Retorna toda a tabela de preços ativa, incluindo exceções por modalidade/professor.
 * As colunas MODALIDADEid_modalidade e UTILIZADORid_utilizador são nullable
 * (NULL = regra universal; preenchido = exceção específica).
 */
async function getTabelaPrecos() {
    try {
        const pool = await poolPromise;
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
 
/**
 * Calcula o custo de um coaching com base no formato, duração, dia e possíveis exceções.
 * Prioridade: exceção por professor > exceção por modalidade > preço universal.
 * (US16 / RF17, RF18)
 */
async function calcularCustoAutomatico(formato, duracao, diaSemana, idModalidade, idProfessor) {
    try {
        const pool = await poolPromise;
        // A ordenação DESC nas colunas nullable coloca os NOT NULL primeiro no SQL Server,
        // garantindo que exceções específicas têm prioridade sobre regras universais (NULL).
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
                UTILIZADORid_utilizador DESC,   -- exceção por professor primeiro
                MODALIDADEid_modalidade DESC;    -- depois por modalidade
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
// 2. GERAÇÃO DE FATURAÇÃO MENSAL (US17 / RF18)
// ============================================================================
 
/**
 * Calcula o total de coachings realizados e empréstimos ativos de um EE num dado mês/ano
 * e cria o registo de faturação. Protegido contra duplicados.
 */
async function gerarFaturacaoMensal(mes, ano, idUtilizador, idAnoLetivo) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();
 
    try {
        // Verificar se já existe fatura para este utilizador/mês/ano (evitar duplicados)
        const faturaExiste = await transaction.request()
            .input('IdUtilizador', sql.Int, idUtilizador)
            .input('Mes', sql.Int, mes)
            .input('Ano', sql.Int, ano)
            .query(`
                SELECT id_faturacao FROM FATURACAO_MENSAL 
                WHERE UTILIZADORid_utilizador = @IdUtilizador 
                  AND mes = @Mes AND ano = @Ano;
            `);
 
        if (faturaExiste.recordset.length > 0) {
            throw new Error('Já existe uma fatura gerada para este utilizador neste período.');
        }
 
        // Total de coachings realizados em nome do EE naquele mês
        // UTILIZADORid_utilizador no PEDIDO_COACHING é o Encarregado de Educação
        const resultCoachings = await transaction.request()
            .input('IdUtilizador', sql.Int, idUtilizador)
            .input('Mes', sql.Int, mes)
            .input('Ano', sql.Int, ano)
            .query(`
                SELECT ISNULL(SUM(c.valor_final), 0) AS total
                FROM COACHING c 
                JOIN PEDIDO_COACHING pc 
                    ON c.PEDIDO_COACHINGid_pedido_coaching = pc.id_pedido_coaching 
                WHERE pc.UTILIZADORid_utilizador = @IdUtilizador 
                  AND MONTH(c.data_aula) = @Mes 
                  AND YEAR(c.data_aula) = @Ano 
                  AND c.estado = 'Realizado';
            `);
 
        // Total de empréstimos do utilizador naquele mês (pela data do pedido)
        const resultEmprestimos = await transaction.request()
            .input('IdUtilizador', sql.Int, idUtilizador)
            .input('Mes', sql.Int, mes)
            .input('Ano', sql.Int, ano)
            .query(`
                SELECT ISNULL(SUM(e.valor), 0) AS total
                FROM EMPRESTIMO e 
                WHERE e.UTILIZADORid_utilizador = @IdUtilizador 
                  AND MONTH(e.data_pedido) = @Mes 
                  AND YEAR(e.data_pedido) = @Ano
                  AND e.estado NOT IN ('Cancelado', 'Rejeitado');
            `);
 
        const totalCoachings = resultCoachings.recordset[0].total;
        const totalEmprestimos = resultEmprestimos.recordset[0].total;
        const totalMes = Number(totalCoachings) + Number(totalEmprestimos);
 
        if (totalMes === 0) {
            await transaction.commit();
            return null; // Não gera fatura se não houver consumo
        }
 
        // Inserir registo de faturação
        const idFaturacao = await transaction.request()
            .input('Ano', sql.Int, ano)
            .input('Mes', sql.Int, mes)
            .input('Total', sql.Decimal(10, 2), totalMes)
            .input('IdUtilizador', sql.Int, idUtilizador)
            .input('IdAnoLetivo', sql.Int, idAnoLetivo)
            .query(`
                INSERT INTO FATURACAO_MENSAL 
                    (ano, mes, data_geracao, total, estado_pagamento, UTILIZADORid_utilizador, ANO_LETIVOid_ano_letivo)
                OUTPUT INSERTED.id_faturacao
                VALUES 
                    (@Ano, @Mes, GETDATE(), @Total, 'Pendente', @IdUtilizador, @IdAnoLetivo);
            `)
            .then(r => r.recordset[0].id_faturacao);
 
        await transaction.commit();
        return idFaturacao;
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no Modelo Transacional (gerarFaturacaoMensal):', error);
        throw error;
    }
}
 
// ============================================================================
// 3. CONSULTA E GESTÃO DE PAGAMENTOS (US18, US19 / RF19, RF20)
// ============================================================================
 
/**
 * Consulta faturas. Se idUtilizador for fornecido, filtra por esse EE.
 * Caso contrário, retorna todas (para exportação pela Contabilidade).
 */
async function getFaturacao(idUtilizador = null) {
    try {
        const pool = await poolPromise;
        let whereClause = '';
        const request = pool.request();
 
        if (idUtilizador) {
            whereClause = 'WHERE f.UTILIZADORid_utilizador = @IdUtilizador';
            request.input('IdUtilizador', sql.Int, idUtilizador);
        }
 
        const query = `
            SELECT 
                f.id_faturacao,
                f.ano,
                f.mes,
                f.data_geracao,
                f.total,
                f.estado_pagamento,
                f.metodo_pagamento,
                f.data_pagamento,
                u.nome AS cliente,
                u.email AS email_cliente,
                a.ano AS ano_letivo_nome
            FROM FATURACAO_MENSAL f
            JOIN UTILIZADOR u ON f.UTILIZADORid_utilizador = u.id_utilizador
            JOIN ANO_LETIVO a ON f.ANO_LETIVOid_ano_letivo = a.id_ano_letivo
            ${whereClause}
            ORDER BY f.ano DESC, f.mes DESC;
        `;
 
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getFaturacao):', error);
        throw error;
    }
}
 
/**
 * Regista o pagamento de uma fatura. Só atualiza se a fatura estiver Pendente. (US19 / RF20)
 */
async function registarPagamentoFatura(idFaturacao, metodoPagamento) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Metodo', sql.VarChar(50), metodoPagamento)
            .input('IdFaturacao', sql.Int, idFaturacao)
            .query(`
                UPDATE FATURACAO_MENSAL 
                SET 
                    estado_pagamento = 'Pago', 
                    metodo_pagamento = @Metodo, 
                    data_pagamento = GETDATE()
                WHERE id_faturacao = @IdFaturacao 
                  AND estado_pagamento = 'Pendente';
            `);
 
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error('Erro no Modelo (registarPagamentoFatura):', error);
        throw error;
    }
}
 
// ============================================================================
// 4. RELATÓRIOS E HISTÓRICO (US29, US30 / RF27, RF28)
// ============================================================================
 
/**
 * Retorna o histórico de atividades de um utilizador (coachings + empréstimos).
 * Serve EEs (vêem os pedidos que fizeram) e Professores (vêem as aulas que deram).
 * (US29 / RF27)
 */
async function getHistoricoAtividades(idUtilizador) {
    try {
        const pool = await poolPromise;
        const query = `
            -- Coachings onde o utilizador é o EE que requisitou
            SELECT 
                'Coaching (EE)' AS tipo_atividade, 
                c.data_aula AS data_registo, 
                m.nome AS detalhe, 
                c.valor_final AS valor, 
                c.estado,
                c.formato_aula,
                c.duracao_minutos
            FROM COACHING c
            JOIN MODALIDADE m ON c.MODALIDADEid_modalidade = m.id_modalidade
            JOIN PEDIDO_COACHING pc ON c.PEDIDO_COACHINGid_pedido_coaching = pc.id_pedido_coaching
            WHERE pc.UTILIZADORid_utilizador = @IdUtilizador
 
            UNION ALL
 
            -- Coachings onde o utilizador é o Professor que deu a aula
            SELECT 
                'Coaching (Professor)' AS tipo_atividade, 
                c.data_aula AS data_registo, 
                m.nome AS detalhe, 
                c.valor_final AS valor, 
                c.estado,
                c.formato_aula,
                c.duracao_minutos
            FROM COACHING c
            JOIN MODALIDADE m ON c.MODALIDADEid_modalidade = m.id_modalidade
            WHERE c.UTILIZADORid_utilizador = @IdUtilizador
 
            UNION ALL
 
            -- Empréstimos de inventário do utilizador
            SELECT 
                'Empréstimo Inventário' AS tipo_atividade, 
                e.data_inicio AS data_registo, 
                'Levantamento de Peças' AS detalhe, 
                e.valor AS valor, 
                e.estado,
                NULL AS formato_aula,
                NULL AS duracao_minutos
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
 * Relatório mensal para a Administração: total de aulas e receita por professor/modalidade.
 * (US30 / RF28)
 */
async function getRelatorioAulasProfessor(mes, ano) {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                u.nome AS professor,
                m.nome AS modalidade,
                COUNT(c.id_coaching) AS total_aulas,
                SUM(c.duracao_minutos) AS total_minutos,
                SUM(c.valor_final) AS total_receita_gerada
            FROM COACHING c
            JOIN UTILIZADOR u ON c.UTILIZADORid_utilizador = u.id_utilizador
            JOIN MODALIDADE m ON c.MODALIDADEid_modalidade = m.id_modalidade
            WHERE MONTH(c.data_aula) = @Mes 
              AND YEAR(c.data_aula) = @Ano 
              AND c.estado = 'Realizado'
            GROUP BY u.nome, m.nome
            ORDER BY u.nome ASC, m.nome ASC;
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
    getTabelaPrecos,
    calcularCustoAutomatico,
    gerarFaturacaoMensal,
    getFaturacao,
    registarPagamentoFatura,
    getHistoricoAtividades,
    getRelatorioAulasProfessor
};
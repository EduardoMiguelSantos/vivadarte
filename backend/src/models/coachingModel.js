const { poolPromise } = require('../config/db');
const sql = require('mssql');

// ============================================================================
// 1. GESTÃO DE DISPONIBILIDADES (Professores e Vagas)
// ============================================================================

async function adicionarDisponibilidadeProfessor({ diaSemana, horaInicio, horaFim, idProfessor }) {
    try {
        const pool = await poolPromise;
        const query = `
            INSERT INTO DISPONIBILIDADE_PROFESSOR 
                (dia_semana, hora_inicio, hora_fim, UTILIZADORid_utilizador)
            VALUES 
                (@DiaSemana, @HoraInicio, @HoraFim, @IdProfessor);
        `;
        const result = await pool.request()
            .input('DiaSemana', sql.Int, diaSemana)
            .input('HoraInicio', sql.Time, horaInicio)
            .input('HoraFim', sql.Time, horaFim)
            .input('IdProfessor', sql.Int, idProfessor)
            .query(query);
            
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error('Erro no Modelo (adicionarDisponibilidadeProfessor):', error);
        throw error;
    }
}

async function getDisponibilidadeEfetiva(idModalidade, diaSemana, dataEspecifica) {
    try {
        const pool = await poolPromise;
        
        // Matriz teórica de disponibilidade dos professores para a modalidade
        const queryDisponibilidade = `
            SELECT 
                dp.id_disponibilidade,
                u.id_utilizador AS id_professor,
                u.nome AS nome_professor,
                dp.hora_inicio,
                dp.hora_fim
            FROM DISPONIBILIDADE_PROFESSOR dp
            JOIN UTILIZADOR u 
                ON dp.UTILIZADORid_utilizador = u.id_utilizador
            JOIN PROFESSOR_MODALIDADE pm 
                ON u.id_utilizador = pm.UTILIZADORid_utilizador
            WHERE pm.MODALIDADEid_modalidade = @IdModalidade
              AND dp.dia_semana = @DiaSemana
              AND u.ativo = 1;
        `;
        const resultDisponibilidade = await pool.request()
            .input('IdModalidade', sql.Int, idModalidade)
            .input('DiaSemana', sql.Int, diaSemana)
            .query(queryDisponibilidade);

        // Ocupações reais (coachings já marcados) para a data específica
        const queryOcupacao = `
            SELECT 
                c.UTILIZADORid_utilizador AS id_professor,
                c.hora_inicio,
                c.duracao_minutos,
                c.SALAid_sala
            FROM COACHING c
            WHERE c.data_aula = @DataEspecifica
              AND c.estado IN ('Agendado', 'Confirmado');
        `;
        const resultOcupacao = await pool.request()
            .input('DataEspecifica', sql.Date, dataEspecifica)
            .query(queryOcupacao);

        return {
            disponibilidades: resultDisponibilidade.recordset,
            ocupacoes: resultOcupacao.recordset
        };
    } catch (error) {
        console.error('Erro no Modelo (getDisponibilidadeEfetiva):', error);
        throw error;
    }
}

// ============================================================================
// 2. PROCESSAMENTO E LEITURA DE PEDIDOS (EE e Coordenação)
// ============================================================================

async function criarPedidoCoaching(dadosPedido, alunosIds) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        const insertPedidoQuery = `
            INSERT INTO PEDIDO_COACHING (
                formato_aula, duracao_minutos, numero_participantes, 
                data_pedido, data_aula_pretendida, hora_inicio_pretendida, 
                estado, custo_estimado, UTILIZADORid_utilizador, 
                ANO_LETIVOid_ano_letivo, MODALIDADEid_modalidade, UTILIZADORid_utilizador2
            )
            OUTPUT INSERTED.id_pedido_coaching
            VALUES (
                @Formato, @Duracao, @NumParticipantes, 
                GETDATE(), @DataAula, @HoraInicio, 
                'Pendente', @CustoEstimado, @IdEncarregado, 
                @IdAnoLetivo, @IdModalidade, @IdProfessor
            );
        `;
        
        const pedidoResult = await transaction.request()
            .input('Formato', sql.VarChar(50), dadosPedido.formatoAula)
            .input('Duracao', sql.Int, dadosPedido.duracaoMinutos)
            .input('NumParticipantes', sql.Int, alunosIds.length)
            .input('DataAula', sql.Date, dadosPedido.dataAula)
            .input('HoraInicio', sql.Time, dadosPedido.horaInicio)
            .input('CustoEstimado', sql.Decimal(10, 2), dadosPedido.custoEstimado)
            .input('IdEncarregado', sql.Int, dadosPedido.idEncarregado)
            .input('IdAnoLetivo', sql.Int, dadosPedido.idAnoLetivo)
            .input('IdModalidade', sql.Int, dadosPedido.idModalidade)
            .input('IdProfessor', sql.Int, dadosPedido.idProfessor)
            .query(insertPedidoQuery);

        const idPedido = pedidoResult.recordset[0].id_pedido_coaching;

        // Iterar sobre alunos e inseri-los na tabela associativa
        for (const idAluno of alunosIds) {
            const insertParticipanteQuery = `
                INSERT INTO PEDIDO_COACHING_PARTICIPANTE (
                    ALUNOid_aluno, PEDIDO_COACHINGid_pedido_coaching, PEDIDO_COACHINGhora_inicio_pretendida
                )
                VALUES (@IdAluno, @IdPedido, @HoraInicio);
            `;
            await transaction.request()
                .input('IdAluno', sql.Int, idAluno)
                .input('IdPedido', sql.Int, idPedido)
                .input('HoraInicio', sql.Time, dadosPedido.horaInicio)
                .query(insertParticipanteQuery);
        }

        await transaction.commit();
        return idPedido;
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no Modelo Transacional (criarPedidoCoaching):', error);
        throw error;
    }
}

async function getPedidosPendentes() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                pc.id_pedido_coaching,
                pc.data_aula_pretendida,
                pc.hora_inicio_pretendida,
                pc.formato_aula,
                pc.estado,
                pc.custo_estimado,
                m.nome AS modalidade,
                ee.nome AS requisitante,
                prof.nome AS professor_desejado,
                COUNT(pcp.ALUNOid_aluno) AS total_alunos
            FROM PEDIDO_COACHING pc
            JOIN UTILIZADOR ee 
                ON pc.UTILIZADORid_utilizador = ee.id_utilizador
            JOIN UTILIZADOR prof 
                ON pc.UTILIZADORid_utilizador2 = prof.id_utilizador
            JOIN MODALIDADE m 
                ON pc.MODALIDADEid_modalidade = m.id_modalidade
            LEFT JOIN PEDIDO_COACHING_PARTICIPANTE pcp 
                ON pc.id_pedido_coaching = pcp.PEDIDO_COACHINGid_pedido_coaching
            WHERE pc.estado = 'Pendente'
            GROUP BY 
                pc.id_pedido_coaching, pc.data_aula_pretendida, pc.hora_inicio_pretendida, 
                pc.formato_aula, pc.estado, pc.custo_estimado, m.nome, ee.nome, prof.nome
            ORDER BY pc.data_aula_pretendida ASC;
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getPedidosPendentes):', error);
        throw error;
    }
}

// ============================================================================
// 3. AGENDAMENTO E CANCELAMENTOS (Direção)
// ============================================================================

async function aprovarEAgendarCoaching(dadosAgendamento) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        await transaction.request()
            .input('IdPedido', sql.Int, dadosAgendamento.idPedido)
            .query(`UPDATE PEDIDO_COACHING SET estado = 'Aprovado' WHERE id_pedido_coaching = @IdPedido;`);

        const insertCoachingQuery = `
            INSERT INTO COACHING (
                formato_aula, duracao_minutos, numero_participantes, data_aula, 
                hora_inicio, estado, UTILIZADORid_utilizador, ANO_LETIVOid_ano_letivo, 
                MODALIDADEid_modalidade, SALAid_sala, PEDIDO_COACHINGid_pedido_coaching, valor_final
            )
            OUTPUT INSERTED.id_coaching
            VALUES (
                @Formato, @Duracao, @NumParticipantes, @DataAula, 
                @HoraInicio, 'Agendado', @IdProfessor, @IdAnoLetivo, 
                @IdModalidade, @IdSala, @IdPedido, @ValorFinal
            );
        `;
        const coachingResult = await transaction.request()
            .input('Formato', sql.VarChar(50), dadosAgendamento.formatoAula)
            .input('Duracao', sql.Int, dadosAgendamento.duracaoMinutos)
            .input('NumParticipantes', sql.Int, dadosAgendamento.numeroParticipantes)
            .input('DataAula', sql.Date, dadosAgendamento.dataAula)
            .input('HoraInicio', sql.Time, dadosAgendamento.horaInicio)
            .input('IdProfessor', sql.Int, dadosAgendamento.idProfessor)
            .input('IdAnoLetivo', sql.Int, dadosAgendamento.idAnoLetivo)
            .input('IdModalidade', sql.Int, dadosAgendamento.idModalidade)
            .input('IdSala', sql.Int, dadosAgendamento.idSala)
            .input('IdPedido', sql.Int, dadosAgendamento.idPedido)
            .input('ValorFinal', sql.Decimal(10, 2), dadosAgendamento.valorFinal)
            .query(insertCoachingQuery);

        const idCoachingFinal = coachingResult.recordset[0].id_coaching;

        // Inicia a Dupla Validação exigida
        await transaction.request()
            .input('TipoValidador', sql.VarChar(50), 'Coordenacao')
            .input('IdUtilizador', sql.Int, dadosAgendamento.idValidador)
            .input('IdCoaching', sql.Int, idCoachingFinal)
            .query(`
                INSERT INTO VALIDACAO_COACHING (
                    tipo_validador, estado_validacao, data_validacao, UTILIZADORid_utilizador, COACHINGid_coaching
                )
                VALUES (@TipoValidador, 'Pendente_Professor', GETDATE(), @IdUtilizador, @IdCoaching);
            `);

        await transaction.commit();
        return idCoachingFinal;
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no Modelo Transacional (aprovarEAgendarCoaching):', error);
        throw error;
    }
}

async function cancelarCoaching(idCoaching) {
    try {
        const pool = await poolPromise;
        const query = `
            UPDATE COACHING
            SET estado = 'Cancelado'
            WHERE id_coaching = @IdCoaching
              AND estado != 'Cancelado'; 
        `;
        const result = await pool.request()
            .input('IdCoaching', sql.Int, idCoaching)
            .query(query);
            
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error('Erro no Modelo (cancelarCoaching):', error);
        throw error;
    }
}

// ============================================================================
// 4. MOTOR DE VALIDAÇÃO DE AULAS (Pós-Aula)
// ============================================================================

async function registarValidacaoAula(idCoaching, idUtilizador, tipoValidador, estadoValidacao, observacoes = null) {
    try {
        const pool = await poolPromise;
        const query = `
            INSERT INTO VALIDACAO_COACHING (
                tipo_validador, estado_validacao, data_validacao, 
                observacoes, UTILIZADORid_utilizador, COACHINGid_coaching
            )
            VALUES (
                @TipoValidador, @EstadoValidacao, GETDATE(), 
                @Observacoes, @IdUtilizador, @IdCoaching
            );
        `;
        const result = await pool.request()
            .input('TipoValidador', sql.VarChar(50), tipoValidador) 
            .input('EstadoValidacao', sql.VarChar(50), estadoValidacao) 
            .input('Observacoes', sql.VarChar(255), observacoes)
            .input('IdUtilizador', sql.Int, idUtilizador)
            .input('IdCoaching', sql.Int, idCoaching)
            .query(query);
            
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error('Erro no Modelo (registarValidacaoAula):', error);
        throw error;
    }
}

async function concluirCoachingPelaCoordenacao(idCoaching, idCoordenador, estadoFinal, observacoes) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        const queryValidacao = `
            INSERT INTO VALIDACAO_COACHING (
                tipo_validador, estado_validacao, data_validacao, observacoes, 
                UTILIZADORid_utilizador, COACHINGid_coaching
            )
            VALUES (
                'Coordenacao', 'Aprovacao_Final', GETDATE(), @Observacoes, 
                @IdCoordenador, @IdCoaching
            );
        `;
        await transaction.request()
            .input('Observacoes', sql.VarChar(255), observacoes || 'Validado pela coordenação. Pronto para faturação.')
            .input('IdCoordenador', sql.Int, idCoordenador)
            .input('IdCoaching', sql.Int, idCoaching)
            .query(queryValidacao);

        const queryUpdate = `
            UPDATE COACHING
            SET estado = @EstadoFinal
            WHERE id_coaching = @IdCoaching;
        `;
        await transaction.request()
            .input('EstadoFinal', sql.VarChar(50), estadoFinal) 
            .input('IdCoaching', sql.Int, idCoaching)
            .query(queryUpdate);

        await transaction.commit();
        return true;
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no Modelo Transacional (concluirCoachingPelaCoordenacao):', error);
        throw error;
    }
}

module.exports = {
    adicionarDisponibilidadeProfessor,
    getDisponibilidadeEfetiva,
    criarPedidoCoaching,
    getPedidosPendentes,
    aprovarEAgendarCoaching,
    cancelarCoaching,
    registarValidacaoAula,
    concluirCoachingPelaCoordenacao
};

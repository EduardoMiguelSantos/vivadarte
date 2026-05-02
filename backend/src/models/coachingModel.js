const { poolPromise } = require('../config/db');
const sql = require('mssql');

// ============================================================================
// 1. PESQUISA DE DISPONIBILIDADES E SUBMISSÃO DE PEDIDOS (US04, US05 / RF04, RF05)
// ============================================================================

/**
 * Consulta as vagas disponíveis cruzando a disponibilidade teórica do professor
 * com as ocupações reais (coachings já aprovados e horários letivos fixos).
 */
async function getDisponibilidadeEfetiva(idModalidade, idProfessor, dataPretendida) {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT dp.hora_inicio, dp.hora_fim, dp.dia_semana
            FROM DISPONIBILIDADE_PROFESSOR dp
            WHERE dp.UTILIZADORid_utilizador = @IdProfessor
              AND dp.dia_semana = DATEPART(dw, @DataPretendida)
              -- A lógica de exclusão (NOT EXISTS) de blocos já ocupados na tabela COACHING e HORARIO 
              -- deve ser garantida aqui para evitar sobreposições.
              AND NOT EXISTS (
                  SELECT 1 FROM COACHING c 
                  WHERE c.UTILIZADORid_utilizador = @IdProfessor 
                    AND c.data_aula = @DataPretendida
                    AND (c.hora_inicio < dp.hora_fim AND DATEADD(minute, c.duracao_minutos, c.hora_inicio) > dp.hora_inicio)
              );
        `;
        const result = await pool.request()
            .input('IdProfessor', sql.Int, idProfessor)
            .input('DataPretendida', sql.Date, dataPretendida)
            .query(query);
            
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getDisponibilidadeEfetiva):', error);
        throw error;
    }
}

/**
 * Regista um novo pedido de coaching e associa os alunos participantes numa única transação.
 */
async function criarPedidoCoaching(dadosPedido, alunosIds) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        const insertPedidoQuery = `
            INSERT INTO PEDIDO_COACHING 
            (formato_aula, duracao_minutos, numero_participantes, data_pedido, data_aula_pretendida, hora_inicio_pretendida, estado, custo_estimado, UTILIZADORid_utilizador, ANO_LETIVOid_ano_letivo, MODALIDADEid_modalidade, UTILIZADORid_utilizador2)
            OUTPUT INSERTED.id_pedido_coaching
            VALUES 
            (@Formato, @Duracao, @NumParticipantes, GETDATE(), @DataPretendida, @HoraPretendida, 'Pendente', @CustoEstimado, @IdProfessor, @IdAnoLetivo, @IdModalidade, @IdEncarregado);
        `;
        
        const pedidoResult = await transaction.request()
            .input('Formato', sql.VarChar(50), dadosPedido.formato_aula)
            .input('Duracao', sql.Int, dadosPedido.duracao_minutos)
            .input('NumParticipantes', sql.Int, alunosIds.length)
            .input('DataPretendida', sql.Date, dadosPedido.data_aula_pretendida)
            .input('HoraPretendida', sql.Time, dadosPedido.hora_inicio_pretendida)
            .input('CustoEstimado', sql.Decimal(10, 2), dadosPedido.custo_estimado)
            .input('IdProfessor', sql.Int, dadosPedido.id_professor) 
            .input('IdAnoLetivo', sql.Int, dadosPedido.id_ano_letivo)
            .input('IdModalidade', sql.Int, dadosPedido.id_modalidade)
            .input('IdEncarregado', sql.Int, dadosPedido.id_encarregado)
            .query(insertPedidoQuery);

        const idPedidoNovo = pedidoResult.recordset[0].id_pedido_coaching;

        // Inserir os alunos associados ao pedido
        for (const idAluno of alunosIds) {
            await transaction.request()
                .input('IdAluno', sql.Int, idAluno)
                .input('IdPedido', sql.Int, idPedidoNovo)
                .input('HoraInicio', sql.Time, dadosPedido.hora_inicio_pretendida)
                .query(`
                    INSERT INTO PEDIDO_COACHING_PARTICIPANTE (ALUNOid_aluno, PEDIDO_COACHINGid_pedido_coaching, PEDIDO_COACHINGhora_inicio_pretendida)
                    VALUES (@IdAluno, @IdPedido, @HoraInicio);
                `);
        }

        await transaction.commit();
        return idPedidoNovo;
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no Modelo Transacional (criarPedidoCoaching):', error);
        throw error;
    }
}

// ============================================================================
// 2. VALIDAÇÃO E GESTÃO DE ESTADO (US06, US07, US08 / RF07, RF08, RF09)
// ============================================================================

/**
 * Lista todos os pedidos que aguardam aprovação da Coordenação.
 */
async function getPedidosPendentes() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT pc.*, m.nome AS modalidade, u.nome AS professor_solicitado
            FROM PEDIDO_COACHING pc
            JOIN MODALIDADE m ON pc.MODALIDADEid_modalidade = m.id_modalidade
            LEFT JOIN UTILIZADOR u ON pc.UTILIZADORid_utilizador = u.id_utilizador
            WHERE pc.estado = 'Pendente'
            ORDER BY pc.data_pedido ASC;
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getPedidosPendentes):', error);
        throw error;
    }
}

/**
 * Transforma um pedido pendente num Coaching efetivo, bloqueando o horário e a sala.
 */
async function aprovarEAgendarCoaching(idPedido, idSala, idCoordenador, valorFinal) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        // 1. Extrair dados do Pedido
        const pedidoQuery = await transaction.request()
            .input('IdPedido', sql.Int, idPedido)
            .query('SELECT * FROM PEDIDO_COACHING WHERE id_pedido_coaching = @IdPedido AND estado = \'Pendente\'');
            
        const pedido = pedidoQuery.recordset[0];
        if (!pedido) throw new Error('Pedido não encontrado ou já processado.');

        // 2. Inserir na tabela COACHING (bloqueia fisicamente a ocupação)
        const insertCoachingQuery = `
            INSERT INTO COACHING 
            (formato_aula, duracao_minutos, numero_participantes, data_aula, hora_inicio, estado, UTILIZADORid_utilizador, ANO_LETIVOid_ano_letivo, MODALIDADEid_modalidade, SALAid_sala, PEDIDO_COACHINGid_pedido_coaching, valor_final)
            OUTPUT INSERTED.id_coaching
            VALUES 
            (@Formato, @Duracao, @NumParticipantes, @DataAula, @HoraInicio, 'Agendado', @IdProfessor, @IdAnoLetivo, @IdModalidade, @IdSala, @IdPedido, @ValorFinal);
        `;
        const coachingResult = await transaction.request()
            .input('Formato', sql.VarChar(50), pedido.formato_aula)
            .input('Duracao', sql.Int, pedido.duracao_minutos)
            .input('NumParticipantes', sql.Int, pedido.numero_participantes)
            .input('DataAula', sql.Date, pedido.data_aula_pretendida)
            .input('HoraInicio', sql.Time, pedido.hora_inicio_pretendida)
            .input('IdProfessor', sql.Int, pedido.UTILIZADORid_utilizador)
            .input('IdAnoLetivo', sql.Int, pedido.ANO_LETIVOid_ano_letivo)
            .input('IdModalidade', sql.Int, pedido.MODALIDADEid_modalidade)
            .input('IdSala', sql.Int, idSala)
            .input('IdPedido', sql.Int, idPedido)
            .input('ValorFinal', sql.Decimal(10, 2), valorFinal)
            .query(insertCoachingQuery);

        const idCoachingCriado = coachingResult.recordset[0].id_coaching;

        // 3. Atualizar Estado do Pedido Original
        await transaction.request()
            .input('IdPedido', sql.Int, idPedido)
            .query(`UPDATE PEDIDO_COACHING SET estado = 'Aprovado' WHERE id_pedido_coaching = @IdPedido`);

        // 4. Registar a Validação da Coordenação
        await transaction.request()
            .input('TipoValidador', sql.VarChar(50), 'Coordenação')
            .input('EstadoValidacao', sql.VarChar(50), 'Aprovado')
            .input('IdUtilizador', sql.Int, idCoordenador)
            .input('IdCoaching', sql.Int, idCoachingCriado)
            .query(`
                INSERT INTO VALIDACAO_COACHING (tipo_validador, estado_validacao, data_validacao, UTILIZADORid_utilizador, COACHINGid_coaching)
                VALUES (@TipoValidador, @EstadoValidacao, GETDATE(), @IdUtilizador, @IdCoaching)
            `);

        await transaction.commit();
        return idCoachingCriado;
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no Modelo Transacional (aprovarEAgendarCoaching):', error);
        throw error;
    }
}

// ============================================================================
// 3. AGENDA E REALIZAÇÃO (US10, US13 / RF12, RF15)
// ============================================================================

/**
 * Consulta a agenda detalhada de um professor, incluindo a sala e os alunos inscritos.
 */
async function getAgendaProfessor(idProfessor) {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                c.id_coaching,
                c.data_aula,
                c.hora_inicio,
                c.duracao_minutos,
                c.formato_aula,
                c.estado,
                m.nome AS modalidade,
                s.nome AS sala,
                STRING_AGG(a.nome, ', ') AS alunos
            FROM COACHING c
            JOIN MODALIDADE m ON c.MODALIDADEid_modalidade = m.id_modalidade
            JOIN SALA s ON c.SALAid_sala = s.id_sala
            JOIN PEDIDO_COACHING pc ON c.PEDIDO_COACHINGid_pedido_coaching = pc.id_pedido_coaching
            JOIN PEDIDO_COACHING_PARTICIPANTE pcp ON pc.id_pedido_coaching = pcp.PEDIDO_COACHINGid_pedido_coaching
            JOIN ALUNO a ON pcp.ALUNOid_aluno = a.id_aluno
            WHERE c.UTILIZADORid_utilizador = @IdProfessor
            GROUP BY 
                c.id_coaching, c.data_aula, c.hora_inicio, c.duracao_minutos, 
                c.formato_aula, c.estado, m.nome, s.nome
            ORDER BY c.data_aula ASC, c.hora_inicio ASC;
        `;
        const result = await pool.request()
            .input('IdProfessor', sql.Int, idProfessor)
            .query(query);
            
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getAgendaProfessor):', error);
        throw error;
    }
}

/**
 * Regista a confirmação de realização da aula por parte do professor ou EE.
 */
async function confirmarRealizacaoAula(idCoaching, idUtilizador, tipoPerfil) {
    try {
        const pool = await poolPromise;
        const query = `
            INSERT INTO VALIDACAO_COACHING (tipo_validador, estado_validacao, data_validacao, UTILIZADORid_utilizador, COACHINGid_coaching)
            VALUES (@TipoValidador, 'Realizado', GETDATE(), @IdUtilizador, @IdCoaching);
        `;
        
        await pool.request()
            .input('TipoValidador', sql.VarChar(50), tipoPerfil) 
            .input('IdUtilizador', sql.Int, idUtilizador)
            .input('IdCoaching', sql.Int, idCoaching)
            .query(query);
            
        return true;
    } catch (error) {
        console.error('Erro no Modelo (confirmarRealizacaoAula):', error);
        throw error;
    }
}

module.exports = {
    getDisponibilidadeEfetiva,
    criarPedidoCoaching,
    getPedidosPendentes,
    aprovarEAgendarCoaching,
    getAgendaProfessor,
    confirmarRealizacaoAula
};
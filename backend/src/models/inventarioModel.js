const { poolPromise } = require('../config/db');
const sql = require('mssql');

// ============================================================================
// 1. CATÁLOGO E GESTÃO DE PEÇAS (US20, US21, US22 / RF21, RF22)
// ============================================================================

async function getCatalogoPecas() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                p.id_peca,
                p.nome AS nome_peca,
                p.descricao,
                p.tamanho,
                p.estado AS condicao_peca,
                p.origem,
                p.localizacao,
                p.disponivel_para_emprestimo,
                p.disponivel_para_venda,
                cp.nome AS categoria,
                u.nome AS proprietario,
                f.foto AS foto_principal
            FROM PECA p
            JOIN CATEGORIA_PECA cp 
                ON p.CATEGORIA_PECAid_categoria_peca = cp.id_categoria_peca
            JOIN UTILIZADOR u 
                ON p.UTILIZADORid_utilizador = u.id_utilizador
            LEFT JOIN (
                SELECT PECAid_peca, MIN(foto) AS foto 
                FROM FOTO_PECA 
                GROUP BY PECAid_peca
            ) f ON p.id_peca = f.PECAid_peca;
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getCatalogoPecas):', error);
        throw error;
    }
}

async function registarNovaPeca(dadosPeca) {
    try {
        const pool = await poolPromise;
        const query = `
            INSERT INTO PECA (
                nome, descricao, tamanho, estado, origem, localizacao, 
                disponivel_para_emprestimo, disponivel_para_venda, data_registo, 
                UTILIZADORid_utilizador, CATEGORIA_PECAid_categoria_peca
            )
            OUTPUT INSERTED.id_peca
            VALUES (
                @Nome, @Descricao, @Tamanho, @Estado, @Origem, @Localizacao, 
                @DispEmprestimo, @DispVenda, GETDATE(), 
                @IdUtilizador, @IdCategoria
            );
        `;
        const result = await pool.request()
            .input('Nome', sql.VarChar(255), dadosPeca.nome)
            .input('Descricao', sql.VarChar(255), dadosPeca.descricao)
            .input('Tamanho', sql.VarChar(50), dadosPeca.tamanho)
            .input('Estado', sql.VarChar(50), dadosPeca.estado)
            .input('Origem', sql.VarChar(50), dadosPeca.origem)
            .input('Localizacao', sql.VarChar(255), dadosPeca.localizacao)
            .input('DispEmprestimo', sql.Bit, dadosPeca.disponivelEmprestimo ? 1 : 0)
            .input('DispVenda', sql.Bit, dadosPeca.disponivelVenda ? 1 : 0)
            .input('IdUtilizador', sql.Int, dadosPeca.idUtilizador)
            .input('IdCategoria', sql.Int, dadosPeca.idCategoria)
            .query(query);
            
        return result.recordset[0].id_peca;
    } catch (error) {
        console.error('Erro no Modelo (registarNovaPeca):', error);
        throw error;
    }
}

// ============================================================================
// 2. CICLO DE EMPRÉSTIMOS (US23, US24 / RF23, RF24)
// ============================================================================

async function requisitarEmprestimo(dadosEmprestimo, itensEmprestimo) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        // 1. Inserir Cabeçalho do Empréstimo
        const insertEmprestimo = `
            INSERT INTO EMPRESTIMO (
                data_pedido, data_inicio, data_fim, estado, observacoes, UTILIZADORid_utilizador
            )
            OUTPUT INSERTED.id_emprestimo
            VALUES (
                GETDATE(), @DataInicio, @DataFim, 'Pendente', @Observacoes, @IdUtilizador
            );
        `;
        const empResult = await transaction.request()
            .input('DataInicio', sql.Date, dadosEmprestimo.dataInicio)
            .input('DataFim', sql.Date, dadosEmprestimo.dataFim)
            .input('Observacoes', sql.VarChar(255), dadosEmprestimo.observacoes)
            .input('IdUtilizador', sql.Int, dadosEmprestimo.idUtilizador)
            .query(insertEmprestimo);

        const idEmprestimo = empResult.recordset[0].id_emprestimo;

        // 2. Inserir as peças (Itens) do empréstimo
        for (const item of itensEmprestimo) {
            const insertItem = `
                INSERT INTO EMPRESTIMO_ITEM (
                    estado_entrega, PECAid_peca, [EMPRESIMO id_emprestimo]
                )
                VALUES (@EstadoEntrega, @IdPeca, @IdEmprestimo);
            `;
            await transaction.request()
                .input('EstadoEntrega', sql.VarChar(50), item.estadoEntrega)
                .input('IdPeca', sql.Int, item.idPeca)
                .input('IdEmprestimo', sql.Int, idEmprestimo)
                .query(insertItem);
        }

        await transaction.commit();
        return idEmprestimo;
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no Modelo Transacional (requisitarEmprestimo):', error);
        throw error;
    }
}

async function registarDevolucaoEmprestimo(idEmprestimo, estadoFinal, observacoes, itensDevolvidos) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        // 1. Atualizar o cabeçalho para Devolvido
        await transaction.request()
            .input('EstadoFinal', sql.VarChar(50), estadoFinal)
            .input('Observacoes', sql.VarChar(255), observacoes)
            .input('IdEmprestimo', sql.Int, idEmprestimo)
            .query(`
                UPDATE EMPRESTIMO 
                SET data_devolucao = GETDATE(), estado = @EstadoFinal, observacoes = @Observacoes 
                WHERE id_emprestimo = @IdEmprestimo;
            `);

        // 2. Atualizar o estado_devolucao em cada peça específica
        for (const item of itensDevolvidos) {
            await transaction.request()
                .input('EstadoDevolucao', sql.VarChar(50), item.estadoDevolucao)
                .input('IdPeca', sql.Int, item.idPeca)
                .input('IdEmprestimo', sql.Int, idEmprestimo)
                .query(`
                    UPDATE EMPRESTIMO_ITEM 
                    SET estado_devolucao = @EstadoDevolucao 
                    WHERE PECAid_peca = @IdPeca AND [EMPRESIMO id_emprestimo] = @IdEmprestimo;
                `);
        }

        await transaction.commit();
        return true;
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no Modelo Transacional (registarDevolucaoEmprestimo):', error);
        throw error;
    }
}

// ============================================================================
// 3. FATURAÇÃO E PENALIZAÇÕES DE EMPRÉSTIMOS (US25, US26 / RF24, RF25)
// ============================================================================

async function registarPenalizacao(dadosPenalizacao) {
    try {
        const pool = await poolPromise;
        const query = `
            INSERT INTO PENALIZACAO_PECA (
                tipo, valor, descricao, data_registo, PECAid_peca, EMPRESTIMOid_emprestimo
            )
            OUTPUT INSERTED.id_penalizacao
            VALUES (
                @Tipo, @Valor, @Descricao, GETDATE(), @IdPeca, @IdEmprestimo
            );
        `;
        const result = await pool.request()
            .input('Tipo', sql.VarChar(50), dadosPenalizacao.tipo)
            .input('Valor', sql.Decimal(10, 2), dadosPenalizacao.valor)
            .input('Descricao', sql.VarChar(255), dadosPenalizacao.descricao)
            .input('IdPeca', sql.Int, dadosPenalizacao.idPeca)
            .input('IdEmprestimo', sql.Int, dadosPenalizacao.idEmprestimo)
            .query(query);
            
        return result.recordset[0].id_penalizacao;
    } catch (error) {
        console.error('Erro no Modelo (registarPenalizacao):', error);
        throw error;
    }
}

async function atualizarPagamentoEmprestimo(idEmprestimo, valor, metodoPagamento, estadoPagamento) {
    try {
        const pool = await poolPromise;
        const query = `
            UPDATE EMPRESTIMO 
            SET 
                valor = @Valor,
                metodo_pagamento = @MetodoPagamento,
                estado_pagamento = @EstadoPagamento,
                data_pagamento = GETDATE()
            WHERE id_emprestimo = @IdEmprestimo;
        `;
        const result = await pool.request()
            .input('Valor', sql.Decimal(10, 2), valor)
            .input('MetodoPagamento', sql.VarChar(50), metodoPagamento)
            .input('EstadoPagamento', sql.VarChar(50), estadoPagamento)
            .input('IdEmprestimo', sql.Int, idEmprestimo)
            .query(query);
            
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error('Erro no Modelo (atualizarPagamentoEmprestimo):', error);
        throw error;
    }
}

// ============================================================================
// 4. VENDA DE PEÇAS (US27, US28 / RF26)
// ============================================================================

async function colocarPecaAVenda(idPeca, preco, idVendedor) {
    try {
        const pool = await poolPromise;
        // NOTA: Como a base de dados agora aceita NULL em UTILIZADORid_utilizador2,
        // não precisamos de o enviar no INSERT. Apenas o vendedor fica registado.
        const query = `
            INSERT INTO VENDA_PECA (
                preco, data_colocacao, estado, PECAid_peca, UTILIZADORid_utilizador
            )
            OUTPUT INSERTED.id_venda
            VALUES (
                @Preco, GETDATE(), 'Disponível', @IdPeca, @IdVendedor
            );
        `;
        const result = await pool.request()
            .input('Preco', sql.Decimal(10, 2), preco)
            .input('IdPeca', sql.Int, idPeca)
            .input('IdVendedor', sql.Int, idVendedor)
            .query(query);
            
        return result.recordset[0].id_venda;
    } catch (error) {
        console.error('Erro no Modelo (colocarPecaAVenda):', error);
        throw error;
    }
}

async function registarConclusaoVenda(idVenda, idComprador, metodoPagamento) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        // 1. Atualizar o registo de venda com os dados do comprador (agora sim, preenchemos o NULL) e pagamento
        await transaction.request()
            .input('IdComprador', sql.Int, idComprador)
            .input('MetodoPagamento', sql.VarChar(50), metodoPagamento)
            .input('IdVenda', sql.Int, idVenda)
            .query(`
                UPDATE VENDA_PECA 
                SET 
                    data_venda = GETDATE(), 
                    estado = 'Concluída', 
                    UTILIZADORid_utilizador2 = @IdComprador, 
                    metodo_pagamento = @MetodoPagamento 
                WHERE id_venda = @IdVenda;
            `);

        // 2. Atualizar a peça para garantir que já não está disponível
        await transaction.request()
            .input('IdVenda', sql.Int, idVenda)
            .query(`
                UPDATE PECA 
                SET disponivel_para_venda = 0, disponivel_para_emprestimo = 0 
                WHERE id_peca = (SELECT PECAid_peca FROM VENDA_PECA WHERE id_venda = @IdVenda);
            `);

        await transaction.commit();
        return true;
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no Modelo Transacional (registarConclusaoVenda):', error);
        throw error;
    }
}

module.exports = {
    getCatalogoPecas,
    registarNovaPeca,
    requisitarEmprestimo,
    registarDevolucaoEmprestimo,
    registarPenalizacao,
    atualizarPagamentoEmprestimo,
    colocarPecaAVenda,
    registarConclusaoVenda
};
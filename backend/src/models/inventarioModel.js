const { poolPromise } = require('../config/db');
const sql = require('mssql');

// ============================================================================
// 1. CATÁLOGO E GESTÃO DE PEÇAS (US20, US21, US22 / RF21, RF22)
// ============================================================================

/**
 * Consulta o catálogo global de peças ativas (disponíveis para empréstimo ou venda).
 * Utiliza uma subquery para extrair apenas a fotografia principal, evitando duplicação de linhas.
 */
async function getCatalogoPecas() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                p.id_peca, p.nome, p.tamanho, p.estado, p.origem,
                p.disponivel_para_emprestimo, p.disponivel_para_venda,
                c.nome AS categoria,
                u.nome AS proprietario,
                (SELECT MIN(foto) FROM FOTO_PECA fp WHERE fp.PECAid_peca = p.id_peca) AS foto_principal
            FROM PECA p
            JOIN CATEGORIA_PECA c ON p.CATEGORIA_PECAid_categoria_peca = c.id_categoria_peca
            JOIN UTILIZADOR u ON p.UTILIZADORid_utilizador = u.id_utilizador
            WHERE p.disponivel_para_emprestimo = 1 OR p.disponivel_para_venda = 1
            ORDER BY p.data_registo DESC;
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getCatalogoPecas):', error);
        throw error;
    }
}

/**
 * Lista o inventário privado de um utilizador específico (para gestão própria e anúncios).
 */
async function getPecasDoUtilizador(idUtilizador) {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT p.*, c.nome AS categoria
            FROM PECA p
            JOIN CATEGORIA_PECA c ON p.CATEGORIA_PECAid_categoria_peca = c.id_categoria_peca
            WHERE p.UTILIZADORid_utilizador = @IdUtilizador
            ORDER BY p.data_registo DESC;
        `;
        const result = await pool.request()
            .input('IdUtilizador', sql.Int, idUtilizador)
            .query(query);
        return result.recordset;
    } catch (error) {
        console.error('Erro no Modelo (getPecasDoUtilizador):', error);
        throw error;
    }
}

/**
 * Regista uma nova peça no inventário digital.
 */
async function registarNovaPeca(dadosPeca, idUtilizador) {
    try {
        const pool = await poolPromise;
        const query = `
            INSERT INTO PECA 
            (nome, descricao, tamanho, estado, origem, localizacao, disponivel_para_emprestimo, disponivel_para_venda, data_registo, UTILIZADORid_utilizador, CATEGORIA_PECAid_categoria_peca)
            OUTPUT INSERTED.id_peca
            VALUES 
            (@Nome, @Descricao, @Tamanho, @Estado, @Origem, @Localizacao, @DispEmprestimo, @DispVenda, GETDATE(), @IdUtilizador, @IdCategoria);
        `;
        
        const result = await pool.request()
            .input('Nome', sql.VarChar(255), dadosPeca.nome)
            .input('Descricao', sql.VarChar(255), dadosPeca.descricao || null)
            .input('Tamanho', sql.VarChar(50), dadosPeca.tamanho || null)
            .input('Estado', sql.VarChar(50), dadosPeca.estado)
            .input('Origem', sql.VarChar(50), dadosPeca.origem || null)
            .input('Localizacao', sql.VarChar(255), dadosPeca.localizacao || null)
            .input('DispEmprestimo', sql.Bit, dadosPeca.disponivel_para_emprestimo ? 1 : 0)
            .input('DispVenda', sql.Bit, dadosPeca.disponivel_para_venda ? 1 : 0)
            .input('IdUtilizador', sql.Int, idUtilizador)
            .input('IdCategoria', sql.Int, dadosPeca.id_categoria_peca)
            .query(query);

        return result.recordset[0].id_peca;
    } catch (error) {
        console.error('Erro no Modelo (registarNovaPeca):', error);
        throw error;
    }
}

// ============================================================================
// 2. CICLO DE EMPRÉSTIMOS E PENALIZAÇÕES (US23 a US26 / RF23 a RF25)
// ============================================================================

/**
 * Cria um pedido de empréstimo e associa os itens requeridos numa única transação.
 */
async function requisitarEmprestimo(idUtilizador, datas, pecasIds) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        const insertEmprestimoQuery = `
            INSERT INTO EMPRESTIMO 
            (data_pedido, data_inicio, data_fim, estado, UTILIZADORid_utilizador)
            OUTPUT INSERTED.id_emprestimo
            VALUES 
            (GETDATE(), @DataInicio, @DataFim, 'Pendente', @IdUtilizador);
        `;
        const resultEmprestimo = await transaction.request()
            .input('DataInicio', sql.Date, datas.data_inicio)
            .input('DataFim', sql.Date, datas.data_fim)
            .input('IdUtilizador', sql.Int, idUtilizador)
            .query(insertEmprestimoQuery);

        const idEmprestimoNovo = resultEmprestimo.recordset[0].id_emprestimo;

        // Inserir os itens associados ao empréstimo
        // Nota Técnica: Respeito absoluto pela sintaxe exata do DDL físico ([EMPRESIMO id_emprestimo])
        for (const idPeca of pecasIds) {
            await transaction.request()
                .input('IdPeca', sql.Int, idPeca)
                .input('IdEmprestimo', sql.Int, idEmprestimoNovo)
                .query(`
                    INSERT INTO EMPRESTIMO_ITEM (estado_entrega, PECAid_peca, [EMPRESIMO id_emprestimo])
                    VALUES ('Aguardar Levantamento', @IdPeca, @IdEmprestimo);
                `);
        }

        await transaction.commit();
        return idEmprestimoNovo;
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no Modelo Transacional (requisitarEmprestimo):', error);
        throw error;
    }
}

/**
 * Atualiza o estado global do empréstimo para 'Devolvido' e itera sobre as peças
 * para registar o seu estado de devolução individual.
 */
async function registarDevolucaoEmprestimo(idEmprestimo, itensDevolvidos) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        // 1. Fechar o cabeçalho do Empréstimo
        await transaction.request()
            .input('IdEmprestimo', sql.Int, idEmprestimo)
            .query(`
                UPDATE EMPRESTIMO 
                SET data_devolucao = GETDATE(), estado = 'Devolvido' 
                WHERE id_emprestimo = @IdEmprestimo
            `);

        // 2. Atualizar estado de devolução de cada item
        for (const item of itensDevolvidos) {
            await transaction.request()
                .input('IdPeca', sql.Int, item.id_peca)
                .input('IdEmprestimo', sql.Int, idEmprestimo)
                .input('EstadoDevolucao', sql.VarChar(50), item.estado_devolucao)
                .input('Observacoes', sql.VarChar(255), item.observacoes || null)
                .query(`
                    UPDATE EMPRESTIMO_ITEM 
                    SET estado_devolucao = @EstadoDevolucao, observacoes = @Observacoes
                    WHERE PECAid_peca = @IdPeca AND [EMPRESIMO id_emprestimo] = @IdEmprestimo
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

/**
 * Regista o pagamento de uma taxa de empréstimo.
 */
async function atualizarPagamentoEmprestimo(idEmprestimo, metodoPagamento) {
    try {
        const pool = await poolPromise;
        const query = `
            UPDATE EMPRESTIMO 
            SET estado_pagamento = 'Pago', metodo_pagamento = @Metodo, data_pagamento = GETDATE()
            WHERE id_emprestimo = @IdEmprestimo;
        `;
        const result = await pool.request()
            .input('Metodo', sql.VarChar(50), metodoPagamento)
            .input('IdEmprestimo', sql.Int, idEmprestimo)
            .query(query);
            
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error('Erro no Modelo (atualizarPagamentoEmprestimo):', error);
        throw error;
    }
}

/**
 * Regista uma penalização associada a um item danificado ou devolvido com atraso.
 */
async function registarPenalizacao(dadosPenalizacao) {
    try {
        const pool = await poolPromise;
        const query = `
            INSERT INTO PENALIZACAO_PECA (tipo, valor, descricao, data_registo, PECAid_peca, EMPRESTIMOid_emprestimo)
            OUTPUT INSERTED.id_penalizacao
            VALUES (@Tipo, @Valor, @Descricao, GETDATE(), @IdPeca, @IdEmprestimo);
        `;
        const result = await pool.request()
            .input('Tipo', sql.VarChar(50), dadosPenalizacao.tipo)
            .input('Valor', sql.Decimal(10, 2), dadosPenalizacao.valor)
            .input('Descricao', sql.VarChar(255), dadosPenalizacao.descricao || null)
            .input('IdPeca', sql.Int, dadosPenalizacao.id_peca)
            .input('IdEmprestimo', sql.Int, dadosPenalizacao.id_emprestimo)
            .query(query);
            
        return result.recordset[0].id_penalizacao;
    } catch (error) {
        console.error('Erro no Modelo (registarPenalizacao):', error);
        throw error;
    }
}

// ============================================================================
// 3. VENDAS PEER-TO-PEER (US27, US28 / RF26)
// ============================================================================

/**
 * Coloca um item à venda (criação da oferta inicial sem comprador).
 */
async function colocarPecaAVenda(idPeca, idVendedor, preco) {
    try {
        const pool = await poolPromise;
        const query = `
            INSERT INTO VENDA_PECA (preco, data_colocacao, estado, PECAid_peca, UTILIZADORid_utilizador)
            OUTPUT INSERTED.id_venda
            VALUES (@Preco, GETDATE(), 'Disponível', @IdPeca, @IdVendedor);
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

/**
 * Finaliza o processo de venda: Regista o comprador e retira a peça dos catálogos ativos.
 */
async function registarConclusaoVenda(idVenda, idPeca, idComprador, metodoPagamento) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
        // 1. Atualizar o registo de VENDA com os dados do comprador (utilizador2)
        await transaction.request()
            .input('IdVenda', sql.Int, idVenda)
            .input('IdComprador', sql.Int, idComprador)
            .input('Metodo', sql.VarChar(50), metodoPagamento)
            .query(`
                UPDATE VENDA_PECA 
                SET data_venda = GETDATE(), estado = 'Concluída', UTILIZADORid_utilizador2 = @IdComprador, metodo_pagamento = @Metodo
                WHERE id_venda = @IdVenda
            `);

        // 2. Retirar a peça do circuito de ofertas ativas
        await transaction.request()
            .input('IdPeca', sql.Int, idPeca)
            .query(`
                UPDATE PECA 
                SET disponivel_para_venda = 0, disponivel_para_emprestimo = 0
                WHERE id_peca = @IdPeca
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
    getPecasDoUtilizador,
    registarNovaPeca,
    requisitarEmprestimo,
    registarDevolucaoEmprestimo,
    atualizarPagamentoEmprestimo,
    registarPenalizacao,
    colocarPecaAVenda,
    registarConclusaoVenda
};
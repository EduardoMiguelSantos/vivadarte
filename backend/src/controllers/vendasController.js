const { sql, poolPromise } = require('../config/db'); // Ajusta o caminho para o teu ficheiro de ligação à BD

// 1. Obter todos os figurinos à venda
exports.getVendas = async (req, res) => {
    try {
        const pool = await poolPromise;
        // Fazemos um JOIN simples para ir buscar informações úteis (ajusta os nomes das tabelas se necessário)
        const result = await pool.request().query(`
            SELECT 
                v.id_venda, v.preco, v.data_colocacao, v.estado, v.metodo_pagamento,
                p.id_peca AS PECAid_peca, p.nome AS PECA_nome, -- Assumindo que a tabela PECA tem 'nome'
                u.id_utilizador, u.nome AS UTILIZADOR_nome -- Assumindo que a tabela UTILIZADOR tem 'nome'
            FROM VENDA_PECA v
            LEFT JOIN PECA p ON v.PECAid_peca = p.id_peca
            LEFT JOIN UTILIZADOR u ON v.UTILIZADORid_utilizador = u.id_utilizador
            ORDER BY v.data_colocacao DESC
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao obter os figurinos à venda.' });
    }
};

// 2. Colocar um novo figurino à venda
exports.createVenda = async (req, res) => {
    const { preco, PECAid_peca, UTILIZADORid_utilizador } = req.body;
    
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('preco', sql.Decimal(10, 2), preco)
            .input('data_colocacao', sql.DateTime, new Date())
            .input('estado', sql.VarChar(50), 'Disponível')
            .input('PECAid_peca', sql.Int, PECAid_peca)
            .input('UTILIZADORid_utilizador', sql.Int, UTILIZADORid_utilizador)
            .query(`
                INSERT INTO VENDA_PECA (preco, data_colocacao, estado, PECAid_peca, UTILIZADORid_utilizador)
                VALUES (@preco, @data_colocacao, @estado, @PECAid_peca, @UTILIZADORid_utilizador)
            `);
            
        res.status(201).json({ message: 'Figurino colocado à venda com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao criar venda de figurino.' });
    }
};

// 3. Comprar figurino (Atualizar estado, data e método de pagamento)
exports.comprarFigurino = async (req, res) => {
    const { id_venda } = req.params;
    const { metodo_pagamento } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id_venda', sql.Int, id_venda)
            .input('data_venda', sql.DateTime, new Date())
            .input('estado', sql.VarChar(50), 'Vendido')
            .input('metodo_pagamento', sql.VarChar(50), metodo_pagamento)
            .query(`
                UPDATE VENDA_PECA
                SET data_venda = @data_venda, estado = @estado, metodo_pagamento = @metodo_pagamento
                WHERE id_venda = @id_venda
            `);

        res.status(200).json({ message: 'Compra efetuada com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao processar a compra.' });
    }
};
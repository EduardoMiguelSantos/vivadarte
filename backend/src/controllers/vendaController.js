// Localização: backend/src/controllers/vendaController.js
const sql = require('mssql');
// IMPORTANTE: Ajusta o caminho abaixo para onde exportas a tua pool de conexão do SQL Server
const { poolPromise } = require('../config/db'); 

// 1. Obter todos os figurinos à venda
// 1. Obter todos os figurinos à venda
exports.getVendas = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                v.id_venda, v.preco, v.estado, v.nome_peca as PECA_nome, 
                v.condicao, v.metodo_pagamento as metodos_pagamento,
                u.nome as UTILIZADOR_nome, u.id_utilizador,
                u2.nome as COMPRADOR_nome, -- <- AQUI VAMOS BUSCAR O NOME DO COMPRADOR!
                (
                    SELECT foto_base64 
                    FROM [vivadarte].[dbo].[FOTO_PECA] f 
                    WHERE f.VENDAid_venda = v.id_venda 
                    FOR JSON PATH
                ) as fotos_json
            FROM [vivadarte].[dbo].[VENDA_PECA] v
            INNER JOIN [vivadarte].[dbo].[UTILIZADOR] u ON v.UTILIZADORid_utilizador = u.id_utilizador
            LEFT JOIN [vivadarte].[dbo].[UTILIZADOR] u2 ON v.UTILIZADORid_utilizador2 = u2.id_utilizador
            ORDER BY v.data_colocacao DESC
        `);

        const vendas = result.recordset.map(v => {
            const fotos = v.fotos_json ? JSON.parse(v.fotos_json).map(f => f.foto_base64) : [];
            return {
                ...v,
                metodos_pagamento: v.metodos_pagamento ? v.metodos_pagamento.split(',') : [],
                fotos: fotos.length > 0 ? fotos : ['https://images.unsplash.com/photo-1547152382-1611bc086830?q=80&w=400']
            };
        });

        res.status(200).json(vendas);
    } catch (err) {
        console.error("Erro a obter vendas:", err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// 2. Criar uma nova venda
exports.criarVenda = async (req, res) => {
    const { PECA_nome, preco, condicao, metodos_pagamento, fotos, id_utilizador } = req.body;
    
    // Proteção extra caso o array de pagamentos venha vazio
    const metodosStr = metodos_pagamento && metodos_pagamento.length > 0 ? metodos_pagamento.join(',') : 'MBWay';

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // ---------------------------------------------------------
            // PASSO 1: Criar a Peça
            // ---------------------------------------------------------
            const reqPeca = new sql.Request(transaction);
            
            reqPeca.input('nome', sql.VarChar, PECA_nome); 
            reqPeca.input('estado', sql.VarChar, condicao); 
            reqPeca.input('id_utilizador', sql.Int, id_utilizador); 
            reqPeca.input('categoria_id', sql.Int, 1); 
            
            const resultPeca = await reqPeca.query(`
                INSERT INTO [vivadarte].[dbo].[PECA] 
                (nome, estado, disponivel_para_emprestimo, disponivel_para_venda, data_registo, UTILIZADORid_utilizador, CATEGORIA_PECAid_categoria_peca)
                OUTPUT INSERTED.id_peca
                VALUES (@nome, @estado, 0, 1, GETDATE(), @id_utilizador, @categoria_id)
            `);
            const id_peca_gerado = resultPeca.recordset[0].id_peca;

            // ---------------------------------------------------------
            // PASSO 2: Inserir a VENDA
            // ---------------------------------------------------------
            const request = new sql.Request(transaction);
            request.input('preco', sql.Decimal(10, 2), preco);
            request.input('estado', sql.VarChar, 'Disponível');
            request.input('id_utilizador', sql.Int, id_utilizador);
            request.input('metodo_pagamento', sql.VarChar, metodosStr);
            request.input('nome_peca', sql.VarChar, PECA_nome);
            request.input('condicao', sql.VarChar, condicao);
            request.input('id_peca_fk', sql.Int, id_peca_gerado); 

            const resultVenda = await request.query(`
                INSERT INTO [vivadarte].[dbo].[VENDA_PECA] 
                (preco, data_colocacao, estado, UTILIZADORid_utilizador, metodo_pagamento, nome_peca, condicao, PECAid_peca)
                OUTPUT INSERTED.id_venda
                VALUES (@preco, GETDATE(), @estado, @id_utilizador, @metodo_pagamento, @nome_peca, @condicao, @id_peca_fk)
            `);
            const id_venda = resultVenda.recordset[0].id_venda;

            // ---------------------------------------------------------
            // PASSO 3: Inserir as FOTOS
            // ---------------------------------------------------------
            if (fotos && fotos.length > 0) {
                for (let foto_base64 of fotos) {
                    const reqFoto = new sql.Request(transaction);
                    reqFoto.input('foto_base64', sql.VarChar(sql.MAX), foto_base64);
                    reqFoto.input('id_venda', sql.Int, id_venda);
                    reqFoto.input('id_peca_foto', sql.Int, id_peca_gerado);
                    
                    await reqFoto.query(`
                        INSERT INTO [vivadarte].[dbo].[FOTO_PECA] (foto_base64, VENDAid_venda, PECAid_peca)
                        VALUES (@foto_base64, @id_venda, @id_peca_foto)
                    `);
                }
            }

            // Confirma a gravação na base de dados
            await transaction.commit();
            
            // IMPORTANTE: O "return" aqui impede que o Node continue a executar lixo
            return res.status(201).json({ message: 'Venda criada com sucesso!', id_venda });

        } catch (err) {
            console.error("⚠️ Ocorreu um erro no SQL:", err.message);
            
            // Colete à prova de balas para o Rollback:
            try {
                await transaction.rollback();
            } catch (rollbackErr) {
                // Se o SQL já tiver fechado a transação, ignoramos silenciosamente
            }
            
            return res.status(500).json({ error: 'Erro ao gravar na base de dados.' });
        }
    } catch (err) {
        console.error("Erro geral no Servidor:", err.message);
        return res.status(500).json({ error: 'Erro de ligação ao servidor' });
    }
};

// 3. Atualizar venda (Editar ou Comprar)
exports.atualizarVenda = async (req, res) => {
    const { id } = req.params;
    const { PECA_nome, preco, estado, UTILIZADORid_utilizador2 } = req.body; 

    try {
        const pool = await poolPromise;
        const request = pool.request();
        
        request.input('id_venda', sql.Int, id);
        request.input('preco', sql.Decimal(10, 2), preco);
        request.input('estado', sql.VarChar, estado);
        request.input('nome_peca', sql.VarChar, PECA_nome);

        // A query base de atualização
        let query = `
            UPDATE [vivadarte].[dbo].[VENDA_PECA] 
            SET preco = @preco, estado = @estado, nome_peca = @nome_peca
        `;

        // Se o frontend enviar o ID do comprador, adicionamos isso à query!
        if (UTILIZADORid_utilizador2) {
            request.input('id_comprador', sql.Int, UTILIZADORid_utilizador2);
            // Regista o comprador e a data da venda na base de dados
            query += `, UTILIZADORid_utilizador2 = @id_comprador, data_venda = GETDATE()`;
        }

        query += ` WHERE id_venda = @id_venda`;

        await request.query(query);
        res.status(200).json({ message: 'Venda atualizada/comprada com sucesso!' });
    } catch (err) {
        console.error("⚠️ Erro ao atualizar venda:", err);
        res.status(500).json({ error: 'Erro ao atualizar na base de dados.' });
    }
};

// 4. Apagar Venda
exports.apagarVenda = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            request.input('id_venda', sql.Int, id);

            // 1. Descobrir qual é a Peça associada a esta Venda (para apagar no fim)
            const resultVenda = await request.query(`
                SELECT PECAid_peca FROM [vivadarte].[dbo].[VENDA_PECA] WHERE id_venda = @id_venda
            `);
            const id_peca = resultVenda.recordset.length > 0 ? resultVenda.recordset[0].PECAid_peca : null;

            // 2. Apagar primeiro as Fotos (porque dependem da Venda)
            await request.query(`
                DELETE FROM [vivadarte].[dbo].[FOTO_PECA] WHERE VENDAid_venda = @id_venda
            `);

            // 3. Apagar a Venda (porque depende da Peça)
            await request.query(`
                DELETE FROM [vivadarte].[dbo].[VENDA_PECA] WHERE id_venda = @id_venda
            `);

            // 4. Apagar a Peça (para não deixar lixo invisível na base de dados)
            if (id_peca) {
                request.input('id_peca', sql.Int, id_peca);
                await request.query(`
                    DELETE FROM [vivadarte].[dbo].[PECA] WHERE id_peca = @id_peca
                `);
            }

            // Confirma tudo!
            await transaction.commit();
            res.status(200).json({ message: 'Figurino apagado com sucesso!' });

        } catch (err) {
            console.error("⚠️ Erro no SQL ao apagar:", err.message);
            try { await transaction.rollback(); } catch (e) {}
            return res.status(500).json({ error: 'Erro ao apagar na base de dados.' });
        }
    } catch (err) {
        console.error("Erro geral no Servidor:", err.message);
        return res.status(500).json({ error: 'Erro de ligação ao servidor' });
    }
};
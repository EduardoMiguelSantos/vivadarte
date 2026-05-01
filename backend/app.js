const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { poolConnect, pool } = require('./src/config/db');

const app = express();

// ========== MIDDLEWARES ==========
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

// ========== ROTA DE REGISTO (SQL SERVER) ==========
app.post('/api/auth/register', async (req, res) => {
    const { nome, email, telefone, password, tipo } = req.body;

    try {
        const saltRounds = 10;
        const hashedPw = await bcrypt.hash(password, saltRounds);
        const perfilId = tipo === 'EE' ? 3 : 2;

        const request = pool.request();
        request.input('nome', nome);
        request.input('email', email);
        request.input('password', hashedPw);
        request.input('telefone', telefone);
        request.input('perfilId', perfilId);

        const sql = `
            BEGIN TRANSACTION;
                DECLARE @InsertedID TABLE (ID INT);
                INSERT INTO [dbo].[UTILIZADOR] ([nome], [email], [password_hash], [telefone], [ativo], [data_criacao]) 
                OUTPUT INSERTED.id_utilizador INTO @InsertedID
                VALUES (@nome, @email, @password, @telefone, 1, GETDATE());

                INSERT INTO [dbo].[UTILIZADOR_PERFIL] ([UTILIZADOR_id], [PERFIL_id])
                SELECT ID, @perfilId FROM @InsertedID;
            COMMIT;
        `;

        await request.query(sql);
        res.status(201).json({ message: 'Registado com sucesso!' });

    } catch (err) {
        console.error('ERRO NO REGISTO:', err.message);
        
        // Verifica se o erro é de email duplicado (UNIQUE KEY)
        if (err.message.includes('UNIQUE KEY') || err.message.includes('duplicate key')) {
            return res.status(400).json({ error: 'Email já em uso !' });
        }

        res.status(500).json({ error: 'Erro ao gravar na base de dados.' });
    }
});

// ========== ROTA DE LOGIN ==========
app.post('/api/auth/login', async (req, res) => {
    const { email, password, tipo } = req.body;

    try {
        const request = pool.request();
        
        // Mapeamento de IDs conforme a tua tabela PERFIL (EE=3, Professor=2)
        const perfilId = tipo === 'EE' ? 3 : 2;

        request.input('email', email);
        request.input('perfilId', perfilId);

        // A query agora verifica se o email E o perfil coincidem
        const sql = `
            SELECT U.*, P.nome as perfil_nome 
            FROM [dbo].[UTILIZADOR] U
            JOIN [dbo].[UTILIZADOR_PERFIL] UP ON U.id_utilizador = UP.UTILIZADOR_id
            JOIN [dbo].[PERFIL] P ON UP.PERFIL_id = P.id_perfil
            WHERE U.email = @email 
              AND UP.PERFIL_id = @perfilId 
              AND U.ativo = 1
        `;

        const result = await request.query(sql);

        // Se não encontrar (ou o perfil estiver errado para este email)
        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Email ou palavra-passe incorretos.' });
        }

        const utilizador = result.recordset[0];

        // Validar password encriptada
        const match = await bcrypt.compare(password, utilizador.password_hash);

        if (!match) {
            return res.status(401).json({ error: 'Email ou palavra-passe incorretos.' });
        }

        // Sucesso: Retorna dados para o Frontend
        res.status(200).json({
            message: 'Sucesso',
            user: { 
                nome: utilizador.nome, 
                perfil: utilizador.perfil_nome 
            }
        });

    } catch (err) {
        console.error('ERRO LOGIN:', err.message);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
poolConnect.then(() => {
    app.listen(PORT, () => console.log(`Servidor a bombar em: http://localhost:${PORT}`));
});
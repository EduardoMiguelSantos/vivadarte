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
        // 1. Encriptar a password
        const saltRounds = 10;
        const hashedPw = await bcrypt.hash(password, saltRounds);

        // 2. Mapeamento de IDs conforme a tua imagem (image_3dfb2b.png)
        // EE -> id_perfil 3 | Professor -> id_perfil 2
        const perfilId = tipo === 'EE' ? 3 : 2;

        const request = pool.request();
        request.input('nome', nome);
        request.input('email', email);
        request.input('password', hashedPw);
        request.input('telefone', telefone);
        request.input('perfilId', perfilId);

        // 3. Query com OUTPUT para garantir a ligação das tabelas
        const sql = `
            BEGIN TRANSACTION;
                DECLARE @InsertedID TABLE (ID INT);

                INSERT INTO [dbo].[UTILIZADOR] 
                ([nome], [email], [password_hash], [telefone], [ativo], [data_criacao]) 
                OUTPUT INSERTED.id_utilizador INTO @InsertedID
                VALUES (@nome, @email, @password, @telefone, 1, GETDATE());

                INSERT INTO [dbo].[UTILIZADOR_PERFIL] ([UTILIZADOR_id], [PERFIL_id])
                SELECT ID, @perfilId FROM @InsertedID;
            COMMIT;
        `;

        await request.query(sql);
        
        console.log(`Sucesso: Utilizador ${email} registado como Perfil ${perfilId}`);
        res.status(201).json({ message: 'Registado com sucesso!' });

    } catch (err) {
        console.error('ERRO NO SQL SERVER:', err.message);
        
        // Se houver erro, tentamos dar rollback se a transação ainda estiver aberta
        if (err.message.includes('transaction')) {
            await pool.request().query('IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;');
        }

        // Resposta amigável para email duplicado
        if (err.message.includes('UNIQUE KEY')) {
            return res.status(400).json({ error: 'Este email já está em uso.' });
        }

        res.status(500).json({ error: 'Erro ao gravar na base de dados: ' + err.message });
    }
});

// ========== ROTA NÃO ENCONTRADA ==========
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT || 3000;

poolConnect
    .then(() => {
        console.log('SQL Server ligado com sucesso');
        app.listen(PORT, () => {
            console.log(`Servidor a correr em: http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Erro de ligação à base de dados:', err.message);
        process.exit(1);
    });
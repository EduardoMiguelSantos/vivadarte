const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { poolConnect } = require('./src/config/db');

const app = express();

// ========== MIDDLEWARES ==========
app.use(express.json());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allow = /^http:\/\/localhost:517\d$/.test(origin) || origin === 'http://localhost:5173';
        return callback(allow ? null : new Error('CORS bloqueado'), allow);
    }
}));

// ========== ROTAS API ==========
//app.use('/api/auth', require('./src/routes/authRoutes')); 
//app.use('/api/admin', require('./src/routes/adminRoutes'));

// ========== ROTA DE LOGIN ==========
app.post('/api/auth/login', async (req, res) => {
    const { email, password, tipo } = req.body;

    try {
        const request = pool.request();
        
        const perfilId = tipo === 'EE' ? 3 : 2;

        request.input('email', email);
        request.input('perfilId', perfilId);

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

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Email ou palavra-passe incorretos.' });
        }

        const utilizador = result.recordset[0];

        const match = await bcrypt.compare(password, utilizador.password_hash);

        if (!match) {
            return res.status(401).json({ error: 'Email ou palavra-passe incorretos.' });
        }

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
app.use(errorHandler);

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
poolConnect.then(() => {
    app.listen(PORT, () => console.log(`Servidor a bombar em: http://localhost:${PORT}`));
});
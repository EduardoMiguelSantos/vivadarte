const express = require('express');
const cors = require('cors');
require('dotenv').config();
<<<<<<< HEAD
<<<<<<< HEAD
const { poolConnect } = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');
=======
const { poolConnect, pool } = require('./src/config/db');
>>>>>>> main
=======

const { poolConnect } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const errorHandler = require('./src/middlewares/errorHandler');
>>>>>>> main

const app = express();

app.use(express.json());
<<<<<<< HEAD
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allow = /^http:\/\/localhost:517\d$/.test(origin) || origin === 'http://localhost:5173';
        return callback(allow ? null : new Error('CORS bloqueado'), allow);
    }
}));

<<<<<<< HEAD
// ========== ROTAS API ==========
app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: "Viva D'arte API" });
});
app.use('/api/auth', require('./src/routes/authRoutes'));
=======
// ========== ROTA DE REGISTO (SQL SERVER) ==========
app.post('/api/auth/register', async (req, res) => {
    const { nome, email, telefone, password, tipo } = req.body;
>>>>>>> main

    try {
        const regexEspecial = /[!@#$%^&*(),.?":{}|<>]/;
        
        if (password.length < 8 || !regexEspecial.test(password)) {
            return res.status(400).json({ 
                error: 'A password deve ter no mínimo 8 caracteres e incluir um caractere especial.' 
            });
=======
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const allow = /^http:\/\/localhost:517\d$/.test(origin);
            return callback(allow ? null : new Error('CORS bloqueado'), allow);
>>>>>>> main
        }
    })
);

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use(errorHandler);

<<<<<<< HEAD
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
=======
>>>>>>> main
const PORT = process.env.PORT || 3000;
poolConnect
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor a bombar em: http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Erro ao ligar a BD:', error.message);
        process.exit(1);
    });
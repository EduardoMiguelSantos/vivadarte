const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { pool, poolConnect, sql } = require('./src/config/db');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ========== LOGIN ==========
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email e password obrigatórios' });

        await poolConnect;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM UTILIZADOR WHERE email = @email AND ativo = 1');

        if (result.recordset.length === 0)
            return res.status(401).json({ error: 'Credenciais inválidas' });

        const utilizador = result.recordset[0];
        const passwordCorreta = await bcrypt.compare(password, utilizador.password_hash);

        if (!passwordCorreta)
            return res.status(401).json({ error: 'Credenciais inválidas' });

        const token = jwt.sign(
            { id: utilizador.id_utilizador, email: utilizador.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({ success: true, token, utilizador: {
            id: utilizador.id_utilizador,
            nome: utilizador.nome,
            email: utilizador.email
        }});

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== REGISTAR ==========
app.post('/api/registar', async (req, res) => {
    try {
        const { nome, email, password } = req.body;
        if (!nome || !email || !password)
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });

        await poolConnect;

        // Verifica se email já existe
        const existe = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id_utilizador FROM UTILIZADOR WHERE email = @email');

        if (existe.recordset.length > 0)
            return res.status(409).json({ error: 'Email já registado' });

        const hash = await bcrypt.hash(password, 12);

        await pool.request()
            .input('nome', sql.NVarChar, nome)
            .input('email', sql.NVarChar, email)
            .input('hash', sql.NVarChar, hash)
            .query('INSERT INTO UTILIZADOR (nome, email, password_hash) VALUES (@nome, @email, @hash)');

        res.status(201).json({ success: true, message: 'Utilizador registado!' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== PÁGINAS ==========
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/login.html')));
app.get('/admin', (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/admin.html')));
app.get('/aluno', (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/aluno.html')));


// ========== INICIAR ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor: http://localhost:${PORT}`);
});
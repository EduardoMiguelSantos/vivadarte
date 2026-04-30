const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// ========== MIDDLEWARES ==========
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ========== ROTAS API ==========
app.use('/api/auth', require('./src/routes/authRoutes'));

// ========== PÁGINAS ==========
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/login.html')));

app.get('/admin', (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/admin.html')));

app.get('/professor', (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/professor.html')));

app.get('/aluno', (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/aluno.html')));

app.get('/contabilidade', (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/contabilidade.html')));

// ========== ROTA NÃO ENCONTRADA ==========
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// ========== INICIAR ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(` Servidor: http://localhost:${PORT}`);
});
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { poolConnect } = require('./src/config/db');

const app = express();

// ========== MIDDLEWARES ==========
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

// ========== ROTAS API ==========
//app.use('/api/auth', require('./src/routes/authRoutes')); 
//app.use('/api/admin', require('./src/routes/adminRoutes'));

// ========== ROTA NÃO ENCONTRADA ==========
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// ========== INICIAR (só após BD ligada) ==========
const PORT = process.env.PORT || 3000;
poolConnect
    .then(() => {
        console.log('Base de dados ligada com sucesso');
        app.listen(PORT, () => {
            console.log(`Servidor: http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Erro:', err.message);
        process.exit(1);
    });
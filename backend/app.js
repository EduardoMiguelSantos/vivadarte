const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { poolConnect } = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');

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
app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: "Viva D'arte API" });
});
app.use('/api/auth', require('./src/routes/authRoutes'));

// ========== ROTA NÃO ENCONTRADA ==========
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});
app.use(errorHandler);

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
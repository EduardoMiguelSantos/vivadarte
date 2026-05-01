const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { poolConnect } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const allow = /^http:\/\/localhost:517\d$/.test(origin);
            return callback(allow ? null : new Error('CORS bloqueado'), allow);
        }
    })
);

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});
app.use(errorHandler);

app.use('/api/auth', authRoutes);
app.use(errorHandler);

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
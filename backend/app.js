const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { poolConnect } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

// Middleware
app.use(express.json());

// Configuração de CORS melhorada para desenvolvimento
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rota de teste
app.get('/api/health', (req, res) => {
    res.json({ status: "online", message: "Servidor Viva D'arte a bombar!" });
});

// Definição de Rotas
app.use('/api/auth', authRoutes);

// Tratamento de Erros (sempre no fim)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Ligar à Base de Dados e iniciar Servidor
poolConnect
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ Servidor a bombar em: http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Erro crítico ao ligar à BD:', error.message);
        process.exit(1);
    });
const express = require('express');
const odbc = require('odbc');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Conexão à base de dados
const connectionString = 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=vivadarte;Trusted_Connection=yes;TrustServerCertificate=yes;';
let connection;

async function conectar() {
    try {
        connection = await odbc.connect(connectionString);
        console.log('✅ Banco conectado');
    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
}
conectar();

// ========== ROTA DE LOGIN (APENAS LOCAL) ==========
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e password são obrigatórios' });
        }

        // Procurar na base de dados
        const result = await connection.query(`
            SELECT id_utilizador, nome, email 
            FROM UTILIZADOR 
            WHERE email = '${email}' AND password = '${password}'
        `);

        if (result.length === 0) {
            return res.status(401).json({ error: 'Email ou password inválidos' });
        }

        res.json({ 
            success: true, 
            message: 'Login bem sucedido!',
            user: result[0]
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTA PARA REGISTAR NOVO UTILIZADOR ==========
app.post('/api/registar', async (req, res) => {
    try {
        const { nome, email, password } = req.body;

        if (!nome || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e password são obrigatórios' });
        }

        // Verificar se email já existe
        const existe = await connection.query(`SELECT * FROM UTILIZADOR WHERE email = '${email}'`);
        
        if (existe.length > 0) {
            return res.status(400).json({ error: 'Email já registado' });
        }

        // Inserir novo utilizador
        await connection.query(`
            INSERT INTO UTILIZADOR (nome, email, password, ativo, data_criacao)
            VALUES ('${nome}', '${email}', '${password}', 1, GETDATE())
        `);

        res.status(201).json({ success: true, message: 'Utilizador registado com sucesso!' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTAS DAS PÁGINAS ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/aluno', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/aluno.html'));
});

app.get('/registar', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/registar.html'));
});

// ========== INICIAR ==========
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor: http://localhost:${PORT}`);
});
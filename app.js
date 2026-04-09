const express = require('express');
const odbc = require('odbc');
const app = express();

app.use(express.json());

const connectionString = 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=vivadarte;Trusted_Connection=yes;TrustServerCertificate=yes;';

let connection;

async function conectar() {
    try {
        connection = await odbc.connect(connectionString);
        console.log('✅ Banco de dados conectado!');
    } catch (err) {
        console.log('❌ Erro ao conectar:', err.message);
    }
}

conectar();

app.get('/api/test', async (req, res) => {
    try {
        const result = await connection.query('SELECT 1 as test');
        res.json({ message: 'API funcionando!', database: 'conectado', test: result[0] });
    } catch (error) {
        res.json({ message: 'API funcionando!', database: 'erro', error: error.message });
    }
});

app.get('/api/alunos', async (req, res) => {
    try {
        const result = await connection.query('SELECT * FROM ALUNO');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(` Servidor rodando na porta ${PORT}`);
    console.log(` Teste: http://localhost:${PORT}/api/test`);
});
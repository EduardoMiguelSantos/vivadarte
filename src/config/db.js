const sql = require('mssql');

const dbConfig = {
    server: 'localhost',          // ← Atenção: SÓ o nome do servidor, sem a instância
    port: 1433,                   // ← A porta fixa que acabou de configurar
    database: 'vivadarte',
    options: {
        trustedConnection: true,  // Mantenha 'true' para autenticação do Windows
        trustServerCertificate: true, // Necessário para desenvolvimento local
        encrypt: false,           // Desligado para desenvolvimento local
        connectTimeout: 30000,
        enableArithAbort: true
    }
};

async function conectar() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('Conectado ao SQL Server com sucesso!');
        return pool;
    } catch (err) {
        console.error('Erro ao conectar:', err.message);
    }
}

conectar();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, poolConnect, sql } = require('../config/db');

// ========== LOGIN ==========
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ error: 'Email e password obrigatórios' });

        await poolConnect;

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT 
                    u.id_utilizador,
                    u.nome,
                    u.email,
                    u.password_hash,
                    u.ativo,
                    STRING_AGG(p.nome, ',') AS perfis
                FROM UTILIZADOR u
                LEFT JOIN UTILIZADOR_PERFIL up ON up.UTILIZADOR_id = u.id_utilizador
                LEFT JOIN PERFIL p ON p.id_perfil = up.PERFIL_id
                WHERE u.email = @email
                GROUP BY u.id_utilizador, u.nome, u.email, u.password_hash, u.ativo
            `);

        if (result.recordset.length === 0)
            return res.status(401).json({ error: 'Credenciais inválidas' });

        const utilizador = result.recordset[0];

        if (!utilizador.ativo)
            return res.status(403).json({ error: 'Conta ainda não aprovada pelo Admin' });

        const passwordCorreta = await bcrypt.compare(password, utilizador.password_hash);
        if (!passwordCorreta)
            return res.status(401).json({ error: 'Credenciais inválidas' });

        const perfis = utilizador.perfis ? utilizador.perfis.split(',') : [];

        const token = jwt.sign(
            { id: utilizador.id_utilizador, email: utilizador.email, perfis },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Redireciona conforme perfil
        let redirecionar = '/aluno';
        if (perfis.includes('Admin') || perfis.includes('Coordenação')) redirecionar = '/admin';
        else if (perfis.includes('Professor')) redirecionar = '/professor';
        else if (perfis.includes('Contabilidade')) redirecionar = '/contabilidade';

        return res.json({
            success: true,
            token,
            redirecionar,
            utilizador: {
                id: utilizador.id_utilizador,
                nome: utilizador.nome,
                email: utilizador.email,
                perfis
            }
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ========== PEDIDO DE REGISTO ==========
async function pedidoRegisto(req, res) {
    try {
        const { nome, email, password, telefone, perfil } = req.body;

        if (!nome || !email || !password || !perfil)
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });

        // Perfis que podem pedir registo (não Admin)
        const perfisPermitidos = ['Professor', 'EE', 'Contabilidade', 'Coordenação'];
        if (!perfisPermitidos.includes(perfil))
            return res.status(400).json({ error: 'Perfil inválido' });

        await poolConnect;

        // Verifica se email já existe
        const existe = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id_utilizador FROM UTILIZADOR WHERE email = @email');

        if (existe.recordset.length > 0)
            return res.status(409).json({ error: 'Email já registado' });

        const hash = await bcrypt.hash(password, 12);

        // Cria utilizador com ativo = 0 (pendente aprovação)
        const novoUtilizador = await pool.request()
            .input('nome', sql.NVarChar, nome)
            .input('email', sql.NVarChar, email)
            .input('hash', sql.NVarChar, hash)
            .input('telefone', sql.NVarChar, telefone || null)
            .query(`
                INSERT INTO UTILIZADOR (nome, email, password_hash, telefone, ativo)
                OUTPUT INSERTED.id_utilizador
                VALUES (@nome, @email, @hash, @telefone, 0)
            `);

        const novoId = novoUtilizador.recordset[0].id_utilizador;

        // Busca id do perfil
        const perfilResult = await pool.request()
            .input('nome', sql.NVarChar, perfil)
            .query('SELECT id_perfil FROM PERFIL WHERE nome = @nome');

        if (perfilResult.recordset.length > 0) {
            await pool.request()
                .input('userId', sql.Int, novoId)
                .input('perfilId', sql.Int, perfilResult.recordset[0].id_perfil)
                .query('INSERT INTO UTILIZADOR_PERFIL (UTILIZADOR_id, PERFIL_id) VALUES (@userId, @perfilId)');
        }

        return res.status(201).json({
            success: true,
            message: 'Pedido de registo enviado! Aguarda aprovação do administrador.'
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { login, pedidoRegisto };
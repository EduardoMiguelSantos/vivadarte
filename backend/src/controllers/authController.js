const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/utilizadorModel');
const { pool, poolConnect } = require('../config/db');

const PERFIL_MAP = {
    EE: 'EE',
    PROF: 'Professor'
};

function mapTipoParaPerfil(tipo) {
    return PERFIL_MAP[tipo] || null;
}

function gerarToken(utilizador) {
    if (!process.env.JWT_SECRET) {
        const err = new Error('JWT_SECRET não definido no backend/.env');
        err.status = 500;
        throw err;
    }

    return jwt.sign(
        {
            id: utilizador.id_utilizador,
            email: utilizador.email,
            perfis: utilizador.perfis
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
}

async function registar(req, res, next) {
    try {
        const { nome, email, password, telefone, tipo } = req.body;

        if (!nome || !email || !password || !tipo || !telefone) {
            return res.status(400).json({ error: 'nome, email, password, telefone e tipo são obrigatórios' });
        }

        const perfilNome = mapTipoParaPerfil(tipo);
        if (!perfilNome) {
            return res.status(400).json({ error: 'tipo inválido. Use EE ou PROF' });
        }

        const existente = await userModel.getUtilizadorByEmail(email);
        if (existente) {
            return res.status(409).json({ error: 'Email já registado' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const novoUtilizador = await userModel.criarUtilizador({
            nome,
            email,
            passwordHash,
            telefone,
            nomePerfil: perfilNome,
            tipo
        });

        const perfis = await userModel.getPerfisDoUtilizador(novoUtilizador.id_utilizador);
        const token = gerarToken({ ...novoUtilizador, perfis });

        return res.status(201).json({
            mensagem: 'Conta criada com sucesso',
            token,
            utilizador: {
                id: novoUtilizador.id_utilizador,
                nome: novoUtilizador.nome,
                email: novoUtilizador.email,
                telefone: novoUtilizador.telefone,
                perfis
            }
        });
    } catch (error) {
        return next(error);
    }
}

async function login(req, res, next) {
    try {
        const { email, password, tipo } = req.body;

        if (!email || !password || !tipo) {
            return res.status(400).json({ error: 'email, password e tipo são obrigatórios' });
        }

        const perfilId = tipo === 'EE' ? 3 : 2;
        const request = pool.request();

        request.input('email', email);
        request.input('perfilId', perfilId);

        const result = await request.query(`
            SELECT U.*, U.[password] AS password_hash, P.nome as perfil_nome
            FROM [dbo].[UTILIZADOR] U
            JOIN [dbo].[UTILIZADOR_PERFIL] UP ON U.id_utilizador = UP.UTILIZADORid_utilizador
            JOIN [dbo].[PERFIL] P ON UP.PERFILid_perfil = P.id_perfil
            WHERE U.email = @email
              AND UP.PERFILid_perfil = @perfilId
              AND U.ativo = 1
        `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Email ou palavra-passe incorretos.' });
        }

        const utilizador = result.recordset[0];
        const passwordValida = await bcrypt.compare(password, utilizador.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Email ou palavra-passe incorretos.' });
        }

        return res.status(200).json({
            message: 'Sucesso',
            user: {
                nome: utilizador.nome,
                perfil: utilizador.perfil_nome
            }
        });
    } catch (error) {
        return next(error);
    }
}

async function me(req, res, next) {
    try {
        const utilizador = await userModel.getUtilizadorByEmail(req.utilizador.email);
        if (!utilizador) {
            return res.status(404).json({ error: 'Utilizador não encontrado' });
        }

        const perfis = await userModel.getPerfisDoUtilizador(utilizador.id_utilizador);

        return res.json({
            utilizador: {
                id: utilizador.id_utilizador,
                nome: utilizador.nome,
                email: utilizador.email,
                perfis
            }
        });
    } catch (error) {
        return next(error);
    }
}

async function verificarTelefone(req, res, next) {
    const { telefone } = req.body;
    try {
        const result = await pool.request()
            .input('telefone', telefone)
            .query('SELECT id_utilizador FROM [dbo].[UTILIZADOR] WHERE telefone = @telefone AND ativo = 1');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Telefone incorreto!' });
        }

        return res.status(200).json({ message: 'Telefone encontrado!' });
    } catch (err) {
        next(err);
    }
}

async function resetPassword(req, res, next) {
    const { telefone, novaPassword } = req.body;

    // Verificação básica de entrada
    if (!telefone || !novaPassword) {
        return res.status(400).json({ error: 'Telefone e nova password são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(novaPassword, salt);

        const telefoneLimpo = telefone.replace(/\s/g, '');

        const result = await pool.request()
            .input('telefone', telefoneLimpo)
            .input('password', hashedPw)
            .query('UPDATE [dbo].[UTILIZADOR] SET [password] = @password WHERE telefone = @telefone AND ativo = 1');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Utilizador não encontrado com este número de telefone.' });
        }

        return res.status(200).json({ message: 'Password alterada com sucesso!' });

    } catch (err) {
        console.error("Erro detalhado no ResetPassword:", err);
        return res.status(500).json({ error: 'Erro interno ao atualizar a password.' });
    }
}

module.exports = {
    registar,
    login,
    me,
    verificarTelefone,
    resetPassword
};
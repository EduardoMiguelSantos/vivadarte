const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

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

        if (!nome || !email || !password || !tipo) {
            return res.status(400).json({ error: 'nome, email, password e tipo são obrigatórios' });
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
            perfilNome
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
                perfis
            }
        });
    } catch (error) {
        return next(error);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email e password são obrigatórios' });
        }

        const utilizador = await userModel.getUtilizadorByEmail(email);
        if (!utilizador) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        if (!utilizador.ativo) {
            return res.status(403).json({ error: 'Utilizador inativo' });
        }

        const passwordValida = await bcrypt.compare(password, utilizador.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const perfis = await userModel.getPerfisDoUtilizador(utilizador.id_utilizador);
        const token = gerarToken({ ...utilizador, perfis });

        return res.json({
            mensagem: 'Login efetuado com sucesso',
            token,
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

module.exports = {
    registar,
    login,
    me
};

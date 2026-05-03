const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/utilizadorModel');

const PERFIL_MAP = {
    EE: 'EE',
    PROF: 'Professor'
};

function mapTipoParaPerfil(tipo) {
    return PERFIL_MAP[tipo] || null;
}

/** IDs alinhados com a tabela PERFIL (Admin=1, EE=2, Professor=3). */
function mapTipoParaPerfilId(tipo) {
    const t = String(tipo || '').toUpperCase();
    if (t === 'ADMIN') return 1;
    if (t === 'EE') return 2;
    if (t === 'PROF') return 3;
    return null;
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

        const perfilId = mapTipoParaPerfilId(tipo);
        if (!perfilId) {
            return res.status(400).json({ error: 'tipo inválido. Use EE, PROF ou ADMIN' });
        }

        const utilizador = await userModel.getUtilizadorParaLogin(email, perfilId);
        if (!utilizador) {
            return res.status(401).json({ error: 'Email ou palavra-passe incorretos.' });
        }

        const passwordValida = await bcrypt.compare(password, utilizador.password);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Email ou palavra-passe incorretos.' });
        }

        const perfis = await userModel.getPerfisDoUtilizador(utilizador.id_utilizador);
        const token = gerarToken({
            id_utilizador: utilizador.id_utilizador,
            nome: utilizador.nome,
            email: utilizador.email,
            telefone: utilizador.telefone,
            perfis
        });

        return res.status(200).json({
            mensagem: 'Sessão iniciada com sucesso',
            token,
            utilizador: {
                id: utilizador.id_utilizador,
                nome: utilizador.nome,
                email: utilizador.email,
                telefone: utilizador.telefone,
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

async function verificarTelefone(req, res, next) {
    try {
        const { telefone } = req.body;
        if (!telefone) {
            return res.status(400).json({ error: 'telefone é obrigatório' });
        }

        const telefoneLimpo = String(telefone).replace(/\s/g, '');
        const existe = await userModel.existeUtilizadorTelefoneAtivo(telefoneLimpo);

        if (!existe) {
            return res.status(404).json({ error: 'Telefone incorreto!' });
        }

        return res.status(200).json({ message: 'Telefone encontrado!' });
    } catch (err) {
        return next(err);
    }
}

async function resetPassword(req, res, next) {
    try {
        const { telefone, novaPassword } = req.body;

        if (!telefone || !novaPassword) {
            return res.status(400).json({ error: 'Telefone e nova password são obrigatórios.' });
        }

        const telefoneLimpo = String(telefone).replace(/\s/g, '');
        const hashedPw = await bcrypt.hash(novaPassword, 10);

        const linhas = await userModel.atualizarPasswordPorTelefone(telefoneLimpo, hashedPw);

        if (linhas === 0) {
            return res.status(404).json({ error: 'Utilizador não encontrado com este número de telefone.' });
        }

        return res.status(200).json({ message: 'Password alterada com sucesso!' });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    registar,
    login,
    me,
    verificarTelefone,
    resetPassword
};

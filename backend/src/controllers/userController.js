const UserModel = require('../models/utilizadorModel');
const bcrypt = require('bcrypt');

const createUser = async (req, res) => {
    try {
        // Usa a função do Rafael que espera estes dados exatos
        const { nome, email, password, telefone, nomePerfil, tipo } = req.body;

        if (!nome || !email || !password || !nomePerfil || !tipo) {
            return res.status(400).json({ erro: 'Preenchimento obrigatório incompleto.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const novoUser = await UserModel.criarUtilizador({
            nome, email, passwordHash, telefone, nomePerfil, tipo
        });

        return res.status(201).json({ mensagem: 'User criado com sucesso.', user: novoUser });
    } catch (erro) {
        console.error('Erro na criação de user:', erro);
        return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
};

const listUsers = async (req, res) => {
    try {
        const { ativo } = req.query; 
        
        // Nome corrigido para bater certo com o Model do Rafael
        let users = await UserModel.listarTodosUtilizadores();

        // Filtro em JavaScript caso pesquises por utilizadores ativos
        if (ativo !== undefined) {
            const isAtivo = ativo == '1' || ativo == 'true';
            users = users.filter(u => u.ativo === isAtivo);
        }

        return res.status(200).json(users);
    } catch (erro) {
        console.error('Erro na listagem de users:', erro);
        return res.status(500).json({ erro: 'Erro interno ao obter a listagem de users.' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id_utilizador } = req.params;
        const { nome, telefone, nomePerfil } = req.body;

        // Nome corrigido
        await UserModel.editarUtilizador(id_utilizador, { nome, telefone, nomePerfil });
        return res.status(200).json({ mensagem: 'Dados atualizados com sucesso.' });
    } catch (erro) {
        console.error('Erro na atualização do user:', erro);
        return res.status(500).json({ erro: 'Erro interno ao tentar atualizar os dados.' });
    }
};

const changeUserState = async (req, res) => {
    try {
        const { id_utilizador } = req.params;
        const { ativo } = req.body;

        // Nome corrigido
        await UserModel.alterarEstadoUtilizador(id_utilizador, ativo);
        return res.status(200).json({ mensagem: 'Estado atualizado com sucesso.' });
    } catch (erro) {
        console.error('Erro ao alterar estado do user:', erro);
        return res.status(500).json({ erro: 'Erro interno.' });
    }
};

module.exports = { createUser, listUsers, updateUser, changeUserState };
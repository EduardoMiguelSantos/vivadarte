// src/controllers/userController.js

const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');

/**
 * Cria um novo user e associa-lhe um perfil na base de dados.
 */
const createUser = async (req, res) => {
    try {
        const { nome, email, password, telefone, id_perfil } = req.body;

        // 1. Validação primária de dados obrigatórios
        if (!nome || !email || !password || !id_perfil) {
            return res.status(400).json({ 
                erro: 'Os campos nome, email, password e id_perfil são de preenchimento obrigatório.' 
            });
        }

        // 2. Encriptação da palavra-passe antes da persistência
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Preparação do objeto de domínio (mapeado para a tabela UTILIZADOR)
        const newUser = {
            nome,
            email,
            password_hash: passwordHash, 
            telefone: telefone || null,
            ativo: 1, // Por defeito, a conta nasce ativa
            data_criacao: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
        };

        // 4. Chamada à camada Model
        const createdUserId = await UserModel.insertUserWithProfile(newUser, id_perfil);

        return res.status(201).json({
            mensagem: 'User criado com sucesso.',
            id_utilizador: createdUserId
        });

    } catch (erro) {
        console.error('Erro na criação de user:', erro);
        // Tratamento de erro para violação da restrição UNIQUE no email
        if (erro.message && erro.message.includes('UNIQUE')) {
            return res.status(409).json({ erro: 'O email fornecido já se encontra registado no sistema.' });
        }
        return res.status(500).json({ erro: 'Erro interno no servidor ao processar o pedido.' });
    }
};

/**
 * Devolve a lista de todos os users, permitindo filtragem opcional pelo estado (ativo/inativo).
 */
const listUsers = async (req, res) => {
    try {
        const { ativo } = req.query; // Permite chamadas como GET /api/users?ativo=1
        
        let users;
        if (ativo !== undefined) {
            users = await UserModel.getUsersByState(ativo);
        } else {
            users = await UserModel.getAllUsers();
        }

        return res.status(200).json(users);

    } catch (erro) {
        console.error('Erro na listagem de users:', erro);
        return res.status(500).json({ erro: 'Erro interno ao obter a listagem de users.' });
    }
};

/**
 * Atualiza os dados de contacto e informação base de um user existente.
 */
const updateUser = async (req, res) => {
    try {
        const { id_utilizador } = req.params;
        const { nome, telefone } = req.body;

        if (!nome) {
            return res.status(400).json({ erro: 'O nome do user não pode estar vazio.' });
        }

        const affectedRows = await UserModel.updateUserData(id_utilizador, { nome, telefone });

        if (affectedRows === 0) {
            return res.status(404).json({ erro: 'User não encontrado.' });
        }

        return res.status(200).json({ mensagem: 'Dados do user atualizados com sucesso.' });

    } catch (erro) {
        console.error('Erro na atualização do user:', erro);
        return res.status(500).json({ erro: 'Erro interno ao tentar atualizar os dados.' });
    }
};

/**
 * Altera o estado de um user (Ativar / Desativar) modificando o bit correspondente.
 */
const changeUserState = async (req, res) => {
    try {
        const { id_utilizador } = req.params;
        const { ativo } = req.body;

        if (typeof ativo === 'undefined') {
            return res.status(400).json({ erro: 'O estado (ativo) deve ser fornecido obrigatoriamente.' });
        }

        const stateBit = ativo ? 1 : 0;
        const affectedRows = await UserModel.updateState(id_utilizador, stateBit);

        if (affectedRows === 0) {
            return res.status(404).json({ erro: 'User não encontrado para alteração de estado.' });
        }

        const stateDescription = stateBit === 1 ? 'ativada' : 'desativada';
        return res.status(200).json({ mensagem: `Conta de user ${stateDescription} com sucesso.` });

    } catch (erro) {
        console.error('Erro ao alterar estado do user:', erro);
        return res.status(500).json({ erro: 'Erro interno ao processar a alteração de estado.' });
    }
};

module.exports = {
    createUser,
    listUsers,
    updateUser,
    changeUserState
};
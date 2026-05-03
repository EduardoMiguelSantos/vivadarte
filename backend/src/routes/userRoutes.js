// src/routes/userRoutes.js

const express = require('express');
const router = express.Router();

// Importação do Controller:
// Adicionei a extensão '.js' para forçar o Node.js a encontrar o ficheiro exato
// que vemos na tua imagem, dentro da pasta 'controllers'.
const userController = require('../controllers/userController.js');

/**
 * Rota: Criar um novo user
 * Método: POST
 * Endpoint Final: /api/users/registar
 */
router.post('/registar', userController.createUser);

/**
 * Rota: Listar todos os users (com suporte a query param ?ativo=1)
 * Método: GET
 * Endpoint Final: /api/users
 */
router.get('/', userController.listUsers);

/**
 * Rota: Atualizar dados base de um user (nome e telefone)
 * Método: PUT
 * Endpoint Final: /api/users/:id_utilizador
 */
router.put('/:id_utilizador', userController.updateUser);

/**
 * Rota: Alterar o estado de um user (Ativar/Desativar)
 * Método: PATCH
 * Endpoint Final: /api/users/:id_utilizador/estado
 */
router.patch('/:id_utilizador/estado', userController.changeUserState);

module.exports = router;
// src/controllers/pedidoCoachingController.js

// Alteração: Importação centralizada no coachingModel
const CoachingModel = require('../models/coachingModel');

/**
 * Consulta as vagas disponíveis com base nos critérios fornecidos (modalidade, data, etc.).
 * Implementa parte da US04 (Pesquisa e Pedido).
 */
const consultarVagas = async (req, res) => {
    try {
        const { id_modalidade, data_pretendida, duracao_minutos } = req.query;

        // Validação básica: precisamos de saber o que estamos a procurar
        if (!id_modalidade || !data_pretendida) {
            return res.status(400).json({
                erro: 'Os parâmetros id_modalidade e data_pretendida são obrigatórios para a pesquisa de vagas.'
            });
        }

        // Delegação para o Model centralizado
        const vagasDisponiveis = await CoachingModel.obterVagas(id_modalidade, data_pretendida, duracao_minutos);

        return res.status(200).json(vagasDisponiveis);

    } catch (erro) {
        console.error('Erro na consulta de vagas de coaching:', erro);
        return res.status(500).json({ erro: 'Erro interno ao consultar as vagas disponíveis.' });
    }
};

/**
 * Cria um novo pedido de coaching.
 * Implementa a US05 (Submissão de Pedido).
 */
const criarPedido = async (req, res) => {
    try {
        const {
            id_utilizador, // Encarregado de Educação ou Professor que faz o pedido
            id_ano_letivo,
            id_modalidade,
            id_professor, // Pode ser null se o EE deixar "qualquer disponível"
            formato_aula,
            duracao_minutos,
            numero_participantes,
            data_aula_pretendida,
            hora_inicio_pretendida,
            alunos_participantes // Array com os IDs dos alunos
        } = req.body;

        // 1. Validação de dados obrigatórios do cabeçalho do pedido
        if (!id_utilizador || !id_ano_letivo || !id_modalidade || !formato_aula || !duracao_minutos || !numero_participantes || !data_aula_pretendida || !hora_inicio_pretendida) {
            return res.status(400).json({
                erro: 'Dados incompletos para submeter o pedido de coaching.'
            });
        }

        // 2. Validação da consistência dos participantes
        if (!alunos_participantes || !Array.isArray(alunos_participantes) || alunos_participantes.length !== numero_participantes) {
             return res.status(400).json({
                erro: 'A lista de alunos participantes não corresponde ao número de participantes indicado.'
            });
        }

        // 3. Preparação do objeto de domínio (mapeia para a tabela PEDIDO_COACHING)
        const novoPedido = {
            id_ano_letivo,
            id_utilizador_requisitante: id_utilizador, 
            id_professor: id_professor || null, 
            id_modalidade,
            formato_aula,
            duracao_minutos,
            numero_participantes,
            data_pedido: new Date().toISOString().split('T')[0],
            data_aula_pretendida,
            hora_inicio_pretendida,
            estado: 'Pendente' // O estado inicial é sempre Pendente
        };

        // 4. Delegação para o Model (transação que insere no PEDIDO_COACHING)
        const idPedidoCriado = await CoachingModel.inserirPedido(novoPedido, alunos_participantes);

        return res.status(201).json({
            mensagem: 'Pedido de coaching submetido com sucesso. Aguarda validação da Coordenação.',
            id_pedido_coaching: idPedidoCriado
        });

    } catch (erro) {
        console.error('Erro na criação de pedido de coaching:', erro);
        return res.status(500).json({ erro: 'Erro interno ao submeter o pedido.' });
    }
};

/**
 * Permite ao Encarregado de Educação cancelar um pedido que ainda não foi realizado.
 * Implementa a US12 (Cancelamento).
 */
const cancelarPedido = async (req, res) => {
    try {
        const { id_pedido_coaching } = req.params;
        const { id_utilizador_requerente } = req.body; 

        if (!id_utilizador_requerente) {
             return res.status(400).json({ erro: 'É necessário fornecer o identificador do utilizador que está a solicitar o cancelamento.' });
        }

        // Delegação para o Model centralizado
        const linhasAfetadas = await CoachingModel.atualizarEstadoPedido(id_pedido_coaching, id_utilizador_requerente, 'Cancelado');

        if (linhasAfetadas === 0) {
            return res.status(404).json({ erro: 'Pedido não encontrado ou o utilizador não tem permissão para o cancelar.' });
        }

        return res.status(200).json({ mensagem: 'Pedido de coaching cancelado com sucesso.' });

    } catch (erro) {
        console.error('Erro ao cancelar o pedido de coaching:', erro);
        return res.status(500).json({ erro: 'Erro interno ao processar o cancelamento do pedido.' });
    }
};

/**
 * Consulta a lista de pedidos (para a Coordenação gerir - US06).
 */
const listarPedidos = async (req, res) => {
    try {
        const { estado } = req.query; 

        let pedidos;
        if (estado) {
            pedidos = await CoachingModel.obterPedidosPorEstado(estado);
        } else {
            pedidos = await CoachingModel.obterTodosPedidos();
        }

        return res.status(200).json(pedidos);

    } catch (erro) {
        console.error('Erro na listagem de pedidos de coaching:', erro);
        return res.status(500).json({ erro: 'Erro interno ao obter a listagem de pedidos.' });
    }
};

module.exports = {
    consultarVagas,
    criarPedido,
    cancelarPedido,
    listarPedidos
};
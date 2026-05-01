function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const mensagem = err.message || 'Erro interno do servidor';
    console.error(err);
    return res.status(500).json({ error: mensagem });
}

module.exports = errorHandler;

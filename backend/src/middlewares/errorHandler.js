function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const status = err.status || 500;
    const mensagem = err.message || 'Erro interno do servidor';
    console.error(err);
    return res.status(status).json({ error: mensagem });
}

module.exports = errorHandler;

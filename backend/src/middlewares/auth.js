const jwt = require('jsonwebtoken');

// Verifica se tem token válido
function autenticar(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer '))
        return res.status(401).json({ error: 'Token em falta' });

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.utilizador = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

// Verifica se tem o perfil certo
function autorizar(...perfis) {
    return (req, res, next) => {
        const perfisUtilizador = req.utilizador?.perfis || [];
        const temPermissao = perfis.some(p => perfisUtilizador.includes(p));

        if (!temPermissao)
            return res.status(403).json({ error: 'Sem permissão' });

        next();
    };
}

module.exports = { autenticar, autorizar };
// biosystem-backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu-segredo');
    req.usuario = decoded;
    next();
  } catch (erro) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const isMaster = (req, res, next) => {
  if (req.usuario.tipo !== 'master') {
    return res.status(403).json({ error: 'Acesso restrito a Master' });
  }
  next();
};

module.exports = { authenticate, isMaster };

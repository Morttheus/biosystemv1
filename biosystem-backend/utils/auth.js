// utils/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Gerar token JWT
const gerarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, tipo: usuario.tipo, clinicaId: usuario.clinica_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Verificar token
const verificarToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Middleware para autenticação
const autenticado = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const decoded = verificarToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  req.usuario = decoded;
  next();
};

// Hash de senha
const hashSenha = async (senha) => {
  return bcrypt.hash(senha, 10);
};

// Comparar senhas
const compararSenhas = async (senha, hash) => {
  return bcrypt.compare(senha, hash);
};

module.exports = { gerarToken, verificarToken, autenticado, hashSenha, compararSenhas };

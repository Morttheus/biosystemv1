// biosystem-backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Usar mock se PostgreSQL não estiver disponível
let authRoutes, usuariosRoutes, pacientesRoutes, prontuariosRoutes, filaAtendimentoRoutes;
try {
  authRoutes = require('./routes/auth');
  usuariosRoutes = require('./routes/usuarios');
  pacientesRoutes = require('./routes/pacientes');
  prontuariosRoutes = require('./routes/prontuarios');
  filaAtendimentoRoutes = require('./routes/fila-atendimento');
} catch (err) {
  console.warn('⚠️  Não conseguiu carregar rotas PostgreSQL:', err.message);
  console.log('📦 Usando Mock Backend em memória...\n');
  authRoutes = require('./routes/auth-mock');
  usuariosRoutes = require('./routes/usuarios-mock');
  pacientesRoutes = require('./routes/pacientes-mock');
  prontuariosRoutes = require('./routes/prontuarios-mock');
  filaAtendimentoRoutes = require('./routes/fila-atendimento-mock');
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend rodando' });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/prontuarios', prontuariosRoutes);
app.use('/api/fila-atendimento', filaAtendimentoRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});

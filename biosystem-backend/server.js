// biosystem-backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Usar mock se PostgreSQL não estiver disponível
let authRoutes, usuariosRoutes, pacientesRoutes, prontuariosRoutes, filaAtendimentoRoutes, clinicasRoutes;
try {
  authRoutes = require('./routes/auth');
  usuariosRoutes = require('./routes/usuarios');
  pacientesRoutes = require('./routes/pacientes');
  prontuariosRoutes = require('./routes/prontuarios');
  filaAtendimentoRoutes = require('./routes/fila-atendimento');
  clinicasRoutes = require('./routes/clinicas');
} catch (err) {
  console.warn('⚠️  Não conseguiu carregar rotas PostgreSQL:', err.message);
  console.log('📦 Usando Mock Backend em memória...\n');
  authRoutes = require('./routes/auth-mock');
  usuariosRoutes = require('./routes/usuarios-mock');
  pacientesRoutes = require('./routes/pacientes-mock');
  prontuariosRoutes = require('./routes/prontuarios-mock');
  filaAtendimentoRoutes = require('./routes/fila-atendimento-mock');
  clinicasRoutes = require('./routes/clinicas-mock');
}

const app = express();

// Middleware
app.use(express.json());

// CORS - Permitir múltiplos domínios
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  /\.vercel\.app$/,  // Qualquer app Vercel
  /\.railway\.app$/, // Qualquer app Railway
  process.env.FRONTEND_URL // Adicionar variável de ambiente se necessário
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisições sem origin (mobile, curl, etc)
    if (!origin) return callback(null, true);
    
    // Verificar se está na whitelist
    if (allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    })) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS bloqueado para: ${origin}`);
      callback(new Error('CORS não permitido para esta origem'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
app.use('/api/clinicas', clinicasRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});

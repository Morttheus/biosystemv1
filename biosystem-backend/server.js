// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./utils/db');
const { apiLimiter, authLimiter, auditLog, sanitizeInput, securityHeaders } = require('./middleware/security');

const app = express();

// Habilitar trust proxy para funcionar atrás de proxy reverso (Railway, Heroku, etc)
app.set('trust proxy', 1);

// Middleware de segurança básico
app.use(securityHeaders);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL
    ].filter(Boolean);

    // Permitir requisições sem origin (ex: Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Em produção, considere restringir mais
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de sanitização
app.use(sanitizeInput);

// Middleware de auditoria (LGPD)
app.use(auditLog);

// Rate limiter geral para API
app.use('/api', apiLimiter);

// Testar conexão com banco
pool.on('connect', () => {
  console.log('✓ Conectado ao banco de dados');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool:', err);
});

// Rota de teste (health check)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend está rodando!',
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

// Importar rotas
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const pacientesRoutes = require('./routes/pacientes');
const prontuariosRoutes = require('./routes/prontuarios');
const agendamentosRoutes = require('./routes/agendamentos');
const clinicasRoutes = require('./routes/clinicas');
const setupRoutes = require('./routes/setup');

// Aplicar rate limiter específico para autenticação
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);

// Demais rotas
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/prontuarios', prontuariosRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/clinicas', clinicasRoutes);
app.use('/api/setup', setupRoutes);

// Erro 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Backend rodando em http://localhost:${PORT}`);
  console.log(`🔒 Segurança: Rate limiting e LGPD audit habilitados`);
  console.log(`📡 CORS habilitado`);
  console.log(`\nEndpoints disponíveis:`);
  console.log(`  GET  /api/health`);
  console.log(`  POST /api/auth/login`);
  console.log(`  *    /api/usuarios`);
  console.log(`  *    /api/pacientes`);
  console.log(`  *    /api/prontuarios`);
  console.log(`  *    /api/agendamentos`);
  console.log(`  *    /api/clinicas`);
  console.log(`\n`);
});

module.exports = { app, pool };

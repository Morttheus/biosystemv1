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

// Setup Database - Endpoint para criar tabelas (use apenas uma vez)
app.get('/api/setup-db', async (req, res) => {
  try {
    const pool = require('./db/connection');

    // Criar tabelas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clinicas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        endereco VARCHAR(500),
        telefone VARCHAR(20),
        email VARCHAR(255),
        cnpj VARCHAR(18) UNIQUE,
        ativo BOOLEAN DEFAULT true,
        data_cadastro TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) NOT NULL DEFAULT 'usuario',
        clinica_id INTEGER,
        telefone VARCHAR(20),
        acesso_relatorios BOOLEAN DEFAULT false,
        ativo BOOLEAN DEFAULT true,
        data_criacao TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cpf VARCHAR(11) UNIQUE NOT NULL,
        telefone VARCHAR(20),
        clinica_id INTEGER NOT NULL,
        ativo BOOLEAN DEFAULT true,
        data_cadastro TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        crm VARCHAR(50) UNIQUE NOT NULL,
        especialidade VARCHAR(255),
        clinica_id INTEGER NOT NULL,
        ativo BOOLEAN DEFAULT true,
        data_cadastro TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS prontuarios (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER NOT NULL,
        medico_id INTEGER,
        clinica_id INTEGER NOT NULL,
        data TIMESTAMP DEFAULT NOW(),
        descricao TEXT,
        ativo BOOLEAN DEFAULT true,
        data_deletado TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
        FOREIGN KEY (medico_id) REFERENCES medicos(id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fila_atendimento (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER NOT NULL,
        paciente_nome VARCHAR(255) NOT NULL,
        medico_id INTEGER,
        medico_nome VARCHAR(255),
        clinica_id INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'aguardando',
        horario_chegada TIMESTAMP DEFAULT NOW(),
        horario_atendimento TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
      )
    `);

    // Criar índices
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_usuarios_clinica_id ON usuarios(clinica_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_pacientes_clinica_id ON pacientes(clinica_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_medicos_clinica_id ON medicos(clinica_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente_id ON prontuarios(paciente_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_prontuarios_clinica_id ON prontuarios(clinica_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_fila_clinica_id ON fila_atendimento(clinica_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_fila_status ON fila_atendimento(status)`);

    // Inserir dados iniciais
    await pool.query(`
      INSERT INTO clinicas (nome, endereco, telefone, email, ativo)
      VALUES ('Clínica Biosystem', 'Rua Principal, 123 - Centro', '(11) 3333-3333', 'contato@biosystem.com', true)
      ON CONFLICT DO NOTHING
    `);

    // Usuários de teste (senha: 123456)
    const senhaHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F.O';

    await pool.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo)
      VALUES ('Master', 'master@biosystem.com', $1, 'master', NULL, '(11) 98888-8888', true)
      ON CONFLICT (email) DO NOTHING
    `, [senhaHash]);

    await pool.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo)
      VALUES ('Administrador', 'admin@biosystem.com', $1, 'admin', 1, '(11) 97777-7777', true)
      ON CONFLICT (email) DO NOTHING
    `, [senhaHash]);

    await pool.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo)
      VALUES ('Recepcionista', 'usuario@biosystem.com', $1, 'usuario', 1, '(11) 96666-6666', true)
      ON CONFLICT (email) DO NOTHING
    `, [senhaHash]);

    await pool.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo)
      VALUES ('Dr. Carlos', 'carlos@biosystem.com', $1, 'medico', 1, '(11) 95555-5555', true)
      ON CONFLICT (email) DO NOTHING
    `, [senhaHash]);

    await pool.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo)
      VALUES ('Painel Sala Espera', 'painel@biosystem.com', $1, 'painel', 1, '(11) 94444-4444', true)
      ON CONFLICT (email) DO NOTHING
    `, [senhaHash]);

    res.json({
      success: true,
      message: 'Banco de dados configurado com sucesso!',
      tables: ['clinicas', 'usuarios', 'pacientes', 'medicos', 'prontuarios', 'fila_atendimento']
    });
  } catch (error) {
    console.error('Erro ao configurar banco:', error);
    res.status(500).json({ error: error.message });
  }
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

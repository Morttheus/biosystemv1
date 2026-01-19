-- biosystem-backend/db/init.sql
-- ============================================
-- TABELAS
-- ============================================

-- Tabela de Clínicas
CREATE TABLE IF NOT EXISTS clinicas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco VARCHAR(500),
  telefone VARCHAR(20),
  email VARCHAR(255),
  cnpj VARCHAR(18) UNIQUE,
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMP DEFAULT NOW()
);

-- Tabela de Usuários
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
);

-- Tabela de Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  clinica_id INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id)
);

-- Tabela de Médicos
CREATE TABLE IF NOT EXISTS medicos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  crm VARCHAR(50) UNIQUE NOT NULL,
  especialidade VARCHAR(255),
  clinica_id INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id)
);

-- Tabela de Procedimentos
CREATE TABLE IF NOT EXISTS procedimentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMP DEFAULT NOW()
);

-- Tabela de Vínculo Procedimentos-Clínicas (Many-to-Many)
CREATE TABLE IF NOT EXISTS procedimentos_clinica (
  procedimento_id INTEGER NOT NULL,
  clinica_id INTEGER NOT NULL,
  valor_clinica DECIMAL(10, 2),
  data_vinculo TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (procedimento_id, clinica_id),
  FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id) ON DELETE CASCADE,
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE
);

-- Tabela de Prontuários
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
  FOREIGN KEY (medico_id) REFERENCES medicos(id),
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id)
);

-- Tabela de Fila de Atendimento
CREATE TABLE IF NOT EXISTS fila_atendimento (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL,
  paciente_nome VARCHAR(255) NOT NULL,
  medico_id INTEGER,
  medico_nome VARCHAR(255),
  clinica_id INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'atendendo', 'atendido', 'cancelado')),
  horario_chegada TIMESTAMP DEFAULT NOW(),
  horario_atendimento TIMESTAMP,
  valor DECIMAL(10, 2) DEFAULT 0.00,
  procedimento_id INTEGER,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (medico_id) REFERENCES medicos(id),
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
  FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id)
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_clinica_id ON usuarios(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_clinica_id ON pacientes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_medicos_clinica_id ON medicos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente_id ON prontuarios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_clinica_id ON prontuarios(clinica_id);
CREATE INDEX IF NOT EXISTS idx_fila_clinica_id ON fila_atendimento(clinica_id);
CREATE INDEX IF NOT EXISTS idx_fila_status ON fila_atendimento(status);

-- ============================================
-- DADOS DE TESTE (OPCIONAL)
-- ============================================

-- Clínica padrão
INSERT INTO clinicas (nome, endereco, telefone, email, ativo)
VALUES ('Clínica Biosystem', 'Rua Principal, 123 - Centro', '(11) 3333-3333', 'contato@biosystem.com', true)
ON CONFLICT DO NOTHING;

-- Usuário Master
INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo)
VALUES ('Master', 'master@biosystem.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F.O', 'master', NULL, '(11) 98888-8888', true)
ON CONFLICT (email) DO NOTHING;

-- Usuário Admin
INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo)
VALUES ('Administrador', 'admin@biosystem.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F.O', 'admin', 1, '(11) 97777-7777', true)
ON CONFLICT (email) DO NOTHING;

-- Usuário Recepcionista
INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo)
VALUES ('Recepcionista', 'usuario@biosystem.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F.O', 'usuario', 1, '(11) 96666-6666', true)
ON CONFLICT (email) DO NOTHING;

-- Usuário Médico
INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo)
VALUES ('Dr. Carlos', 'carlos@biosystem.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F.O', 'medico', 1, '(11) 95555-5555', true)
ON CONFLICT (email) DO NOTHING;

-- Usuário Painel
INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo)
VALUES ('Painel Sala Espera', 'painel@biosystem.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F.O', 'painel', 1, '(11) 94444-4444', true)
ON CONFLICT (email) DO NOTHING;

-- db/init.sql
-- Script para criar todas as tabelas do BioSystem

-- Tabela de Clínicas
CREATE TABLE IF NOT EXISTS clinicas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco VARCHAR(255),
  telefone VARCHAR(20),
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('master', 'admin', 'medico', 'usuario', 'painel')),
  clinica_id INTEGER REFERENCES clinicas(id),
  medico_id INTEGER,
  ativo BOOLEAN DEFAULT true,
  acesso_relatorios BOOLEAN DEFAULT false,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Médicos
CREATE TABLE IF NOT EXISTS medicos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  crm VARCHAR(50) UNIQUE NOT NULL,
  especialidade VARCHAR(255),
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Procedimentos
CREATE TABLE IF NOT EXISTS procedimentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  valor DECIMAL(10,2) DEFAULT 0,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Procedimento-Clínicas (many-to-many)
CREATE TABLE IF NOT EXISTS procedimento_clinicas (
  id SERIAL PRIMARY KEY,
  procedimento_id INTEGER NOT NULL REFERENCES procedimentos(id) ON DELETE CASCADE,
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  UNIQUE(procedimento_id, clinica_id)
);

-- Tabela de Prontuários
CREATE TABLE IF NOT EXISTS prontuarios (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id INTEGER REFERENCES medicos(id),
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
  descricao TEXT,
  valor DECIMAL(10,2) DEFAULT 0,
  procedimento_id INTEGER REFERENCES procedimentos(id),
  ativo BOOLEAN DEFAULT true,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id INTEGER NOT NULL REFERENCES medicos(id),
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
  procedimento_id INTEGER REFERENCES procedimentos(id),
  data DATE NOT NULL,
  hora TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'concluido')),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Fila de Atendimento
CREATE TABLE IF NOT EXISTS fila_atendimento (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id INTEGER REFERENCES medicos(id),
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
  procedimento_id INTEGER REFERENCES procedimentos(id),
  valor DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'aguardando',
  horario_chegada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  horario_atendimento TIMESTAMP,
  horario_finalizacao TIMESTAMP
);

-- Tabela de Chamadas (Painel Sala de Espera)
CREATE TABLE IF NOT EXISTS chamadas (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
  sala VARCHAR(100) DEFAULT 'Consultório',
  ativa BOOLEAN DEFAULT true,
  data_chamada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_clinica ON usuarios(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_clinica ON pacientes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente ON prontuarios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_medico ON prontuarios(medico_id);
CREATE INDEX IF NOT EXISTS idx_fila_status ON fila_atendimento(status);
CREATE INDEX IF NOT EXISTS idx_fila_clinica ON fila_atendimento(clinica_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_clinica ON agendamentos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_chamadas_clinica ON chamadas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_chamadas_ativa ON chamadas(ativa);

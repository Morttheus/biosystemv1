// routes/setup.js
// ROTA TEMPORÁRIA PARA CONFIGURAÇÃO DO BANCO DE DADOS
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// Verificar estrutura do banco
router.get('/check', autenticado, async (req, res) => {
  try {
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuário master pode acessar' });
    }

    const tables = ['clinicas', 'usuarios', 'medicos', 'pacientes', 'procedimentos',
                    'procedimento_clinicas', 'prontuarios', 'agendamentos', 'fila_atendimento', 'chamadas'];

    const result = {};

    for (const table of tables) {
      try {
        const countResult = await query(`SELECT COUNT(*) as total FROM ${table}`);
        const columnsResult = await query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);

        result[table] = {
          exists: true,
          count: parseInt(countResult.rows[0].total),
          columns: columnsResult.rows.map(c => `${c.column_name} (${c.data_type})`)
        };
      } catch (err) {
        result[table] = {
          exists: false,
          error: err.message
        };
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Erro verificar banco:', err);
    res.status(500).json({ error: 'Erro no servidor', details: err.message });
  }
});

// Criar tabelas faltantes
router.post('/create-tables', autenticado, async (req, res) => {
  try {
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuário master pode acessar' });
    }

    const results = [];

    // Tabela de Procedimentos
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS procedimentos (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          valor DECIMAL(10,2) DEFAULT 0,
          descricao TEXT,
          ativo BOOLEAN DEFAULT true,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      results.push({ table: 'procedimentos', status: 'ok' });
    } catch (err) {
      results.push({ table: 'procedimentos', status: 'error', error: err.message });
    }

    // Tabela de vínculo Procedimento-Clínicas (many-to-many)
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS procedimento_clinicas (
          id SERIAL PRIMARY KEY,
          procedimento_id INTEGER NOT NULL REFERENCES procedimentos(id) ON DELETE CASCADE,
          clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
          UNIQUE(procedimento_id, clinica_id)
        )
      `);
      results.push({ table: 'procedimento_clinicas', status: 'ok' });
    } catch (err) {
      results.push({ table: 'procedimento_clinicas', status: 'error', error: err.message });
    }

    // Tabela de Agendamentos
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS agendamentos (
          id SERIAL PRIMARY KEY,
          paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
          medico_id INTEGER NOT NULL REFERENCES medicos(id),
          clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
          procedimento_id INTEGER REFERENCES procedimentos(id),
          data DATE NOT NULL,
          hora TIME NOT NULL,
          status VARCHAR(50) DEFAULT 'agendado',
          observacoes TEXT,
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      results.push({ table: 'agendamentos', status: 'ok' });
    } catch (err) {
      results.push({ table: 'agendamentos', status: 'error', error: err.message });
    }

    // Tabela de Fila de Atendimento (com colunas extras)
    try {
      await query(`
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
        )
      `);
      results.push({ table: 'fila_atendimento', status: 'ok' });
    } catch (err) {
      results.push({ table: 'fila_atendimento', status: 'error', error: err.message });
    }

    // Adicionar colunas faltantes na fila_atendimento
    try {
      await query(`ALTER TABLE fila_atendimento ADD COLUMN IF NOT EXISTS procedimento_id INTEGER REFERENCES procedimentos(id)`);
      await query(`ALTER TABLE fila_atendimento ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2) DEFAULT 0`);
      results.push({ table: 'fila_atendimento.colunas_extras', status: 'ok' });
    } catch (err) {
      results.push({ table: 'fila_atendimento.colunas_extras', status: 'error', error: err.message });
    }

    // Tornar medico_id opcional na fila_atendimento (pode não ter médico inicialmente)
    try {
      await query(`ALTER TABLE fila_atendimento ALTER COLUMN medico_id DROP NOT NULL`);
      results.push({ table: 'fila_atendimento.medico_opcional', status: 'ok' });
    } catch (err) {
      results.push({ table: 'fila_atendimento.medico_opcional', status: 'error', error: err.message });
    }

    // Tabela de Chamadas
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS chamadas (
          id SERIAL PRIMARY KEY,
          paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
          clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
          sala VARCHAR(100) DEFAULT 'Consultório',
          ativa BOOLEAN DEFAULT true,
          data_chamada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      results.push({ table: 'chamadas', status: 'ok' });
    } catch (err) {
      results.push({ table: 'chamadas', status: 'error', error: err.message });
    }

    // Adicionar coluna ativo em prontuarios se não existir
    try {
      await query(`ALTER TABLE prontuarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true`);
      results.push({ table: 'prontuarios.ativo', status: 'ok' });
    } catch (err) {
      results.push({ table: 'prontuarios.ativo', status: 'error', error: err.message });
    }

    // Adicionar colunas extras em prontuarios
    try {
      await query(`ALTER TABLE prontuarios ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2) DEFAULT 0`);
      await query(`ALTER TABLE prontuarios ADD COLUMN IF NOT EXISTS procedimento_id INTEGER REFERENCES procedimentos(id)`);
      results.push({ table: 'prontuarios.colunas_extras', status: 'ok' });
    } catch (err) {
      results.push({ table: 'prontuarios.colunas_extras', status: 'error', error: err.message });
    }

    // Adicionar coluna acesso_relatorios em usuarios se não existir
    try {
      await query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS acesso_relatorios BOOLEAN DEFAULT false`);
      results.push({ table: 'usuarios.acesso_relatorios', status: 'ok' });
    } catch (err) {
      results.push({ table: 'usuarios.acesso_relatorios', status: 'error', error: err.message });
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error('Erro criar tabelas:', err);
    res.status(500).json({ error: 'Erro no servidor', details: err.message });
  }
});

module.exports = router;

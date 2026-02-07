// routes/setup.js
// Rota para verificar e atualizar a estrutura do banco de dados
const express = require('express');
const { query, pool } = require('../utils/db');

const router = express.Router();

// Verificar estrutura das tabelas
router.get('/check', async (req, res) => {
  try {
    const tables = ['clinicas', 'usuarios', 'pacientes', 'prontuarios', 'medicos', 'procedimentos'];
    const result = {};

    for (const table of tables) {
      try {
        const columns = await query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        result[table] = columns.rows;
      } catch (err) {
        result[table] = { error: err.message };
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Erro ao verificar estrutura:', err);
    res.status(500).json({ error: err.message });
  }
});

// Adicionar colunas que faltam
router.post('/migrate', async (req, res) => {
  const migrations = [];

  try {
    // Verificar e adicionar coluna 'ativa' em clinicas
    try {
      await query(`ALTER TABLE clinicas ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT true`);
      migrations.push('clinicas.ativa adicionada');
    } catch (err) {
      migrations.push(`clinicas.ativa: ${err.message}`);
    }

    // Verificar e adicionar coluna 'atualizado_em' em clinicas
    try {
      await query(`ALTER TABLE clinicas ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      migrations.push('clinicas.atualizado_em adicionada');
    } catch (err) {
      migrations.push(`clinicas.atualizado_em: ${err.message}`);
    }

    // Verificar e adicionar coluna 'criado_em' em pacientes
    try {
      await query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      migrations.push('pacientes.criado_em adicionada');
    } catch (err) {
      migrations.push(`pacientes.criado_em: ${err.message}`);
    }

    // Verificar e adicionar coluna 'criado_em' em usuarios
    try {
      await query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      migrations.push('usuarios.criado_em adicionada');
    } catch (err) {
      migrations.push(`usuarios.criado_em: ${err.message}`);
    }

    // Verificar e adicionar coluna 'data_consulta' em prontuarios
    try {
      await query(`ALTER TABLE prontuarios ADD COLUMN IF NOT EXISTS data_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      migrations.push('prontuarios.data_consulta adicionada');
    } catch (err) {
      migrations.push(`prontuarios.data_consulta: ${err.message}`);
    }

    // Verificar e adicionar coluna 'atualizado_em' em prontuarios
    try {
      await query(`ALTER TABLE prontuarios ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      migrations.push('prontuarios.atualizado_em adicionada');
    } catch (err) {
      migrations.push(`prontuarios.atualizado_em: ${err.message}`);
    }

    // Verificar e adicionar coluna 'atualizado_em' em pacientes
    try {
      await query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      migrations.push('pacientes.atualizado_em adicionada');
    } catch (err) {
      migrations.push(`pacientes.atualizado_em: ${err.message}`);
    }

    // Verificar e adicionar coluna 'atualizado_em' em usuarios
    try {
      await query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      migrations.push('usuarios.atualizado_em adicionada');
    } catch (err) {
      migrations.push(`usuarios.atualizado_em: ${err.message}`);
    }

    res.json({ success: true, migrations });
  } catch (err) {
    console.error('Erro ao executar migrations:', err);
    res.status(500).json({ error: err.message, migrations });
  }
});

module.exports = router;

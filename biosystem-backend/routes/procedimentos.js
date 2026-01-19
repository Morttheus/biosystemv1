// biosystem-backend/routes/procedimentos.js
const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 📋 LISTAR PROCEDIMENTOS
router.get('/', authenticate, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const resultado = await pool.query(
      'SELECT id, nome, valor, descricao, ativo, data_cadastro FROM procedimentos WHERE ativo = true ORDER BY nome ASC'
    );

    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar procedimentos:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ➕ CRIAR PROCEDIMENTO
router.post('/', authenticate, async (req, res) => {
  try {
    const { nome, valor, descricao } = req.body;

    // Validações
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome do procedimento é obrigatório' });
    }

    if (valor === undefined || valor === null || isNaN(parseFloat(valor))) {
      return res.status(400).json({ error: 'Valor é obrigatório e deve ser numérico' });
    }

    const valorNumerico = parseFloat(valor);

    const resultado = await pool.query(
      `INSERT INTO procedimentos (nome, valor, descricao, ativo, data_cadastro)
       VALUES ($1, $2, $3, true, NOW())
       RETURNING id, nome, valor, descricao, ativo, data_cadastro`,
      [nome.trim(), valorNumerico, descricao || null]
    );

    res.status(201).json({
      message: 'Procedimento criado com sucesso',
      procedimento: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao criar procedimento:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🔍 OBTER PROCEDIMENTO POR ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      'SELECT id, nome, valor, descricao, ativo, data_cadastro FROM procedimentos WHERE id = $1',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao obter procedimento:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ✏️ ATUALIZAR PROCEDIMENTO
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, valor, descricao, ativo } = req.body;

    // Verifica se procedimento existe
    const procedimentoExiste = await pool.query(
      'SELECT id FROM procedimentos WHERE id = $1',
      [id]
    );
    if (procedimentoExiste.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    const campos = [];
    const valores = [];
    let paramIndex = 1;

    if (nome !== undefined) {
      campos.push(`nome = $${paramIndex}`);
      valores.push(nome.trim());
      paramIndex++;
    }

    if (valor !== undefined) {
      campos.push(`valor = $${paramIndex}`);
      valores.push(parseFloat(valor));
      paramIndex++;
    }

    if (descricao !== undefined) {
      campos.push(`descricao = $${paramIndex}`);
      valores.push(descricao);
      paramIndex++;
    }

    if (ativo !== undefined) {
      campos.push(`ativo = $${paramIndex}`);
      valores.push(ativo);
      paramIndex++;
    }

    if (campos.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    valores.push(id);

    const query = `UPDATE procedimentos SET ${campos.join(', ')} WHERE id = $${paramIndex} RETURNING id, nome, valor, descricao, ativo, data_cadastro`;

    const resultado = await pool.query(query, valores);

    res.json({
      message: 'Procedimento atualizado com sucesso',
      procedimento: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao atualizar procedimento:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🗑️ DESATIVAR PROCEDIMENTO
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      'UPDATE procedimentos SET ativo = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    res.json({ message: 'Procedimento desativado com sucesso' });
  } catch (erro) {
    console.error('Erro ao desativar procedimento:', erro);
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

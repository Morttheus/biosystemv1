// routes/procedimentos.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// LISTAR PROCEDIMENTOS
router.get('/', autenticado, async (req, res) => {
  try {
    const result = await query('SELECT * FROM procedimentos WHERE ativo = true ORDER BY nome ASC');

    const procedimentos = result.rows.map(p => ({
      id: p.id,
      nome: p.nome,
      valor: parseFloat(p.valor) || 0,
      descricao: p.descricao,
      ativo: p.ativo
    }));

    res.json(procedimentos);
  } catch (err) {
    console.error('Erro listar procedimentos:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// OBTER PROCEDIMENTO POR ID
router.get('/:id', autenticado, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM procedimentos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    const p = result.rows[0];
    res.json({
      id: p.id,
      nome: p.nome,
      valor: parseFloat(p.valor) || 0,
      descricao: p.descricao,
      ativo: p.ativo
    });
  } catch (err) {
    console.error('Erro obter procedimento:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// CRIAR PROCEDIMENTO
router.post('/', autenticado, async (req, res) => {
  try {
    // Apenas master pode criar procedimentos
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuários Master podem criar procedimentos' });
    }

    const { nome, valor, descricao } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome do procedimento é obrigatório' });
    }

    const result = await query(
      `INSERT INTO procedimentos (nome, valor, descricao, ativo)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [nome, valor || 0, descricao || '']
    );

    const p = result.rows[0];
    res.status(201).json({
      success: true,
      procedimento: {
        id: p.id,
        nome: p.nome,
        valor: parseFloat(p.valor) || 0,
        descricao: p.descricao,
        ativo: p.ativo
      }
    });
  } catch (err) {
    console.error('Erro criar procedimento:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR PROCEDIMENTO
router.put('/:id', autenticado, async (req, res) => {
  try {
    // Apenas master pode atualizar procedimentos
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuários Master podem atualizar procedimentos' });
    }

    const { id } = req.params;
    const { nome, valor, descricao, ativo } = req.body;

    const result = await query(
      `UPDATE procedimentos
       SET nome = COALESCE($1, nome),
           valor = COALESCE($2, valor),
           descricao = COALESCE($3, descricao),
           ativo = COALESCE($4, ativo)
       WHERE id = $5
       RETURNING *`,
      [nome, valor, descricao, ativo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    const p = result.rows[0];
    res.json({
      success: true,
      procedimento: {
        id: p.id,
        nome: p.nome,
        valor: parseFloat(p.valor) || 0,
        descricao: p.descricao,
        ativo: p.ativo
      }
    });
  } catch (err) {
    console.error('Erro atualizar procedimento:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// DELETAR PROCEDIMENTO (soft delete)
router.delete('/:id', autenticado, async (req, res) => {
  try {
    // Apenas master pode deletar procedimentos
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuários Master podem deletar procedimentos' });
    }

    const { id } = req.params;

    const result = await query(
      'UPDATE procedimentos SET ativo = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    res.json({ success: true, message: 'Procedimento excluído com sucesso' });
  } catch (err) {
    console.error('Erro deletar procedimento:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;

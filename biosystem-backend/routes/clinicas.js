// routes/clinicas.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// LISTAR CLÍNICAS
router.get('/', autenticado, async (req, res) => {
  try {
    const result = await query('SELECT * FROM clinicas ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro listar clínicas:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// OBTER CLÍNICA POR ID
router.get('/:id', autenticado, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM clinicas WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro obter clínica:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// CRIAR CLÍNICA
router.post('/', autenticado, async (req, res) => {
  try {
    // Apenas master pode criar clínicas
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuários Master podem criar clínicas' });
    }

    const { nome, endereco, telefone, email, cnpj } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome da clínica é obrigatório' });
    }

    const result = await query(
      `INSERT INTO clinicas (nome, endereco, telefone, email, cnpj, ativa)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [nome, endereco || '', telefone || '', email || '', cnpj || '']
    );

    res.status(201).json({ success: true, clinica: result.rows[0] });
  } catch (err) {
    console.error('Erro criar clínica:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR CLÍNICA
router.put('/:id', autenticado, async (req, res) => {
  try {
    // Apenas master pode editar clínicas
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuários Master podem editar clínicas' });
    }

    const { id } = req.params;
    const { nome, endereco, telefone, email, cnpj, ativa } = req.body;

    const result = await query(
      `UPDATE clinicas
       SET nome = COALESCE($1, nome),
           endereco = COALESCE($2, endereco),
           telefone = COALESCE($3, telefone),
           email = COALESCE($4, email),
           cnpj = COALESCE($5, cnpj),
           ativa = COALESCE($6, ativa),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [nome, endereco, telefone, email, cnpj, ativa, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica não encontrada' });
    }

    res.json({ success: true, clinica: result.rows[0] });
  } catch (err) {
    console.error('Erro atualizar clínica:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// DELETAR CLÍNICA (desativar)
router.delete('/:id', autenticado, async (req, res) => {
  try {
    // Apenas master pode excluir clínicas
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuários Master podem excluir clínicas' });
    }

    const { id } = req.params;

    const result = await query(
      'UPDATE clinicas SET ativa = false, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica não encontrada' });
    }

    res.json({ success: true, message: 'Clínica desativada com sucesso' });
  } catch (err) {
    console.error('Erro deletar clínica:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;

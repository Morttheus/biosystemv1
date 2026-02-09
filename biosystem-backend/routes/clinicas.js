// routes/clinicas.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// LISTAR CLÍNICAS
router.get('/', autenticado, async (req, res) => {
  try {
    const result = await query('SELECT * FROM clinicas WHERE ativo = true ORDER BY nome ASC');
    // Mapear para manter compatibilidade com frontend
    const clinicas = result.rows.map(c => ({
      ...c,
      ativa: c.ativo // alias para compatibilidade
    }));
    res.json(clinicas);
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

    const clinica = { ...result.rows[0], ativa: result.rows[0].ativo };
    res.json(clinica);
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

    const { nome, endereco, telefone } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome da clínica é obrigatório' });
    }

    const result = await query(
      `INSERT INTO clinicas (nome, endereco, telefone, ativo)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [nome, endereco || '', telefone || '']
    );

    const clinica = { ...result.rows[0], ativa: result.rows[0].ativo };
    res.status(201).json({ success: true, clinica });
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
    const { nome, endereco, telefone, ativa, ativo } = req.body;

    // Suporta ambos: ativa e ativo
    const valorAtivo = ativo !== undefined ? ativo : ativa;

    const result = await query(
      `UPDATE clinicas
       SET nome = COALESCE($1, nome),
           endereco = COALESCE($2, endereco),
           telefone = COALESCE($3, telefone),
           ativo = COALESCE($4, ativo)
       WHERE id = $5
       RETURNING *`,
      [nome, endereco, telefone, valorAtivo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica não encontrada' });
    }

    const clinica = { ...result.rows[0], ativa: result.rows[0].ativo };
    res.json({ success: true, clinica });
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
      'UPDATE clinicas SET ativo = false WHERE id = $1 RETURNING *',
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

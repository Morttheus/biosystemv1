// routes/procedimentos.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// LISTAR PROCEDIMENTOS (com clínicas vinculadas)
router.get('/', autenticado, async (req, res) => {
  try {
    const { clinica_id } = req.query;

    let sql;
    let params = [];

    if (clinica_id) {
      // Filtrar apenas procedimentos vinculados a esta clínica
      sql = `
        SELECT DISTINCT p.*
        FROM procedimentos p
        INNER JOIN procedimento_clinicas pc ON p.id = pc.procedimento_id
        WHERE p.ativo = true AND pc.clinica_id = $1
        ORDER BY p.nome ASC
      `;
      params = [clinica_id];
    } else {
      sql = 'SELECT * FROM procedimentos WHERE ativo = true ORDER BY nome ASC';
    }

    const result = await query(sql, params);

    // Buscar clínicas vinculadas para cada procedimento
    const procedimentos = [];
    for (const p of result.rows) {
      const clinicasResult = await query(
        'SELECT clinica_id FROM procedimento_clinicas WHERE procedimento_id = $1',
        [p.id]
      );
      procedimentos.push({
        id: p.id,
        nome: p.nome,
        valor: parseFloat(p.valor) || 0,
        descricao: p.descricao,
        ativo: p.ativo,
        clinicas: clinicasResult.rows.map(c => c.clinica_id)
      });
    }

    res.json(procedimentos);
  } catch (err) {
    console.error('Erro listar procedimentos:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// OBTER PROCEDIMENTO POR ID (com clínicas)
router.get('/:id', autenticado, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM procedimentos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    const p = result.rows[0];

    // Buscar clínicas vinculadas
    const clinicasResult = await query(
      'SELECT clinica_id FROM procedimento_clinicas WHERE procedimento_id = $1',
      [p.id]
    );

    res.json({
      id: p.id,
      nome: p.nome,
      valor: parseFloat(p.valor) || 0,
      descricao: p.descricao,
      ativo: p.ativo,
      clinicas: clinicasResult.rows.map(c => c.clinica_id)
    });
  } catch (err) {
    console.error('Erro obter procedimento:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// CRIAR PROCEDIMENTO (com vínculo a clínicas)
router.post('/', autenticado, async (req, res) => {
  try {
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuários Master podem criar procedimentos' });
    }

    const { nome, valor, descricao, clinicas } = req.body;

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

    // Vincular clínicas se informadas
    let clinicasVinculadas = [];
    if (clinicas && Array.isArray(clinicas) && clinicas.length > 0) {
      for (const clinicaItem of clinicas) {
        const clinicaId = typeof clinicaItem === 'object' ? clinicaItem.id : clinicaItem;
        await query(
          'INSERT INTO procedimento_clinicas (procedimento_id, clinica_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [p.id, clinicaId]
        );
        clinicasVinculadas.push(parseInt(clinicaId));
      }
    }

    res.status(201).json({
      success: true,
      procedimento: {
        id: p.id,
        nome: p.nome,
        valor: parseFloat(p.valor) || 0,
        descricao: p.descricao,
        ativo: p.ativo,
        clinicas: clinicasVinculadas
      }
    });
  } catch (err) {
    console.error('Erro criar procedimento:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR PROCEDIMENTO (com vínculo a clínicas)
router.put('/:id', autenticado, async (req, res) => {
  try {
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuários Master podem atualizar procedimentos' });
    }

    const { id } = req.params;
    const { nome, valor, descricao, ativo, clinicas } = req.body;

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

    // Atualizar vínculos de clínicas se informadas
    let clinicasVinculadas = [];
    if (clinicas && Array.isArray(clinicas)) {
      // Remove vínculos anteriores
      await query('DELETE FROM procedimento_clinicas WHERE procedimento_id = $1', [id]);

      // Insere novos vínculos
      for (const clinicaItem of clinicas) {
        const clinicaId = typeof clinicaItem === 'object' ? clinicaItem.id : clinicaItem;
        await query(
          'INSERT INTO procedimento_clinicas (procedimento_id, clinica_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, clinicaId]
        );
        clinicasVinculadas.push(parseInt(clinicaId));
      }
    } else {
      // Buscar clínicas atuais
      const clinicasResult = await query(
        'SELECT clinica_id FROM procedimento_clinicas WHERE procedimento_id = $1',
        [id]
      );
      clinicasVinculadas = clinicasResult.rows.map(c => c.clinica_id);
    }

    const p = result.rows[0];
    res.json({
      success: true,
      procedimento: {
        id: p.id,
        nome: p.nome,
        valor: parseFloat(p.valor) || 0,
        descricao: p.descricao,
        ativo: p.ativo,
        clinicas: clinicasVinculadas
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

    // Remover vínculos de clínicas
    await query('DELETE FROM procedimento_clinicas WHERE procedimento_id = $1', [id]);

    res.json({ success: true, message: 'Procedimento excluído com sucesso' });
  } catch (err) {
    console.error('Erro deletar procedimento:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;

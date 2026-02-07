// routes/medicos.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// LISTAR MÉDICOS
router.get('/', autenticado, async (req, res) => {
  try {
    const { clinica_id } = req.query;
    let sql = 'SELECT * FROM medicos WHERE ativo = true';
    let params = [];

    if (clinica_id) {
      sql += ' AND clinica_id = $1';
      params = [clinica_id];
    }

    const result = await query(sql + ' ORDER BY nome ASC', params);

    // Mapear para camelCase
    const medicos = result.rows.map(m => ({
      id: m.id,
      nome: m.nome,
      crm: m.crm,
      especialidade: m.especialidade,
      clinicaId: m.clinica_id,
      ativo: m.ativo
    }));

    res.json(medicos);
  } catch (err) {
    console.error('Erro listar médicos:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// OBTER MÉDICO POR ID
router.get('/:id', autenticado, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM medicos WHERE id = $1 AND ativo = true', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    const m = result.rows[0];
    res.json({
      id: m.id,
      nome: m.nome,
      crm: m.crm,
      especialidade: m.especialidade,
      clinicaId: m.clinica_id,
      ativo: m.ativo
    });
  } catch (err) {
    console.error('Erro obter médico:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// CRIAR MÉDICO
router.post('/', autenticado, async (req, res) => {
  try {
    const { nome, crm, especialidade, clinica_id, clinicaId } = req.body;

    // Suporta ambos formatos
    const finalClinicaId = clinica_id || clinicaId;

    if (!nome || !crm || !finalClinicaId) {
      return res.status(400).json({ error: 'Nome, CRM e clínica são obrigatórios' });
    }

    // Verificar se CRM já existe
    const existente = await query('SELECT id FROM medicos WHERE crm = $1', [crm]);
    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe um médico com este CRM' });
    }

    const result = await query(
      `INSERT INTO medicos (nome, crm, especialidade, clinica_id, ativo)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [nome, crm, especialidade || '', finalClinicaId]
    );

    const m = result.rows[0];
    res.status(201).json({
      success: true,
      medico: {
        id: m.id,
        nome: m.nome,
        crm: m.crm,
        especialidade: m.especialidade,
        clinicaId: m.clinica_id,
        ativo: m.ativo
      }
    });
  } catch (err) {
    console.error('Erro criar médico:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR MÉDICO
router.put('/:id', autenticado, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, crm, especialidade, clinica_id, clinicaId, ativo } = req.body;

    // Suporta ambos formatos
    const finalClinicaId = clinica_id || clinicaId;

    const result = await query(
      `UPDATE medicos
       SET nome = COALESCE($1, nome),
           crm = COALESCE($2, crm),
           especialidade = COALESCE($3, especialidade),
           clinica_id = COALESCE($4, clinica_id),
           ativo = COALESCE($5, ativo)
       WHERE id = $6
       RETURNING *`,
      [nome, crm, especialidade, finalClinicaId, ativo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    const m = result.rows[0];
    res.json({
      success: true,
      medico: {
        id: m.id,
        nome: m.nome,
        crm: m.crm,
        especialidade: m.especialidade,
        clinicaId: m.clinica_id,
        ativo: m.ativo
      }
    });
  } catch (err) {
    console.error('Erro atualizar médico:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// DELETAR MÉDICO (soft delete)
router.delete('/:id', autenticado, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE medicos SET ativo = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    res.json({ success: true, message: 'Médico excluído com sucesso' });
  } catch (err) {
    console.error('Erro deletar médico:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;

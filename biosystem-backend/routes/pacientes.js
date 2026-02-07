// routes/pacientes.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// LISTAR PACIENTES
router.get('/', autenticado, async (req, res) => {
  try {
    const { clinica_id } = req.query;
    let sql = 'SELECT * FROM pacientes WHERE ativo = true';
    let params = [];

    if (clinica_id) {
      sql += ' AND clinica_id = $1';
      params = [clinica_id];
    }

    const result = await query(sql + ' ORDER BY data_cadastro DESC', params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro listar pacientes:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// BUSCAR PACIENTE POR CPF
router.get('/cpf/:cpf', autenticado, async (req, res) => {
  try {
    const cpf = req.params.cpf.replace(/\D/g, '');
    const result = await query(
      'SELECT * FROM pacientes WHERE cpf = $1 AND ativo = true',
      [cpf]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro buscar paciente:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// CADASTRAR PACIENTE
router.post('/', autenticado, async (req, res) => {
  try {
    const { nome, cpf, telefone, clinica_id, clinicaId } = req.body;

    // Suporta ambos formatos
    const finalClinicaId = clinica_id || clinicaId;

    if (!nome || !cpf || !finalClinicaId) {
      return res.status(400).json({ error: 'Nome, CPF e clínica são obrigatórios' });
    }

    const cpfLimpo = cpf.replace(/\D/g, '');

    // Verificar se já existe
    const existente = await query('SELECT id FROM pacientes WHERE cpf = $1', [cpfLimpo]);
    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Paciente já cadastrado com este CPF' });
    }

    const result = await query(
      `INSERT INTO pacientes (nome, cpf, telefone, clinica_id, ativo)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [nome, cpfLimpo, telefone || '', finalClinicaId]
    );

    res.status(201).json({ success: true, paciente: result.rows[0] });
  } catch (err) {
    console.error('Erro cadastrar paciente:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR PACIENTE
router.put('/:id', autenticado, async (req, res) => {
  try {
    const { nome, telefone } = req.body;

    const result = await query(
      `UPDATE pacientes
       SET nome = COALESCE($1, nome),
           telefone = COALESCE($2, telefone)
       WHERE id = $3
       RETURNING *`,
      [nome, telefone, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json({ success: true, paciente: result.rows[0] });
  } catch (err) {
    console.error('Erro atualizar paciente:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// DELETAR PACIENTE (soft delete)
router.delete('/:id', autenticado, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE pacientes SET ativo = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json({ success: true, message: 'Paciente excluído com sucesso' });
  } catch (err) {
    console.error('Erro deletar paciente:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;

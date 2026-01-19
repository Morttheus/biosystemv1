// biosystem-backend/routes/medicos.js
const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 📋 LISTAR MÉDICOS
router.get('/', authenticate, async (req, res) => {
  try {
    // Garantir que dados sejam sempre atualizados em tempo real
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { clinica_id } = req.query;
    let query = 'SELECT id, nome, crm, especialidade, clinica_id, ativo, data_cadastro FROM medicos WHERE ativo = true';
    const params = [];

    if (clinica_id) {
      query += ' AND clinica_id = $1';
      params.push(clinica_id);
    }

    query += ' ORDER BY nome ASC';
    const resultado = await pool.query(query, params);

    const medicos = resultado.rows.map(m => ({
      id: m.id,
      nome: m.nome,
      crm: m.crm,
      especialidade: m.especialidade,
      clinicaId: m.clinica_id,
      ativo: m.ativo,
      dataCadastro: m.data_cadastro
    }));

    res.json(medicos);
  } catch (erro) {
    console.error('Erro ao listar médicos:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🔍 OBTER MÉDICO POR ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, crm, especialidade, clinica_id, ativo 
       FROM medicos WHERE id = $1 AND ativo = true`,
      [req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    const m = resultado.rows[0];
    res.json({
      id: m.id,
      nome: m.nome,
      crm: m.crm,
      especialidade: m.especialidade,
      clinicaId: m.clinica_id,
      ativo: m.ativo
    });
  } catch (erro) {
    console.error('Erro ao obter médico:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ➕ CRIAR MÉDICO (master ou admin da clínica)
router.post('/', authenticate, async (req, res) => {
  try {
    // Verificar permissão - master ou admin podem criar médicos
    if (req.usuario.tipo !== 'master' && req.usuario.tipo !== 'admin') {
      return res.status(403).json({ error: 'Permissão insuficiente para criar médicos' });
    }

    const { nome, crm, especialidade, clinicaId } = req.body;

    // Validações
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    if (!crm || !crm.trim()) {
      return res.status(400).json({ error: 'CRM é obrigatório' });
    }
    if (!clinicaId) {
      return res.status(400).json({ error: 'Clínica é obrigatória' });
    }

    // Verifica se clínica existe
    const clinicaExiste = await pool.query(
      'SELECT id FROM clinicas WHERE id = $1 AND ativo = true',
      [clinicaId]
    );
    if (clinicaExiste.rows.length === 0) {
      return res.status(400).json({ error: 'Clínica não encontrada ou inativa' });
    }

    // Verifica se CRM já existe
    const crmExiste = await pool.query(
      'SELECT id FROM medicos WHERE crm = $1 AND ativo = true',
      [crm.trim()]
    );

    if (crmExiste.rows.length > 0) {
      return res.status(400).json({ error: 'CRM já cadastrado' });
    }

    const resultado = await pool.query(
      `INSERT INTO medicos (nome, crm, especialidade, clinica_id, ativo, data_cadastro)
       VALUES ($1, $2, $3, $4, true, NOW())
       RETURNING id, nome, crm, especialidade, clinica_id, ativo, data_cadastro`,
      [nome.trim(), crm.trim(), especialidade || null, clinicaId]
    );

    const medico = resultado.rows[0];
    res.status(201).json({
      message: 'Médico criado com sucesso',
      medico: {
        id: medico.id,
        nome: medico.nome,
        crm: medico.crm,
        especialidade: medico.especialidade,
        clinicaId: medico.clinica_id,
        ativo: medico.ativo,
        dataCadastro: medico.data_cadastro
      }
    });
  } catch (erro) {
    console.error('Erro ao criar médico:', erro);

    if (erro.code === '23505') {
      return res.status(400).json({ error: 'CRM já está cadastrado' });
    }
    if (erro.code === '23503') {
      return res.status(400).json({ error: 'Clínica não existe' });
    }

    res.status(500).json({ error: 'Erro interno ao criar médico' });
  }
});

// ✏️ EDITAR MÉDICO (master ou admin da clínica)
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Verificar permissão - master ou admin podem editar médicos
    if (req.usuario.tipo !== 'master' && req.usuario.tipo !== 'admin') {
      return res.status(403).json({ error: 'Permissão insuficiente para editar médicos' });
    }

    const { id } = req.params;
    const { nome, crm, especialidade } = req.body;

    const resultado = await pool.query(
      `UPDATE medicos
       SET nome = COALESCE($1, nome),
           crm = COALESCE($2, crm),
           especialidade = COALESCE($3, especialidade)
       WHERE id = $4 AND ativo = true
       RETURNING id, nome, crm, especialidade, clinica_id, ativo`,
      [nome || null, crm || null, especialidade || null, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    const medico = resultado.rows[0];
    res.json({
      message: 'Médico atualizado com sucesso',
      medico: {
        id: medico.id,
        nome: medico.nome,
        crm: medico.crm,
        especialidade: medico.especialidade,
        clinicaId: medico.clinica_id,
        ativo: medico.ativo
      }
    });
  } catch (erro) {
    console.error('Erro ao editar médico:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🗑️ DELETAR MÉDICO (Soft delete - master ou admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Verificar permissão - master ou admin podem deletar médicos
    if (req.usuario.tipo !== 'master' && req.usuario.tipo !== 'admin') {
      return res.status(403).json({ error: 'Permissão insuficiente para deletar médicos' });
    }

    const { id } = req.params;

    const resultado = await pool.query(
      'UPDATE medicos SET ativo = false WHERE id = $1 AND ativo = true RETURNING id',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    res.json({ message: 'Médico desativado com sucesso' });
  } catch (erro) {
    console.error('Erro ao deletar médico:', erro);
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

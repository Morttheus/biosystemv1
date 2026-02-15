// routes/pacientes.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// Helper para mapear paciente para camelCase
const mapPaciente = (p) => ({
  id: p.id,
  nome: p.nome,
  cpf: p.cpf,
  telefone: p.telefone,
  dataNascimento: p.data_nascimento,
  numeroProntuario: p.numero_prontuario,
  clinicaId: p.clinica_id,
  ativo: p.ativo,
  dataCadastro: p.data_cadastro
});

// Gera próximo número de prontuário sequencial
const gerarNumeroProntuario = async () => {
  const result = await query(
    "SELECT numero_prontuario FROM pacientes WHERE numero_prontuario IS NOT NULL ORDER BY numero_prontuario DESC LIMIT 1"
  );
  if (result.rows.length === 0) {
    return '00001';
  }
  const ultimo = parseInt(result.rows[0].numero_prontuario) || 0;
  return String(ultimo + 1).padStart(5, '0');
};

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
    res.json(result.rows.map(mapPaciente));
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

    res.json(mapPaciente(result.rows[0]));
  } catch (err) {
    console.error('Erro buscar paciente:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// CADASTRAR PACIENTE
router.post('/', autenticado, async (req, res) => {
  try {
    const { nome, cpf, telefone, dataNascimento, data_nascimento, clinica_id, clinicaId } = req.body;

    // Suporta ambos formatos
    const finalClinicaId = clinica_id || clinicaId;
    const finalDataNascimento = dataNascimento || data_nascimento || null;

    if (!nome || !cpf || !finalClinicaId) {
      return res.status(400).json({ error: 'Nome, CPF e clínica são obrigatórios' });
    }

    const cpfLimpo = cpf.replace(/\D/g, '');

    // Verificar se já existe
    const existente = await query('SELECT id FROM pacientes WHERE cpf = $1', [cpfLimpo]);
    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Paciente já cadastrado com este CPF' });
    }

    // Gera número de prontuário único automaticamente
    const numeroProntuario = await gerarNumeroProntuario();

    const result = await query(
      `INSERT INTO pacientes (nome, cpf, telefone, data_nascimento, numero_prontuario, clinica_id, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [nome, cpfLimpo, telefone || '', finalDataNascimento, numeroProntuario, finalClinicaId]
    );

    res.status(201).json({ success: true, paciente: mapPaciente(result.rows[0]) });
  } catch (err) {
    console.error('Erro cadastrar paciente:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR PACIENTE
router.put('/:id', autenticado, async (req, res) => {
  try {
    const { nome, telefone, dataNascimento, data_nascimento } = req.body;
    const finalDataNascimento = dataNascimento || data_nascimento;

    const result = await query(
      `UPDATE pacientes
       SET nome = COALESCE($1, nome),
           telefone = COALESCE($2, telefone),
           data_nascimento = COALESCE($3, data_nascimento)
       WHERE id = $4
       RETURNING *`,
      [nome, telefone, finalDataNascimento, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json({ success: true, paciente: mapPaciente(result.rows[0]) });
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

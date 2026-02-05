// routes/pacientes.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// LISTAR PACIENTES
router.get('/', autenticado, async (req, res) => {
  try {
    const { clinica_id } = req.query;
    let sql = 'SELECT * FROM pacientes';
    let params = [];

    if (clinica_id) {
      sql += ' WHERE clinica_id = $1';
      params = [clinica_id];
    }

    const result = await query(sql + ' ORDER BY criado_em DESC', params);
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
      'SELECT * FROM pacientes WHERE cpf = $1',
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
    const { nome, cpf, email, telefone, data_nascimento, endereco, clinica_id } = req.body;

    if (!nome || !cpf || !clinica_id) {
      return res.status(400).json({ error: 'Nome, CPF e clínica são obrigatórios' });
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Verificar se já existe
    const existente = await query('SELECT id FROM pacientes WHERE cpf = $1', [cpfLimpo]);
    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Paciente já cadastrado com este CPF' });
    }

    const result = await query(
      `INSERT INTO pacientes (nome, cpf, email, telefone, data_nascimento, endereco, clinica_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nome, cpfLimpo, email, telefone, data_nascimento, endereco, clinica_id]
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
    const { nome, email, telefone, data_nascimento, endereco } = req.body;
    
    const result = await query(
      `UPDATE pacientes
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           telefone = COALESCE($3, telefone),
           data_nascimento = COALESCE($4, data_nascimento),
           endereco = COALESCE($5, endereco),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [nome, email, telefone, data_nascimento, endereco, req.params.id]
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

module.exports = router;

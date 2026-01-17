// biosystem-backend/routes/pacientes.js
const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 📋 LISTAR PACIENTES
router.get('/', authenticate, async (req, res) => {
  try {
    // Garantir que dados sejam sempre atualizados em tempo real
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { clinica_id } = req.query;
    let query = 'SELECT id, nome, cpf, telefone, clinica_id, data_cadastro FROM pacientes WHERE ativo = true';
    const params = [];

    if (clinica_id) {
      query += ' AND clinica_id = $1';
      params.push(clinica_id);
    }

    query += ' ORDER BY nome ASC';
    const resultado = await pool.query(query, params);

    const pacientes = resultado.rows.map(p => ({
      id: p.id,
      nome: p.nome,
      cpf: p.cpf,
      telefone: p.telefone,
      clinicaId: p.clinica_id,
      dataCadastro: p.data_cadastro
    }));

    res.json(pacientes);
  } catch (erro) {
    console.error('Erro ao listar pacientes:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🔍 BUSCAR PACIENTE POR CPF
router.get('/cpf/:cpf', authenticate, async (req, res) => {
  try {
    const { cpf } = req.params;
    const resultado = await pool.query(
      'SELECT id, nome, cpf, telefone, clinica_id, data_cadastro FROM pacientes WHERE cpf = $1 AND ativo = true',
      [cpf]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const p = resultado.rows[0];
    res.json({
      id: p.id,
      nome: p.nome,
      cpf: p.cpf,
      telefone: p.telefone,
      clinicaId: p.clinica_id,
      dataCadastro: p.data_cadastro
    });
  } catch (erro) {
    console.error('Erro ao buscar paciente:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ➕ CRIAR PACIENTE
router.post('/', authenticate, async (req, res) => {
  try {
    const { nome, cpf, telefone, clinicaId } = req.body;

    if (!nome || !cpf || !clinicaId) {
      return res.status(400).json({ error: 'Nome, CPF e clínica são obrigatórios' });
    }

    // Verifica se CPF já existe
    const cpfExiste = await pool.query(
      'SELECT id FROM pacientes WHERE cpf = $1 AND ativo = true',
      [cpf]
    );

    if (cpfExiste.rows.length > 0) {
      return res.status(400).json({ error: 'CPF já cadastrado' });
    }

    const resultado = await pool.query(
      `INSERT INTO pacientes (nome, cpf, telefone, clinica_id, ativo, data_cadastro)
       VALUES ($1, $2, $3, $4, true, NOW())
       RETURNING id, nome, cpf, telefone, clinica_id, data_cadastro`,
      [nome, cpf, telefone || null, clinicaId]
    );

    const paciente = resultado.rows[0];
    res.status(201).json({
      message: 'Paciente criado com sucesso',
      paciente: {
        id: paciente.id,
        nome: paciente.nome,
        cpf: paciente.cpf,
        telefone: paciente.telefone,
        clinicaId: paciente.clinica_id,
        dataCadastro: paciente.data_cadastro
      }
    });
  } catch (erro) {
    console.error('Erro ao criar paciente:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ✏️ EDITAR PACIENTE
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cpf, telefone } = req.body;

    const resultado = await pool.query(
      `UPDATE pacientes 
       SET nome = COALESCE($1, nome), cpf = COALESCE($2, cpf), telefone = COALESCE($3, telefone)
       WHERE id = $4 AND ativo = true
       RETURNING id, nome, cpf, telefone, clinica_id, data_cadastro`,
      [nome || null, cpf || null, telefone || null, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const paciente = resultado.rows[0];
    res.json({
      message: 'Paciente atualizado com sucesso',
      paciente: {
        id: paciente.id,
        nome: paciente.nome,
        cpf: paciente.cpf,
        telefone: paciente.telefone,
        clinicaId: paciente.clinica_id,
        dataCadastro: paciente.data_cadastro
      }
    });
  } catch (erro) {
    console.error('Erro ao editar paciente:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🗑️ DELETAR PACIENTE (Soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      'UPDATE pacientes SET ativo = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json({ message: 'Paciente desativado com sucesso' });
  } catch (erro) {
    console.error('Erro ao deletar paciente:', erro);
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

// biosystem-backend/routes/prontuarios.js
const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 📋 LISTAR PRONTUÁRIOS
router.get('/', authenticate, async (req, res) => {
  try {
    // Garantir que dados sejam sempre atualizados em tempo real
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { paciente_id, clinica_id } = req.query;
    let query = 'SELECT id, paciente_id, medico_id, clinica_id, data, descricao, ativo FROM prontuarios WHERE ativo = true';
    const params = [];
    let paramIndex = 1;

    if (paciente_id) {
      query += ` AND paciente_id = $${paramIndex}`;
      params.push(paciente_id);
      paramIndex++;
    }

    if (clinica_id) {
      query += ` AND clinica_id = $${paramIndex}`;
      params.push(clinica_id);
      paramIndex++;
    }

    query += ' ORDER BY data DESC';
    const resultado = await pool.query(query, params);

    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar prontuários:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ➕ CRIAR PRONTUÁRIO
router.post('/', authenticate, async (req, res) => {
  try {
    const { pacienteId, medicoId, clinicaId, descricao } = req.body;

    if (!pacienteId || !clinicaId) {
      return res.status(400).json({ error: 'Paciente e clínica são obrigatórios' });
    }

    const resultado = await pool.query(
      `INSERT INTO prontuarios (paciente_id, medico_id, clinica_id, data, descricao, ativo)
       VALUES ($1, $2, $3, NOW(), $4, true)
       RETURNING id, paciente_id, medico_id, clinica_id, data, descricao`,
      [pacienteId, medicoId || null, clinicaId, descricao || '']
    );

    const prontuario = resultado.rows[0];
    res.status(201).json({
      message: 'Prontuário criado com sucesso',
      prontuario
    });
  } catch (erro) {
    console.error('Erro ao criar prontuário:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ✏️ EDITAR PRONTUÁRIO
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao } = req.body;

    const resultado = await pool.query(
      `UPDATE prontuarios 
       SET descricao = COALESCE($1, descricao)
       WHERE id = $2 AND ativo = true
       RETURNING id, paciente_id, medico_id, clinica_id, data, descricao`,
      [descricao || null, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Prontuário não encontrado' });
    }

    res.json({
      message: 'Prontuário atualizado com sucesso',
      prontuario: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao editar prontuário:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🗑️ DELETAR PRONTUÁRIO (Soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      'UPDATE prontuarios SET ativo = false, data_deletado = NOW() WHERE id = $1 RETURNING id',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Prontuário não encontrado' });
    }

    res.json({ message: 'Prontuário deletado com sucesso' });
  } catch (erro) {
    console.error('Erro ao deletar prontuário:', erro);
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

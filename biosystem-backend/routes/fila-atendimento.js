// biosystem-backend/routes/fila-atendimento.js
const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 📋 LISTAR FILA DE ATENDIMENTO
router.get('/', authenticate, async (req, res) => {
  try {
    // Garantir que dados sejam sempre atualizados em tempo real
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { clinica_id, status } = req.query;
    let query = 'SELECT id, paciente_id, paciente_nome, medico_id, medico_nome, clinica_id, status, horario_chegada, horario_atendimento FROM fila_atendimento WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (clinica_id) {
      query += ` AND clinica_id = $${paramIndex}`;
      params.push(clinica_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY horario_chegada ASC';
    const resultado = await pool.query(query, params);

    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar fila:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ➕ ADICIONAR À FILA
router.post('/', authenticate, async (req, res) => {
  try {
    const { pacienteId, pacienteNome, clinicaId } = req.body;

    if (!pacienteId || !pacienteNome || !clinicaId) {
      return res.status(400).json({ error: 'Paciente, nome e clínica são obrigatórios' });
    }

    const resultado = await pool.query(
      `INSERT INTO fila_atendimento (paciente_id, paciente_nome, clinica_id, status, horario_chegada)
       VALUES ($1, $2, $3, 'aguardando', NOW())
       RETURNING id, paciente_id, paciente_nome, clinica_id, status, horario_chegada`,
      [pacienteId, pacienteNome, clinicaId]
    );

    res.status(201).json({
      message: 'Paciente adicionado à fila',
      filaAtendimento: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao adicionar à fila:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ✏️ ATUALIZAR STATUS
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, medicoId, medicoNome } = req.body;

    const valores = [status || null, medicoId || null, medicoNome || null, id];

    const resultado = await pool.query(
      `UPDATE fila_atendimento 
       SET status = COALESCE($1, status),
           medico_id = COALESCE($2, medico_id),
           medico_nome = COALESCE($3, medico_nome),
           horario_atendimento = CASE WHEN $1 = 'atendendo' THEN NOW() ELSE horario_atendimento END
       WHERE id = $4
       RETURNING id, paciente_id, paciente_nome, medico_id, medico_nome, clinica_id, status, horario_chegada, horario_atendimento`,
      valores
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Fila não encontrada' });
    }

    res.json({
      message: 'Fila atualizada com sucesso',
      filaAtendimento: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao atualizar fila:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🗑️ REMOVER DA FILA
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      'DELETE FROM fila_atendimento WHERE id = $1 RETURNING id',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Fila não encontrada' });
    }

    res.json({ message: 'Paciente removido da fila' });
  } catch (erro) {
    console.error('Erro ao remover da fila:', erro);
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

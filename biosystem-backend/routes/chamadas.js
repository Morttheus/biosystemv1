// routes/chamadas.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// OBTER CHAMADA ATIVA
router.get('/', autenticado, async (req, res) => {
  try {
    const { clinica_id } = req.query;
    let sql = `
      SELECT c.*, p.nome as paciente_nome
      FROM chamadas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.ativa = true
    `;
    let params = [];

    if (clinica_id) {
      sql += ' AND c.clinica_id = $1';
      params = [clinica_id];
    }

    sql += ' ORDER BY c.data_chamada DESC LIMIT 1';

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.json(null);
    }

    const c = result.rows[0];
    res.json({
      id: c.id,
      pacienteId: c.paciente_id,
      pacienteNome: c.paciente_nome,
      clinicaId: c.clinica_id,
      sala: c.sala,
      ativa: c.ativa,
      dataChamada: c.data_chamada
    });
  } catch (err) {
    console.error('Erro obter chamada ativa:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// HISTÓRICO DE CHAMADAS
router.get('/historico', autenticado, async (req, res) => {
  try {
    const { clinica_id } = req.query;
    let sql = `
      SELECT c.*, p.nome as paciente_nome
      FROM chamadas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      WHERE 1=1
    `;
    let params = [];

    if (clinica_id) {
      sql += ' AND c.clinica_id = $1';
      params = [clinica_id];
    }

    sql += ' ORDER BY c.data_chamada DESC LIMIT 50';

    const result = await query(sql, params);

    const chamadas = result.rows.map(c => ({
      id: c.id,
      pacienteId: c.paciente_id,
      pacienteNome: c.paciente_nome,
      clinicaId: c.clinica_id,
      sala: c.sala,
      ativa: c.ativa,
      dataChamada: c.data_chamada
    }));

    res.json(chamadas);
  } catch (err) {
    console.error('Erro obter histórico de chamadas:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// REGISTRAR CHAMADA
router.post('/', autenticado, async (req, res) => {
  try {
    const { paciente_id, pacienteId, clinica_id, clinicaId, sala } = req.body;

    const finalPacienteId = paciente_id || pacienteId;
    const finalClinicaId = clinica_id || clinicaId;

    if (!finalPacienteId || !finalClinicaId) {
      return res.status(400).json({ error: 'Paciente e clínica são obrigatórios' });
    }

    // Desativar chamadas anteriores da mesma clínica
    await query(
      'UPDATE chamadas SET ativa = false WHERE clinica_id = $1 AND ativa = true',
      [finalClinicaId]
    );

    const result = await query(
      `INSERT INTO chamadas (paciente_id, clinica_id, sala, ativa, data_chamada)
       VALUES ($1, $2, $3, true, NOW())
       RETURNING *`,
      [finalPacienteId, finalClinicaId, sala || 'Consultório']
    );

    const c = result.rows[0];
    res.status(201).json({
      success: true,
      chamada: {
        id: c.id,
        pacienteId: c.paciente_id,
        clinicaId: c.clinica_id,
        sala: c.sala,
        ativa: c.ativa,
        dataChamada: c.data_chamada
      }
    });
  } catch (err) {
    console.error('Erro registrar chamada:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// DESATIVAR CHAMADA
router.put('/:id/desativar', autenticado, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE chamadas SET ativa = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chamada não encontrada' });
    }

    res.json({ success: true, message: 'Chamada desativada' });
  } catch (err) {
    console.error('Erro desativar chamada:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;

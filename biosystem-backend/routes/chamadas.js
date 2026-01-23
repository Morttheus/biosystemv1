// biosystem-backend/routes/chamadas.js
const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 📋 LISTAR CHAMADAS ATIVAS (para o painel)
router.get('/', authenticate, async (req, res) => {
  try {
    // Desabilita cache para sempre ter dados em tempo real
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { clinica_id } = req.query;

    let query = `
      SELECT id, paciente_id, paciente_nome, medico_id, medico_nome, clinica_id, data_hora, ativa
      FROM chamadas
      WHERE ativa = true
    `;
    const params = [];

    if (clinica_id) {
      query += ` AND clinica_id = $1`;
      params.push(clinica_id);
    }

    // Pega apenas chamadas dos últimos 30 segundos
    query += ` AND data_hora > NOW() - INTERVAL '30 seconds'`;
    query += ` ORDER BY data_hora DESC LIMIT 1`;

    const resultado = await pool.query(query, params);

    // Mapeia para camelCase
    const chamada = resultado.rows.length > 0 ? {
      id: resultado.rows[0].id,
      pacienteId: resultado.rows[0].paciente_id,
      pacienteNome: resultado.rows[0].paciente_nome,
      medicoId: resultado.rows[0].medico_id,
      medicoNome: resultado.rows[0].medico_nome,
      clinicaId: resultado.rows[0].clinica_id,
      dataHora: resultado.rows[0].data_hora,
      ativa: resultado.rows[0].ativa
    } : null;

    res.json(chamada);
  } catch (erro) {
    console.error('Erro ao listar chamadas:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 📋 HISTÓRICO DE CHAMADAS DO DIA
router.get('/historico', authenticate, async (req, res) => {
  try {
    const { clinica_id } = req.query;

    let query = `
      SELECT id, paciente_id, paciente_nome, medico_id, medico_nome, clinica_id, data_hora, ativa
      FROM chamadas
      WHERE DATE(data_hora) = CURRENT_DATE
    `;
    const params = [];

    if (clinica_id) {
      query += ` AND clinica_id = $1`;
      params.push(clinica_id);
    }

    query += ` ORDER BY data_hora DESC`;

    const resultado = await pool.query(query, params);

    const chamadas = resultado.rows.map(c => ({
      id: c.id,
      pacienteId: c.paciente_id,
      pacienteNome: c.paciente_nome,
      medicoId: c.medico_id,
      medicoNome: c.medico_nome,
      clinicaId: c.clinica_id,
      dataHora: c.data_hora,
      ativa: c.ativa
    }));

    res.json(chamadas);
  } catch (erro) {
    console.error('Erro ao listar histórico:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ➕ REGISTRAR CHAMADA
router.post('/', authenticate, async (req, res) => {
  try {
    const { pacienteId, pacienteNome, medicoId, medicoNome, clinicaId } = req.body;

    if (!pacienteNome || !clinicaId) {
      return res.status(400).json({ error: 'Nome do paciente e clínica são obrigatórios' });
    }

    // Desativa chamadas antigas da mesma clínica
    await pool.query(
      'UPDATE chamadas SET ativa = false WHERE clinica_id = $1 AND ativa = true',
      [clinicaId]
    );

    // Registra nova chamada
    const resultado = await pool.query(
      `INSERT INTO chamadas (paciente_id, paciente_nome, medico_id, medico_nome, clinica_id, data_hora, ativa)
       VALUES ($1, $2, $3, $4, $5, NOW(), true)
       RETURNING id, paciente_id, paciente_nome, medico_id, medico_nome, clinica_id, data_hora, ativa`,
      [pacienteId || null, pacienteNome, medicoId || null, medicoNome || null, clinicaId]
    );

    const chamada = {
      id: resultado.rows[0].id,
      pacienteId: resultado.rows[0].paciente_id,
      pacienteNome: resultado.rows[0].paciente_nome,
      medicoId: resultado.rows[0].medico_id,
      medicoNome: resultado.rows[0].medico_nome,
      clinicaId: resultado.rows[0].clinica_id,
      dataHora: resultado.rows[0].data_hora,
      ativa: resultado.rows[0].ativa
    };

    console.log('📢 Nova chamada registrada:', chamada.pacienteNome, '- Clínica:', chamada.clinicaId);

    res.status(201).json({ success: true, chamada });
  } catch (erro) {
    console.error('Erro ao registrar chamada:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ❌ DESATIVAR CHAMADA
router.put('/:id/desativar', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE chamadas SET ativa = false WHERE id = $1',
      [id]
    );

    res.json({ success: true, message: 'Chamada desativada' });
  } catch (erro) {
    console.error('Erro ao desativar chamada:', erro);
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

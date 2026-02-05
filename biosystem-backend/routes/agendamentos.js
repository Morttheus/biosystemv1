// routes/agendamentos.js
const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { autenticado } = require('../utils/auth');

// Obter todos os agendamentos da clínica
router.get('/', autenticado, async (req, res) => {
  try {
    const { clinicaId } = req.usuario;
    const { data_inicio, data_fim, medico_id, status } = req.query;

    let query = `
      SELECT
        a.*,
        p.nome as paciente_nome,
        p.cpf as paciente_cpf,
        m.nome as medico_nome,
        pr.nome as procedimento_nome
      FROM agendamentos a
      LEFT JOIN pacientes p ON a.paciente_id = p.id
      LEFT JOIN medicos m ON a.medico_id = m.id
      LEFT JOIN procedimentos pr ON a.procedimento_id = pr.id
      WHERE a.clinica_id = $1
    `;
    const params = [clinicaId];
    let paramIndex = 2;

    if (data_inicio) {
      query += ` AND a.data >= $${paramIndex}`;
      params.push(data_inicio);
      paramIndex++;
    }

    if (data_fim) {
      query += ` AND a.data <= $${paramIndex}`;
      params.push(data_fim);
      paramIndex++;
    }

    if (medico_id) {
      query += ` AND a.medico_id = $${paramIndex}`;
      params.push(medico_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY a.data, a.hora';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar agendamentos:', err);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// Criar novo agendamento
router.post('/', autenticado, async (req, res) => {
  try {
    const { clinicaId } = req.usuario;
    const { paciente_id, medico_id, procedimento_id, data, hora, observacoes } = req.body;

    // Validações
    if (!paciente_id || !medico_id || !data || !hora) {
      return res.status(400).json({ error: 'Paciente, médico, data e hora são obrigatórios' });
    }

    // Verificar conflito de horário
    const conflito = await pool.query(
      `SELECT id FROM agendamentos
       WHERE clinica_id = $1 AND medico_id = $2 AND data = $3 AND hora = $4 AND status != 'cancelado'`,
      [clinicaId, medico_id, data, hora]
    );

    if (conflito.rows.length > 0) {
      return res.status(400).json({ error: 'Este horário já está ocupado para este médico' });
    }

    const result = await pool.query(
      `INSERT INTO agendamentos (clinica_id, paciente_id, medico_id, procedimento_id, data, hora, observacoes, status, criado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'agendado', NOW())
       RETURNING *`,
      [clinicaId, paciente_id, medico_id, procedimento_id || null, data, hora, observacoes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar agendamento:', err);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// Atualizar agendamento
router.put('/:id', autenticado, async (req, res) => {
  try {
    const { id } = req.params;
    const { clinicaId } = req.usuario;
    const { paciente_id, medico_id, procedimento_id, data, hora, observacoes, status } = req.body;

    // Verificar se agendamento existe e pertence à clínica
    const agendamento = await pool.query(
      'SELECT * FROM agendamentos WHERE id = $1 AND clinica_id = $2',
      [id, clinicaId]
    );

    if (agendamento.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Verificar conflito de horário (exceto o próprio agendamento)
    if (data && hora && medico_id) {
      const conflito = await pool.query(
        `SELECT id FROM agendamentos
         WHERE clinica_id = $1 AND medico_id = $2 AND data = $3 AND hora = $4 AND id != $5 AND status != 'cancelado'`,
        [clinicaId, medico_id, data, hora, id]
      );

      if (conflito.rows.length > 0) {
        return res.status(400).json({ error: 'Este horário já está ocupado para este médico' });
      }
    }

    const result = await pool.query(
      `UPDATE agendamentos SET
        paciente_id = COALESCE($1, paciente_id),
        medico_id = COALESCE($2, medico_id),
        procedimento_id = $3,
        data = COALESCE($4, data),
        hora = COALESCE($5, hora),
        observacoes = COALESCE($6, observacoes),
        status = COALESCE($7, status),
        atualizado_em = NOW()
       WHERE id = $8 AND clinica_id = $9
       RETURNING *`,
      [paciente_id, medico_id, procedimento_id, data, hora, observacoes, status, id, clinicaId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar agendamento:', err);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// Excluir agendamento
router.delete('/:id', autenticado, async (req, res) => {
  try {
    const { id } = req.params;
    const { clinicaId } = req.usuario;

    const result = await pool.query(
      'DELETE FROM agendamentos WHERE id = $1 AND clinica_id = $2 RETURNING *',
      [id, clinicaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json({ message: 'Agendamento excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir agendamento:', err);
    res.status(500).json({ error: 'Erro ao excluir agendamento' });
  }
});

// Alterar status do agendamento
router.patch('/:id/status', autenticado, async (req, res) => {
  try {
    const { id } = req.params;
    const { clinicaId } = req.usuario;
    const { status } = req.body;

    const statusValidos = ['agendado', 'confirmado', 'cancelado', 'concluido'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const result = await pool.query(
      `UPDATE agendamentos SET status = $1, atualizado_em = NOW()
       WHERE id = $2 AND clinica_id = $3
       RETURNING *`,
      [status, id, clinicaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

module.exports = router;

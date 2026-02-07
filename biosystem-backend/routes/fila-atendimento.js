// routes/fila-atendimento.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// LISTAR FILA DE ATENDIMENTO
router.get('/', autenticado, async (req, res) => {
  try {
    const { clinica_id, status } = req.query;
    let sql = `
      SELECT f.*, p.nome as paciente_nome, p.cpf as paciente_cpf, m.nome as medico_nome
      FROM fila_atendimento f
      LEFT JOIN pacientes p ON f.paciente_id = p.id
      LEFT JOIN medicos m ON f.medico_id = m.id
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;

    if (clinica_id) {
      sql += ` AND f.clinica_id = $${paramIndex}`;
      params.push(clinica_id);
      paramIndex++;
    }

    if (status) {
      sql += ` AND f.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ' ORDER BY f.horario_chegada ASC';

    const result = await query(sql, params);

    const fila = result.rows.map(f => ({
      id: f.id,
      pacienteId: f.paciente_id,
      pacienteNome: f.paciente_nome,
      pacienteCpf: f.paciente_cpf,
      medicoId: f.medico_id,
      medicoNome: f.medico_nome,
      clinicaId: f.clinica_id,
      status: f.status,
      horarioChegada: f.horario_chegada,
      horarioAtendimento: f.horario_atendimento,
      horarioFinalizacao: f.horario_finalizacao
    }));

    res.json(fila);
  } catch (err) {
    console.error('Erro listar fila:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ADICIONAR À FILA
router.post('/', autenticado, async (req, res) => {
  try {
    const { paciente_id, pacienteId, medico_id, medicoId, clinica_id, clinicaId } = req.body;

    const finalPacienteId = paciente_id || pacienteId;
    const finalMedicoId = medico_id || medicoId;
    const finalClinicaId = clinica_id || clinicaId;

    if (!finalPacienteId || !finalMedicoId || !finalClinicaId) {
      return res.status(400).json({ error: 'Paciente, médico e clínica são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO fila_atendimento (paciente_id, medico_id, clinica_id, status, horario_chegada)
       VALUES ($1, $2, $3, 'aguardando', NOW())
       RETURNING *`,
      [finalPacienteId, finalMedicoId, finalClinicaId]
    );

    const f = result.rows[0];
    res.status(201).json({
      success: true,
      filaItem: {
        id: f.id,
        pacienteId: f.paciente_id,
        medicoId: f.medico_id,
        clinicaId: f.clinica_id,
        status: f.status,
        horarioChegada: f.horario_chegada
      }
    });
  } catch (err) {
    console.error('Erro adicionar à fila:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR STATUS NA FILA
router.put('/:id', autenticado, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    let updateFields = ['status = COALESCE($1, status)'];
    let params = [status];
    let paramIndex = 2;

    // Se status é "em_atendimento", atualizar horário de atendimento
    if (status === 'em_atendimento') {
      updateFields.push(`horario_atendimento = NOW()`);
    }

    // Se status é "atendido" ou "finalizado", atualizar horário de finalização
    if (status === 'atendido' || status === 'finalizado') {
      updateFields.push(`horario_finalizacao = NOW()`);
    }

    const sql = `UPDATE fila_atendimento
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`;
    params.push(id);

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item não encontrado na fila' });
    }

    const f = result.rows[0];
    res.json({
      success: true,
      filaItem: {
        id: f.id,
        pacienteId: f.paciente_id,
        medicoId: f.medico_id,
        clinicaId: f.clinica_id,
        status: f.status,
        horarioChegada: f.horario_chegada,
        horarioAtendimento: f.horario_atendimento,
        horarioFinalizacao: f.horario_finalizacao
      }
    });
  } catch (err) {
    console.error('Erro atualizar fila:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// REMOVER DA FILA
router.delete('/:id', autenticado, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM fila_atendimento WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item não encontrado na fila' });
    }

    res.json({ success: true, message: 'Removido da fila com sucesso' });
  } catch (err) {
    console.error('Erro remover da fila:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;

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
      SELECT f.*, p.cpf as paciente_cpf, pr.nome as procedimento_nome
      FROM fila_atendimento f
      LEFT JOIN pacientes p ON f.paciente_id = p.id
      LEFT JOIN procedimentos pr ON f.procedimento_id = pr.id
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
      procedimentoId: f.procedimento_id,
      procedimentoNome: f.procedimento_nome,
      valor: parseFloat(f.valor) || 0,
      status: f.status,
      horarioChegada: f.horario_chegada,
      horarioAtendimento: f.horario_atendimento
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
    const { paciente_id, pacienteId, pacienteNome, paciente_nome,
            medico_id, medicoId, medicoNome, medico_nome,
            clinica_id, clinicaId,
            procedimento_id, procedimentoId, valor } = req.body;

    const finalPacienteId = paciente_id || pacienteId;
    const finalMedicoId = medico_id || medicoId || null;
    const finalClinicaId = clinica_id || clinicaId;
    const finalProcedimentoId = procedimento_id || procedimentoId || null;
    const finalValor = parseFloat(valor) || 0;

    if (!finalPacienteId || !finalClinicaId) {
      return res.status(400).json({ error: 'Paciente e clínica são obrigatórios' });
    }

    // Buscar nome do paciente se não foi enviado
    let finalPacienteNome = pacienteNome || paciente_nome || '';
    if (!finalPacienteNome && finalPacienteId) {
      try {
        const pacResult = await query('SELECT nome FROM pacientes WHERE id = $1', [finalPacienteId]);
        finalPacienteNome = pacResult.rows[0]?.nome || 'Paciente';
      } catch (e) { finalPacienteNome = 'Paciente'; }
    }

    // Buscar nome do médico se não foi enviado
    let finalMedicoNome = medicoNome || medico_nome || '';
    if (!finalMedicoNome && finalMedicoId) {
      try {
        const medResult = await query('SELECT nome FROM medicos WHERE id = $1', [finalMedicoId]);
        finalMedicoNome = medResult.rows[0]?.nome || '';
      } catch (e) { /* ignorar */ }
    }

    const result = await query(
      `INSERT INTO fila_atendimento (paciente_id, paciente_nome, medico_id, medico_nome, clinica_id, procedimento_id, valor, status, horario_chegada)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'aguardando', NOW())
       RETURNING *`,
      [finalPacienteId, finalPacienteNome, finalMedicoId, finalMedicoNome, finalClinicaId, finalProcedimentoId, finalValor]
    );

    const f = result.rows[0];

    const filaItem = {
      id: f.id,
      pacienteId: f.paciente_id,
      pacienteNome: f.paciente_nome,
      medicoId: f.medico_id,
      medicoNome: f.medico_nome,
      clinicaId: f.clinica_id,
      procedimentoId: f.procedimento_id,
      valor: parseFloat(f.valor) || 0,
      status: f.status,
      horarioChegada: f.horario_chegada
    };

    res.status(201).json({
      success: true,
      filaItem,
      filaAtendimento: filaItem
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
    const { status, medicoId, medico_id, medicoNome, medico_nome, valor, procedimentoId, procedimento_id } = req.body;

    let updateFields = ['status = COALESCE($1, status)'];
    let params = [status];
    let paramIndex = 2;

    const finalMedicoId = medicoId || medico_id;
    if (finalMedicoId) {
      updateFields.push(`medico_id = $${paramIndex}`);
      params.push(finalMedicoId);
      paramIndex++;

      // Atualizar nome do médico também
      const finalMedicoNome = medicoNome || medico_nome;
      if (finalMedicoNome) {
        updateFields.push(`medico_nome = $${paramIndex}`);
        params.push(finalMedicoNome);
        paramIndex++;
      }
    }

    // Atualizar valor se fornecido
    if (valor !== undefined && valor !== null) {
      updateFields.push(`valor = $${paramIndex}`);
      params.push(parseFloat(valor) || 0);
      paramIndex++;
    }

    // Atualizar procedimento se fornecido
    const finalProcedimentoId = procedimentoId || procedimento_id;
    if (finalProcedimentoId) {
      updateFields.push(`procedimento_id = $${paramIndex}`);
      params.push(finalProcedimentoId);
      paramIndex++;
    }

    if (status === 'em_atendimento' || status === 'atendendo') {
      updateFields.push(`horario_atendimento = NOW()`);
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

    const filaItem = {
      id: f.id,
      pacienteId: f.paciente_id,
      pacienteNome: f.paciente_nome,
      medicoId: f.medico_id,
      medicoNome: f.medico_nome,
      clinicaId: f.clinica_id,
      procedimentoId: f.procedimento_id,
      valor: parseFloat(f.valor) || 0,
      status: f.status,
      horarioChegada: f.horario_chegada,
      horarioAtendimento: f.horario_atendimento
    };

    res.json({
      success: true,
      filaItem,
      filaAtendimento: filaItem
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

// routes/prontuarios.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// Helper para mapear prontuário para camelCase
const mapProntuario = (p) => ({
  id: p.id,
  pacienteId: p.paciente_id,
  medicoId: p.medico_id,
  clinicaId: p.clinica_id,
  queixaPrincipal: p.queixa_principal,
  diagnostico: p.diagnostico,
  prescricao: p.prescricao,
  observacoes: p.observacoes,
  descricao: p.descricao,
  dataConsulta: p.data_consulta,
  atualizadoEm: p.atualizado_em
});

// LISTAR PRONTUÁRIOS
router.get('/', autenticado, async (req, res) => {
  try {
    const { paciente_id, pacienteId, clinica_id, clinicaId } = req.query;
    let sql = 'SELECT * FROM prontuarios';
    let params = [];
    let conditions = [];

    // Suporta ambos formatos
    const finalPacienteId = paciente_id || pacienteId;
    const finalClinicaId = clinica_id || clinicaId;

    // Se não é master, forçar filtro por clínica do usuário
    if (req.usuario.tipo !== 'master') {
      conditions.push(`clinica_id = $${conditions.length + 1}`);
      params.push(req.usuario.clinica_id);
    } else if (finalClinicaId) {
      conditions.push(`clinica_id = $${conditions.length + 1}`);
      params.push(finalClinicaId);
    }

    if (finalPacienteId) {
      conditions.push(`paciente_id = $${conditions.length + 1}`);
      params.push(finalPacienteId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await query(sql + ' ORDER BY data_consulta DESC', params);

    // Mapear para camelCase
    const prontuarios = result.rows.map(mapProntuario);
    res.json(prontuarios);
  } catch (err) {
    console.error('Erro listar prontuários:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// CRIAR PRONTUÁRIO
router.post('/', autenticado, async (req, res) => {
  try {
    // Suporta ambos formatos
    const pacienteId = req.body.paciente_id || req.body.pacienteId;
    const medicoId = req.body.medico_id || req.body.medicoId;
    const clinicaId = req.body.clinica_id || req.body.clinicaId;
    const { queixa_principal, queixaPrincipal, diagnostico, prescricao, observacoes, descricao } = req.body;

    if (!pacienteId || !medicoId || !clinicaId) {
      return res.status(400).json({ error: 'Paciente, médico e clínica são obrigatórios' });
    }

    // Verificar permissão: não-master só pode criar na sua clínica
    if (req.usuario.tipo !== 'master' && parseInt(clinicaId) !== req.usuario.clinica_id) {
      return res.status(403).json({ error: 'Permissão negada para criar prontuário em outra clínica' });
    }

    const finalQueixaPrincipal = queixa_principal || queixaPrincipal || '';

    const result = await query(
      `INSERT INTO prontuarios (paciente_id, medico_id, clinica_id, queixa_principal, diagnostico, prescricao, observacoes, descricao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [pacienteId, medicoId, clinicaId, finalQueixaPrincipal, diagnostico || '', prescricao || '', observacoes || '', descricao || '']
    );

    res.status(201).json({ success: true, prontuario: mapProntuario(result.rows[0]) });
  } catch (err) {
    console.error('Erro criar prontuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR PRONTUÁRIO
router.put('/:id', autenticado, async (req, res) => {
  try {
    const prontuarioId = parseInt(req.params.id);

    // Verificar se prontuário existe e se usuário tem permissão
    const checkPront = await query('SELECT clinica_id, medico_id FROM prontuarios WHERE id = $1', [prontuarioId]);
    if (checkPront.rows.length === 0) {
      return res.status(404).json({ error: 'Prontuário não encontrado' });
    }

    // Verificar permissão: master pode editar qualquer um, outros só da sua clínica
    if (req.usuario.tipo !== 'master' && checkPront.rows[0].clinica_id !== req.usuario.clinica_id) {
      return res.status(403).json({ error: 'Permissão negada' });
    }

    const { queixa_principal, queixaPrincipal, diagnostico, prescricao, observacoes, descricao } = req.body;
    const finalQueixaPrincipal = queixa_principal || queixaPrincipal;

    const result = await query(
      `UPDATE prontuarios
       SET queixa_principal = COALESCE($1, queixa_principal),
           diagnostico = COALESCE($2, diagnostico),
           prescricao = COALESCE($3, prescricao),
           observacoes = COALESCE($4, observacoes),
           descricao = COALESCE($5, descricao),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [finalQueixaPrincipal, diagnostico, prescricao, observacoes, descricao, prontuarioId]
    );

    res.json({ success: true, prontuario: mapProntuario(result.rows[0]) });
  } catch (err) {
    console.error('Erro atualizar prontuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// DELETAR PRONTUÁRIO
router.delete('/:id', autenticado, async (req, res) => {
  try {
    const prontuarioId = parseInt(req.params.id);

    // Apenas master pode deletar prontuários
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuários Master podem deletar prontuários' });
    }

    const result = await query('DELETE FROM prontuarios WHERE id = $1 RETURNING id', [prontuarioId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prontuário não encontrado' });
    }

    res.json({ success: true, message: 'Prontuário deletado' });
  } catch (err) {
    console.error('Erro deletar prontuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;

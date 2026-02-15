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
  descricao: p.descricao,
  valor: p.valor,
  procedimentoId: p.procedimento_id,
  dataConsulta: p.data,
  data: p.data,
  ativo: p.ativo
});

// LISTAR PRONTUÁRIOS
router.get('/', autenticado, async (req, res) => {
  try {
    const { paciente_id, pacienteId, clinica_id, clinicaId } = req.query;
    let sql = 'SELECT * FROM prontuarios WHERE ativo = true';
    let params = [];
    let paramIndex = 1;

    // Suporta ambos formatos
    const finalPacienteId = paciente_id || pacienteId;
    const finalClinicaId = clinica_id || clinicaId;

    // Se não é master, forçar filtro por clínica do usuário
    if (req.usuario.tipo !== 'master') {
      sql += ` AND clinica_id = $${paramIndex}`;
      params.push(req.usuario.clinicaId);
      paramIndex++;
    } else if (finalClinicaId) {
      sql += ` AND clinica_id = $${paramIndex}`;
      params.push(finalClinicaId);
      paramIndex++;
    }

    if (finalPacienteId) {
      sql += ` AND paciente_id = $${paramIndex}`;
      params.push(finalPacienteId);
      paramIndex++;
    }

    const result = await query(sql + ' ORDER BY data DESC', params);

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
    const procedimentoId = req.body.procedimento_id || req.body.procedimentoId || null;
    const valor = req.body.valor || 0;
    const { descricao } = req.body;

    if (!pacienteId || !clinicaId) {
      return res.status(400).json({ error: 'Paciente e clínica são obrigatórios' });
    }

    // Verificar permissão: não-master só pode criar na sua clínica (usa == para string/number)
    // eslint-disable-next-line eqeqeq
    if (req.usuario.tipo !== 'master' && clinicaId != req.usuario.clinicaId) {
      return res.status(403).json({ error: 'Permissão negada para criar prontuário em outra clínica' });
    }

    const result = await query(
      `INSERT INTO prontuarios (paciente_id, medico_id, clinica_id, descricao, valor, procedimento_id, ativo, data)
       VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP)
       RETURNING *`,
      [pacienteId, medicoId, clinicaId, descricao || '', valor, procedimentoId]
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
    // eslint-disable-next-line eqeqeq
    if (req.usuario.tipo !== 'master' && checkPront.rows[0].clinica_id != req.usuario.clinicaId) {
      return res.status(403).json({ error: 'Permissão negada' });
    }

    const { descricao, valor } = req.body;

    const result = await query(
      `UPDATE prontuarios
       SET descricao = COALESCE($1, descricao),
           valor = COALESCE($2, valor)
       WHERE id = $3
       RETURNING *`,
      [descricao, valor, prontuarioId]
    );

    res.json({ success: true, prontuario: mapProntuario(result.rows[0]) });
  } catch (err) {
    console.error('Erro atualizar prontuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// DELETAR PRONTUÁRIO (soft delete)
router.delete('/:id', autenticado, async (req, res) => {
  try {
    const prontuarioId = parseInt(req.params.id);

    // Apenas master pode deletar prontuários
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuários Master podem deletar prontuários' });
    }

    const result = await query(
      'UPDATE prontuarios SET ativo = false WHERE id = $1 RETURNING id',
      [prontuarioId]
    );

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

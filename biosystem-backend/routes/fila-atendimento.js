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
    let query = 'SELECT id, paciente_id, paciente_nome, medico_id, medico_nome, clinica_id, status, horario_chegada, horario_atendimento, valor, procedimento_id FROM fila_atendimento WHERE 1=1';
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
    const { pacienteId, pacienteNome, clinicaId, medicoId, medicoNome, valor, procedimentoId } = req.body;

    // Validações
    if (!pacienteId) {
      return res.status(400).json({ error: 'ID do paciente é obrigatório' });
    }
    if (!pacienteNome || !pacienteNome.trim()) {
      return res.status(400).json({ error: 'Nome do paciente é obrigatório' });
    }
    if (!clinicaId) {
      return res.status(400).json({ error: 'ID da clínica é obrigatório' });
    }

    // Verifica se paciente existe
    const pacienteExiste = await pool.query(
      'SELECT id FROM pacientes WHERE id = $1 AND ativo = true',
      [pacienteId]
    );
    if (pacienteExiste.rows.length === 0) {
      return res.status(400).json({ error: 'Paciente não encontrado ou inativo' });
    }

    // Verifica se clínica existe
    const clinicaExiste = await pool.query(
      'SELECT id FROM clinicas WHERE id = $1 AND ativo = true',
      [clinicaId]
    );
    if (clinicaExiste.rows.length === 0) {
      return res.status(400).json({ error: 'Clínica não encontrada ou inativa' });
    }

    // Verifica se paciente já está na fila (aguardando ou atendendo)
    const jaEmFila = await pool.query(
      `SELECT id FROM fila_atendimento
       WHERE paciente_id = $1 AND clinica_id = $2 AND status IN ('aguardando', 'atendendo')`,
      [pacienteId, clinicaId]
    );
    if (jaEmFila.rows.length > 0) {
      return res.status(400).json({ error: 'Paciente já está na fila de atendimento' });
    }

    const resultado = await pool.query(
      `INSERT INTO fila_atendimento (paciente_id, paciente_nome, medico_id, medico_nome, clinica_id, status, horario_chegada, valor, procedimento_id)
       VALUES ($1, $2, $3, $4, $5, 'aguardando', NOW(), $6, $7)
       RETURNING id, paciente_id, paciente_nome, medico_id, medico_nome, clinica_id, status, horario_chegada, valor, procedimento_id`,
      [pacienteId, pacienteNome.trim(), medicoId || null, medicoNome || null, clinicaId, valor || 0, procedimentoId || null]
    );

    res.status(201).json({
      message: 'Paciente adicionado à fila',
      filaAtendimento: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao adicionar à fila:', erro);

    if (erro.code === '23503') {
      return res.status(400).json({ error: 'Paciente ou clínica não existe' });
    }

    res.status(500).json({ error: 'Erro interno ao adicionar à fila' });
  }
});

// ✏️ ATUALIZAR STATUS
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, medicoId, medicoNome, valor, procedimentoId } = req.body;

    // Validação de status
    const statusValidos = ['aguardando', 'atendendo', 'atendido', 'cancelado'];
    if (status && !statusValidos.includes(status)) {
      return res.status(400).json({
        error: `Status inválido. Valores permitidos: ${statusValidos.join(', ')}`
      });
    }

    // Verifica se registro existe
    const registroExiste = await pool.query(
      'SELECT id, status FROM fila_atendimento WHERE id = $1',
      [id]
    );
    if (registroExiste.rows.length === 0) {
      return res.status(404).json({ error: 'Registro de fila não encontrado' });
    }

    const valores = [status || null, medicoId || null, medicoNome || null, valor !== undefined ? valor : null, procedimentoId || null, id];

    const resultado = await pool.query(
      `UPDATE fila_atendimento
       SET status = COALESCE($1, status),
           medico_id = COALESCE($2, medico_id),
           medico_nome = COALESCE($3, medico_nome),
           valor = COALESCE($4, valor),
           procedimento_id = COALESCE($5, procedimento_id),
           horario_atendimento = CASE
             WHEN $1 = 'atendendo' THEN COALESCE(horario_atendimento, NOW())
             WHEN $1 = 'atendido' THEN NOW()
             ELSE horario_atendimento
           END
       WHERE id = $6
       RETURNING id, paciente_id, paciente_nome, medico_id, medico_nome, clinica_id, status, horario_chegada, horario_atendimento, valor, procedimento_id`,
      valores
    );

    res.json({
      message: 'Fila atualizada com sucesso',
      filaAtendimento: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao atualizar fila:', erro);
    res.status(500).json({ error: 'Erro interno ao atualizar fila' });
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

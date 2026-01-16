// biosystem-backend/routes/prontuarios-mock.js
const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const prontuarios = [];

// 📋 LISTAR PRONTUÁRIOS
router.get('/', authenticate, async (req, res) => {
  try {
    res.json(prontuarios);
  } catch (erro) {
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

    const prontuario = {
      id: prontuarios.length + 1,
      pacienteId,
      medicoId: medicoId || null,
      clinicaId,
      data: new Date(),
      descricao: descricao || '',
      ativo: true
    };

    prontuarios.push(prontuario);

    res.status(201).json({
      message: 'Prontuário criado com sucesso',
      prontuario
    });
  } catch (erro) {
    res.status(500).json({ error: erro.message });
  }
});

// ✏️ EDITAR PRONTUÁRIO
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao } = req.body;

    const prontuario = prontuarios.find(p => p.id === parseInt(id) && p.ativo);

    if (!prontuario) {
      return res.status(404).json({ error: 'Prontuário não encontrado' });
    }

    if (descricao) prontuario.descricao = descricao;

    res.json({
      message: 'Prontuário atualizado com sucesso',
      prontuario
    });
  } catch (erro) {
    res.status(500).json({ error: erro.message });
  }
});

// 🗑️ DELETAR PRONTUÁRIO
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prontuario = prontuarios.find(p => p.id === parseInt(id));

    if (!prontuario) {
      return res.status(404).json({ error: 'Prontuário não encontrado' });
    }

    prontuario.ativo = false;

    res.json({ message: 'Prontuário deletado com sucesso' });
  } catch (erro) {
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

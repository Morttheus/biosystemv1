// biosystem-backend/routes/fila-atendimento-mock.js
const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const fila = [];

// 📋 LISTAR FILA
router.get('/', authenticate, async (req, res) => {
  try {
    res.json(fila);
  } catch (erro) {
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

    const item = {
      id: fila.length + 1,
      pacienteId,
      pacienteNome,
      medicoId: null,
      medicoNome: null,
      clinicaId,
      status: 'aguardando',
      horarioChegada: new Date()
    };

    fila.push(item);

    res.status(201).json({
      message: 'Paciente adicionado à fila',
      filaAtendimento: item
    });
  } catch (erro) {
    res.status(500).json({ error: erro.message });
  }
});

// ✏️ ATUALIZAR STATUS
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, medicoId, medicoNome } = req.body;

    const item = fila.find(f => f.id === parseInt(id));

    if (!item) {
      return res.status(404).json({ error: 'Fila não encontrada' });
    }

    if (status) item.status = status;
    if (medicoId) item.medicoId = medicoId;
    if (medicoNome) item.medicoNome = medicoNome;
    if (status === 'atendendo') item.horarioAtendimento = new Date();

    res.json({
      message: 'Fila atualizada com sucesso',
      filaAtendimento: item
    });
  } catch (erro) {
    res.status(500).json({ error: erro.message });
  }
});

// 🗑️ REMOVER DA FILA
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const idx = fila.findIndex(f => f.id === parseInt(id));

    if (idx === -1) {
      return res.status(404).json({ error: 'Fila não encontrada' });
    }

    fila.splice(idx, 1);

    res.json({ message: 'Paciente removido da fila' });
  } catch (erro) {
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

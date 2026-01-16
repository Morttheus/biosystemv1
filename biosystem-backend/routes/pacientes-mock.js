// biosystem-backend/routes/pacientes-mock.js
const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Dados em memória
const pacientes = [];

// 📋 LISTAR PACIENTES
router.get('/', authenticate, async (req, res) => {
  try {
    res.json(pacientes);
  } catch (erro) {
    res.status(500).json({ error: erro.message });
  }
});

// 🔍 BUSCAR PACIENTE POR CPF
router.get('/cpf/:cpf', authenticate, async (req, res) => {
  try {
    const { cpf } = req.params;
    const paciente = pacientes.find(p => p.cpf === cpf && p.ativo);

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json(paciente);
  } catch (erro) {
    res.status(500).json({ error: erro.message });
  }
});

// ➕ CRIAR PACIENTE
router.post('/', authenticate, async (req, res) => {
  try {
    const { nome, cpf, telefone, clinicaId } = req.body;

    if (!nome || !cpf || !clinicaId) {
      return res.status(400).json({ error: 'Nome, CPF e clínica são obrigatórios' });
    }

    const cpfExiste = pacientes.find(p => p.cpf === cpf && p.ativo);
    if (cpfExiste) {
      return res.status(400).json({ error: 'CPF já cadastrado' });
    }

    const paciente = {
      id: pacientes.length + 1,
      nome,
      cpf,
      telefone: telefone || null,
      clinicaId,
      ativo: true,
      dataCadastro: new Date()
    };

    pacientes.push(paciente);

    res.status(201).json({
      message: 'Paciente criado com sucesso',
      paciente
    });
  } catch (erro) {
    res.status(500).json({ error: erro.message });
  }
});

// ✏️ EDITAR PACIENTE
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cpf, telefone } = req.body;

    const paciente = pacientes.find(p => p.id === parseInt(id) && p.ativo);

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    if (nome) paciente.nome = nome;
    if (cpf) paciente.cpf = cpf;
    if (telefone) paciente.telefone = telefone;

    res.json({
      message: 'Paciente atualizado com sucesso',
      paciente
    });
  } catch (erro) {
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

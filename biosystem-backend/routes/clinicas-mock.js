// biosystem-backend/routes/clinicas-mock.js
const express = require('express');

const router = express.Router();

// Dados em memória
let clinicas = [
  {
    id: 1,
    nome: 'Clínica Biosystem',
    endereco: 'Rua Principal, 123 - Centro',
    telefone: '(11) 3333-3333',
    email: 'contato@biosystem.com',
    cnpj: null,
    ativo: true,
    data_cadastro: new Date().toISOString()
  }
];

let nextId = 2;

// 📋 LISTAR CLÍNICAS
router.get('/', (req, res) => {
  const ativas = clinicas.filter(c => c.ativo);
  res.json(ativas);
});

// 🔍 OBTER CLÍNICA POR ID
router.get('/:id', (req, res) => {
  const clinica = clinicas.find(c => c.id === parseInt(req.params.id) && c.ativo);
  if (!clinica) {
    return res.status(404).json({ error: 'Clínica não encontrada' });
  }
  res.json(clinica);
});

// ➕ CRIAR CLÍNICA
router.post('/', (req, res) => {
  const { nome, endereco, telefone, email, cnpj } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const novaClinica = {
    id: nextId++,
    nome,
    endereco: endereco || null,
    telefone: telefone || null,
    email: email || null,
    cnpj: cnpj || null,
    ativo: true,
    data_cadastro: new Date().toISOString()
  };

  clinicas.push(novaClinica);

  res.status(201).json({
    message: 'Clínica criada com sucesso',
    clinica: novaClinica
  });
});

// ✏️ EDITAR CLÍNICA
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nome, endereco, telefone, email, cnpj } = req.body;

  const index = clinicas.findIndex(c => c.id === parseInt(id) && c.ativo);
  if (index === -1) {
    return res.status(404).json({ error: 'Clínica não encontrada' });
  }

  clinicas[index] = {
    ...clinicas[index],
    nome: nome || clinicas[index].nome,
    endereco: endereco !== undefined ? endereco : clinicas[index].endereco,
    telefone: telefone !== undefined ? telefone : clinicas[index].telefone,
    email: email !== undefined ? email : clinicas[index].email,
    cnpj: cnpj !== undefined ? cnpj : clinicas[index].cnpj
  };

  res.json({
    message: 'Clínica atualizada com sucesso',
    clinica: clinicas[index]
  });
});

// 🗑️ DELETAR CLÍNICA (Soft delete)
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const index = clinicas.findIndex(c => c.id === parseInt(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Clínica não encontrada' });
  }

  clinicas[index].ativo = false;
  res.json({ message: 'Clínica desativada com sucesso' });
});

module.exports = router;

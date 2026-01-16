// biosystem-backend/routes/usuarios-mock.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, isMaster } = require('../middleware/auth');
const authMock = require('./auth-mock');

const router = express.Router();

// 📋 LISTAR USUÁRIOS
router.get('/', authenticate, async (req, res) => {
  try {
    const usuarios = authMock.getUsuarios();
    
    const usuariosList = usuarios.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      tipo: u.tipo,
      clinicaId: u.clinica_id,
      telefone: u.telefone,
      ativo: u.ativo
    }));

    res.json(usuariosList);
  } catch (erro) {
    console.error('Erro ao listar usuários:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🔍 OBTER USUÁRIO POR ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const usuarios = authMock.getUsuarios();
    const usuario = usuarios.find(u => u.id === parseInt(req.params.id));

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      clinicaId: usuario.clinica_id,
      telefone: usuario.telefone
    });
  } catch (erro) {
    console.error('Erro ao obter usuário:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ✏️ EDITAR USUÁRIO
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, tipo, clinicaId, acessoRelatorios, telefone } = req.body;

    const usuarios = authMock.getUsuarios();
    const usuario = usuarios.find(u => u.id === parseInt(id));

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // ⚠️ RESTRIÇÃO: Apenas MASTER pode alterar telefone
    if (telefone && telefone !== usuario.telefone) {
      if (req.usuario.tipo !== 'master') {
        return res.status(403).json({ 
          error: 'Apenas Master pode alterar o telefone do usuário. Contate o administrador.' 
        });
      }
    }

    // Atualiza campos
    if (nome) usuario.nome = nome;
    if (email) usuario.email = email;
    if (senha) usuario.senha = bcrypt.hashSync(senha, 10);
    if (tipo) usuario.tipo = tipo;
    if (clinicaId !== undefined) usuario.clinica_id = clinicaId;
    if (telefone) usuario.telefone = telefone;
    if (acessoRelatorios !== undefined) usuario.acesso_relatorios = acessoRelatorios;

    res.json({
      message: 'Usuário atualizado com sucesso',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        clinicaId: usuario.clinica_id,
        telefone: usuario.telefone
      }
    });
  } catch (erro) {
    console.error('Erro ao editar usuário:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🗑️ DELETAR USUÁRIO (Soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Impede auto-deleção
    if (req.usuario.id === parseInt(id)) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
    }

    const usuarios = authMock.getUsuarios();
    const usuario = usuarios.find(u => u.id === parseInt(id));

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Soft delete
    usuario.ativo = false;

    res.json({ message: 'Usuário desativado com sucesso' });
  } catch (erro) {
    console.error('Erro ao deletar usuário:', erro);
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

// biosystem-backend/routes/auth-mock.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate, isMaster } = require('../middleware/auth');

const router = express.Router();

// Dados em memória (mock)
const usuarios = [
  {
    id: 1,
    nome: 'Master',
    email: 'master@biosystem.com',
    senha: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F.O', // senha: 123456
    tipo: 'master',
    clinica_id: null,
    telefone: '(11) 98888-8888',
    ativo: true
  },
  {
    id: 2,
    nome: 'Administrador',
    email: 'admin@biosystem.com',
    senha: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F.O', // 123456
    tipo: 'admin',
    clinica_id: 1,
    telefone: '(11) 97777-7777',
    ativo: true
  },
  {
    id: 3,
    nome: 'Recepcionista',
    email: 'usuario@biosystem.com',
    senha: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F.O', // 123456
    tipo: 'usuario',
    clinica_id: 1,
    telefone: '(11) 96666-6666',
    ativo: true
  },
  {
    id: 4,
    nome: 'Dr. Carlos',
    email: 'carlos@biosystem.com',
    senha: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F.O', // 123456
    tipo: 'medico',
    clinica_id: 1,
    telefone: '(11) 95555-5555',
    ativo: true
  },
  {
    id: 5,
    nome: 'Painel Sala Espera',
    email: 'painel@biosystem.com',
    senha: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F.O', // 123456
    tipo: 'painel',
    clinica_id: 1,
    telefone: '(11) 94444-4444',
    ativo: true
  }
];

// 📝 REGISTRAR NOVO USUÁRIO (Master)
router.post('/registrar', async (req, res) => {
  try {
    const { nome, email, senha, tipo, clinicaId, telefone } = req.body;

    if (!nome || !email || !senha || !telefone) {
      return res.status(400).json({ error: 'Nome, email, senha e telefone são obrigatórios' });
    }

    // Verifica se email já existe
    const emailExiste = usuarios.find(u => u.email === email);
    if (emailExiste) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Cria novo usuário
    const novoUsuario = {
      id: usuarios.length + 1,
      nome,
      email,
      senha: senhaHash,
      tipo: tipo || 'usuario',
      clinica_id: clinicaId || null,
      telefone,
      ativo: true
    };

    usuarios.push(novoUsuario);

    // Gera JWT
    const token = jwt.sign(
      { id: novoUsuario.id, email: novoUsuario.email, tipo: novoUsuario.tipo },
      process.env.JWT_SECRET || 'seu-segredo',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Usuário registrado com sucesso',
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        tipo: novoUsuario.tipo,
        clinicaId: novoUsuario.clinica_id,
        telefone: novoUsuario.telefone
      },
      token
    });
  } catch (erro) {
    console.error('Erro ao registrar:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🔐 LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Busca usuário
    const usuario = usuarios.find(u => u.email === email && u.ativo === true);

    if (!usuario) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Verifica senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Gera JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
      process.env.JWT_SECRET || 'seu-segredo',
      { expiresIn: '7d' }
    );

    console.log(`✅ Login bem-sucedido: ${usuario.email} (${usuario.tipo})`);

    res.json({
      message: 'Login realizado com sucesso',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        clinicaId: usuario.clinica_id,
        telefone: usuario.telefone
      },
      token
    });
  } catch (erro) {
    console.error('Erro ao fazer login:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ✅ VERIFICAR TOKEN
router.get('/me', authenticate, async (req, res) => {
  try {
    const usuario = usuarios.find(u => u.id === req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
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
    console.error('Erro ao verificar token:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🔑 ESQUECI A SENHA
router.post('/forgot-password', async (req, res) => {
  try {
    const { contact } = req.body; // email ou telefone

    if (!contact) {
      return res.status(400).json({ error: 'Email ou telefone é obrigatório' });
    }

    // Busca usuário por email ou telefone
    const usuario = usuarios.find(u => 
      (u.email === contact || u.telefone === contact) && u.ativo === true
    );

    if (!usuario) {
      // Segurança: não revela se usuário existe
      return res.json({
        message: 'Se o email/telefone existe, uma nova senha foi enviada para o contato cadastrado.'
      });
    }

    // Gera senha temporária (8 caracteres)
    const novaSenh = Math.random().toString(36).slice(-8).toUpperCase();
    const senhaHash = await bcrypt.hash(novaSenh, 10);

    // Atualiza senha
    usuario.senha = senhaHash;

    console.log(`\n📧 Nova senha para ${usuario.email}: ${novaSenh}\n`);

    res.json({
      message: `Nova senha enviada para ${usuario.email}. Verifique seu email ou SMS.`,
      novaSenhaTemp: novaSenh // REMOVER EM PRODUÇÃO
    });
  } catch (erro) {
    console.error('Erro ao solicitar nova senha:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// Função auxiliar para acesso aos usuários
router.getUsuarios = () => usuarios;

module.exports = router;

// biosystem-backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const { authenticate, isMaster } = require('../middleware/auth');

const router = express.Router();

// 📝 REGISTRAR NOVO USUÁRIO (Master)
router.post('/registrar', async (req, res) => {
  try {
    const { nome, email, senha, tipo, clinicaId, telefone } = req.body;

    // ✅ VALIDAÇÕES DE CAMPOS OBRIGATÓRIOS
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    if (!senha || senha.length < 6) {
      return res.status(400).json({ error: 'Senha é obrigatória e deve ter pelo menos 6 caracteres' });
    }
    if (!telefone || !telefone.trim()) {
      return res.status(400).json({ error: 'Telefone é obrigatório' });
    }

    // ✅ VALIDAÇÃO DE FORMATO DE EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // ✅ VALIDAÇÃO DE TIPO DE USUÁRIO
    const tiposValidos = ['master', 'admin', 'usuario', 'medico', 'painel'];
    const tipoUsuario = tipo || 'usuario';
    if (!tiposValidos.includes(tipoUsuario)) {
      return res.status(400).json({
        error: `Tipo de usuário inválido. Valores permitidos: ${tiposValidos.join(', ')}`
      });
    }

    // ✅ VERIFICA SE CLINICA_ID EXISTE (se fornecido)
    if (clinicaId) {
      const clinicaExiste = await pool.query(
        'SELECT id FROM clinicas WHERE id = $1 AND ativo = true',
        [clinicaId]
      );
      if (clinicaExiste.rows.length === 0) {
        return res.status(400).json({ error: 'Clínica não encontrada ou inativa' });
      }
    }

    // Verifica se email já existe e está ativo
    const emailExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND ativo = true', [email.trim().toLowerCase()]);
    if (emailExiste.rows.length > 0) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere novo usuário
    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo, data_criacao)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING id, nome, email, tipo, clinica_id, telefone, ativo`,
      [nome.trim(), email.trim().toLowerCase(), senhaHash, tipoUsuario, clinicaId || null, telefone.trim()]
    );

    const usuario = resultado.rows[0];

    // Gera JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
      process.env.JWT_SECRET || 'seu-segredo',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Usuário registrado com sucesso',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        clinicaId: usuario.clinica_id,
        telefone: usuario.telefone,
        ativo: usuario.ativo
      },
      token
    });
  } catch (erro) {
    console.error('Erro ao registrar:', erro);

    // Tratamento específico para constraint violations
    if (erro.code === '23505') { // unique_violation
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    res.status(500).json({ error: 'Erro interno ao registrar usuário' });
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
    const resultado = await pool.query(
      'SELECT id, nome, email, senha, tipo, clinica_id, telefone, ativo FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const usuario = resultado.rows[0];

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
    const resultado = await pool.query(
      `SELECT id, nome, email, tipo, clinica_id, telefone, ativo FROM usuarios WHERE id = $1 AND ativo = true`,
      [req.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const usuario = resultado.rows[0];
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
    const resultado = await pool.query(
      `SELECT id, nome, email, telefone, ativo FROM usuarios 
       WHERE (email = $1 OR telefone = $2) AND ativo = true`,
      [contact, contact]
    );

    if (resultado.rows.length === 0) {
      // Não revela se usuário existe (segurança)
      return res.json({
        message: 'Se o email/telefone existe, uma nova senha foi enviada para o contato cadastrado.'
      });
    }

    const usuario = resultado.rows[0];

    // Gera senha temporária (8 caracteres)
    const novaSenha = Math.random().toString(36).slice(-8).toUpperCase();
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualiza senha no banco
    await pool.query(
      'UPDATE usuarios SET senha = $1 WHERE id = $2',
      [senhaHash, usuario.id]
    );

    // TODO: Integrar SMTP ou SMS aqui para enviar a nova senha
    // Log apenas em desenvolvimento (não expõe em produção)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 [DEV] Nova senha para ${usuario.email}: ${novaSenha}\n`);
    }

    res.json({
      message: `Nova senha enviada para ${usuario.email}. Verifique seu email ou SMS.`
    });
  } catch (erro) {
    console.error('Erro ao solicitar nova senha:', erro);
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

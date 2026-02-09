// routes/auth.js
const express = require('express');
const { query } = require('../utils/db');
const { gerarToken, hashSenha, compararSenhas, autenticado } = require('../utils/auth');

const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const result = await query('SELECT * FROM usuarios WHERE email = $1 AND ativo = true', [email]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const senhaValida = await compararSenhas(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = gerarToken(usuario);
    const { senha: _, ...usuarioSemSenha } = usuario;

    res.json({ success: true, token, usuario: usuarioSemSenha });
  } catch (err) {
    console.error('Erro login:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// REGISTRAR NOVO USUÁRIO
router.post('/registrar', autenticado, async (req, res) => {
  try {
    const { nome, email, senha, tipo, clinica_id, clinicaId } = req.body;
    const finalClinicaId = clinica_id || clinicaId;

    if (!nome || !email || !senha || !tipo) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, email, senha, tipo' });
    }

    // Verificar se email existe
    const existente = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await hashSenha(senha);

    // Inserir usuário
    const result = await query(
      `INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, ativo)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id, nome, email, tipo, clinica_id`,
      [nome, email, senhaHash, tipo, finalClinicaId]
    );

    const novoUsuario = result.rows[0];
    res.status(201).json({ success: true, usuario: novoUsuario });
  } catch (err) {
    console.error('Erro registrar:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// VERIFICAR TOKEN - retorna dados completos do usuário do banco
router.get('/me', autenticado, async (req, res) => {
  try {
    const result = await query('SELECT * FROM usuarios WHERE id = $1 AND ativo = true', [req.usuario.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    const { senha: _, ...usuarioSemSenha } = result.rows[0];
    res.json({ usuario: usuarioSemSenha });
  } catch (err) {
    console.error('Erro verificar token:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;

// biosystem-backend/routes/usuarios.js
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/connection');
const { authenticate, isMaster } = require('../middleware/auth');

const router = express.Router();

// 📋 LISTAR USUÁRIOS
router.get('/', authenticate, async (req, res) => {
  try {
    // Garantir que dados sejam sempre atualizados em tempo real
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const resultado = await pool.query(
      `SELECT id, nome, email, tipo, clinica_id, telefone, ativo, data_criacao 
       FROM usuarios WHERE ativo = true ORDER BY data_criacao DESC`
    );

    const usuarios = resultado.rows.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      tipo: u.tipo,
      clinicaId: u.clinica_id,
      telefone: u.telefone,
      ativo: u.ativo
    }));

    res.json(usuarios);
  } catch (erro) {
    console.error('Erro ao listar usuários:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🔍 OBTER USUÁRIO POR ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, email, tipo, clinica_id, telefone, ativo 
       FROM usuarios WHERE id = $1 AND ativo = true`,
      [req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const u = resultado.rows[0];
    res.json({
      id: u.id,
      nome: u.nome,
      email: u.email,
      tipo: u.tipo,
      clinicaId: u.clinica_id,
      telefone: u.telefone
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

    // Busca usuário existente
    const usuarioExistente = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1 AND ativo = true',
      [id]
    );

    if (usuarioExistente.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const usuarioAtual = usuarioExistente.rows[0];

    // ⚠️ RESTRIÇÃO: Apenas MASTER pode alterar telefone
    if (telefone && telefone !== usuarioAtual.telefone) {
      if (req.usuario.tipo !== 'master') {
        return res.status(403).json({ 
          error: 'Apenas Master pode alterar o telefone do usuário. Contate o administrador.' 
        });
      }
    }

    // Prepara valores para update
    const valores = [];
    const setClause = [];
    let paramIndex = 1;

    if (nome) {
      setClause.push(`nome = $${paramIndex}`);
      valores.push(nome);
      paramIndex++;
    }

    if (email) {
      // Verifica se novo email já existe e está ativo
      const emailExiste = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2 AND ativo = true',
        [email, id]
      );
      if (emailExiste.rows.length > 0) {
        return res.status(400).json({ error: 'Este email já está em uso' });
      }
      setClause.push(`email = $${paramIndex}`);
      valores.push(email);
      paramIndex++;
    }

    if (senha) {
      const senhaHash = await bcrypt.hash(senha, 10);
      setClause.push(`senha = $${paramIndex}`);
      valores.push(senhaHash);
      paramIndex++;
    }

    if (tipo) {
      setClause.push(`tipo = $${paramIndex}`);
      valores.push(tipo);
      paramIndex++;
    }

    if (clinicaId !== undefined) {
      setClause.push(`clinica_id = $${paramIndex}`);
      valores.push(clinicaId || null);
      paramIndex++;
    }

    if (telefone) {
      setClause.push(`telefone = $${paramIndex}`);
      valores.push(telefone);
      paramIndex++;
    }

    if (acessoRelatorios !== undefined) {
      setClause.push(`acesso_relatorios = $${paramIndex}`);
      valores.push(acessoRelatorios);
      paramIndex++;
    }

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    // Adiciona o ID no final
    valores.push(id);

    const query = `
      UPDATE usuarios 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, nome, email, tipo, clinica_id, telefone, ativo
    `;

    const resultado = await pool.query(query, valores);
    const usuarioAtualizado = resultado.rows[0];

    res.json({
      message: 'Usuário atualizado com sucesso',
      usuario: {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        tipo: usuarioAtualizado.tipo,
        clinicaId: usuarioAtualizado.clinica_id,
        telefone: usuarioAtualizado.telefone
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

    // Soft delete: marca como inativo (apenas se está ativo)
    const resultado = await pool.query(
      'UPDATE usuarios SET ativo = false WHERE id = $1 AND ativo = true RETURNING id',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário desativado com sucesso' });
  } catch (erro) {
    console.error('Erro ao deletar usuário:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🆕 CRIAR NOVO USUÁRIO
router.post('/', authenticate, async (req, res) => {
  try {
    const { nome, email, senha, tipo, clinicaId, telefone } = req.body;

    // ⚠️ AUTORIZAÇÃO: Apenas MASTER pode criar usuários
    if (req.usuario.tipo !== 'master' && req.usuario.tipo !== 'admin') {
      return res.status(403).json({
        error: 'Apenas Master ou Admin podem criar novos usuários'
      });
    }

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

    // Verifica se já existe usuário ativo com mesmo email
    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe um usuário ativo com este email' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, tipo, clinica_id, telefone, ativo, data_criacao)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING id, nome, email, tipo, clinica_id, telefone, ativo`,
      [nome.trim(), email.trim().toLowerCase(), senhaHash, tipoUsuario, clinicaId || null, telefone.trim()]
    );

    const novoUsuario = resultado.rows[0];

    // ✅ RESPOSTA MAPEADA PARA CAMELCASE (consistente com outras rotas)
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        tipo: novoUsuario.tipo,
        clinicaId: novoUsuario.clinica_id,
        telefone: novoUsuario.telefone,
        ativo: novoUsuario.ativo
      }
    });
  } catch (erro) {
    console.error('Erro ao criar usuário:', erro);

    // Tratamento específico para constraint violations
    if (erro.code === '23505') { // unique_violation
      return res.status(400).json({ error: 'Email já está em uso' });
    }
    if (erro.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Clínica referenciada não existe' });
    }

    res.status(500).json({ error: 'Erro interno ao criar usuário' });
  }
});

module.exports = router;

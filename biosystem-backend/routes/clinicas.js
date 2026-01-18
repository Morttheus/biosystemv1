// biosystem-backend/routes/clinicas.js
const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 📋 LISTAR CLÍNICAS
router.get('/', authenticate, async (req, res) => {
  try {
    // Garantir que dados sejam sempre atualizados em tempo real
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const resultado = await pool.query(
      `SELECT id, nome, endereco, telefone, email, cnpj, ativo, data_cadastro
       FROM clinicas WHERE ativo = true ORDER BY nome ASC`
    );

    // Mapear para formato consistente (ativa em vez de ativo)
    const clinicas = resultado.rows.map(c => ({
      id: c.id,
      nome: c.nome,
      endereco: c.endereco,
      telefone: c.telefone,
      email: c.email,
      cnpj: c.cnpj,
      ativa: c.ativo,
      dataCadastro: c.data_cadastro
    }));

    res.json(clinicas);
  } catch (erro) {
    console.error('Erro ao listar clínicas:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🔍 OBTER CLÍNICA POR ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, endereco, telefone, email, cnpj, ativo, data_cadastro
       FROM clinicas WHERE id = $1 AND ativo = true`,
      [req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica não encontrada' });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao obter clínica:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ➕ CRIAR CLÍNICA
router.post('/', authenticate, async (req, res) => {
  try {
    const { nome, endereco, telefone, email, cnpj } = req.body;
    console.log('📝 [POST /clinicas] Recebido:', { nome, endereco, telefone, email, cnpj });

    // Validações
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Validação de email (se fornecido)
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }
    }

    // Verifica se CNPJ já existe e está ATIVO (se fornecido)
    if (cnpj && cnpj.trim()) {
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      if (cnpjLimpo.length !== 14) {
        return res.status(400).json({ error: 'CNPJ deve conter 14 dígitos' });
      }

      const cnpjExiste = await pool.query(
        'SELECT id FROM clinicas WHERE cnpj = $1 AND ativo = true',
        [cnpj.trim()]
      );
      if (cnpjExiste.rows.length > 0) {
        return res.status(400).json({ error: 'CNPJ já cadastrado' });
      }
    }

    const resultado = await pool.query(
      `INSERT INTO clinicas (nome, endereco, telefone, email, cnpj, ativo, data_cadastro)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       RETURNING id, nome, endereco, telefone, email, cnpj, ativo, data_cadastro`,
      [nome.trim(), endereco || null, telefone || null, email?.trim()?.toLowerCase() || null, cnpj?.trim() || null]
    );

    const clinica = resultado.rows[0];
    console.log('✅ [POST /clinicas] Clínica criada:', clinica);

    res.status(201).json({
      message: 'Clínica criada com sucesso',
      clinica: {
        id: clinica.id,
        nome: clinica.nome,
        endereco: clinica.endereco,
        telefone: clinica.telefone,
        email: clinica.email,
        cnpj: clinica.cnpj,
        ativa: clinica.ativo,
        dataCadastro: clinica.data_cadastro
      }
    });
  } catch (erro) {
    console.error('❌ [POST /clinicas] Erro ao criar clínica:', erro);

    if (erro.code === '23505') {
      return res.status(400).json({ error: 'CNPJ já está cadastrado' });
    }

    res.status(500).json({ error: 'Erro interno ao criar clínica' });
  }
});

// ✏️ EDITAR CLÍNICA
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, endereco, telefone, email, cnpj } = req.body;

    const resultado = await pool.query(
      `UPDATE clinicas
       SET nome = COALESCE($1, nome),
           endereco = COALESCE($2, endereco),
           telefone = COALESCE($3, telefone),
           email = COALESCE($4, email),
           cnpj = COALESCE($5, cnpj)
       WHERE id = $6 AND ativo = true
       RETURNING id, nome, endereco, telefone, email, cnpj, ativo`,
      [nome || null, endereco || null, telefone || null, email || null, cnpj || null, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica não encontrada' });
    }

    res.json({
      message: 'Clínica atualizada com sucesso',
      clinica: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao editar clínica:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🗑️ DELETAR CLÍNICA (Soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      'UPDATE clinicas SET ativo = false WHERE id = $1 AND ativo = true RETURNING id',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica não encontrada' });
    }

    res.json({ message: 'Clínica desativada com sucesso' });
  } catch (erro) {
    console.error('Erro ao deletar clínica:', erro);
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

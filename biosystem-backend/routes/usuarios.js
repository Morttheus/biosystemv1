// routes/usuarios.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado, hashSenha } = require('../utils/auth');

const router = express.Router();

// LISTAR USUÁRIOS
router.get('/', autenticado, async (req, res) => {
  try {
    const { clinica_id } = req.query;
    let sql = 'SELECT id, nome, email, tipo, clinica_id, ativo, acesso_relatorios FROM usuarios WHERE ativo = true';
    let params = [];

    // Se não é master, só pode ver usuários da própria clínica
    if (req.usuario.tipo !== 'master') {
      sql += ' AND clinica_id = $1';
      params = [req.usuario.clinica_id];
    } else if (clinica_id) {
      // Master pode filtrar por clínica específica
      sql += ' AND clinica_id = $1';
      params = [clinica_id];
    }

    const result = await query(sql + ' ORDER BY criado_em DESC', params);

    // Mapear para camelCase
    const usuarios = result.rows.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      tipo: u.tipo,
      clinicaId: u.clinica_id,
      ativo: u.ativo,
      acessoRelatorios: u.acesso_relatorios
    }));

    res.json(usuarios);
  } catch (err) {
    console.error('Erro listar usuários:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// OBTER USUÁRIO POR ID
router.get('/:id', autenticado, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Verificar permissão: próprio usuário ou master
    if (req.usuario.id !== userId && req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Permissão negada' });
    }

    const result = await query(
      'SELECT id, nome, email, tipo, clinica_id, ativo, acesso_relatorios FROM usuarios WHERE id = $1 AND ativo = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const u = result.rows[0];
    res.json({
      id: u.id,
      nome: u.nome,
      email: u.email,
      tipo: u.tipo,
      clinicaId: u.clinica_id,
      ativo: u.ativo,
      acessoRelatorios: u.acesso_relatorios
    });
  } catch (err) {
    console.error('Erro obter usuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR USUÁRIO
router.put('/:id', autenticado, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { nome, email, tipo, clinica_id, clinicaId, ativo, acessoRelatorios, acesso_relatorios, senha } = req.body;

    // Verificar permissão: master pode editar qualquer um, admin pode editar da sua clínica
    if (req.usuario.tipo !== 'master') {
      if (req.usuario.tipo === 'admin') {
        // Admin só pode editar usuários da sua clínica
        const checkUser = await query('SELECT clinica_id FROM usuarios WHERE id = $1', [userId]);
        if (checkUser.rows.length === 0 || checkUser.rows[0].clinica_id !== req.usuario.clinica_id) {
          return res.status(403).json({ error: 'Permissão negada' });
        }
        // Admin não pode alterar tipo para master
        if (tipo === 'master') {
          return res.status(403).json({ error: 'Permissão negada para criar usuário master' });
        }
      } else {
        // Outros só podem editar a si mesmos (e apenas nome, email, senha)
        if (req.usuario.id !== userId) {
          return res.status(403).json({ error: 'Permissão negada' });
        }
      }
    }

    // Suporta ambos formatos: clinica_id e clinicaId
    const finalClinicaId = clinica_id || clinicaId;
    const finalAcessoRelatorios = acessoRelatorios !== undefined ? acessoRelatorios : acesso_relatorios;

    let sql = `UPDATE usuarios
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           tipo = COALESCE($3, tipo),
           clinica_id = COALESCE($4, clinica_id),
           ativo = COALESCE($5, ativo),
           acesso_relatorios = COALESCE($6, acesso_relatorios),
           atualizado_em = CURRENT_TIMESTAMP`;

    let params = [nome, email, tipo, finalClinicaId, ativo, finalAcessoRelatorios];
    let paramIndex = 7;

    // Se senha foi fornecida, atualizar também
    if (senha) {
      const senhaHash = await hashSenha(senha);
      sql += `, senha = $${paramIndex}`;
      params.push(senhaHash);
      paramIndex++;
    }

    sql += ` WHERE id = $${paramIndex} RETURNING id, nome, email, tipo, clinica_id, ativo, acesso_relatorios`;
    params.push(userId);

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const u = result.rows[0];
    res.json({
      success: true,
      usuario: {
        id: u.id,
        nome: u.nome,
        email: u.email,
        tipo: u.tipo,
        clinicaId: u.clinica_id,
        ativo: u.ativo,
        acessoRelatorios: u.acesso_relatorios
      }
    });
  } catch (err) {
    console.error('Erro atualizar usuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// DELETAR USUÁRIO (desativar)
router.delete('/:id', autenticado, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Apenas master pode desativar usuários
    if (req.usuario.tipo !== 'master') {
      return res.status(403).json({ error: 'Apenas usuários Master podem desativar usuários' });
    }

    // Não pode desativar a si mesmo
    if (req.usuario.id === userId) {
      return res.status(400).json({ error: 'Você não pode desativar seu próprio usuário' });
    }

    const result = await query(
      'UPDATE usuarios SET ativo = false, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ success: true, message: 'Usuário desativado' });
  } catch (err) {
    console.error('Erro deletar usuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;

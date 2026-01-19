// biosystem-backend/routes/procedimentos.js
const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 📋 LISTAR PROCEDIMENTOS
router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const { clinica_id } = req.query;

    if (clinica_id) {
      // Tentar primeiro com a tabela procedimentos_clinica
      try {
        const query = `
          SELECT DISTINCT p.id, p.nome, p.valor, p.descricao, p.ativo, p.data_cadastro
          FROM procedimentos p
          INNER JOIN procedimentos_clinica pc ON p.id = pc.procedimento_id
          WHERE pc.clinica_id = $1 AND p.ativo = true
          ORDER BY p.nome ASC
        `;
        const resultado = await pool.query(query, [clinica_id]);
        return res.json(resultado.rows);
      } catch (erro) {
        // Se a tabela não existir, usar fallback
        if (erro.code === '42P01') {
          console.warn('⚠️  Tabela procedimentos_clinica não existe, usando fallback');
          const fallbackQuery = 'SELECT id, nome, valor, descricao, ativo, data_cadastro FROM procedimentos WHERE ativo = true ORDER BY nome ASC';
          const resultado = await pool.query(fallbackQuery);
          return res.json(resultado.rows);
        }
        throw erro;
      }
    }

    // Sem filtro de clínica: retornar todos os procedimentos ativos
    const query = 'SELECT id, nome, valor, descricao, ativo, data_cadastro FROM procedimentos WHERE ativo = true ORDER BY nome ASC';
    const resultado = await pool.query(query);
    res.json(resultado.rows);
  } catch (erro) {
    console.error('❌ Erro ao listar procedimentos:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🔍 OBTER PROCEDIMENTO COM CLÍNICAS
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const procedimento = await pool.query(
      'SELECT id, nome, valor, descricao, ativo, data_cadastro FROM procedimentos WHERE id = $1',
      [id]
    );

    if (procedimento.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    // Obter clínicas vinculadas
    const clinicas = await pool.query(
      `SELECT c.id, c.nome, pc.valor_clinica, pc.data_vinculo
       FROM clinicas c
       INNER JOIN procedimentos_clinica pc ON c.id = pc.clinica_id
       WHERE pc.procedimento_id = $1 AND c.ativo = true
       ORDER BY c.nome`,
      [id]
    );

    res.json({
      ...procedimento.rows[0],
      clinicas: clinicas.rows
    });
  } catch (erro) {
    console.error('Erro ao obter procedimento:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ➕ CRIAR PROCEDIMENTO COM CLÍNICAS
router.post('/', authenticate, async (req, res) => {
  try {
    const { nome, valor, descricao, clinicas } = req.body;

    // Validações
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome do procedimento é obrigatório' });
    }

    if (valor === undefined || valor === null || isNaN(parseFloat(valor))) {
      return res.status(400).json({ error: 'Valor é obrigatório e deve ser numérico' });
    }

    if (!clinicas || !Array.isArray(clinicas) || clinicas.length === 0) {
      return res.status(400).json({ error: 'Pelo menos uma clínica deve ser selecionada' });
    }

    const valorNumerico = parseFloat(valor);

    // Iniciar transação
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Criar procedimento
      const resultadoProcedimento = await client.query(
        `INSERT INTO procedimentos (nome, valor, descricao, ativo, data_cadastro)
         VALUES ($1, $2, $3, true, NOW())
         RETURNING id, nome, valor, descricao, ativo, data_cadastro`,
        [nome.trim(), valorNumerico, descricao || null]
      );

      const procedimentoId = resultadoProcedimento.rows[0].id;

      // Vincular a clínicas
      for (const clinica of clinicas) {
        const valorClinica = clinica.valor_clinica || valorNumerico;
        await client.query(
          `INSERT INTO procedimentos_clinica (procedimento_id, clinica_id, valor_clinica)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [procedimentoId, clinica.id || clinica, valorClinica]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Procedimento criado e vinculado às clínicas com sucesso',
        procedimento: resultadoProcedimento.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (erro) {
    console.error('Erro ao criar procedimento:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ✏️ ATUALIZAR PROCEDIMENTO
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, valor, descricao, ativo, clinicas } = req.body;

    // Verifica se procedimento existe
    const procedimentoExiste = await pool.query(
      'SELECT id FROM procedimentos WHERE id = $1',
      [id]
    );
    if (procedimentoExiste.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const campos = [];
      const valores = [];
      let paramIndex = 1;

      if (nome !== undefined) {
        campos.push(`nome = $${paramIndex}`);
        valores.push(nome.trim());
        paramIndex++;
      }

      if (valor !== undefined) {
        campos.push(`valor = $${paramIndex}`);
        valores.push(parseFloat(valor));
        paramIndex++;
      }

      if (descricao !== undefined) {
        campos.push(`descricao = $${paramIndex}`);
        valores.push(descricao);
        paramIndex++;
      }

      if (ativo !== undefined) {
        campos.push(`ativo = $${paramIndex}`);
        valores.push(ativo);
        paramIndex++;
      }

      // Atualizar procedimento
      let resultado;
      if (campos.length > 0) {
        valores.push(id);
        const query = `UPDATE procedimentos SET ${campos.join(', ')} WHERE id = $${paramIndex} RETURNING id, nome, valor, descricao, ativo, data_cadastro`;
        resultado = await client.query(query, valores);
      } else {
        resultado = await client.query('SELECT id, nome, valor, descricao, ativo, data_cadastro FROM procedimentos WHERE id = $1', [id]);
      }

      // Atualizar clínicas vinculadas (se fornecidas)
      if (clinicas && Array.isArray(clinicas) && clinicas.length > 0) {
        // Remover vinculações antigas
        await client.query(
          'DELETE FROM procedimentos_clinica WHERE procedimento_id = $1',
          [id]
        );

        // Adicionar novas vinculações
        for (const clinica of clinicas) {
          const valorClinica = clinica.valor_clinica || (resultado.rows[0]?.valor || 0);
          await client.query(
            `INSERT INTO procedimentos_clinica (procedimento_id, clinica_id, valor_clinica)
             VALUES ($1, $2, $3)`,
            [id, clinica.id || clinica, valorClinica]
          );
        }
      }

      await client.query('COMMIT');

      res.json({
        message: 'Procedimento atualizado com sucesso',
        procedimento: resultado.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (erro) {
    console.error('Erro ao atualizar procedimento:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🗑️ DESATIVAR PROCEDIMENTO
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      'UPDATE procedimentos SET ativo = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    res.json({ message: 'Procedimento desativado com sucesso' });
  } catch (erro) {
    console.error('Erro ao desativar procedimento:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// ➕ ADICIONAR CLÍNICA A PROCEDIMENTO
router.post('/:id/clinicas', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { clinica_id, valor_clinica } = req.body;

    if (!clinica_id) {
      return res.status(400).json({ error: 'ID da clínica é obrigatório' });
    }

    // Verifica se procedimento existe
    const procedimento = await pool.query(
      'SELECT id FROM procedimentos WHERE id = $1',
      [id]
    );
    if (procedimento.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    // Verifica se clínica existe
    const clinica = await pool.query(
      'SELECT id FROM clinicas WHERE id = $1',
      [clinica_id]
    );
    if (clinica.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica não encontrada' });
    }

    // Verifica se já está vinculado
    const jaVinculado = await pool.query(
      'SELECT * FROM procedimentos_clinica WHERE procedimento_id = $1 AND clinica_id = $2',
      [id, clinica_id]
    );
    if (jaVinculado.rows.length > 0) {
      return res.status(400).json({ error: 'Esta clínica já está vinculada a este procedimento' });
    }

    const resultado = await pool.query(
      `INSERT INTO procedimentos_clinica (procedimento_id, clinica_id, valor_clinica)
       VALUES ($1, $2, $3)
       RETURNING procedimento_id, clinica_id, valor_clinica, data_vinculo`,
      [id, clinica_id, valor_clinica || null]
    );

    res.status(201).json({
      message: 'Clínica vinculada ao procedimento com sucesso',
      vinculo: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao adicionar clínica:', erro);
    res.status(500).json({ error: erro.message });
  }
});

// 🗑️ REMOVER CLÍNICA DE PROCEDIMENTO
router.delete('/:id/clinicas/:clinica_id', authenticate, async (req, res) => {
  try {
    const { id, clinica_id } = req.params;

    const resultado = await pool.query(
      'DELETE FROM procedimentos_clinica WHERE procedimento_id = $1 AND clinica_id = $2 RETURNING procedimento_id',
      [id, clinica_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Vínculo entre procedimento e clínica não encontrado' });
    }

    res.json({ message: 'Clínica desvinculada do procedimento com sucesso' });
  } catch (erro) {
    console.error('Erro ao remover clínica:', erro);
    res.status(500).json({ error: erro.message });
  }
});

module.exports = router;

// Script para executar migração no banco Railway
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('Conectando ao banco Railway...');

    // Verifica e adiciona coluna valor na tabela prontuarios
    console.log('Verificando coluna valor na tabela prontuarios...');
    const checkValorProntuarios = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'prontuarios' AND column_name = 'valor'
    `);

    if (checkValorProntuarios.rows.length === 0) {
      await client.query('ALTER TABLE prontuarios ADD COLUMN valor DECIMAL(10, 2) DEFAULT 0');
      console.log('✅ Coluna valor adicionada à tabela prontuarios');
    } else {
      console.log('✅ Coluna valor já existe na tabela prontuarios');
    }

    // Verifica e adiciona coluna procedimento_id na tabela prontuarios
    console.log('Verificando coluna procedimento_id na tabela prontuarios...');
    const checkProcProntuarios = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'prontuarios' AND column_name = 'procedimento_id'
    `);

    if (checkProcProntuarios.rows.length === 0) {
      await client.query('ALTER TABLE prontuarios ADD COLUMN procedimento_id INTEGER');
      console.log('✅ Coluna procedimento_id adicionada à tabela prontuarios');
    } else {
      console.log('✅ Coluna procedimento_id já existe na tabela prontuarios');
    }

    // Verifica e adiciona coluna valor na tabela fila_atendimento
    console.log('Verificando coluna valor na tabela fila_atendimento...');
    const checkValorFila = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'fila_atendimento' AND column_name = 'valor'
    `);

    if (checkValorFila.rows.length === 0) {
      await client.query('ALTER TABLE fila_atendimento ADD COLUMN valor DECIMAL(10, 2) DEFAULT 0');
      console.log('✅ Coluna valor adicionada à tabela fila_atendimento');
    } else {
      console.log('✅ Coluna valor já existe na tabela fila_atendimento');
    }

    // Verifica e adiciona coluna procedimento_id na tabela fila_atendimento
    console.log('Verificando coluna procedimento_id na tabela fila_atendimento...');
    const checkProcFila = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'fila_atendimento' AND column_name = 'procedimento_id'
    `);

    if (checkProcFila.rows.length === 0) {
      await client.query('ALTER TABLE fila_atendimento ADD COLUMN procedimento_id INTEGER');
      console.log('✅ Coluna procedimento_id adicionada à tabela fila_atendimento');
    } else {
      console.log('✅ Coluna procedimento_id já existe na tabela fila_atendimento');
    }

    // Cria índices para melhorar performance
    console.log('Criando índices...');
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_prontuarios_valor ON prontuarios(valor)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_prontuarios_procedimento_id ON prontuarios(procedimento_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_fila_atendimento_valor ON fila_atendimento(valor)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_fila_atendimento_procedimento_id ON fila_atendimento(procedimento_id)');
      console.log('✅ Índices criados com sucesso');
    } catch (e) {
      console.log('⚠️  Alguns índices já existiam');
    }

    console.log('\n🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);

// biosystem-backend/db/connection.js
const { Pool } = require('pg');
require('dotenv').config();

// Configuração para Railway (usa DATABASE_URL) ou variáveis individuais
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'biosystem'
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool de conexão:', err);
});

// Testar conexão inicial
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Banco de dados respondendo'))
  .catch(err => console.error('❌ Erro ao conectar ao banco:', err.message));

module.exports = pool;

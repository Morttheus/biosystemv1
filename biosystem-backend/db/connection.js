// biosystem-backend/db/connection.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'biosystem'
});

pool.on('error', (err) => {
  console.error('Erro no pool de conexão:', err);
});

module.exports = pool;

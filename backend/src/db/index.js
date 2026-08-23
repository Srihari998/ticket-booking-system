const { Pool } = require('pg');
const config = require('../config');

const isProduction = process.env.NODE_ENV === 'production' || config.databaseUrl.includes('neon.tech') || config.databaseUrl.includes('render.com') || config.databaseUrl.includes('sslmode=require');

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

const closePool = async () => {
  await pool.end().catch(() => {});
};

module.exports = {
  getPool: () => pool,
  query,
  getClient,
  closePool
};

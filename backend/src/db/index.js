const { Pool } = require('pg');
const config = require('../config');
const mockDb = require('./mockDb');

let poolInstance = null;
let pgFailed = false;

const shouldUseMock = () => {
  if (process.env.NODE_ENV === 'test' || process.env.USE_MOCK_DB === 'true' || pgFailed) {
    return true;
  }
  return false;
};

const getPool = () => {
  if (shouldUseMock()) {
    return mockDb;
  }

  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: config.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    poolInstance.on('error', () => {
      pgFailed = true;
    });
  }
  return poolInstance;
};

const query = async (text, params) => {
  if (shouldUseMock()) {
    return mockDb.query(text, params);
  }
  try {
    const pool = getPool();
    return await pool.query(text, params);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === '28P01' || err.code === '3D000' || err.message?.includes('connect')) {
      pgFailed = true;
      return mockDb.query(text, params);
    }
    throw err;
  }
};

const getClient = async () => {
  if (shouldUseMock()) {
    return mockDb.createClient();
  }
  try {
    const pool = getPool();
    return await pool.connect();
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === '28P01' || err.code === '3D000' || err.message?.includes('connect')) {
      pgFailed = true;
      return mockDb.createClient();
    }
    throw err;
  }
};

const closePool = async () => {
  if (poolInstance) {
    await poolInstance.end().catch(() => {});
    poolInstance = null;
  }
};

module.exports = {
  getPool,
  query,
  getClient,
  closePool,
  mockDb
};

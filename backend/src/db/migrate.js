const fs = require('fs');
const path = require('path');
const { query, closePool } = require('./index');

const runMigrations = async () => {
  try {
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await query(schemaSql);
    console.log('Database migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

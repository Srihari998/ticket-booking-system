const fs = require('fs');
const path = require('path');
const { query, closePool } = require('./index');

const runSeeds = async () => {
  try {
    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await query(seedSql);
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
};

if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };

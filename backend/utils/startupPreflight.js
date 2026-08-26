const db = require('../db');

function validatePort() {
  const port = parseInt(process.env.PORT, 10);

  if (!port || Number.isNaN(port)) {
    throw new Error('PORT is required and must be a valid number');
  }

  return port;
}

async function validateStartupPrerequisites() {
  const port = validatePort();

  await db.query('SELECT 1');
  console.log('✅ Database connection successfully established');

  return port;
}

module.exports = {
  validateStartupPrerequisites,
};
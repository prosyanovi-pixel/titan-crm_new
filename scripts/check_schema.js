const db = require('./backend/db');

async function checkSchema() {
  try {
    console.log('--- Users table ---');
    const usersSchema = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.table(usersSchema.rows);

    console.log('\n--- Employees table ---');
    const employeesSchema = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employees'");
    console.table(employeesSchema.rows);

    console.log('\n--- Testing GET /api/users query ---');
    try {
      const { rows } = await db.query(`
          SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.avatar, u.initials,
                 u.department, u.nickname, u.telegram_token,
                 e.position_id, e.department_id,
                 p.name AS position_name,
                 d.name AS department_name
          FROM users u
          LEFT JOIN employees e ON e.user_id = u.id::text
          LEFT JOIN positions p ON p.id = e.position_id
          LEFT JOIN departments d ON d.id = e.department_id
          ORDER BY u.name
      `);
      console.log('Query successful, rows:', rows.length);
    } catch (err) {
      console.error('Query failed:', err.message);
    }
  } catch (err) {
    console.error('Error checking schema:', err.message);
  } finally {
    process.exit();
  }
}

checkSchema();

const { Pool } = require('pg');

const pool = new Pool({
  user: 'myuser',
  host: 'localhost',
  database: 'titancrm1',
  password: 'mysecretpassword',
  port: 5432,
});

async function check() {
  try {
    const res = await pool.query('SELECT * FROM contractor_tags WHERE contractor_id = 309');
    console.log("contractor_tags:", res.rows);
    const res2 = await pool.query("SELECT * FROM defined_tags WHERE module = 'contractors'");
    console.log("defined_tags:", res2.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();

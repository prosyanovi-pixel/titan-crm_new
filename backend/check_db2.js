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
    const contractorIds = [309];
    const tagsRes = await pool.query(
      'SELECT contractor_id, tag FROM contractor_tags WHERE contractor_id = ANY($1)',
      [contractorIds]
    );
    console.log("tagsRes:", tagsRes.rows);
    
    // Test the camelCase logic from db.js
    const tags = {};
    tagsRes.rows.forEach(row => {
      // simulate db.js camelCase mapping if it happens
      if (!tags[row.contractor_id]) tags[row.contractor_id] = [];
      tags[row.contractor_id].push(row.tag);
    });
    console.log("Mapped tags:", tags);

    const camelTagsRes = await pool.query(
      'SELECT contractor_id AS "contractorId", tag FROM contractor_tags WHERE contractor_id = ANY($1)',
      [contractorIds]
    );
    console.log("camelTagsRes:", camelTagsRes.rows);

  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();

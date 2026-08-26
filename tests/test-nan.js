const db = require('./backend/db.js');
db.query("SELECT COUNT(*) as total_count, COUNT(CASE WHEN read = false THEN 1 END) as unseen_count FROM mail LIMIT 1").then(r => console.log(r.rows)).catch(console.error).finally(() => process.exit(0));

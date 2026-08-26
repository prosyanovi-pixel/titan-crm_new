const db = require('./db');

async function check() {
  try {
    // Получаем любое дело, которое только что было обновлено (например, A40-..., или просто любое арбитражное)
    const { rows: cases } = await db.query(`SELECT id, title, case_number, first_instance_number, status FROM legal_cases WHERE first_instance_number IS NOT NULL LIMIT 1`);
    const legalCase = cases[0];
    
    if (!legalCase) return console.log('Нет арбитражных дел');
    console.log('\n--- 1. ДЕЛО ---');
    console.log(legalCase);
    
    const { rows: updates } = await db.query(`SELECT title, description, created_at FROM case_record_updates WHERE case_id = $1 ORDER BY created_at DESC LIMIT 3`, [legalCase.id]);
    console.log('\n--- 2. НОВЫЕ ЗАПИСИ ТАЙМЛАЙНА ---');
    console.log(updates);
    
    const { rows: docs } = await db.query(`SELECT name, type, size, author, url FROM case_documents WHERE case_id = $1`, [legalCase.id]);
    console.log('\n--- 3. ДОБАВЛЕННЫЕ ДОКУМЕНТЫ ---');
    console.log(docs);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();

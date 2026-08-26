const db = require('../db');

async function createCourtsAndJudges() {
  console.log('Creating courts and judges tables...');

  // Create courts table
  await db.query(`
    CREATE TABLE IF NOT EXISTS courts (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(500) NOT NULL,
      address TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create judges table
  await db.query(`
    CREATE TABLE IF NOT EXISTS judges (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(500) NOT NULL,
      court_id VARCHAR(50) REFERENCES courts(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed initial data
  const courts = [
    { id: 'c1', name: 'Арбитражный суд г. Москвы', address: 'ул. Большая Тульская, 17' },
    { id: 'c2', name: 'Басманный районный суд', address: 'ул. Каланчевская, 11' },
    { id: 'c3', name: 'Девятый арбитражный апелляционный суд', address: 'пр. Соломенной Сторожки, 12' }
  ];

  for (const court of courts) {
    await db.query(
      'INSERT INTO courts (id, name, address) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
      [court.id, court.name, court.address]
    );
  }

  const judges = [
    { id: 'j1', name: 'Иванова А.А.', court_id: 'c1' },
    { id: 'j2', name: 'Петров П.П.', court_id: 'c1' },
    { id: 'j3', name: 'Смирнова С.С.', court_id: 'c2' },
    { id: 'j4', name: 'Кузнецов К.К.', court_id: 'c3' }
  ];

  for (const judge of judges) {
    await db.query(
      'INSERT INTO judges (id, name, court_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
      [judge.id, judge.name, judge.court_id]
    );
  }

  console.log('✅ Courts and judges tables created and seeded');
}

module.exports = createCourtsAndJudges;

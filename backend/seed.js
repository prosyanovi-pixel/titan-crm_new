const db = require('./db');

async function seed() {
  console.log('🌱 Starting seed...');

  // Seed contractors
  const contractors = [
    {
      name: 'ООО ТИТАН',
      fullName: 'Общество с ограниченной ответственностью ТИТАН',
      status: 'active',
      phone: '—',
      manager: 'Александр Админ',
      inn: '7701002003',
      kpp: '770101001',
      ogrn: null,
      legalForm: 'ooo',
      type: 'client',
      currency: 'RUB',
      registrationDate: null,
      director: null,
      directorPosition: null,
      legalAddress: null,
      notes: null
    },
    {
      name: 'Газпром',
      fullName: 'Газпром',
      status: 'vip',
      phone: '—',
      manager: 'Мария Менеджер',
      inn: '7736050003',
      kpp: '772801001',
      ogrn: null,
      legalForm: 'ooo',
      type: 'client',
      currency: 'RUB',
      registrationDate: null,
      director: null,
      directorPosition: null,
      legalAddress: null,
      notes: null
    }
  ];

  for (const c of contractors) {
    const exists = await db.query(
      'SELECT 1 FROM contractors WHERE inn = $1',
      [c.inn]
    );
    if (exists.rows.length === 0) {
      await db.query(
        `INSERT INTO contractors
          (name, full_name, status, phone, manager, inn, kpp, ogrn, legal_form, type, currency, registration_date, director, director_position, legal_address, notes)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [c.name, c.fullName, c.status, c.phone, c.manager, c.inn, c.kpp, c.ogrn, c.legalForm, c.type, c.currency, c.registrationDate, c.director, c.directorPosition, c.legalAddress, c.notes]
      );
      console.log(`✅ Contractor "${c.name}" inserted`);
    } else {
      console.log(`⏭️  Contractor "${c.name}" already exists`);
    }
  }

  // Seed projects
  const projects = [
    {
      name: 'Внедрение системы безопасности',
      client: 'Газпром',
      manager: 'Мария Менеджер',
      status: 'active',
      stage: 'todo',
      priority: 'Medium',
      budget_used: 0,
      budget: 2500000,
      deadline: '2026-12-31',
      tasks_count: 12,
      completed_tasks: 0
    },
    {
      name: 'Модернизация IT-инфраструктуры',
      client: 'ООО ТИТАН',
      manager: 'Александр Админ',
      status: 'active',
      stage: 'in_progress',
      priority: 'High',
      budget_used: 45,
      budget: 5000000,
      deadline: '2026-06-01',
      tasks_count: 45,
      completed_tasks: 18
    },
    {
      name: 'Разработка CRM-системы',
      client: 'Вектор',
      manager: 'Иван Юрист',
      status: 'active',
      stage: 'in_progress',
      priority: 'High',
      budget_used: 72,
      budget: 1800000,
      deadline: '2026-02-20',
      tasks_count: 28,
      completed_tasks: 25
    }
  ];

  for (const p of projects) {
    const exists = await db.query(
      'SELECT 1 FROM projects WHERE name = $1',
      [p.name]
    );
    if (exists.rows.length === 0) {
      await db.query(
        `INSERT INTO projects
          (parent_id, name, client, manager, status, stage, priority, budget_used, budget, deadline, tasks_count, completed_tasks)
          VALUES (NULL,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [p.name, p.client, p.manager, p.status, p.stage, p.priority, p.budget_used, p.budget, p.deadline, p.tasks_count, p.completed_tasks]
      );
      console.log(`✅ Project "${p.name}" inserted`);
    } else {
      console.log(`⏭️  Project "${p.name}" already exists`);
    }
  }

  console.log('🎉 Seed completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  const workflowId = uuidv4();
  
  await db.query(`
    INSERT INTO workflows (id, name, description, trigger_type, trigger_config, status)
    VALUES ($1, 'Обработка выписок Альфа-Банка', 'Автоматически ищет непрочитанные письма от no-reply@alfabank.ru, сохраняет вложения и импортирует их в финансы.', 'schedule', '{"cron": "0 * * * *"}', 'active')
  `, [workflowId]);

  // Step 1: Fetch unread emails from no-reply@alfabank.ru
  await db.query(`
    INSERT INTO workflow_steps (workflow_id, step_order, module, action, action_config, on_fail)
    VALUES ($1, 1, 'mail', 'fetch_emails', $2, 'stop')
  `, [workflowId, JSON.stringify({
    folder: 'INBOX',
    limit: 5,
    unread_only: true,
    sender_contains: 'no-reply@alfabank.ru',
    process_each_email: true
  })]);

  // Step 2: Save attachments
  await db.query(`
    INSERT INTO workflow_steps (workflow_id, step_order, module, action, action_config, on_fail)
    VALUES ($1, 2, 'mail', 'save_attachments_to_documents', $2, 'stop')
  `, [workflowId, JSON.stringify({
    mail_id: '{{step1.emails[0].id}}',
    filter_ext: '.txt,.csv'
  })]);

  // Step 3: Process statement document (this step has a condition: only run if documents were found)
  await db.query(`
    INSERT INTO workflow_steps (workflow_id, step_order, module, action, action_config, condition, on_fail)
    VALUES ($1, 3, 'finance', 'process_statement_document', $2, $3, 'continue')
  `, [
    workflowId, 
    JSON.stringify({ documents: '{{step2.documents}}' }),
    JSON.stringify({ field: 'step2.found', operator: 'equals', value: true })
  ]);

  // Step 4: Mark email as read
  await db.query(`
    INSERT INTO workflow_steps (workflow_id, step_order, module, action, action_config, on_fail)
    VALUES ($1, 4, 'mail', 'mark_as_read', $2, 'continue')
  `, [workflowId, JSON.stringify({
    mail_id: '{{step1.emails[0].id}}',
    is_read: true
  })]);

  console.log('Workflow successfully seeded with ID:', workflowId);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
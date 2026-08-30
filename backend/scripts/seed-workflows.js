/**
 * Seed тестовых Workflow в БД
 * Запуск: node scripts/seed-workflows.js
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// Фиксированные UUID для воркфлоу (чтобы при повторном запуске делался upsert)
const WF_IDS = {
  finance: 'a1b2c3d4-0001-4000-8000-000000000001',
  legal:   'a1b2c3d4-0002-4000-8000-000000000002',
  webhook: 'a1b2c3d4-0003-4000-8000-000000000003',
  arbitr_v2: '07c5a907-6119-4292-8663-40c4e5e5f170',
  sales:   'a1b2c3d4-0005-4000-8000-000000000005',
};

const workflows = [
  // 1. Финансовый воркфлоу
  {
    id: WF_IDS.finance,
    name: 'Обработка финансовых писем',
    description: 'Каждый час проверяем входящую почту. Если есть письма от бухгалтерии, извлекаем данные и создаём счёт.',
    trigger_type: 'schedule',
    trigger_config: { cron: '0 * * * *' },
    status: 'draft',
    steps: [
      { step_order: 1, module: 'mail', action: 'search_by_sender', action_config: { sender_email: '@buh', folder: 'INBOX', limit: 5 }, condition: null, on_fail: 'stop' },
      { step_order: 2, module: 'mail', action: 'extract_urls', action_config: { email_body: '{{step1.emails.0.body_text}}', filter_ext: '.pdf' }, condition: { field: 'step1.found', operator: 'equals', value: 'true' }, on_fail: 'skip' },
      { step_order: 3, module: 'mail', action: 'download_url_to_document', action_config: { url: '{{step2.first_url}}', name: 'Финансовый документ' }, condition: { field: 'step2.found', operator: 'equals', value: 'true' }, on_fail: 'skip' },
      { step_order: 4, module: 'finance', action: 'create_invoice', action_config: { title: 'Счёт из письма: {{step1.emails.0.subject}}', amount_total: 0, currency: 'RUB', invoice_type: 'expense', description: 'Создано автоматически из письма' }, condition: { field: 'step1.count', operator: 'gt', value: '0' }, on_fail: 'skip' },
    ]
  },

  // 2. Юридический воркфлоу (старый)
  {
    id: WF_IDS.legal,
    name: 'Обработка судебных уведомлений',
    description: 'Проверяет письма от судов. Ищет номер дела, скачивает документы.',
    trigger_type: 'schedule',
    trigger_config: { cron: '0 9 * * 1-5' },
    status: 'draft',
    steps: [
      { step_order: 1, module: 'mail', action: 'search_by_sender', action_config: { sender_email: 'court', folder: 'INBOX', limit: 10, unread_only: true }, condition: null, on_fail: 'stop' },
      { step_order: 2, module: 'mail', action: 'extract_case_number', action_config: { email_body: '{{step1.emails.0.body_text}}' }, condition: { field: 'step1.found', operator: 'equals', value: 'true' }, on_fail: 'skip' },
      { step_order: 3, module: 'legal_cases', action: 'find_case_by_number', action_config: { case_number: '{{step2.case_number}}' }, condition: { field: 'step2.found', operator: 'equals', value: 'true' }, on_fail: 'skip' },
      { step_order: 4, module: 'mail', action: 'extract_urls', action_config: { email_body: '{{step1.emails.0.body_text}}', filter_ext: '.pdf,.doc,.docx' }, condition: { field: 'step3.found', operator: 'equals', value: 'true' }, on_fail: 'skip' },
      { step_order: 5, module: 'mail', action: 'download_url_to_document', action_config: { url: '{{step4.first_url}}', name: 'Документ суда по делу {{step2.case_number}}' }, condition: { field: 'step4.found', operator: 'equals', value: 'true' }, on_fail: 'skip' },
      { step_order: 6, module: 'legal_cases', action: 'attach_document_to_case', action_config: { case_id: '{{step3.caseId}}', document_id: '{{step5.documentId}}', doc_name: '{{step5.documentName}}' }, condition: { field: 'step5.documentId', operator: 'exists' }, on_fail: 'skip' },
    ]
  },

  // 3. Webhook воркфлоу
  {
    id: WF_IDS.webhook,
    name: 'Обработка входящих заявок (Webhook)',
    description: 'Принимает POST-запрос. Создаёт задачу, назначает юриста и счёт.',
    trigger_type: 'webhook',
    trigger_config: {},
    status: 'active',
    steps: [
      { step_order: 1, module: 'lawyers', action: 'find_lawyer', action_config: { specialization: '{{trigger.body.specialization}}', status: 'active' }, on_fail: 'skip' },
      { step_order: 2, module: 'tasks', action: 'create_task', action_config: { title: 'Заявка: {{trigger.body.title}}', priority: '{{trigger.body.priority}}', status: 'To Do', assignee: '{{step1.lawyers.0.name}}' }, on_fail: 'stop' },
      { step_order: 3, module: 'finance', action: 'create_invoice', action_config: { title: 'Услуга: {{trigger.body.title}}', amount_total: '{{trigger.body.amount}}', currency: 'RUB', invoice_type: 'income', description: 'Автосоздано при входящей заявке' }, condition: { field: 'trigger.body.amount', operator: 'exists' }, on_fail: 'skip' },
    ]
  },

  // 4. МОНИТОРИНГ АРБИТРА (V2) - ОБНОВЛЕННЫЙ
  {
    id: WF_IDS.arbitr_v2,
    name: 'Мониторинг Арбитра (V2)',
    description: 'Автоматическое извлечение данных о судебных разбирательствах из писем Электронного Стража Guard (Гвардия)',
    trigger_type: 'manual',
    trigger_config: {
      version: "2.0",
      description: "Обработка писем из папки Арбитр",
      trigger_event: "manual_trigger",
      folder: "folder_a95c19e5-9fdf-4573-96ae-aec7a08256ed"
    },
    status: 'active',
    steps: [
      {
        step_order: 1,
        module: 'mail',
        action: 'fetch_emails',
        action_config: {
          limit: 500,
          folder: "folder_a95c19e5-9fdf-4573-96ae-aec7a08256ed",
          account_id: "mail_account_c1ebd46d-2c7f-4f99-8b54-634a1ecb7a89",
          unread_only: true,
          process_each_email: true
        },
        on_fail: 'stop'
      },
      {
        step_order: 2,
        module: 'mail',
        action: 'extract_arbitr_data',
        action_config: {
          keyword: 'ООО "ВМТ"',
          body_text: '{{step1.emails.0.body_text}}',
          html_body: '{{step1.emails.0.html_body}}'
        },
        on_fail: 'stop'
      },
      {
        step_order: 3,
        module: 'legal_cases',
        action: 'find_case_by_number',
        action_config: {
          case_number: '{{step2.updates.0.caseNumber}}',
          excludeStatus: 'done'
        },
        on_fail: 'stop'
      },
      {
        step_order: 4,
        module: 'legal_cases',
        action: 'ensure_case_instance',
        action_config: {
          case_id: '{{step3.caseId}}',
          instance_number: '{{step2.updates.0.caseNumber}}',
          instance_type: '{{step2.updates.0.instanceType}}',
          court_name: '{{step2.updates.0.courtName}}',
          judge: '{{step2.updates.0.judge}}',
          status: 'hearing'
        },
        condition: { field: 'step2.found', operator: 'equals', value: true },
        on_fail: 'stop'
      },
      {
        step_order: 5,
        module: 'legal_cases',
        action: 'add_case_note',
        action_config: {
          case_id: '{{step3.caseId}}',
          instance_id: '{{step4.instance_id}}',
          text: '{{step2.updates.0.formattedNote}}',
          author: 'Мониторинг Арбитра',
          initials: 'MA',
          is_internal: false
        },
        condition: { field: 'step3.found', operator: 'equals', value: true },
        on_fail: 'stop'
      },
      {
        step_order: 6,
        module: 'mail',
        action: 'download_url_to_document',
        action_config: {
          url: '{{step2.updates.0.pdfUrl}}',
          name: '{{step2.updates.0.docName}}'
        },
        condition: { field: 'step3.found', operator: 'equals', value: true },
        on_fail: 'stop'
      },
      {
        step_order: 7,
        module: 'legal_cases',
        action: 'attach_document_to_case',
        action_config: {
          case_id: '{{step3.caseId}}',
          instance_id: '{{step4.instance_id}}',
          document_id: '{{step6.documentId}}',
          doc_name: '{{step6.documentName}}',
          stored_file: '{{step6.storedFilename}}',
          external_url: '{{step6.url}}'
        },
        condition: { field: 'step3.found', operator: 'equals', value: true },
        on_fail: 'stop'
      },
      {
        step_order: 8,
        module: 'legal_cases',
        action: 'add_timeline_event',
        action_config: {
          case_id: '{{step3.caseId}}',
          instance_id: '{{step4.instance_id}}',
          title: 'Обновление КАД',
          description: '{{step2.updates.0.docInfo}}\nСсылка: {{step2.updates.0.pdfUrl}}',
          type: 'document',
          author: 'workflow'
        },
        condition: { field: 'step3.found', operator: 'equals', value: true },
        on_fail: 'stop'
      },
      {
        step_order: 9,
        module: 'legal_cases',
        action: 'update_case_status',
        action_config: {
          case_id: '{{step3.caseId}}',
          status: 'в_работе',
          lawyer_id: '{{step3.lawyerId}}',
          lawyer_name: '{{step3.lawyerName}}',
          note: 'Обновлено на основе решения суда'
        },
        condition: { field: 'step3.found', operator: 'equals', value: true },
        on_fail: 'stop'
      },
      {
        step_order: 10,
        module: 'mail',
        action: 'mark_as_read',
        action_config: {
          mail_id: '{{step1.emails.0.id}}',
          is_read: true
        },
        condition: { field: 'step1.count', operator: 'gt', value: 0 },
        on_fail: 'stop'
      },
      {
        step_order: 11,
        module: 'mail',
        action: 'log_processing_status',
        action_config: {
          limit: '{{step1.limit}}',
          processed_count: '{{step1.count}}',
          has_more: '{{step1.has_more}}',
          unread_count: '{{step1.unread_count}}',
          total_matching: '{{step1.total_matching}}',
          message: 'Если has_more = true, повторите workflow'
        },
        on_fail: 'stop'
      }
    ]
  },

  // 5. B2B Sales Standard Workflow
  {
    id: WF_IDS.sales,
    name: 'B2B Sales Standard',
    description: 'Автоматически ставит задачу менеджеру при переходе сделки на этап "Подготовка КП".',
    trigger_type: 'event',
    trigger_config: { eventName: 'sales_stage_changed', stageTo: 'quote_prep' },
    status: 'active',
    steps: [
      { 
        step_order: 1, 
        module: 'tasks', 
        action: 'create_task', 
        action_config: { 
          title: 'Подготовить первичное коммерческое предложение', 
          priority: 'high', 
          status: 'To Do',
          description: 'Автоматически создано при переходе на этап "Подготовка КП".'
        }, 
        on_fail: 'skip' 
      }
    ]
  }
];

async function seed() {
  console.log('🌱 Seeding updated workflows...\n');

  for (const wf of workflows) {
    const { steps, ...wfData } = wf;

    // Upsert workflow
    await db.query(
      `INSERT INTO workflows (id, name, description, trigger_type, trigger_config, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         trigger_type = EXCLUDED.trigger_type,
         trigger_config = EXCLUDED.trigger_config,
         status = EXCLUDED.status,
         updated_at = NOW()`,
      [
        wfData.id,
        wfData.name,
        wfData.description,
        wfData.trigger_type,
        JSON.stringify(wfData.trigger_config),
        wfData.status,
      ]
    );

    // Delete old steps
    await db.query('DELETE FROM workflow_steps WHERE workflow_id = $1', [wfData.id]);

    // Insert steps
    for (const step of steps) {
      const stepId = uuidv4();
      await db.query(
        `INSERT INTO workflow_steps (id, workflow_id, step_order, module, action, action_config, condition, delay_seconds, on_fail)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          stepId,
          wfData.id,
          step.step_order,
          step.module,
          step.action,
          JSON.stringify(step.action_config || {}),
          step.condition ? JSON.stringify(step.condition) : null,
          step.delay_seconds || 0,
          step.on_fail || 'skip',
        ]
      );
    }

    console.log(`✅ ${wfData.name} (${steps.length} steps)`);
  }

  console.log('\n✓ Done seeding workflows!');
  await db.pool.end();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

/**
 * Вспомогательные функции и константы для routes/references.js
 */

/** Таблицы, разрешённые в универсальных CRUD-роутах */
const VALID_WRITE_TABLES = [
  'project_status', 'project_stage', 'priority', 'contractor_status',
  'legal_forms', 'legal_form_groups', 'contractor_type', 'task_status', 'lawyer_status',
  'specialization', 'case_status', 'currency', 'case_type',
  'event_type', 'mail_label', 'defined_tags', 'relationship_type',
  'finance_invoice_status', 'calendar_status', 'contract_status', 'contract_payment_status',
  'marketing_status', 'marketing_type',
];

/** Таблицы, у которых есть колонка color */
const TABLES_WITH_COLOR = new Set([
  'project_status', 'contractor_status', 'task_status', 'lawyer_status',
  'case_status', 'defined_tags', 'relationship_type', 'legal_forms',
  'priority', 'finance_invoice_status', 'calendar_status', 'contract_status', 'contract_payment_status',
  'marketing_status', 'marketing_type',
]);

/** Таблицы, у которых есть колонка module */
const TABLES_WITH_MODULE = new Set(['defined_tags', 'relationship_type']);

/** Таблицы, у которых есть колонка show_as_tab */
const TABLES_WITH_SHOW_AS_TAB = new Set(['relationship_type', 'legal_forms', 'legal_form_groups']);

/** Таблицы, у которых есть колонка is_active */
const TABLES_WITH_IS_ACTIVE = new Set(['relationship_type', 'legal_forms', 'contractor_status', 'project_status', 'task_status', 'lawyer_status']);

/** Формирует единый массив статусов для страницы Settings */
function buildUnifiedStatuses({ contractorStatuses, projectStatuses, taskStatuses, lawyerStatuses, caseStatuses, financeInvoiceStatuses, calendarStatuses, contractStatuses, contractPaymentStatuses, marketingStatuses }) {
  return [
    ...contractorStatuses.map(s => ({ ...s, module: 'contractors' })),
    ...projectStatuses.map(s => ({ ...s, module: 'projects' })),
    ...taskStatuses.map(s => ({ ...s, module: 'tasks' })),
    ...lawyerStatuses.map(s => ({ ...s, module: 'lawyers' })),
    ...caseStatuses.map(s => ({ ...s, module: 'cases' })),
    ...financeInvoiceStatuses.map(s => ({ ...s, module: 'finance' })),
    ...(calendarStatuses || []).map(s => ({ ...s, module: 'calendar' })),
    ...(contractStatuses || []).map(s => ({ ...s, module: 'contracts' })),
    ...(contractPaymentStatuses || []).map(s => ({ ...s, module: 'contracts_payment' })),
    ...(marketingStatuses || []).map(s => ({ ...s, module: 'marketing' })),
  ];
}

/** Формирует единый массив приоритетов (все модули × все приоритеты) */
function buildUnifiedPriorities(genericPriorities, availableModules) {
  const DEFAULT_COLORS = { 
    High: '#EF4444', 
    Medium: '#F59E0B',
    Low: '#3B82F6'
  };
  const LEVEL = { High: 3, Medium: 2, Low: 1 };
  const result = [];
  availableModules.forEach(mod => {
    genericPriorities.forEach(p => {
      result.push({
        ...p,
        module: mod.id,
        level: LEVEL[p.id] ?? 1,
        color: p.color || DEFAULT_COLORS[p.id] || '#3B82F6',
      });
    });
  });
  return result;
}

/**
 * Бизнес-логика POST /sync-modules.
 * Выполняется внутри транзакции (client уже взят из пула).
 * @returns {{ syncedModules, insertedQuickActions, report }}
 */
async function syncModulesTransaction(client, modules, dryRun) {
  let syncedModules = 0;
  let insertedQuickActions = 0;
  const report = {
    modules: { inserted: [], updated: [], unchanged: [], invalid: [] },
    quickActions: { inserted: [], existing: [], invalid: [] },
  };

  for (const moduleItem of modules) {
    if (!moduleItem?.id || !moduleItem?.name || !moduleItem?.icon) {
      report.modules.invalid.push({ id: moduleItem?.id || null, reason: 'missing required fields' });
      continue;
    }

    const displayOrder = Number.isFinite(moduleItem.displayOrder) ? moduleItem.displayOrder : 999;
    const { rows: [existing] } = await client.query(
      'SELECT id, name, icon, displayorder FROM modules WHERE id = $1',
      [moduleItem.id]
    );

    if (!existing) {
      report.modules.inserted.push({ id: moduleItem.id, name: moduleItem.name, icon: moduleItem.icon, displayOrder });
    } else {
      const changed =
        existing.name !== moduleItem.name ||
        existing.icon !== moduleItem.icon ||
        Number(existing.displayorder) !== Number(displayOrder);
      if (changed) {
        report.modules.updated.push({
          id: moduleItem.id,
          from: { name: existing.name, icon: existing.icon, displayOrder: existing.displayorder },
          to:   { name: moduleItem.name, icon: moduleItem.icon, displayOrder },
        });
      } else {
        report.modules.unchanged.push({ id: moduleItem.id });
      }
    }

    if (!dryRun) {
      await client.query(
        `INSERT INTO modules (id, name, icon, displayorder)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name, icon = EXCLUDED.icon, displayorder = EXCLUDED.displayorder`,
        [moduleItem.id, moduleItem.name, moduleItem.icon, displayOrder]
      );
    }
    syncedModules++;

    for (const qa of (Array.isArray(moduleItem.quickActions) ? moduleItem.quickActions : [])) {
      if (!qa?.id || !qa?.name || !qa?.icon || !qa?.action) {
        report.quickActions.invalid.push({ id: qa?.id || null, module: moduleItem.id, reason: 'missing required fields' });
        continue;
      }
      const actionDisplayOrder = Number.isFinite(qa.displayOrder) ? qa.displayOrder : 999;
      const { rows } = await client.query('SELECT id FROM quick_actions WHERE id = $1', [qa.id]);

      if (rows.length > 0) {
        report.quickActions.existing.push({ id: qa.id, module: moduleItem.id });
      } else {
        report.quickActions.inserted.push({ id: qa.id, module: moduleItem.id, action: qa.action, displayOrder: actionDisplayOrder });
        if (!dryRun) {
          const insertResult = await client.query(
            `INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active)
             VALUES ($1,$2,$3,$4,$5,$6,TRUE)
             ON CONFLICT (id) DO NOTHING RETURNING id`,
            [qa.id, qa.name, qa.icon, qa.action, moduleItem.id, actionDisplayOrder]
          );
          if (insertResult.rows.length > 0) insertedQuickActions++;
        }
      }
    }
  }

  return { syncedModules, insertedQuickActions, report };
}

module.exports = { VALID_WRITE_TABLES, TABLES_WITH_COLOR, TABLES_WITH_MODULE, TABLES_WITH_SHOW_AS_TAB, TABLES_WITH_IS_ACTIVE, buildUnifiedStatuses, buildUnifiedPriorities, syncModulesTransaction };

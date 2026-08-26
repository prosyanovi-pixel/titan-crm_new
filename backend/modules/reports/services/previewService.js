/**
 * Сервис для генерации данных предпросмотра отчётов
 */

const db = require('../../../db');

/**
 * Генерирует данные для предпросмотра на базе типа отчёта и фильтров
 * @param {string} reportType - тип отчёта
 * @param {Object} filters - фильтры
 * @param {number} page - страница
 * @param {number} limit - кол-во на страницу
 * @param {string} sortBy - поле для сортировки
 * @param {string} sortDir - направление ('asc' | 'desc')
 */
async function getReportPreview(reportType, filters = {}, page = 1, limit = 10, sortBy = null, sortDir = 'asc') {
  const { dateFrom, dateTo, projectId, contractorId, lawyerId, kind, groupBy } = filters;
  const offset = (page - 1) * limit;

  function buildOrderBy(defaultSort) {
    if (!sortBy) return `ORDER BY ${defaultSort}`;
    // Simple mapping to snake_case for common fields if they come in camelCase
    const fieldMap = {
      'contractorName': 'c.name',
      'projectName': 'p.name',
      'paymentDate': 'fp.payment_date',
      'categoryName': 'fc.name',
      'dueDate': 'fi.due_date',
      'amountDue': 'fi.amount_due',
      'identifier': 'fi.identifier',
      'name': 'name',
      'amount': 'amount',
      'date': 'date'
    };
    const dbField = fieldMap[sortBy] || sortBy;
    return `ORDER BY ${dbField} ${sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
  }

  function buildWhere(dateField, extra = []) {
    const conds = [];
    const params = [];
    if (dateFrom) { params.push(dateFrom); conds.push(`${dateField} >= $${params.length}`); }
    if (dateTo) { params.push(dateTo); conds.push(`${dateField} <= $${params.length}`); }
    extra.forEach(([field, val]) => {
      if (val) { params.push(val); conds.push(`${field} = $${params.length}`); }
    });
    return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
  }

  try {
    switch (reportType) {
      case 'finance_register': {
        const { where, params } = buildWhere('fp.payment_date', [
          ['fp.kind', kind],
          ['fp.project_id', projectId],
          ['fp.contractor_id', contractorId],
        ]);
        const { rows } = await db.query(
          `SELECT fp.id, fp.kind, fp.amount, fp.payment_date,
                  fc.name AS category_name, c.name AS contractor_name,
                  p.name AS project_name, fi.identifier AS invoice_identifier
           FROM finance_payments fp
           LEFT JOIN finance_expense_categories fc ON fc.id = fp.category_id
           LEFT JOIN finance_invoices fi ON fi.id = fp.invoice_id
           LEFT JOIN projects p ON p.id = fp.project_id
           LEFT JOIN contractors c ON c.id = fp.contractor_id
           ${where}
           ${buildOrderBy('fp.payment_date DESC')}
           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, limit, offset]
        );
        const { rows: total } = await db.query(
          `SELECT COUNT(*) FROM finance_payments fp ${where}`, params
        );
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'finance_pl': {
        const { where, params } = buildWhere('fp.payment_date', [
          ['fp.project_id', projectId],
        ]);
        const { rows } = await db.query(
          `SELECT fp.kind, fc.name AS category_name, SUM(fp.amount) AS total
           FROM finance_payments fp
           LEFT JOIN finance_expense_categories fc ON fc.id = fp.category_id
           ${where}
           GROUP BY fp.kind, fc.name
           ${buildOrderBy('total DESC')}
           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, limit, offset]
        );
        return { data: rows, totalRows: rows.length };
      }

      case 'finance_dds': {
        const { where, params } = buildWhere('fp.payment_date');
        const { rows } = await db.query(
          `SELECT fp.kind, fc.name AS category_name, fc.color, SUM(fp.amount) AS total
           FROM finance_payments fp
           LEFT JOIN finance_expense_categories fc ON fc.id = fp.category_id
           ${where}
           GROUP BY fp.kind, fc.name, fc.color
           ${buildOrderBy('fp.kind, total DESC')}
           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, limit, offset]
        );
        return { data: rows, totalRows: rows.length };
      }

      case 'finance_receivables': {
        const { rows } = await db.query(
          `SELECT fi.id, fi.identifier, fi.amount_due, fi.due_date,
                  c.name AS contractor_name, p.name AS project_name,
                  fi.due_date < CURRENT_DATE AS is_overdue
           FROM finance_invoices fi
           LEFT JOIN contractors c ON c.id = fi.contractor_id
           LEFT JOIN projects p ON p.id = fi.project_id
           WHERE fi.amount_due > 0
           ${buildOrderBy('fi.due_date ASC')}
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        const { rows: total } = await db.query(
          'SELECT COUNT(*) FROM finance_invoices WHERE amount_due > 0'
        );
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'finance_taxes': {
        const { rows } = await db.query(
          `SELECT TO_CHAR(payment_date, 'YYYY-MM') AS period,
                  SUM(amount) AS tax_base,
                  SUM(amount) * 0.20 AS tax_amount,
                  'calculated' AS status
           FROM finance_payments
           WHERE kind = 'income'
           GROUP BY period
           ORDER BY period DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        return { data: rows, totalRows: rows.length };
      }

      case 'projects_summary': {
        const { rows } = await db.query(
          `SELECT p.id, p.name, p.status, p.deadline,
                  p.manager AS manager_name,
                  COALESCE(tsk.tasks_total, 0) AS tasks_total,
                  COALESCE(tsk.tasks_done,  0) AS tasks_done,
                  COALESCE(tags.list, '[]') AS tags
           FROM projects p
           LEFT JOIN LATERAL (
             SELECT
               COUNT(*) AS tasks_total,
               COUNT(*) FILTER (WHERE t.status = 'done') AS tasks_done
             FROM tasks t
             JOIN project_stages ps ON ps.id = t.project_stage_id
             WHERE ps.project_id = p.id
           ) tsk ON true
           LEFT JOIN LATERAL (
             SELECT json_agg(json_build_object('id', dt.id, 'name', dt.name, 'color', dt.color)) AS list
             FROM project_tags pt
             JOIN defined_tags dt ON dt.id = pt.tag_id
             WHERE pt.project_id = p.id
           ) tags ON true
           GROUP BY p.id, p.name, p.status, p.deadline, p.manager, tsk.tasks_total, tsk.tasks_done, tags.list
           ${buildOrderBy('p.created_at DESC')}
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        const { rows: total } = await db.query('SELECT COUNT(*) FROM projects');
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'projects_budget': {
        const { rows } = await db.query(
          `SELECT p.id, p.name, p.budget,
                  COALESCE(SUM(fp.amount) FILTER (WHERE fp.kind = 'income'), 0) AS total_income,
                  p.budget - COALESCE(SUM(fp.amount) FILTER (WHERE fp.kind = 'income'), 0) AS variance,
                  CASE WHEN p.budget > 0 THEN ROUND((COALESCE(SUM(fp.amount) FILTER (WHERE fp.kind = 'income'), 0) / p.budget) * 100, 1) ELSE 0 END AS usage_percent
           FROM projects p
           LEFT JOIN finance_payments fp ON fp.project_id = p.id
           GROUP BY p.id, p.name, p.budget
           ${buildOrderBy('p.budget DESC')}
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        const { rows: total } = await db.query('SELECT COUNT(*) FROM projects');
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'projects_stages': {
        const { rows } = await db.query(
          `SELECT p.name AS project_name, ps.name AS stage_name, 
                  CASE WHEN ps.is_completed THEN 'completed' ELSE 'active' END AS status,
                  COUNT(t.id) AS tasks_count
           FROM project_stages ps
           JOIN projects p ON p.id = ps.project_id
           LEFT JOIN tasks t ON t.project_stage_id = ps.id
           GROUP BY p.id, p.name, ps.id, ps.name, ps.is_completed, ps.order_index
           ${buildOrderBy('p.name, ps.order_index')}
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        const { rows: total } = await db.query('SELECT COUNT(*) FROM project_stages');
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'tasks_workload': {
        const { rows } = await db.query(
          `SELECT assignee AS assignee_name,
                  COUNT(*) FILTER (WHERE status = 'in_progress') AS active_tasks,
                  COUNT(*) FILTER (WHERE status = 'todo' OR status = 'pending') AS pending_tasks,
                  COUNT(*) AS total_tasks
           FROM tasks
           WHERE assignee IS NOT NULL
           GROUP BY assignee
           ${buildOrderBy('total_tasks DESC')}
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        const { rows: total } = await db.query('SELECT COUNT(DISTINCT assignee) FROM tasks WHERE assignee IS NOT NULL');
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'tasks_overdue': {
        const { rows } = await db.query(
          `SELECT t.title, t.project AS project_name, t.assignee AS assignee_name, t.due_date,
                  (CURRENT_DATE - t.due_date::date) AS days_overdue
           FROM tasks t
           WHERE t.status != 'done' AND t.due_date::date < CURRENT_DATE
           ${buildOrderBy('days_overdue DESC')}
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        const { rows: total } = await db.query("SELECT COUNT(*) FROM tasks WHERE status != 'done' AND due_date::date < CURRENT_DATE");
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'contractors_activity': {
        const { rows } = await db.query(
          `SELECT c.id, c.name, c.inn,
                  COUNT(DISTINCT fp.project_id) AS projects_count,
                  COUNT(DISTINCT fp.id) AS payments_count,
                  COALESCE(SUM(fp.amount) FILTER (WHERE fp.kind = 'income'), 0) AS total_income,
                  COALESCE(tags.list, '[]') AS tags
           FROM contractors c
           LEFT JOIN finance_payments fp ON fp.contractor_id = c.id
           LEFT JOIN LATERAL (
             SELECT json_agg(json_build_object('id', dt.id, 'name', dt.name, 'color', dt.color)) AS list
             FROM contractor_tags ct
             JOIN defined_tags dt ON dt.id = ct.tag_id
             WHERE ct.contractor_id = c.id
           ) tags ON true
           GROUP BY c.id, c.name, c.inn, tags.list
           ${buildOrderBy('total_income DESC')}
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        const { rows: total } = await db.query('SELECT COUNT(*) FROM contractors');
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'contractors_dossier': {
        if (!contractorId) return { data: [], totalRows: 0 };
        const { rows } = await db.query(
          `(SELECT name AS entity_name, 'Договор' AS entity_type, status, amount, expiration_date AS date, assigned_to AS assignee, created_at
            FROM contracts WHERE contractor_id = $1)
           UNION ALL
           (SELECT identifier AS entity_name, 'Счёт' AS entity_type, status, amount_due AS amount, due_date AS date, NULL AS assignee, created_at
            FROM finance_invoices WHERE contractor_id = $1)
           UNION ALL
           (SELECT name AS entity_name, 'Проект' AS entity_type, status, budget AS amount, deadline AS date, manager AS assignee, created_at
            FROM projects WHERE client = (SELECT name FROM contractors WHERE id = $1))
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          [contractorId, limit, offset]
        );
        return { data: rows, totalRows: rows.length };
      }

      case 'contractors_contracts': {
        const { rows } = await db.query(
          `SELECT c.contract_number, ctr.name AS contractor_name, c.status, c.start_date, c.expiration_date AS end_date, c.amount
           FROM contracts c
           JOIN contractors ctr ON ctr.id = c.contractor_id
           ${buildOrderBy('c.created_at DESC')}
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        const { rows: total } = await db.query('SELECT COUNT(*) FROM contracts');
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'lawyers_workload': {
        const { rows } = await db.query(
          `SELECT u.name AS full_name,
                  COUNT(lc.id) AS active_cases,
                  (SELECT COUNT(*) FROM calendar_events ce WHERE ce.assignee = u.id AND ce.date >= CURRENT_DATE AND ce.date <= CURRENT_DATE + INTERVAL '7 days') AS hearings_soon
           FROM users u
           LEFT JOIN legal_cases lc ON lc.lawyer_id = u.id AND lc.status = 'active'
           WHERE u.role = 'lawyer' OR u.id IN (SELECT DISTINCT lawyer_id FROM legal_cases)
           GROUP BY u.id, u.name
           ORDER BY active_cases DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        const { rows: total } = await db.query("SELECT COUNT(*) FROM users WHERE role = 'lawyer'");
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'lawyers_performance': {
        const { rows } = await db.query(
          `SELECT u.id,
                  u.name        AS full_name,
                  u.role        AS specialization,
                  COUNT(DISTINCT lc.id) AS cases_total,
                  COUNT(DISTINCT lc.id) FILTER (WHERE lc.status = 'closed') AS cases_closed,
                  COUNT(DISTINCT lc.id) FILTER (WHERE lc.outcome = 'win') AS cases_won,
                  COUNT(DISTINCT lc.id) FILTER (WHERE lc.outcome = 'loss') AS cases_lost,
                  ROUND(
                    COUNT(DISTINCT lc.id) FILTER (WHERE lc.outcome = 'win')::numeric 
                    / NULLIF(COUNT(DISTINCT lc.id) FILTER (WHERE lc.outcome IN ('win','loss')), 0) * 100, 
                    1
                  ) AS win_rate
           FROM users u
           LEFT JOIN legal_cases lc ON lc.lawyer_id = u.id
           WHERE u.role = 'lawyer' OR u.id IN (SELECT DISTINCT lawyer_id FROM legal_cases)
           GROUP BY u.id, u.name, u.role
           ORDER BY cases_total DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        const { rows: total } = await db.query("SELECT COUNT(*) FROM users WHERE role = 'lawyer'");
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'marketing_campaigns': {
        const { where, params } = buildWhere('m.created_at', [
          ['m.status', filters.status],
          ['m.type', filters.type],
        ]);
        const { rows } = await db.query(
          `SELECT m.id, m.name, m.description, m.status, m.type, m.budget, m.actual_cost, m.start_date, m.end_date, m.target_audience
           FROM marketing_campaigns m
           ${where}
           ${buildOrderBy('m.created_at DESC')}
           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, limit, offset]
        );
        const { rows: total } = await db.query(
          `SELECT COUNT(*) FROM marketing_campaigns m ${where}`, params
        );
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      case 'custom': {
        const source = String(filters?.sourceEntity || 'finance');
        const groupBy = String(filters?.groupBy || '');
        let queryStr = '';
        let countQuery = '';
        const params = [];
        const conds = [];

        const applyDateFilter = (dateField) => {
          if (dateFrom) {
            params.push(dateFrom);
            conds.push(`${dateField} >= $${params.length}`);
          }
          if (dateTo) {
            params.push(dateTo);
            conds.push(`${dateField} <= $${params.length}`);
          }
        };

        const CUSTOM_SOURCE_FIELDS = {
          contracts: {
            name: 'c.name',
            status: 'c.status',
            amount: 'c.amount',
            date: 'c.expiration_date',
          },
          projects: {
            name: 'p.name',
            status: 'p.status',
            amount: 'p.budget',
            date: 'p.deadline',
          },
          tasks: {
            name: 't.title',
            status: 't.status',
            date: 't.due_date',
          },
          contractors: {
            name: 'c.name',
            inn: 'c.inn',
            date: 'c.created_at',
          },
          finance: {
            date: 'fp.payment_date',
            kind: 'fp.kind',
            amount: 'fp.amount',
          },
          marketing: {
            name: 'm.name',
            status: 'm.status',
            amount: 'm.budget',
            date: 'm.end_date',
          }
        };

        const applyRulesFilter = () => {
          if (!Array.isArray(filters.rules)) return;
          const entityFields = CUSTOM_SOURCE_FIELDS[source];
          if (!entityFields) return;

          filters.rules.forEach(rule => {
            const dbField = entityFields[rule.field];
            if (!dbField) return; // Skip unknown/invalid fields to prevent injection

            const op = String(rule.operator).toLowerCase();
            const val = String(rule.value || '');

            if (op === 'is_null') {
              conds.push(`${dbField} IS NULL`);
            } else if (op === 'is_not_null') {
              conds.push(`${dbField} IS NOT NULL`);
            } else {
              const validOps = {
                '=': '=',
                '>': '>',
                '<': '<',
                '>=': '>=',
                '<=': '<=',
                'like': 'ILIKE'
              };
              const sqlOp = validOps[op];
              if (!sqlOp) return;

              if (sqlOp === 'ILIKE') {
                params.push(`%${val}%`);
              } else {
                params.push(val);
              }
              conds.push(`${dbField} ${sqlOp} $${params.length}`);
            }
          });
        };

        applyRulesFilter();

        const buildWhere = () => (conds.length ? `WHERE ${conds.join(' AND ')}` : '');

        if (source === 'contracts') {
          applyDateFilter('c.created_at');
          const where = buildWhere();
          queryStr = `
            SELECT c.name,
                   c.status,
                   c.amount,
                   c.expiration_date AS date,
                   c.assigned_to AS "assignedTo"
            FROM contracts c
            ${where}
            ORDER BY c.created_at DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
          countQuery = `SELECT COUNT(*) FROM contracts c ${where}`;
        } else if (source === 'projects') {
          applyDateFilter('p.created_at');
          const where = buildWhere();

          if (groupBy === 'status') {
            queryStr = `
              SELECT p.status,
                     COUNT(*)::int AS "projectsCount",
                     COALESCE(SUM(p.budget), 0) AS amount
              FROM projects p
              ${where}
              GROUP BY p.status
              ORDER BY amount DESC
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            countQuery = `SELECT COUNT(DISTINCT p.status) FROM projects p ${where}`;
          } else {
            queryStr = `
              SELECT p.name,
                     p.status,
                     p.budget AS amount,
                     p.deadline AS date,
                     p.manager AS "assignedTo"
              FROM projects p
              ${where}
              ORDER BY p.created_at DESC
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            countQuery = `SELECT COUNT(*) FROM projects p ${where}`;
          }
        } else if (source === 'tasks') {
          applyDateFilter('t.due_date');
          const where = buildWhere();
          queryStr = `
            SELECT t.title AS name,
                   t.status,
                   NULL AS amount,
                   t.due_date AS date,
                   t.assignee AS "assignedTo",
                   p.name AS "projectName"
            FROM tasks t
            LEFT JOIN project_stages ps ON ps.id = t.project_stage_id
            LEFT JOIN projects p ON p.id = ps.project_id
            ${where}
            ORDER BY t.due_date DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
          countQuery = `SELECT COUNT(*) FROM tasks t ${where}`;
        } else if (source === 'contractors') {
          applyDateFilter('c.created_at');
          const where = buildWhere();
          queryStr = `
            SELECT c.name,
                   c.inn,
                   'active' AS status,
                   c.created_at AS date,
                   NULL AS amount,
                   NULL AS "assignedTo",
                   COALESCE(fp.total_income, 0) AS "amountTotal",
                   COALESCE(fp.projects_count, 0) AS "projectsCount"
            FROM contractors c
            LEFT JOIN LATERAL (
              SELECT COUNT(DISTINCT p.id) AS projects_count,
                     COALESCE(SUM(f.amount) FILTER (WHERE f.kind = 'income'), 0) AS total_income
              FROM finance_payments f
              LEFT JOIN projects p ON p.id = f.project_id
              WHERE f.contractor_id = c.id
            ) fp ON true
            ${where}
            ORDER BY fp.total_income DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
          countQuery = `SELECT COUNT(*) FROM contractors c ${where}`;
        } else if (source === 'marketing') {
          applyDateFilter('m.created_at');
          const where = buildWhere();

          if (groupBy === 'status') {
            queryStr = `
              SELECT m.status,
                     COUNT(*)::int AS "campaignsCount",
                     COALESCE(SUM(m.budget), 0) AS amount
              FROM marketing_campaigns m
              ${where}
              GROUP BY m.status
              ORDER BY amount DESC
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            countQuery = `SELECT COUNT(DISTINCT m.status) FROM marketing_campaigns m ${where}`;
          } else {
            queryStr = `
              SELECT m.name,
                     m.status,
                     m.budget AS amount,
                     m.end_date AS date,
                     NULL AS "assignedTo"
              FROM marketing_campaigns m
              ${where}
              ORDER BY m.created_at DESC
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            countQuery = `SELECT COUNT(*) FROM marketing_campaigns m ${where}`;
          }
        } else {
          applyDateFilter('fp.payment_date');
          const where = buildWhere();

          if (groupBy === 'kind') {
            queryStr = `
              SELECT fp.kind,
                     SUM(fp.amount) AS amount,
                     COUNT(*)::int AS "paymentsCount"
              FROM finance_payments fp
              ${where}
              GROUP BY fp.kind
              ${buildOrderBy('amount DESC')}
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            countQuery = `SELECT COUNT(DISTINCT fp.kind) FROM finance_payments fp ${where}`;
          } else if (groupBy === 'project') {
            queryStr = `
              SELECT COALESCE(p.name, 'Без проекта') AS "projectName",
                     SUM(fp.amount) AS amount,
                     COUNT(*)::int AS "paymentsCount"
              FROM finance_payments fp
              LEFT JOIN projects p ON p.id = fp.project_id
              ${where}
              GROUP BY p.name
              ${buildOrderBy('amount DESC')}
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            countQuery = `SELECT COUNT(DISTINCT COALESCE(p.name, 'Без проекта')) FROM finance_payments fp LEFT JOIN projects p ON p.id = fp.project_id ${where}`;
          } else if (groupBy === 'contractor') {
            queryStr = `
              SELECT COALESCE(ctr.name, 'Без контрагента') AS "contractorName",
                     SUM(fp.amount) AS amount,
                     COUNT(*)::int AS "paymentsCount"
              FROM finance_payments fp
              LEFT JOIN contractors ctr ON ctr.id = fp.contractor_id
              ${where}
              GROUP BY ctr.name
              ${buildOrderBy('amount DESC')}
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            countQuery = `SELECT COUNT(DISTINCT COALESCE(ctr.name, 'Без контрагента')) FROM finance_payments fp LEFT JOIN contractors ctr ON ctr.id = fp.contractor_id ${where}`;
          } else {
            queryStr = `
              SELECT fp.payment_date AS date,
                     fp.kind,
                     fp.amount,
                     ctr.name AS "contractorName",
                     p.name AS "projectName",
                     fc.name AS "categoryName"
              FROM finance_payments fp
              LEFT JOIN contractors ctr ON ctr.id = fp.contractor_id
              LEFT JOIN projects p ON p.id = fp.project_id
              LEFT JOIN finance_expense_categories fc ON fc.id = fp.category_id
              ${where}
              ${buildOrderBy('fp.payment_date DESC')}
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            countQuery = `SELECT COUNT(*) FROM finance_payments fp ${where}`;
          }
        }

        const finalParams = [...params, limit, offset];
        const { rows } = await db.query(queryStr, finalParams);
        const { rows: total } = await db.query(countQuery, params);
        return { data: rows, totalRows: parseInt(total[0].count) };
      }

      default:
        return { data: [], totalRows: 0 };
    }
  } catch (error) {
    console.error('Report Preview Error:', error);
    return { data: [], totalRows: 0 };
  }
}

module.exports = {
  getReportPreview
};

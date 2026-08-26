const db = require('../../../db');
const logger = require('../../../utils/logger');
const {
  buildUnifiedStatuses,
  buildUnifiedPriorities,
  syncModulesTransaction,
  VALID_WRITE_TABLES,
  TABLES_WITH_COLOR,
  TABLES_WITH_MODULE,
  TABLES_WITH_SHOW_AS_TAB,
  TABLES_WITH_IS_ACTIVE,
} = require('../referencesHelpers');

class ReferencesService {
  async getCurrencies() {
    const { rows } = await db.query('SELECT id, name, symbol, exchange_rate, is_base FROM currency ORDER BY id');
    return rows;
  }

  async createCurrency({ id, name, symbol, exchange_rate = 1, is_base = false }) {
    const { rows } = await db.query(
      `INSERT INTO currency (id, name, symbol, exchange_rate, is_base)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, symbol=EXCLUDED.symbol,
         exchange_rate=EXCLUDED.exchange_rate, is_base=EXCLUDED.is_base
       RETURNING *`,
      [id.trim().toUpperCase(), name.trim(), symbol || '', exchange_rate, is_base]
    );
    return rows[0];
  }

  async updateCurrency(id, { name, symbol, exchange_rate, is_base }) {
    if (is_base) await db.query('UPDATE currency SET is_base=FALSE');
    const { rows } = await db.query(
      `UPDATE currency
       SET name=COALESCE($1,name), symbol=COALESCE($2,symbol),
           exchange_rate=COALESCE($3,exchange_rate), is_base=COALESCE($4,is_base)
       WHERE id=$5 RETURNING *`,
      [name || null, symbol || null, exchange_rate ?? null, is_base ?? null, id.toUpperCase()]
    );
    return rows[0];
  }

  async deleteCurrency(id) {
    const uppercaseId = id.toUpperCase();
    const { rows: [base] } = await db.query('SELECT is_base FROM currency WHERE id=$1', [uppercaseId]);
    if (base?.is_base) throw new Error('Нельзя удалить базовую валюту');
    await db.query('DELETE FROM currency WHERE id=$1', [uppercaseId]);
    return true;
  }

  async getAllReferences() {
    const financeStatusTable = await db.query("SELECT to_regclass('public.finance_invoice_status') AS table_name");
    const financeInvoiceStatuses = financeStatusTable.rows[0]?.tableName
      ? await db.query('SELECT * FROM finance_invoice_status ORDER BY displayorder')
      : { rows: [] };

    const [
      projectStatuses, projectStages, priorities, managers, taskStatuses,
      contractorStatuses, lawyerStatuses, caseStatuses, modules, definedTags,
      contractorTypes, legalForms, relationshipTypes, currencies, taxRegimes,
      calendarStatuses, contractStatuses, contractPaymentStatuses,
      marketingStatuses, marketingTypes,
    ] = await Promise.all([
      db.query('SELECT * FROM project_status ORDER BY displayorder'),
      db.query('SELECT * FROM project_stage ORDER BY displayorder'),
      db.query('SELECT * FROM priority ORDER BY displayorder'),
      db.query("SELECT u.name, u.id FROM users u WHERE u.role IN ('manager', 'admin', 'Менеджер', 'Администратор')"),
      db.query('SELECT * FROM task_status ORDER BY displayorder'),
      db.query('SELECT * FROM contractor_status ORDER BY displayorder'),
      db.query('SELECT * FROM lawyer_status ORDER BY displayorder'),
      db.query('SELECT * FROM case_status ORDER BY displayorder'),
      db.query('SELECT * FROM modules ORDER BY displayorder'),
      db.query('SELECT * FROM defined_tags ORDER BY displayorder, id'),
      db.query('SELECT * FROM contractor_type'),
      db.query(`
        SELECT f.code as id, f.*, g.name as group_name, g.display_order as group_display_order, g.show_as_tab as group_show_as_tab
        FROM legal_forms f
        LEFT JOIN legal_form_groups g ON f.group_id = g.id
        ORDER BY g.display_order, f.name
      `),
      db.query('SELECT * FROM relationship_type ORDER BY displayorder, id'),
      db.query('SELECT id, name, symbol, exchange_rate, is_base FROM currency ORDER BY id'),
      db.query('SELECT * FROM finance_tax_regimes WHERE is_active = TRUE ORDER BY id'),
      db.query('SELECT * FROM calendar_status ORDER BY displayorder'),
      db.query('SELECT * FROM contract_status ORDER BY displayorder'),
      db.query('SELECT * FROM contract_payment_status ORDER BY displayorder'),
      db.query('SELECT * FROM marketing_status ORDER BY displayorder'),
      db.query('SELECT * FROM marketing_type ORDER BY displayorder'),
    ]);

    const unifiedStatuses = buildUnifiedStatuses({
      contractorStatuses: contractorStatuses.rows,
      projectStatuses: projectStatuses.rows,
      taskStatuses: taskStatuses.rows,
      lawyerStatuses: lawyerStatuses.rows,
      caseStatuses: caseStatuses.rows,
      financeInvoiceStatuses: financeInvoiceStatuses.rows,
      calendarStatuses: calendarStatuses.rows,
      contractStatuses: contractStatuses.rows,
      contractPaymentStatuses: contractPaymentStatuses.rows,
      marketingStatuses: marketingStatuses.rows,
    });

    const unifiedPriorities = buildUnifiedPriorities(priorities.rows, modules.rows);

    const unifiedRelationshipTypes = relationshipTypes.rows.map(rt => ({
      ...rt,
      module: rt.module || 'contractors',
    }));

    return {
      projectStatuses: projectStatuses.rows,
      projectStages: projectStages.rows,
      priorities: priorities.rows,
      managers: managers.rows,
      taskStatuses: taskStatuses.rows,
      statuses: unifiedStatuses,
      tags: definedTags.rows,
      prioritySettings: unifiedPriorities,
      relationshipTypes: unifiedRelationshipTypes,
      modules: modules.rows,
      contractorTypes: contractorTypes.rows,
      legalForms: legalForms.rows,
      currencies: currencies.rows,
      taxRegimes: taxRegimes.rows,
      marketingStatuses: marketingStatuses.rows,
      marketingTypes: marketingTypes.rows,
    };
  }

  async syncModules(modulesList, dryRun) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await syncModulesTransaction(client, modulesList, dryRun);
      if (dryRun) await client.query('ROLLBACK');
      else await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('syncModules failed', err);
      throw err;
    } finally {
      client.release();
    }
  }

  async getLegalFormGroups() {
    const { rows } = await db.query('SELECT * FROM legal_form_groups ORDER BY display_order');
    return rows;
  }

  async createLegalFormGroup({ id, name, nameRu, displayOrder, color, showAsTab }) {
    const { rows } = await db.query(
      `INSERT INTO legal_form_groups (id, name, name_ru, display_order, color, show_as_tab)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, name_ru=EXCLUDED.name_ru,
         display_order=EXCLUDED.display_order, color=EXCLUDED.color, show_as_tab=EXCLUDED.show_as_tab
       RETURNING *`,
      [id.trim(), name.trim(), nameRu || null, displayOrder || 0, color || '#3B82F6', showAsTab ?? true]
    );
    return rows[0];
  }

  async updateLegalFormGroup(id, { name, nameRu, displayOrder, color, showAsTab }) {
    const { rows } = await db.query(
      `UPDATE legal_form_groups
       SET name=COALESCE($1,name), name_ru=COALESCE($2,name_ru), display_order=COALESCE($3,display_order),
           color=COALESCE($4,color), show_as_tab=COALESCE($5,show_as_tab), updated_at=CURRENT_TIMESTAMP
       WHERE id=$6 RETURNING *`,
      [name || null, nameRu || null, displayOrder !== undefined ? displayOrder : null,
       color || null, showAsTab !== undefined ? showAsTab : null, id]
    );
    return rows.length ? rows[0] : null;
  }

  async deleteLegalFormGroup(id) {
    await db.query('DELETE FROM legal_form_groups WHERE id=$1', [id]);
    return true;
  }

  async getPositions() {
    const { rows } = await db.query('SELECT * FROM positions ORDER BY displayorder, name');
    return rows;
  }

  async getLegalForms() {
    const { rows } = await db.query(`
      SELECT f.code as id, f.*, g.name as group_name, g.display_order as group_display_order, g.show_as_tab as group_show_as_tab
      FROM legal_forms f
      LEFT JOIN legal_form_groups g ON f.group_id = g.id
      ORDER BY g.display_order, f.name
    `);
    return rows;
  }

  async createLegalForm({ id, name, color, group_id, show_as_tab, keywords }) {
    const code = id.trim().toUpperCase();
    const { rows } = await db.query(
      `INSERT INTO legal_forms (code, name, color, group_id, show_as_tab, keywords)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, color=EXCLUDED.color,
         group_id=EXCLUDED.group_id, show_as_tab=EXCLUDED.show_as_tab, keywords=EXCLUDED.keywords
       RETURNING *`,
      [code, name.trim(), color || '#3B82F6', group_id || null, show_as_tab ?? true, keywords || '']
    );
    return rows[0];
  }

  async updateLegalForm(id, { name, color, groupId, group_id, keywords, showAsTab, show_as_tab }) {
    const code = id.toUpperCase();
    const gId = groupId !== undefined ? groupId : group_id;
    const tab = showAsTab !== undefined ? showAsTab : show_as_tab;

    const { rows: existingRows } = await db.query('SELECT * FROM legal_forms WHERE code = $1', [code]);
    if (!existingRows.length) return null;
    const existing = existingRows[0];

    const { rows } = await db.query(
      `UPDATE legal_forms
       SET name = $1,
           color = $2,
           group_id = $3,
           keywords = $4,
           show_as_tab = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE code = $6 RETURNING *`,
      [
        name || existing.name,
        color || existing.color || '#3B82F6',
        gId === undefined ? existing.group_id : (gId || null),
        keywords === undefined ? existing.keywords : (keywords || ''),
        tab === undefined ? existing.show_as_tab : (String(tab) === 'true'),
        code,
      ]
    );
    return rows[0];
  }

  async deleteLegalForm(id) {
    await db.query('DELETE FROM legal_forms WHERE code=$1', [id.toUpperCase()]);
    return true;
  }

  async createGenericReference(table, data) {
    if (!VALID_WRITE_TABLES.includes(table)) throw new Error('Invalid table name');
    const { id, name, displayOrder, color, module, showAsTab } = data;
    const finalId = id || (table === 'defined_tags' ? `tag-${Date.now()}` : name.toLowerCase().replace(/\s+/g, '_'));
    const hasColor = TABLES_WITH_COLOR.has(table);
    const hasModule = TABLES_WITH_MODULE.has(table);
    const hasShowAsTab = TABLES_WITH_SHOW_AS_TAB.has(table);

    const columns = ['id', 'name'];
    const values = [finalId, name];

    const push = (col, val) => { columns.push(col); values.push(val); };
    if (displayOrder !== undefined) push('displayorder', displayOrder);
    if (hasColor && color) push('color', color);
    if (hasModule && module) push('module', module);
    if (hasShowAsTab && showAsTab !== undefined) push('show_as_tab', showAsTab);

    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const conflictCols = columns.filter(c => c !== 'id');
    const conflictClause = conflictCols.length > 0
      ? `ON CONFLICT (id) DO UPDATE SET ${conflictCols.map(c => `${c}=EXCLUDED.${c}`).join(', ')}`
      : 'ON CONFLICT (id) DO NOTHING';

    const { rows } = await db.query(
      `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders.join(',')}) ${conflictClause} RETURNING *`,
      values
    );

    if (!rows.length && conflictCols.length === 0) {
      const { rows: existing } = await db.query(`SELECT * FROM ${table} WHERE id=$1`, [finalId]);
      return existing[0];
    }
    return rows[0];
  }

  async updateGenericReference(table, id, data) {
    if (!VALID_WRITE_TABLES.includes(table)) throw new Error('Invalid table name');
    
    const name = data.name;
    const displayOrder = data.displayOrder !== undefined ? data.displayOrder : data.displayorder;
    const color = data.color;
    const showAsTab = data.showAsTab !== undefined ? data.showAsTab : data.show_as_tab;
    const isActive = data.isActive !== undefined ? data.isActive : data.is_active;

    const hasColor = TABLES_WITH_COLOR.has(table);
    const hasShowAsTab = TABLES_WITH_SHOW_AS_TAB.has(table);
    const hasIsActive = TABLES_WITH_IS_ACTIVE.has(table);

    const setClauses = [];
    const values = [];

    const push = (expr, val) => { values.push(val); setClauses.push(`${expr} = $${values.length}`); };

    if (name !== undefined) push('name', name);
    if (displayOrder !== undefined) push('displayorder', displayOrder === null ? null : Number(displayOrder));
    if (hasColor && color !== undefined) push('color', color);
    if (hasShowAsTab && showAsTab !== undefined) push('show_as_tab', showAsTab === null ? null : (String(showAsTab) === 'true'));
    if (hasIsActive && isActive !== undefined) push('is_active', isActive === null ? null : (String(isActive) === 'true'));

    if (!setClauses.length) return null; // No changes

    values.push(id);
    const { rows } = await db.query(
      `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id=$${values.length} RETURNING *`, values
    );
    return rows.length ? rows[0] : false;
  }

  async deleteGenericReference(table, id) {
    if (!VALID_WRITE_TABLES.includes(table)) throw new Error('Invalid table name');
    const { rows } = await db.query(`DELETE FROM ${table} WHERE id=$1 RETURNING *`, [id]);
    if (!rows.length) return false;
    return true;
  }
}

module.exports = new ReferencesService();
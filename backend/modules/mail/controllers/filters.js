/**
 * Mail Module - Filters Controller
 * CRUD фильтров, применение фильтров к письмам
 */

const db = require('../../../db');
const { v4: uuidv4 } = require('uuid');
const helpers = require('../utils/helpers');
const logger = require('../../../utils/logger');

// ----- GET filters -----

async function getFilters(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { rows } = await db.query(
      'SELECT id, filter_name, description, match_type, target_folder_id, apply_star, apply_read, delete_mail, forward_to, apply_label_id, is_active FROM mail_filters WHERE account_id = $1 AND user_id = $2 ORDER BY display_order ASC',
      [req.params.accountId, userId]
    );
    res.json(rows);
  } catch (error) {
    logger.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
}

// ----- CREATE filter -----

async function createFilter(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { accountId, filterName, description, matchType, targetFolderId, applyStar, applyRead, deleteMail, forwardTo, applyLabelId } = req.body;
  try {
    if (!accountId || !filterName || !matchType) {
      return res.status(400).json({ error: 'Account ID, filter name, and match type required' });
    }

    const id = `filter_${uuidv4()}`;
    const { rows } = await db.query(
      `INSERT INTO mail_filters (id, account_id, user_id, filter_name, description, match_type, target_folder_id, apply_star, apply_read, delete_mail, forward_to, apply_label_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
       RETURNING id, filter_name, match_type, delete_mail, forward_to, apply_label_id, is_active`,
      [id, accountId, userId, filterName, description, matchType, targetFolderId, applyStar || false, applyRead || false, deleteMail || false, forwardTo || null, applyLabelId || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Error creating filter:', error);
    res.status(500).json({ error: 'Failed to create filter' });
  }
}

// ----- UPDATE filter -----

async function updateFilter(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { filterName, description, matchType, targetFolderId, applyStar, applyRead, deleteMail, forwardTo, applyLabelId, isActive } = req.body;
  try {
    const fields = [];
    const values = [];
    let p = 1;

    if (filterName !== undefined) { fields.push(`filter_name = $${p++}`); values.push(filterName); }
    if (description !== undefined) { fields.push(`description = $${p++}`); values.push(description); }
    if (matchType !== undefined) { fields.push(`match_type = $${p++}`); values.push(matchType); }
    if (targetFolderId !== undefined) { fields.push(`target_folder_id = $${p++}`); values.push(targetFolderId); }
    if (applyStar !== undefined) { fields.push(`apply_star = $${p++}`); values.push(applyStar); }
    if (applyRead !== undefined) { fields.push(`apply_read = $${p++}`); values.push(applyRead); }
    if (deleteMail !== undefined) { fields.push(`delete_mail = $${p++}`); values.push(deleteMail); }
    if (forwardTo !== undefined) { fields.push(`forward_to = $${p++}`); values.push(forwardTo); }
    if (applyLabelId !== undefined) { fields.push(`apply_label_id = $${p++}`); values.push(applyLabelId); }
    if (isActive !== undefined) { fields.push(`is_active = $${p++}`); values.push(isActive); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.filterId, userId);

    const query = `UPDATE mail_filters SET ${fields.join(', ')} WHERE id = $${p++} AND user_id = $${p++} RETURNING *`;
    const { rows } = await db.query(query, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Filter not found' });

    res.json(rows[0]);
  } catch (error) {
    logger.error('Error updating filter:', error);
    res.status(500).json({ error: 'Failed to update filter' });
  }
}

// ----- DELETE filter -----

async function deleteFilter(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { rows } = await db.query(
      'DELETE FROM mail_filters WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.filterId, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Filter not found' });

    res.json({ message: 'Filter deleted' });
  } catch (error) {
    logger.error('Error deleting filter:', error);
    res.status(500).json({ error: 'Failed to delete filter' });
  }
}

// ----- APPLY single filter -----

async function applyFilter(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { filterId } = req.params;
  const { limit = 1000, dryRun = false } = req.body;

  try {
    const { rows: filterRows } = await db.query(
      'SELECT * FROM mail_filters WHERE id = $1 AND user_id = $2', [filterId, userId]
    );
    if (filterRows.length === 0) return res.status(404).json({ error: 'Filter not found' });

    const filter = filterRows[0];
    const filterEngine = require('../services/mailFilterEngine');

    const { rows: mails } = await db.query(
      `SELECT * FROM mail WHERE account_id = $1 AND user_id = $2 ORDER BY date DESC LIMIT $3`,
      [filter.account_id, userId, limit]
    );

    let matchedCount = 0;
    const actions = [];

    for (const mail of mails) {
      const result = await filterEngine.applyFilter(mail, filter);
      if (result.matched) {
        matchedCount++;
        actions.push(...result.actions);
        if (filter.apply_once) break;
      }
    }

    res.json({
      success: true,
      message: `Фильтр применён к ${matchedCount} письму(ам)`,
      processed: mails.length, matched: matchedCount,
      actions: dryRun ? actions : undefined
    });
  } catch (error) {
    logger.error('Error applying filter:', error);
    res.status(500).json({ error: 'Failed to apply filter', details: error.message });
  }
}

// ----- APPLY all filters -----

async function applyAllFilters(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { accountId, limit = 1000, dryRun = false } = req.body;
  try {
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });

    const account = await helpers.requireAccount(accountId, userId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const filterEngine = require('../services/mailFilterEngine');
    const result = await filterEngine.applyFiltersToExistingMails(accountId, { limit, dryRun });

    res.json({
      success: true,
      message: `Фильтры применены к ${result.matched} письму(ам) из ${result.processed}`,
      ...result
    });
  } catch (error) {
    logger.error('Error applying all filters:', error);
    res.status(500).json({ error: 'Failed to apply filters', details: error.message });
  }
}

module.exports = {
  getFilters,
  createFilter,
  updateFilter,
  deleteFilter,
  applyFilter,
  applyAllFilters,
};

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../../../db');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted } = require('../../../utils/responseHelpers');
const logger = require('../../../utils/logger');
const { suggestCourts } = require('../../../services/dadataService');

// ─────────────────────────────────────────────
// DaData Court Suggest (проксируем через бэкенд,
// чтобы API-ключ не попадал на фронтенд)
// ─────────────────────────────────────────────

/**
 * POST /api/courts/suggest
 * Полнотекстовый поиск судов через DaData
 * Body: { query: string, courtType?: string, count?: number }
 */
router.post('/suggest', asyncHandler(async (req, res) => {
  const { query, courtType, count } = req.body;

  if (!query || String(query).trim().length < 2) {
    return sendSuccess(res, []);
  }

  const suggestions = await suggestCourts(String(query).trim(), { courtType, count });
  sendSuccess(res, suggestions);
}));

/**
 * POST /api/courts/select
 * Сохранить выбранный суд из DaData в локальную БД (upsert по dadata_code или name).
 * Возвращает запись суда из БД.
 * Body: { name, dadataCode?, courtType?, courtTypeName?, inn?, address?, legalAddress?, website? }
 */
router.post('/select', asyncHandler(async (req, res) => {
  const {
    name, dadataCode, courtType, courtTypeName,
    inn, address, legalAddress, website,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  // Upsert: обновляем если уже есть по dadata_code или name
  const existsQuery = dadataCode
    ? 'SELECT id FROM courts WHERE dadata_code = $1 LIMIT 1'
    : 'SELECT id FROM courts WHERE name = $1 LIMIT 1';
  const existsParam = dadataCode ? dadataCode : name;

  const { rows: existing } = await db.query(existsQuery, [existsParam]);

  let court;
  if (existing.length > 0) {
    // Обновляем существующий
    const { rows } = await db.query(
      `UPDATE courts SET
         name = $1, dadata_code = $2, court_type = $3, court_type_name = $4,
         inn = $5, address = $6, legal_address = $7, website = $8
       WHERE id = $9 RETURNING *`,
      [name, dadataCode || null, courtType || null, courtTypeName || null,
       inn || null, address || null, legalAddress || null, website || null,
       existing[0].id]
    );
    court = rows[0];
    logger.info(`[Courts] Updated court from DaData: ${name}`);
  } else {
    // Создаём новый
    const id = `c${crypto.randomUUID().slice(0, 8)}`;
    const { rows } = await db.query(
      `INSERT INTO courts (id, name, dadata_code, court_type, court_type_name, inn, address, legal_address, website)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, name, dadataCode || null, courtType || null, courtTypeName || null,
       inn || null, address || null, legalAddress || null, website || null]
    );
    court = rows[0];
    logger.info(`[Courts] Saved new court from DaData: ${name}`);
  }

  sendSuccess(res, court);
}));

// ─────────────────────────────────────────────
// Судьи
// ─────────────────────────────────────────────

router.get('/judges', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT j.*, c.name as court_name
    FROM judges j
    LEFT JOIN courts c ON j.court_id = c.id
    ORDER BY j.name
  `);
  sendSuccess(res, rows);
}));

router.get('/judges/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query('SELECT * FROM judges WHERE id = $1', [id]);
  if (rows.length === 0) return sendNotFound(res);
  sendSuccess(res, rows[0]);
}));

router.post('/judges', asyncHandler(async (req, res) => {
  const { name, court_id, secretary_phone, assistant_phone, email, office, composition } = req.body;
  const id = `j${crypto.randomUUID().slice(0, 8)}`;
  const { rows } = await db.query(
    `INSERT INTO judges (id, name, court_id, secretary_phone, assistant_phone, email, office, composition)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [id, name, court_id || null, secretary_phone || null, assistant_phone || null, email || null, office || null, composition || null]
  );
  sendCreated(res, rows[0]);
}));

router.put('/judges/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, court_id, secretary_phone, assistant_phone, email, office, composition } = req.body;
  const { rows } = await db.query(
    `UPDATE judges SET
       name = $1,
       court_id = $2,
       secretary_phone = $3,
       assistant_phone = $4,
       email = $5,
       office = $6,
       composition = $7
     WHERE id = $8 RETURNING *`,
    [name, court_id, secretary_phone, assistant_phone, email, office, composition, id]
  );
  if (rows.length === 0) return sendNotFound(res);
  sendSuccess(res, rows[0]);
}));

router.delete('/judges/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await db.query('DELETE FROM judges WHERE id = $1', [id]);
  if (rowCount === 0) return sendNotFound(res);
  sendDeleted(res);
}));

// ─────────────────────────────────────────────
// Суды (локальная БД)
// ─────────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM courts ORDER BY name');
  sendSuccess(res, rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query('SELECT * FROM courts WHERE id = $1', [id]);
  if (rows.length === 0) return sendNotFound(res);
  sendSuccess(res, rows[0]);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  const id = `c${crypto.randomUUID().slice(0, 8)}`;
  const { rows } = await db.query(
    'INSERT INTO courts (id, name, address) VALUES ($1, $2, $3) RETURNING *',
    [id, name, address || '']
  );
  sendCreated(res, rows[0]);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;
  const { rows } = await db.query(
    'UPDATE courts SET name = $1, address = $2 WHERE id = $3 RETURNING *',
    [name, address, id]
  );
  if (rows.length === 0) return sendNotFound(res);
  sendSuccess(res, rows[0]);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await db.query('DELETE FROM courts WHERE id = $1', [id]);
  if (rowCount === 0) return sendNotFound(res);
  sendDeleted(res);
}));

module.exports = router;

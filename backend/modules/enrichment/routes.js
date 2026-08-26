// backend/routes/enrichment.js
/**
 * /api/enrichment — обогащение данных контрагентов из открытых источников.
 * Логика фоновых задач вынесена в enrichmentJob.js.
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const logger = require('../../utils/logger');
const { fetchEnrichmentData, applyEnrichment, FIELD_LABELS } = require('./services/enrichmentCore');
const { lookupByQuery } = require('./services/providers/nalog-fns');
const { makeJobId, saveJobProgress, runEnrichmentJob } = require('./services/enrichmentJob');

// GET /api/enrichment - базовая информация
router.get('/', (req, res) => {
  res.json({ message: 'Enrichment API. Use /enrichment/fields or /enrichment/batch-lookup/active for details.' });
});

// ─── POST /search ─────────────────────────────────────────────────────────────
router.post('/search', async (req, res) => {
  const { query } = req.body;
  if (!query || !String(query).trim()) {
    return res.status(400).json({ error: 'Пустой поисковый запрос' });
  }
  try {
    const result = await lookupByQuery(String(query).trim());
    if (!result) return res.status(404).json({ error: 'Не удалось найти данные по запросу' });
    res.json(result);
  } catch (err) {
    logger.error('enrichment search error', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /fields ──────────────────────────────────────────────────────────────
router.get('/fields', (req, res) => {
  res.json(Object.entries(FIELD_LABELS).map(([key, label]) => ({ key, label })));
});

// ─── GET /lookup-by-inn/:inn ─────────────────────────────────────────────────
router.get('/lookup-by-inn/:inn', async (req, res) => {
  const { inn } = req.params;
  if (!inn || !/^\d{10}$|^\d{12}$/.test(inn)) {
    return res.status(400).json({ error: 'Некорректный ИНН' });
  }

  try {
    const { source, data, error } = await fetchEnrichmentData({ inn });
    
    if (error && !data) {
      return res.status(422).json({ error });
    }

    if (!data) {
      return res.status(404).json({ error: 'Данные не найдены' });
    }

    res.json({ source, data });
  } catch (err) {
    logger.error(`enrichment lookup-by-inn error for INN ${inn}`, err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /lookup/:contractorId ────────────────────────────────────────────────
router.get('/lookup/:contractorId', async (req, res) => {
  const { contractorId } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT id, name, full_name, inn, ogrn, kpp, legal_address,
              director, director_position, registration_date, legal_form, email, phone,
              authorized_capital, tax_regime_id
       FROM contractors WHERE id = $1`,
      [contractorId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Контрагент не найден' });

    const contractor = rows[0];
    if (!contractor.inn) {
      return res.status(400).json({ error: 'У контрагента не указан ИНН — поиск невозможен' });
    }

    const { source, data, error } = await fetchEnrichmentData({
      id: contractor.id, inn: contractor.inn, name: contractor.name,
    });
    if (error && !data) return res.status(422).json({ error });

    const current = {
      name:             contractor.name,
      fullName:         contractor.fullName,
      inn:              contractor.inn,
      ogrn:             contractor.ogrn,
      kpp:              contractor.kpp,
      legalAddress:     contractor.legalAddress,
      director:         contractor.director,
      directorPosition: contractor.directorPosition,
      registrationDate: contractor.registrationDate,
      legalForm:        contractor.legalForm,
      authorizedCapital: contractor.authorizedCapital,
      taxRegimeId:       contractor.taxRegimeId,
    };

    const diff = {};
    for (const [field, label] of Object.entries(FIELD_LABELS)) {
      const newVal = data?.[field];
      if (newVal !== undefined) {
        diff[field] = {
          label,
          current: current[field] || null,
          fetched: newVal,
          changed: String(newVal || '').trim() !== String(current[field] || '').trim(),
        };
      }
    }

    await db.query(
      `INSERT INTO enrichment_log (contractor_id, source, status, data_after)
       VALUES ($1, $2, 'found', $3)`,
      [contractorId, source || 'unknown', JSON.stringify(data)]
    ).catch(() => {});

    res.json({ source, diff, raw: data });
  } catch (err) {
    logger.error(`enrichment lookup error for contractor ${contractorId}`, err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /apply/:contractorId ────────────────────────────────────────────────
router.post('/apply/:contractorId', async (req, res) => {
  const { contractorId } = req.params;
  const { fields, source, data } = req.body;
  const userId = req.headers['x-user-id'];

  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return res.status(400).json({ error: 'Не указаны поля для применения' });
  }
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Отсутствуют данные для применения' });
  }
  try {
    const { rows } = await db.query('SELECT * FROM contractors WHERE id = $1', [contractorId]);
    if (!rows.length) return res.status(404).json({ error: 'Контрагент не найден' });

    const result = await applyEnrichment(
      parseInt(contractorId), rows[0], data, fields, source || 'manual', userId
    );
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error(`enrichment apply error for contractor ${contractorId}`, err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /batch-lookup/start ─────────────────────────────────────────────────
router.post('/batch-lookup/start', async (req, res) => {
  try {
    const { ids, skipFull = true } = req.body;

    const { rows: running } = await db.query(
      `SELECT id FROM enrichment_jobs WHERE status IN ('running','pending') ORDER BY started_at DESC LIMIT 1`
    );
    if (running.length) {
      return res.status(409).json({ error: 'Задача уже выполняется', jobId: running[0].id });
    }

    const { rows: paused } = await db.query(
      `SELECT * FROM enrichment_jobs WHERE status = 'paused' ORDER BY started_at DESC LIMIT 1`
    );
    if (paused.length) {
      return res.status(409).json({ error: 'Задача приостановлена', jobId: paused[0].id, paused: true });
    }

    let query, params = [];
    if (ids && Array.isArray(ids) && ids.length > 0) {
      query = `SELECT id, name, inn, full_name, ogrn, kpp, legal_address,
             director, director_position, registration_date, legal_form,
             authorized_capital, tax_regime_id, enriched_at
               FROM contractors WHERE id = ANY($1) AND inn IS NOT NULL AND inn != ''`;
      params = [ids];
    } else {
      query = `SELECT id, name, inn, full_name, ogrn, kpp, legal_address,
             director, director_position, registration_date, legal_form,
             authorized_capital, tax_regime_id, enriched_at
               FROM contractors WHERE inn IS NOT NULL AND inn != '' ORDER BY name`;
    }

    const { rows: contractors } = await db.query(query, params);
    if (!contractors.length) return res.json({ jobId: null, message: 'Нет контрагентов с ИНН' });

    const jobId = makeJobId();
    await db.query(
      `INSERT INTO enrichment_jobs (id, status, progress, total, skip_count, results, processed_contractor_ids, started_at)
       VALUES ($1, 'pending', 0, $2, 0, '[]', '[]', NOW())`,
      [jobId, contractors.length]
    );

    runEnrichmentJob(jobId, contractors, skipFull === true || skipFull === undefined).catch(async err => {
      logger.error('enrichment job error', err);
      await saveJobProgress(jobId, { status: 'error', error: err.message });
    });

    res.json({ jobId, total: contractors.length });
  } catch (err) {
    logger.error('enrichment start error', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /batch-lookup/stop ──────────────────────────────────────────────────
router.post('/batch-lookup/stop', async (req, res) => {
  try {
    await db.query(`UPDATE enrichment_jobs SET status = 'paused' WHERE status IN ('running','pending')`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /batch-lookup/finish ────────────────────────────────────────────────
router.post('/batch-lookup/finish', async (req, res) => {
  try {
    const { rows: [job] } = await db.query(
      `SELECT * FROM enrichment_jobs WHERE status IN ('paused','running','pending') ORDER BY started_at DESC LIMIT 1`
    );
    if (!job) return res.status(404).json({ error: 'Нет активных задач' });
    await db.query(
      `UPDATE enrichment_jobs SET status = 'done', finished_at = NOW(), current_name = NULL WHERE id = $1`,
      [job.id]
    );
    res.json({ ok: true, jobId: job.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /batch-lookup/continue ─────────────────────────────────────────────
router.post('/batch-lookup/continue', async (req, res) => {
  try {
    const { skipFull = true } = req.body;
    const { rows: [job] } = await db.query(
      `SELECT * FROM enrichment_jobs WHERE status = 'paused' ORDER BY started_at DESC LIMIT 1`
    );
    if (!job) return res.status(404).json({ error: 'Нет приостановленных задач' });

    const { rows: allContractors } = await db.query(
      `SELECT id, name, inn, full_name, ogrn, kpp, legal_address,
              director, director_position, registration_date, legal_form,
              authorized_capital, tax_regime_id, enriched_at
       FROM contractors WHERE inn IS NOT NULL AND inn != '' ORDER BY name`
    );

    const alreadyDone = job.progress ?? 0;
    const remaining = allContractors.slice(alreadyDone);

    if (!remaining.length) {
      await db.query(`UPDATE enrichment_jobs SET status = 'done', finished_at = NOW() WHERE id = $1`, [job.id]);
      return res.json({ jobId: job.id, total: 0, message: 'Все контрагенты уже обработаны' });
    }

    await db.query(`UPDATE enrichment_jobs SET status = 'pending', current_name = NULL WHERE id = $1`, [job.id]);

    runEnrichmentJob(job.id, remaining, skipFull).catch(async err => {
      logger.error('enrichment continue error', err);
      await saveJobProgress(job.id, { status: 'error', error: err.message });
    });

    res.json({ jobId: job.id, total: allContractors.length, progress: alreadyDone });
  } catch (err) {
    logger.error('enrichment continue error', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /batch-lookup/reset ─────────────────────────────────────────────────
router.post('/batch-lookup/reset', async (req, res) => {
  try {
    await db.query(
      `UPDATE enrichment_jobs SET status = 'error', error = 'Принудительно сброшено', finished_at = NOW()
       WHERE status IN ('running','pending','paused')`
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /batch-lookup/status/:jobId ─────────────────────────────────────────
router.get('/batch-lookup/status/:jobId', async (req, res) => {
  try {
    const { rows: [job] } = await db.query(
      'SELECT * FROM enrichment_jobs WHERE id = $1', [req.params.jobId]
    );
    if (!job) return res.status(404).json({ error: 'Задача не найдена' });
    res.json({
      status: job.status, progress: job.progress, total: job.total,
      skipCount: job.skip_count, currentName: job.current_name,
      results: job.results ?? [], error: job.error || null,
      startedAt: job.started_at, finishedAt: job.finished_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /batch-lookup/active ─────────────────────────────────────────────────
router.get('/batch-lookup/active', async (req, res) => {
  try {
    const { rows: [job] } = await db.query(
      `SELECT id, status, progress, total, skip_count, current_name, started_at, finished_at
       FROM enrichment_jobs ORDER BY started_at DESC LIMIT 1`
    );
    res.json(job ? {
      jobId: job.id, status: job.status, progress: job.progress,
      total: job.total, skipCount: job.skip_count,
      currentName: job.current_name,
      startedAt: job.started_at, finishedAt: job.finished_at,
    } : null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /batch-apply ────────────────────────────────────────────────────────
router.post('/batch-apply', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { items } = req.body;
  if (!items || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Нет данных для применения' });
  }

  let totalApplied = 0;
  const errors = [];
  const appliedIds = [];

  for (const item of items) {
    try {
      const { rows } = await db.query('SELECT * FROM contractors WHERE id = $1', [item.contractorId]);
      if (!rows.length) { errors.push({ contractorId: item.contractorId, error: 'Не найден' }); continue; }
      const result = await applyEnrichment(
        parseInt(item.contractorId), rows[0], item.data, item.fields,
        item.source || 'admin-batch', userId
      );
      totalApplied += result.updated || 0;
      appliedIds.push(item.contractorId);
    } catch (err) {
      errors.push({ contractorId: item.contractorId, error: err.message });
    }
  }

  if (appliedIds.length > 0) {
    const { rows: [activeJob] } = await db.query(
      `SELECT id, processed_contractor_ids, results FROM enrichment_jobs
       WHERE status IN ('running', 'pending', 'paused') ORDER BY started_at DESC LIMIT 1`
    );
    if (activeJob) {
      const processed = new Set(activeJob.processed_contractor_ids ? JSON.parse(activeJob.processed_contractor_ids) : []);
      const results   = activeJob.results ? JSON.parse(activeJob.results) : [];
      appliedIds.forEach(id => processed.add(id));
      const filtered = results.filter(r => !appliedIds.includes(r.contractorId));
      await db.query(
        `UPDATE enrichment_jobs SET processed_contractor_ids = $1, results = $2 WHERE id = $3`,
        [JSON.stringify(Array.from(processed)), JSON.stringify(filtered), activeJob.id]
      );
    }
  }

  res.json({ applied: totalApplied, errors });
});

// ─── GET /log/:contractorId ───────────────────────────────────────────────────
router.get('/log/:contractorId', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM enrichment_log WHERE contractor_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.params.contractorId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.runEnrichmentJobResume = runEnrichmentJob;

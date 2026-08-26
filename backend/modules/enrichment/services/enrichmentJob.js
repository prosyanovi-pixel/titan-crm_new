// backend/routes/enrichmentJob.js
/**
 * Основная логика фонового обогащения контрагентов (batch enrichment job).
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const { fetchEnrichmentData, FIELD_LABELS } = require('./enrichmentCore');

// Поля которые проверяются для определения «полноты» данных контрагента
const COMPLETENESS_FIELDS = [
  'ogrn', 'kpp', 'legal_address', 'director',
  'director_position', 'registration_date', 'legal_form', 'full_name',
];
// Если заполнено >= порога, пропускаем при батч-обогащении
const COMPLETENESS_THRESHOLD = 6;

/** Генерирует уникальный ID задачи. */
function makeJobId() {
  return `enrich_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Сохраняет промежуточный прогресс задачи в БД. */
async function saveJobProgress(jobId, patch) {
  try {
    const sets = [];
    const vals = [];
    let i = 1;
    for (const [k, v] of Object.entries(patch)) {
      sets.push(`${k} = $${i++}`);
      vals.push(typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
    }
    vals.push(jobId);
    await db.query(`UPDATE enrichment_jobs SET ${sets.join(', ')} WHERE id = $${i}`, vals);
  } catch (e) {
    logger.error('saveJobProgress error', e);
  }
}

/**
 * Запускает/продолжает задачу обогащения для списка контрагентов.
 * @param {string} jobId
 * @param {Array} contractors
 * @param {boolean} skipFull - пропускать уже заполненных
 */
async function runEnrichmentJob(jobId, contractors, skipFull = true) {
  const { rows: [jobRow] } = await db.query(
    'SELECT processed_contractor_ids FROM enrichment_jobs WHERE id = $1', [jobId]
  );
  const processedIds = new Set(
    jobRow?.processed_contractor_ids ? JSON.parse(jobRow.processed_contractor_ids) : []
  );

  await saveJobProgress(jobId, { status: 'running', total: contractors.length, progress: 0 });

  const results = [];
  let skipCount = 0;
  let progress = 0;

  logger.info(`[enrichment] Job ${jobId}: skipFull=${skipFull}, total=${contractors.length}, already_processed=${processedIds.size}`);

  for (const c of contractors) {
    // Проверяем, не остановили ли задачу
    const { rows: [chk] } = await db.query('SELECT status FROM enrichment_jobs WHERE id = $1', [jobId]);
    if (!chk || chk.status === 'cancelled' || chk.status === 'paused') break;

    if (processedIds.has(c.id)) {
      progress++;
      await saveJobProgress(jobId, { progress });
      continue;
    }

    await saveJobProgress(jobId, { current_name: c.name });

    if (skipFull === true) {
      // Пропускаем если уже обогащался ранее (enriched_at проставлен)
      if (c.enriched_at) {
        skipCount++;
        progress++;
        processedIds.add(c.id);
        await saveJobProgress(jobId, { progress, skip_count: skipCount, processed_contractor_ids: Array.from(processedIds) });
        await new Promise(r => setTimeout(r, 50));
        continue;
      }

      // Также пропускаем контрагентов с достаточно заполненными данными
      const filledCount = COMPLETENESS_FIELDS.filter(f => {
        const val = c[f];
        return val && String(val).trim() !== '';
      }).length;

      if (filledCount >= COMPLETENESS_THRESHOLD) {
        skipCount++;
        progress++;
        processedIds.add(c.id);
        await saveJobProgress(jobId, { progress, skip_count: skipCount, processed_contractor_ids: Array.from(processedIds) });
        await new Promise(r => setTimeout(r, 50));
        continue;
      }
    }

    try {
      const { source, data, error } = await fetchEnrichmentData({
        id: c.id, inn: c.inn, name: c.name,
      });

      if (error && !data) {
        results.push({ contractorId: c.id, name: c.name, inn: c.inn, error });
      } else {
        const current = {
          name: c.name, fullName: c.full_name, inn: c.inn,
          ogrn: c.ogrn, kpp: c.kpp, legalAddress: c.legal_address,
          director: c.director, directorPosition: c.director_position,
          registrationDate: c.registration_date, legalForm: c.legal_form,
          authorizedCapital: c.authorized_capital,
          taxRegimeId: c.tax_regime_id,
        };

        const diff = {};
        let changedCount = 0;
        for (const [field, label] of Object.entries(FIELD_LABELS)) {
          const newVal     = data?.[field];
          const currentVal = current[field];
          if (newVal !== undefined) {
            const changed = String(newVal || '').trim() !== String(currentVal || '').trim();
            diff[field] = { label, current: currentVal || null, fetched: newVal, changed };
            if (changed) changedCount++;
          }
        }
        results.push({ contractorId: c.id, name: c.name, inn: c.inn, source, diff, raw: data, changedCount });
      }
    } catch (err) {
      results.push({ contractorId: c.id, name: c.name, inn: c.inn, error: err.message });
    }

    processedIds.add(c.id);
    progress++;
    await saveJobProgress(jobId, { progress, results, processed_contractor_ids: Array.from(processedIds) });
    await new Promise(r => setTimeout(r, 800)); // пауза чтобы не поймать бан
  }

  const { rows: [finalChk] } = await db.query('SELECT status FROM enrichment_jobs WHERE id = $1', [jobId]);
  if (finalChk?.status !== 'paused') {
    await saveJobProgress(jobId, {
      status: 'done', progress, skip_count: skipCount, results,
      current_name: null, finished_at: new Date().toISOString(),
    });
  } else {
    await saveJobProgress(jobId, { progress, skip_count: skipCount, results, current_name: null });
  }
}

module.exports = { makeJobId, saveJobProgress, runEnrichmentJob };

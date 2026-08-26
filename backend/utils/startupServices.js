const db = require('../db');

async function initializeRuntimeServices(server) {
  try {
    const websocketServer = require('../modules/notifications/services/websocketServer');
    websocketServer.init(server);
    console.log('✅ WebSocket server initialized on /ws');
  } catch (error) {
    console.warn('Warning: WebSocket initialization failed:', error.message);
  }

  try {
    const cacheCleaner = require('../modules/settings/services/cacheCleaner');
    await cacheCleaner.init();
  } catch (error) {
    console.warn('Warning: CacheCleaner initialization failed:', error.message);
  }

  try {
    const projectCronService = require('../modules/projects/services/projectCronService');
    projectCronService.initCronJobs();
  } catch (error) {
    console.warn('Warning: projectCronService initialization failed:', error.message);
  }

  try {
    const syncScheduler = require('../modules/settings/services/syncScheduler');
    await syncScheduler.init();
  } catch (error) {
    console.warn('Warning: SyncScheduler initialization failed:', error.message);
  }

  try {
    const { rows } = await db.query(
      `SELECT id FROM enrichment_jobs WHERE status IN ('running','pending') ORDER BY started_at DESC LIMIT 1`
    );
    if (rows.length) {
      const jobId = rows[0].id;
      console.log(`[enrichment] Resuming unfinished job ${jobId}...`);
      await db.query(`UPDATE enrichment_jobs SET status = 'pending', current_name = NULL WHERE id = $1`, [jobId]);
      const { rows: [job] } = await db.query('SELECT * FROM enrichment_jobs WHERE id = $1', [jobId]);
      const processed = (job.results || []).map(r => r.contractorId);
      const { rows: remaining } = await db.query(
        `SELECT id, name, inn, full_name, ogrn, kpp, legal_address,
                director, director_position, registration_date, legal_form
         FROM contractors
         WHERE inn IS NOT NULL AND inn != ''
           AND id != ALL($1::int[])
         ORDER BY name`,
        [processed.length ? processed : [0]]
      );
      if (remaining.length) {
        const { runEnrichmentJobResume } = require('../modules/enrichment/routes');
        if (runEnrichmentJobResume) runEnrichmentJobResume(jobId, remaining);
      } else {
        await db.query(`UPDATE enrichment_jobs SET status = 'done', finished_at = NOW() WHERE id = $1`, [jobId]);
      }
    }
  } catch (error) {
    console.warn('[enrichment] Auto-resume error:', error.message);
  }
}

module.exports = {
  initializeRuntimeServices,
};
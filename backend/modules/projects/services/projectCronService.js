const cron = require('node-cron');
const db = require('../../../db');
const logger = require('../../../utils/logger');
// Ищем websocketServer глобально, если он есть
let websocketServer = null;
try {
  websocketServer = require('../../notifications/services/websocketServer');
} catch (e) {
  // Игнорируем, если модуль не найден
}

/**
 * Проверка просроченных этапов проектов.
 * Запускается раз в день.
 */
async function checkOverdueProjectStages() {
  try {
    logger.info('Starting check for overdue project stages...');

    // Ищем просроченные этапы (статус не completed и дедлайн в прошлом)
    const result = await db.query(`
      SELECT 
        ps.id as stage_id, 
        ps.name as stage_name, 
        ps.due_date,
        p.id as project_id, 
        p.name as project_name
      FROM project_stages ps
      JOIN projects p ON ps.project_id = p.id
      WHERE ps.status != 'completed'
        AND ps.due_date < CURRENT_DATE
        AND ps.due_date IS NOT NULL
    `);

    if (result.rows.length === 0) {
      logger.info('No overdue project stages found.');
      return;
    }

    logger.info(`Found ${result.rows.length} overdue project stages.`);

    // В идеале мы должны найти ID менеджера проекта. 
    // Для демо-версии или если manager_id нет, отправим админам (user_id = 1)
    for (const stage of result.rows) {
      const title = `Просрочен этап: ${stage.stage_name}`;
      const message = `Этап "${stage.stage_name}" в проекте "${stage.project_name}" просрочен (дедлайн: ${new Date(stage.due_date).toLocaleDateString('ru-RU')}).`;
      const link = `/projects/${stage.project_id}?tab=stages`;

      // Получаем админов (или хардкодим user_id 1 для совместимости)
      let admins = [{ id: 1 }];
      try {
        const usersRes = await db.query("SELECT id FROM users WHERE role = 'admin' OR username = 'admin'");
        if (usersRes.rows.length > 0) admins = usersRes.rows;
      } catch (e) {} // Таблица users может не существовать в таком виде

      for (const admin of admins) {
        try {
          await db.query(
            'INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1, $2, $3, $4, $5)',
            [admin.id, 'warning', title, message, link]
          );
        } catch (e) {
          // Таблица notifications может не поддерживаться или user_id не тот
        }

        if (websocketServer && typeof websocketServer.sendToUser === 'function') {
          websocketServer.sendToUser(admin.id, {
            type: 'project_stage_overdue',
            data: {
              stageId: stage.stage_id,
              projectId: stage.project_id,
              title,
              message,
              link,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    }
    
    logger.info('Overdue project stages check completed.');
  } catch (error) {
    logger.error('Error checking overdue project stages:', error);
  }
}

/**
 * Инициализация всех cron jobs модуля Projects
 */
function initCronJobs() {
  // Запуск каждый день в 09:00 (0 9 * * *)
  cron.schedule('0 9 * * *', () => {
    checkOverdueProjectStages();
  });
  
  logger.info('Project cron jobs initialized.');
}

module.exports = {
  initCronJobs,
  checkOverdueProjectStages,
};

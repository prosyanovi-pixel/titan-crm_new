const eventBus = require('../../utils/eventBus');
const db = require('../../db');

async function handleStageChange(data) {
  const { projectId, newStage, project } = data;
  if (!project || !project.workflowId) return;

  try {
    // Получаем шаги воркфлоу, привязанного к проекту
    const { rows: steps } = await db.query(
      `SELECT action_config FROM workflow_steps 
       WHERE workflow_id = $1 AND action_config->>'stageName' = $2`,
      [project.workflowId, newStage]
    );

    if (steps.length === 0) return;

    const stepConfig = steps[0].action_config;
    
    // Проверяем, есть ли настройка авто-задачи (autoTask) для этого этапа
    if (stepConfig && stepConfig.autoTask) {
      const { role, title } = stepConfig.autoTask;

      // Ищем пользователей с нужной ролью
      const { rows: users } = await db.query(
        `SELECT id FROM users WHERE position_role = $1 AND status = 'active' LIMIT 1`,
        [role]
      );

      const assignedToId = users.length > 0 ? users[0].id : null;

      // Создаем задачу
      await db.query(
        `INSERT INTO tasks (title, description, status, project_id, assigned_to_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [title, `Автоматическая задача сгенерирована при переходе проекта на этап "${newStage}".`, 'todo', projectId, assignedToId]
      );

      console.log(`[Sales Integration] Created auto-task "${title}" for project ${projectId}`);
    }
  } catch (error) {
    console.error(`[Sales Integration] Error handling stage change for project ${projectId}:`, error);
  }
}

// Подписываемся на событие смены этапа
eventBus.on('projects.stage_changed', handleStageChange);

module.exports = {
  handleStageChange
};

/**
 * Контроллеры модуля Dashboard
 * Обработчики HTTP-запросов для статистики
 */

const { asyncHandler } = require('../../utils/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');
const db = require('../../db');

/**
 * Нормализация статусов проектов
 * @param {string} s - Статус из БД
 * @returns {string} Человекочитаемый статус
 */
function normalizeProjectStatus(s) {
  const st = (s || '').toString().toLowerCase().trim();
  if (st === 'active') return 'В работе';
  if (st === 'pending') return 'Ожидание';
  if (st === 'finished') return 'Завершена';
  if (st === 'paused') return 'Приостановлена';
  return s;
}

/**
 * Форматирование времени
 * @param {string} dateString - Дата
 * @returns {string} Человекочитаемое время
 */
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Только что';
  if (diffHours < 24) return `${diffHours} часа назад`;
  if (diffHours < 48) return 'Вчера';
  return `${Math.floor(diffHours / 24)} дней назад`;
}

/**
 * Форматирование даты
 * @param {string} dateString - Дата
 * @returns {string} Дата в формате RU
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
}

/**
 * Форматирование валюты
 * @param {number} amount - Сумма
 * @returns {string} Отформатированная сумма
 */
function formatCurrency(amount) {
  const num = parseFloat(amount);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M ₽';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K ₽';
  }
  return num.toFixed(0) + ' ₽';
}

/**
 * Получение названия приоритета
 * @param {string} priority - Приоритет
 * @returns {string} Название приоритета
 */
function getPriorityName(priority) {
  const priorityMap = {
    'high': 'Высокий',
    'medium': 'Средний',
    'low': 'Низкий'
  };
  return priorityMap[priority] || priority;
}

/**
 * Получить статистику дашборда
 * @route GET /api/dashboard/stats
 * @returns {Object} Статистика дашборда
 */
async function getStats(req, res) {
  // Get contractors count
  const contractorsResult = await db.query('SELECT COUNT(*) as count FROM contractors');

  // Get total projects count
  const totalProjectsResult = await db.query('SELECT COUNT(*) as count FROM projects');

  // Get active projects count
  const activeProjectsResult = await db.query("SELECT COUNT(*) as count FROM projects WHERE status = 'active'");

  // Get total turnover (sum of all project budgets)
  const turnoverResult = await db.query('SELECT COALESCE(SUM(budget), 0) as total FROM projects');

  // Get total tasks count
  const totalTasksResult = await db.query('SELECT COALESCE(SUM(taskscount), 0) as count FROM projects');

  // Get recent activities
  const recentActivities = [];

  // Recent projects
  const recentProjects = await db.query(`
    SELECT id, name as title, status, deadline as date, 'project' as type
    FROM projects
    ORDER BY id DESC
    LIMIT 3
  `);

  recentActivities.push(...recentProjects.rows.map(p => ({
    id: p.id,
    title: p.title,
    type: p.type,
    date: p.date,
    dateText: p.date,
    time: p.date ? formatTime(p.date) : 'Недавно',
    status: normalizeProjectStatus(p.status)
  })));

  // Recent contractors
  const recentContractors = await db.query(`
    SELECT id, name as title, status, id as date, 'contractor' as type
    FROM contractors
    ORDER BY id DESC
    LIMIT 3
  `);
  
  recentActivities.push(...recentContractors.rows.map(c => ({
    id: c.id,
    title: c.title,
    type: c.type,
    date: c.date,
    dateText: c.date,
    time: c.date ? formatTime(c.date) : 'Недавно',
    status: c.status === 'active' ? 'Активен' : c.status === 'vip' ? 'VIP' : c.status
  })));

  // Take first 4 activities
  const finalActivities = recentActivities.slice(0, 4);

  // Get upcoming projects
  const upcomingProjectsResult = await db.query(`
    SELECT id, name as title, deadline, priority
    FROM projects
    WHERE deadline IS NOT NULL
    ORDER BY deadline ASC
    LIMIT 5
  `);

  const upcomingProjects = upcomingProjectsResult.rows.map(proj => ({
    ...proj,
    deadline: formatDate(proj.deadline),
    priority: getPriorityName(proj.priority),
    status: normalizeProjectStatus(proj.status)
  }));

  // Get quick stats
  const revenueGrowth = '+15%'; // Mock growth

  const newClientsResult = await db.query(`
    SELECT COUNT(*) as count
    FROM contractors
    WHERE type = 'client'
  `);

  // Calculate team efficiency
  const efficiencyResult = await db.query(`
    SELECT
      SUM(taskscount) as total_tasks,
      SUM(completedtasks) as completed_tasks
    FROM projects
  `);

  const totalTasks = parseInt(efficiencyResult.rows[0].total_tasks) || 0;
  const completedTasks = parseInt(efficiencyResult.rows[0].completed_tasks) || 0;
  const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  sendSuccess(res, {
    totalProjects: totalProjectsResult.rows[0].count,
    activeProjects: activeProjectsResult.rows[0].count,
    totalTasks: totalTasks,
    taskCompletion: taskCompletion,
    turnover: formatCurrency(turnoverResult.rows[0].total),
    recentActivities: finalActivities,
    upcomingProjects: upcomingProjects,
    quickStats: {
      revenueGrowth: revenueGrowth,
      newClients: newClientsResult.rows[0].count.toString(),
      taskCompletion: taskCompletion.toString() + '%'
    }
  });
}

module.exports = {
  getStats,
  // Экспортируем хелперы для тестов
  normalizeProjectStatus,
  formatTime,
  formatDate,
  formatCurrency,
  getPriorityName,
};

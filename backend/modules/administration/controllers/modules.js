const db = require('../../../db');
const { clearCache } = require('../../../utils/moduleSettingsLoader');
const eventBus = require('../../../utils/eventBus');

// Получить список всех модулей
exports.getModules = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, icon, displayorder, folder, is_active FROM modules ORDER BY displayorder, name'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching modules:', err);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
};

// Переключить статус модуля (вкл/выкл)
exports.toggleModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    const { rowCount, rows } = await db.query(
      'UPDATE modules SET is_active = $1 WHERE id = $2 RETURNING id, name, is_active',
      [is_active, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Сбрасываем кэш
    clearCache(id);

    // Оповещаем систему через шину событий
    eventBus.emit(is_active ? 'module.activated' : 'module.deactivated', rows[0]);

    res.json(rows[0]);
  } catch (err) {
    console.error('Error toggling module:', err);
    res.status(500).json({ error: 'Failed to toggle module' });
  }
};

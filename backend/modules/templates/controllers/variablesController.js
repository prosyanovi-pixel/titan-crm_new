const db = require('../../../db');

exports.list = async (req, res) => {
  try {
    const { moduleId } = req.query;
    let query = 'SELECT * FROM template_variables ORDER BY name ASC';
    const args = [];

    if (moduleId) {
      query = 'SELECT * FROM template_variables WHERE module_id = $1 ORDER BY name ASC';
      args.push(moduleId);
    }

    const { rows } = await db.query(query, args);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching template variables:', error);
    res.status(500).json({ error: 'Failed to fetch template variables' });
  }
};

exports.create = async (req, res) => {
  try {
    const { moduleId, name, key, description, dbPath } = req.body;

    if (!moduleId || !name || !key || !dbPath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { rows } = await db.query(`
      INSERT INTO template_variables (module_id, name, key, db_path, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [moduleId, name, key, dbPath, description || null]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating template variable:', error);
    res.status(500).json({ error: 'Failed to create template variable' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, key, description, dbPath } = req.body;

    const { rows } = await db.query(`
      UPDATE template_variables
      SET name = COALESCE($1, name),
          key = COALESCE($2, key),
          db_path = COALESCE($3, db_path),
          description = COALESCE($4, description)
      WHERE id = $5
      RETURNING *
    `, [name, key, dbPath, description, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Variable not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating template variable:', error);
    res.status(500).json({ error: 'Failed to update template variable' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('DELETE FROM template_variables WHERE id = $1 RETURNING id', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Variable not found' });
    }
    
    res.json({ message: 'Variable deleted successfully' });
  } catch (error) {
    console.error('Error deleting template variable:', error);
    res.status(500).json({ error: 'Failed to delete template variable' });
  }
};

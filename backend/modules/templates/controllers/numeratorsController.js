const db = require('../../../db');

exports.list = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM numerators ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching numerators:', err);
    res.status(500).json({ error: 'Failed to fetch numerators' });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM numerators WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Numerator not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching numerator:', err);
    res.status(500).json({ error: 'Failed to fetch numerator' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, mask } = req.body;
    if (!name || !mask) {
      return res.status(400).json({ error: 'Name and mask are required' });
    }
    const result = await db.query(
      'INSERT INTO numerators (name, mask, current_value) VALUES ($1, $2, 0) RETURNING *',
      [name, mask]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating numerator:', err);
    res.status(500).json({ error: 'Failed to create numerator' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mask, current_value } = req.body;
    const result = await db.query(
      'UPDATE numerators SET name = $1, mask = $2, current_value = $3 WHERE id = $4 RETURNING *',
      [name, mask, current_value || 0, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Numerator not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating numerator:', err);
    res.status(500).json({ error: 'Failed to update numerator' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM numerators WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Numerator not found' });
    }
    res.json({ message: 'Numerator deleted successfully' });
  } catch (err) {
    console.error('Error deleting numerator:', err);
    res.status(500).json({ error: 'Failed to delete numerator' });
  }
};

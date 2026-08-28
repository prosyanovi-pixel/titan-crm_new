const db = require('../../../db');

exports.getPriceLists = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM price_lists ORDER BY is_default DESC, name ASC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.getPriceList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM price_lists WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Price list not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createPriceList = async (req, res, next) => {
  try {
    const { name, currency = 'RUB', isActive = true, isDefault = false, validFrom, validTo } = req.body;
    
    // If setting as default, unset others
    if (isDefault) {
      await db.query(`UPDATE price_lists SET is_default = false`);
    }

    const { rows } = await db.query(
      `INSERT INTO price_lists (name, currency, is_active, is_default, valid_from, valid_to)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, currency, isActive, isDefault, validFrom, validTo]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updatePriceList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, currency, isActive, isDefault, validFrom, validTo } = req.body;
    
    if (isDefault) {
      await db.query(`UPDATE price_lists SET is_default = false WHERE id != $1`, [id]);
    }

    const { rows } = await db.query(
      `UPDATE price_lists 
       SET name = COALESCE($1, name),
           currency = COALESCE($2, currency),
           is_active = COALESCE($3, is_active),
           is_default = COALESCE($4, is_default),
           valid_from = $5,
           valid_to = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, currency, isActive, isDefault, validFrom, validTo, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Price list not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deletePriceList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `DELETE FROM price_lists WHERE id = $1 RETURNING *`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Price list not found' });
    }
    res.json({ message: 'Price list deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.setPriceListItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemType, itemId, price, currency = 'RUB' } = req.body;
    
    const { rows } = await db.query(
      `INSERT INTO price_list_items (price_list_id, item_type, item_id, price, currency)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (price_list_id, item_type, item_id)
       DO UPDATE SET price = EXCLUDED.price, currency = EXCLUDED.currency, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, itemType, itemId, price, currency]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.getPriceListItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemType } = req.query;
    
    let query = `SELECT * FROM price_list_items WHERE price_list_id = $1`;
    let params = [id];
    
    if (itemType) {
      query += ` AND item_type = $2`;
      params.push(itemType);
    }
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

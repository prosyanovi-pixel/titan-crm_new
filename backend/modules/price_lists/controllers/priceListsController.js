const db = require('../../../db');

exports.getPriceLists = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*,
              array_remove(array_agg(t.tag), NULL) as tags
       FROM price_lists p
       LEFT JOIN price_list_tags t ON p.id = t.price_list_id
       GROUP BY p.id
       ORDER BY p.is_default DESC, p.name ASC`
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
      `SELECT p.*,
              array_remove(array_agg(t.tag), NULL) as tags
       FROM price_lists p
       LEFT JOIN price_list_tags t ON p.id = t.price_list_id
       WHERE p.id = $1
       GROUP BY p.id`,
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
    const { name, currency = 'RUB', isActive = true, isDefault = false, validFrom, validTo, statusId, tags } = req.body;
    
    // If setting as default, unset others
    if (isDefault) {
      await db.query(`UPDATE price_lists SET is_default = false`);
    }

    const resolvedStatusId = statusId || (isActive ? 'active' : 'inactive');

    const { rows } = await db.query(
      `INSERT INTO price_lists (name, currency, is_active, is_default, valid_from, valid_to, status_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, currency, isActive, isDefault, validFrom, validTo, resolvedStatusId]
    );
    const priceListId = rows[0].id;

    if (Array.isArray(tags) && tags.length > 0) {
      for (const tag of tags) {
        await db.query(
          `INSERT INTO price_list_tags (price_list_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [priceListId, tag]
        );
      }
    }

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updatePriceList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, currency, isActive, isDefault, validFrom, validTo, statusId, tags } = req.body;
    
    if (isDefault) {
      await db.query(`UPDATE price_lists SET is_default = false WHERE id != $1`, [id]);
    }

    const resolvedStatusId = statusId !== undefined ? statusId : (isActive !== undefined ? (isActive ? 'active' : 'inactive') : undefined);

    const { rows } = await db.query(
      `UPDATE price_lists 
       SET name = COALESCE($1, name),
           currency = COALESCE($2, currency),
           is_active = COALESCE($3, is_active),
           is_default = COALESCE($4, is_default),
           valid_from = $5,
           valid_to = $6,
           status_id = COALESCE($7, status_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [name, currency, isActive, isDefault, validFrom, validTo, resolvedStatusId, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Price list not found' });
    }

    if (tags) {
      await db.query(`DELETE FROM price_list_tags WHERE price_list_id = $1`, [id]);
      if (Array.isArray(tags) && tags.length > 0) {
        for (const tag of tags) {
          await db.query(
            `INSERT INTO price_list_tags (price_list_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, tag]
          );
        }
      }
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
    
    if (price === null) {
      const { rows } = await db.query(
        `DELETE FROM price_list_items WHERE price_list_id = $1 AND item_type = $2 AND item_id = $3 RETURNING *`,
        [id, itemType, itemId]
      );
      return res.json({ deleted: true });
    }

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

exports.bulkSetPriceListItems = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { itemType, itemId, price, currency }
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    await client.query('BEGIN');

    // First delete any items where price is null
    const itemsToDelete = items.filter(item => item.price === null);
    if (itemsToDelete.length > 0) {
      for (const item of itemsToDelete) {
        await client.query(
          `DELETE FROM price_list_items WHERE price_list_id = $1 AND item_type = $2 AND item_id = $3`,
          [id, item.itemType, item.itemId]
        );
      }
    }

    // Upsert items where price is not null
    const itemsToUpsert = items.filter(item => item.price !== null);
    if (itemsToUpsert.length > 0) {
      for (const item of itemsToUpsert) {
        await client.query(
          `INSERT INTO price_list_items (price_list_id, item_type, item_id, price, currency)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (price_list_id, item_type, item_id)
           DO UPDATE SET price = EXCLUDED.price, currency = EXCLUDED.currency, updated_at = CURRENT_TIMESTAMP`,
          [id, item.itemType, item.itemId, item.price, item.currency || 'RUB']
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
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

/**
 * Массовое обновление прайс-листов (is_active / is_default).
 * @param {import('express').Request} req - запрос с телом { ids: number[], patch: { isActive?, isDefault? } }
 */
exports.bulkUpdatePriceLists = async (req, res, next) => {
  try {
    const { ids, patch } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids are required' });
    }

    const hasChanges = Object.keys(patch || {}).some((k) =>
      ['isActive', 'isDefault', 'statusId'].includes(k)
    );
    if (!hasChanges) {
      return res.status(400).json({ error: 'isActive, isDefault or statusId is required' });
    }

    if (patch?.isDefault) {
      await db.query(`UPDATE price_lists SET is_default = false WHERE id != ANY($1)`, [ids]);
    }

    const resolvedStatusId = patch?.statusId !== undefined ? patch.statusId : (patch?.isActive !== undefined ? (patch.isActive ? 'active' : 'inactive') : undefined);

    const { rows } = await db.query(
      `UPDATE price_lists SET
         is_active = COALESCE($1, is_active),
         is_default = COALESCE($2, is_default),
         status_id = COALESCE($3, status_id),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($4) RETURNING id`,
      [patch?.isActive, patch?.isDefault, resolvedStatusId, ids]
    );
    res.json({ updated: rows.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Массовое удаление прайс-листов (вместе с позициями price_list_items).
 */
exports.bulkDeletePriceLists = async (req, res, next) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids are required' });
    }

    await db.query(`DELETE FROM price_list_tags WHERE price_list_id = ANY($1)`, [ids]);
    await db.query(`DELETE FROM price_list_items WHERE price_list_id = ANY($1)`, [ids]);
    const { rows } = await db.query(
      `DELETE FROM price_lists WHERE id = ANY($1) RETURNING id`,
      [ids]
    );
    res.json({ deleted: rows.length });
  } catch (error) {
    next(error);
  }
};

const pdfService = require('../services/pdfService');

exports.exportPriceListPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate id
    if (isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const pdfBuffer = await pdfService.generatePriceListPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=price-list-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    if (error.message === 'Price list not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

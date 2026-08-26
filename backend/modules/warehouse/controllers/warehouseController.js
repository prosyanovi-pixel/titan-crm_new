const db = require('../../../db');

/**
 * Validates that a value is a valid number
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {number|null} - Validated number or null
 */
function validateNumber(value, fieldName) {
    if (value === undefined || value === null) return null;
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) {
        throw new Error(`${fieldName} must be a valid number`);
    }
    return num;
}

/**
 * Validates that a value is a valid string
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @param {Object} options - Validation options
 * @param {number} [options.maxLength] - Maximum length
 * @returns {string|null} - Validated string or null
 */
function validateString(value, fieldName, options = {}) {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') {
        throw new Error(`${fieldName} must be a string`);
    }
    if (options.maxLength && value.length > options.maxLength) {
        throw new Error(`${fieldName} must be at most ${options.maxLength} characters`);
    }
    return value;
}

/**
 * Get all warehouses with their tags
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Array of warehouses
 */
exports.getWarehouses = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT w.*, 
                   COALESCE(
                       (SELECT json_agg(t.tag) FROM warehouse_tags t WHERE t.warehouse_id = w.id),
                       '[]'::json
                   ) as tags
            FROM warehouses w 
            ORDER BY w.name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching warehouses:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Create a new warehouse
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Created warehouse
 */
exports.createWarehouse = async (req, res) => {
    try {
        const { name, type, address, isActive, status, tags } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        
        // Validate string fields
        const validatedName = validateString(name, 'name', { maxLength: 200 });
        const validatedType = validateString(type, 'type', { maxLength: 50 });
        const validatedAddress = validateString(address, 'address', { maxLength: 500 });
        const validatedStatus = validateString(status, 'status', { maxLength: 50 });
        
        // Set defaults
        const finalType = validatedType || 'main';
        const finalIsActive = isActive !== false;

        await db.query('BEGIN');
        const result = await db.query(
            `INSERT INTO warehouses (name, type, address, is_active, status) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [validatedName, finalType, validatedAddress, finalIsActive, validatedStatus]
        );
        const warehouseId = result.rows[0].id;

        if (Array.isArray(tags) && tags.length > 0) {
            for (const tag of tags) {
                await db.query('INSERT INTO warehouse_tags (warehouse_id, tag) VALUES ($1, $2)', [warehouseId, tag]);
            }
        }
        await db.query('COMMIT');
        
        result.rows[0].tags = tags || [];
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error creating warehouse:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Update an existing warehouse
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Updated warehouse
 */
exports.updateWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, address, isActive, status, tags } = req.body;
        
        if (!id) return res.status(400).json({ message: 'Warehouse ID is required' });
        
        // Validate string fields
        const validatedName = name !== undefined ? validateString(name, 'name', { maxLength: 200 }) : undefined;
        const validatedType = type !== undefined ? validateString(type, 'type', { maxLength: 50 }) : undefined;
        const validatedAddress = address !== undefined ? validateString(address, 'address', { maxLength: 500 }) : undefined;
        const validatedStatus = status !== undefined ? validateString(status, 'status', { maxLength: 50 }) : undefined;
        
        await db.query('BEGIN');
        const result = await db.query(
            `UPDATE warehouses 
             SET name = COALESCE($1, name), 
                 type = COALESCE($2, type), 
                 address = COALESCE($3, address), 
                 is_active = COALESCE($4, is_active),
                 status = COALESCE($5, status),
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $6 RETURNING *`,
            [validatedName, validatedType, validatedAddress, isActive, validatedStatus, id]
        );
        
        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Warehouse not found' });
        }

        if (Array.isArray(tags)) {
            await db.query('DELETE FROM warehouse_tags WHERE warehouse_id = $1', [id]);
            for (const tag of tags) {
                await db.query('INSERT INTO warehouse_tags (warehouse_id, tag) VALUES ($1, $2)', [id, tag]);
            }
        }
        await db.query('COMMIT');

        const updated = result.rows[0];
        if (Array.isArray(tags)) updated.tags = tags;
        res.json(updated);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error updating warehouse:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Delete a warehouse
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Deletion confirmation
 */
exports.deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: 'Warehouse ID is required' });
        
        // Basic check if it's the main warehouse or if it has balances
        const balances = await db.query('SELECT 1 FROM inventory_balances WHERE warehouse_id = $1 LIMIT 1', [id]);
        if (balances.rows.length > 0) {
            return res.status(400).json({ message: 'Cannot delete warehouse with existing inventory balances.' });
        }

        const result = await db.query('DELETE FROM warehouses WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Warehouse not found' });
        res.json({ message: 'Warehouse deleted' });
    } catch (err) {
        console.error('Error deleting warehouse:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Bulk delete multiple warehouses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Bulk deletion result
 */
exports.bulkDeleteWarehouses = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Array of ids is required' });
        }
        
        // Validate each id is a valid number
        const validatedIds = ids.map((id, index) => {
            const num = validateNumber(id, `ids[${index}]`);
            return num !== null ? num : id;
        });

        // Check if any of these warehouses have balances
        const balances = await db.query('SELECT warehouse_id FROM inventory_balances WHERE warehouse_id = ANY($1::int[]) LIMIT 1', [validatedIds]);
        if (balances.rows.length > 0) {
            return res.status(400).json({ message: 'Cannot delete warehouses with existing inventory balances.' });
        }

        const result = await db.query('DELETE FROM warehouses WHERE id = ANY($1::int[]) RETURNING id', [validatedIds]);
        res.json({ message: `Successfully deleted ${result.rowCount} warehouses`, deletedCount: result.rowCount, deletedIds: result.rows.map(r => r.id) });
    } catch (err) {
        console.error('Error in bulk deleting warehouses:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Bulk update multiple warehouses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Bulk update result
 */
exports.bulkUpdateWarehouses = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { ids, updates } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Array of ids is required' });
        }
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'Updates object is required' });
        }

        await client.query('BEGIN');
        
        const allowedKeys = ['status', 'type'];
        const setClauses = [];
        const values = [];
        let idx = 1;

        for (const key of Object.keys(updates)) {
            if (key === 'tags') continue; // Handled separately if needed
            const dbKey = key;
            if (!allowedKeys.includes(dbKey)) continue;
            setClauses.push(`${dbKey} = $${idx}`);
            values.push(updates[key]);
            idx++;
        }

        let updatedCount = 0;
        if (setClauses.length > 0) {
            values.push(ids);
            const query = `
                UPDATE warehouses 
                SET ${setClauses.join(', ')}, updated_at = NOW() 
                WHERE id = ANY($${idx}::int[]) 
                RETURNING id
            `;
            const result = await client.query(query, values);
            updatedCount = result.rowCount;
        }

        // Handle tags bulk update if provided
        if (updates.tags) {
            const tags = Array.isArray(updates.tags) ? updates.tags : [];
            await client.query('UPDATE warehouses SET tags = $1 WHERE id = ANY($2::int[])', [tags, ids]);
            updatedCount = ids.length;
        }

        await client.query('COMMIT');
        res.json({ message: `Successfully updated ${updatedCount} warehouses`, updatedCount });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in bulk updating warehouses:', err);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
};

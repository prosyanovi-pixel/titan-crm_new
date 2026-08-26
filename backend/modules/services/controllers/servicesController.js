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
 * Get all services with optional category filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Array of services
 */
exports.getServices = async (req, res) => {
    try {
        const { categoryId, status, type, search } = req.query;
        let query = `
            SELECT s.*, c.name as category_name,
                   COALESCE(
                       (SELECT json_agg(t.tag) FROM service_tags t WHERE t.service_id = s.id),
                       '[]'::json
                   ) as tags
            FROM services s 
            LEFT JOIN service_categories c ON s.category_id = c.id
        `;
        const queryParams = [];
        const whereClauses = [];

        if (categoryId) {
            queryParams.push(categoryId);
            whereClauses.push(`s.category_id = $${queryParams.length}`);
        }

        if (status && status !== 'all') {
            queryParams.push(status);
            whereClauses.push(`s.status = $${queryParams.length}`);
        }

        if (type && type !== 'all') {
            queryParams.push(type);
            whereClauses.push(`s.type = $${queryParams.length}`);
        }

        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`s.name ILIKE $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ` + whereClauses.join(' AND ');
        }

        query += ` ORDER BY s.id DESC`;

        const result = await db.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get a single service by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Service object
 */
exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: 'Service ID is required' });
        
        const validatedId = validateNumber(id, 'id');
        if (validatedId === null) return res.status(400).json({ message: 'Service ID must be a valid number' });
        
        const result = await db.query(`
            SELECT s.*, c.name as category_name,
                   COALESCE(
                       (SELECT json_agg(t.tag) FROM service_tags t WHERE t.service_id = s.id),
                       '[]'::json
                   ) as tags
            FROM services s 
            LEFT JOIN service_categories c ON s.category_id = c.id
            WHERE s.id = $1
        `, [validatedId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Service not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching service:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Create a new service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Created service
 */
exports.createService = async (req, res) => {
    try {
        const { name, description, images, translations, categoryId, type, baseCost, costType, taxContributionsRate, vatRate, isActive, status, tags } = req.body;
        if (!name || !type || !costType) return res.status(400).json({ message: 'Name, type, and costType are required' });
        
        // Validate numeric fields
        const validatedBaseCost = validateNumber(baseCost, 'baseCost');
        const validatedTaxRate = validateNumber(taxContributionsRate, 'taxContributionsRate');
        const validatedVatRate = validateNumber(vatRate, 'vatRate');
        
        // Set defaults - TITAN CRM standard: VAT = 22%
        const finalBaseCost = validatedBaseCost !== null ? validatedBaseCost : 0;
        const finalTaxRate = validatedTaxRate !== null ? validatedTaxRate : 30.00;
        const finalVatRate = validatedVatRate !== null ? validatedVatRate : 22; // TITAN CRM standard: 22%
        
        // Validate string fields
        const validatedName = validateString(name, 'name', { maxLength: 200 });
        const validatedDescription = validateString(description, 'description', { maxLength: 5000 });
        const validatedType = validateString(type, 'type', { maxLength: 50 });
        const validatedCostType = validateString(costType, 'costType', { maxLength: 50 });
        const validatedStatus = validateString(status, 'status', { maxLength: 50 });

        await db.query('BEGIN');
        const result = await db.query(
            `INSERT INTO services (name, description, images, translations, category_id, type, base_cost, cost_type, tax_contributions_rate, vat_rate, is_active, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [validatedName, validatedDescription || null, images ? JSON.stringify(images) : '[]', translations ? JSON.stringify(translations) : '{}', categoryId || null, validatedType, finalBaseCost, validatedCostType, finalTaxRate, finalVatRate, isActive !== false, validatedStatus || null]
        );
        const serviceId = result.rows[0].id;

        if (Array.isArray(tags) && tags.length > 0) {
            for (const tag of tags) {
                await db.query('INSERT INTO service_tags (service_id, tag) VALUES ($1, $2)', [serviceId, tag]);
            }
        }
        await db.query('COMMIT');

        result.rows[0].tags = tags || [];
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error creating service:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Update an existing service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Updated service
 */
exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, images, translations, categoryId, type, baseCost, costType, taxContributionsRate, vatRate, isActive, status, tags } = req.body;
        
        if (!id) return res.status(400).json({ message: 'Service ID is required' });
        
        // Validate numeric fields if provided
        const validatedBaseCost = baseCost !== undefined ? validateNumber(baseCost, 'baseCost') : undefined;
        const validatedTaxRate = taxContributionsRate !== undefined ? validateNumber(taxContributionsRate, 'taxContributionsRate') : undefined;
        const validatedVatRate = vatRate !== undefined ? validateNumber(vatRate, 'vatRate') : undefined;
        
        // Set defaults - TITAN CRM standard: VAT = 22%
        const finalBaseCost = validatedBaseCost !== null ? validatedBaseCost : baseCost;
        const finalTaxRate = validatedTaxRate !== null ? validatedTaxRate : taxContributionsRate;
        const finalVatRate = validatedVatRate !== null ? validatedVatRate : 22; // TITAN CRM standard: 22%
        
        // Validate string fields if provided
        const validatedName = name !== undefined ? validateString(name, 'name', { maxLength: 200 }) : undefined;
        const validatedDescription = description !== undefined ? validateString(description, 'description', { maxLength: 5000 }) : undefined;
        const validatedType = type !== undefined ? validateString(type, 'type', { maxLength: 50 }) : undefined;
        const validatedCostType = costType !== undefined ? validateString(costType, 'costType', { maxLength: 50 }) : undefined;
        const validatedStatus = status !== undefined ? validateString(status, 'status', { maxLength: 50 }) : undefined;

        await db.query('BEGIN');
        const result = await db.query(
            `UPDATE services 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 images = COALESCE($3, images),
                 translations = COALESCE($4, translations),
                 category_id = $5,
                 type = COALESCE($6, type),
                 base_cost = COALESCE($7, base_cost),
                 cost_type = COALESCE($8, cost_type),
                 tax_contributions_rate = COALESCE($9, tax_contributions_rate),
                 vat_rate = COALESCE($10, vat_rate),
                 is_active = COALESCE($11, is_active),
                 status = COALESCE($12, status),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $13 RETURNING *`,
            [validatedName, validatedDescription, images ? JSON.stringify(images) : null, translations ? JSON.stringify(translations) : null, categoryId !== undefined ? categoryId : null, validatedType, finalBaseCost, validatedCostType, finalTaxRate, finalVatRate, isActive, validatedStatus, id]
        );

        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Service not found' });
        }

        if (Array.isArray(tags)) {
            await db.query('DELETE FROM service_tags WHERE service_id = $1', [id]);
            for (const tag of tags) {
                await db.query('INSERT INTO service_tags (service_id, tag) VALUES ($1, $2)', [id, tag]);
            }
        }
        await db.query('COMMIT');

        const updated = result.rows[0];
        if (Array.isArray(tags)) updated.tags = tags;
        res.json(updated);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error updating service:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Delete a service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Deletion confirmation
 */
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: 'Service ID is required' });
        
        const validatedId = validateNumber(id, 'id');
        if (validatedId === null) return res.status(400).json({ message: 'Service ID must be a valid number' });
        
        const result = await db.query('DELETE FROM services WHERE id = $1 RETURNING *', [validatedId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Service not found' });
        res.json({ message: 'Service deleted successfully' });
    } catch (err) {
        console.error('Error deleting service:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Bulk delete multiple services
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Bulk deletion result
 */
exports.bulkDeleteServices = async (req, res) => {
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

        const result = await db.query('DELETE FROM services WHERE id = ANY($1::int[]) RETURNING id', [validatedIds]);
        res.json({ message: `Successfully deleted ${result.rowCount} services`, deletedCount: result.rowCount, deletedIds: result.rows.map(r => r.id) });
    } catch (err) {
        console.error('Error in bulk deleting services:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Bulk update multiple services
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Bulk update result
 */
exports.bulkUpdateServices = async (req, res) => {
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
        
        const allowedKeys = ['status', 'category_id', 'type'];
        const setClauses = [];
        const values = [];
        let idx = 1;

        for (const key of Object.keys(updates)) {
            if (key === 'tags') continue; // Handled separately if needed
            const dbKey = key === 'categoryId' ? 'category_id' : key;
            if (!allowedKeys.includes(dbKey)) continue;
            setClauses.push(`${dbKey} = $${idx}`);
            values.push(updates[key]);
            idx++;
        }

        let updatedCount = 0;
        if (setClauses.length > 0) {
            values.push(ids);
            const query = `
                UPDATE services 
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
            await client.query('UPDATE services SET tags = $1 WHERE id = ANY($2::int[])', [tags, ids]);
            updatedCount = ids.length;
        }

        await client.query('COMMIT');
        res.json({ message: `Successfully updated ${updatedCount} services`, updatedCount });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in bulk updating services:', err);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
};

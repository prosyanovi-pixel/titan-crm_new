const db = require('../../../db');
const csv = require('csv-parse'); // Need to check if it's installed, or use simple parsing
const { stringify } = require('csv-stringify/sync');

// [Опущены методы Categories для краткости, они не менялись]
/**
 * Get all product categories as a nested tree
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Tree of categories
 */
exports.getCategories = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM product_categories ORDER BY parent_id NULLS FIRST, name ASC');
        
        // Build nested tree
        const categories = result.rows;
        const categoryMap = {};
        const roots = [];

        categories.forEach(cat => {
            cat.children = [];
            categoryMap[cat.id] = cat;
        });

        categories.forEach(cat => {
            if (cat.parent_id) {
                if (categoryMap[cat.parent_id]) {
                    categoryMap[cat.parent_id].children.push(cat);
                }
            } else {
                roots.push(cat);
            }
        });

        res.json(roots);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Create a new product category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Created category
 */
exports.createCategory = async (req, res) => {
    try {
        const { name, parentId, description, images, translations } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        
        // Validate string fields
        const validatedName = validateString(name, 'name', { maxLength: 200 });
        const validatedDescription = validateString(description, 'description', { maxLength: 5000 });
        
        const result = await db.query(
            'INSERT INTO product_categories (name, parent_id, description, images, translations) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [validatedName, parentId || null, validatedDescription || null, images ? JSON.stringify(images) : '[]', translations ? JSON.stringify(translations) : '{}']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating category:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Update an existing product category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Updated category
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parentId, description, images, translations } = req.body;
        
        // Validate string fields
        const validatedName = name !== undefined ? validateString(name, 'name', { maxLength: 200 }) : undefined;
        const validatedDescription = description !== undefined ? validateString(description, 'description', { maxLength: 5000 }) : undefined;
        
        const result = await db.query(
            `UPDATE product_categories 
             SET name = COALESCE($1, name), 
                 parent_id = $2, 
                 description = COALESCE($3, description), 
                 images = COALESCE($4, images),
                 translations = COALESCE($5, translations),
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $6 RETURNING *`,
            [validatedName, parentId !== undefined ? parentId : null, validatedDescription, images ? JSON.stringify(images) : null, translations ? JSON.stringify(translations) : null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating category:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Delete a product category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Deletion confirmation
 */
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM product_categories WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (err) {
        console.error('Error deleting category:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get all products with category names and tags
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Array of products
 */
exports.getProducts = async (req, res) => {
    try {
        const { categoryId, status, type, search } = req.query;
        let query = `
            SELECT p.*, c.name as category_name,
                   COALESCE(
                       (SELECT json_agg(t.tag) FROM product_tags t WHERE t.product_id = p.id),
                       '[]'::json
                   ) as tags
            FROM products p 
            LEFT JOIN product_categories c ON p.category_id = c.id
        `;
        const queryParams = [];
        const whereClauses = ['p.deleted_at IS NULL'];

        if (categoryId) {
            queryParams.push(categoryId);
            whereClauses.push(`p.category_id = $${queryParams.length}`);
        }

        if (status && status !== 'all') {
            queryParams.push(status);
            whereClauses.push(`p.status = $${queryParams.length}`);
        }

        if (type && type !== 'all') {
            queryParams.push(type);
            whereClauses.push(`p.type = $${queryParams.length}`);
        }

        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`p.name ILIKE $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ` + whereClauses.join(' AND ');
        }

        query += ` ORDER BY p.name ASC`;

        const result = await db.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Validates that a value is a valid number
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @param {Object} options - Validation options
 * @param {number} [options.min] - Minimum value (inclusive)
 * @param {number} [options.max] - Maximum value (inclusive)
 * @returns {number|null} - Validated number or null
 */
function validateNumber(value, fieldName, options = {}) {
    if (value === undefined || value === null) return null;
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) {
        throw new Error(`${fieldName} must be a valid number`);
    }
    if (options.min !== undefined && num < options.min) {
        throw new Error(`${fieldName} must be at least ${options.min}`);
    }
    if (options.max !== undefined && num > options.max) {
        throw new Error(`${fieldName} must be at most ${options.max}`);
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
 * Create a new product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Created product
 * 
 * @note TODO: Consider using Decimal.js for precise financial calculations (purchase_price, vat_rate)
 * to avoid floating-point precision issues. Current implementation uses parseFloat which may
 * cause rounding errors in financial operations.
 */
exports.createProduct = async (req, res) => {
    try {
        const { skuInternal, skuExternal, name, description, categoryId, unit, purchasePrice, currency, vatRate, dimensions, characteristics, images, translations, isActive, status, type, tags } = req.body;
        
        // Validation
        if (!name) return res.status(400).json({ message: 'Name is required' });
        
        // At least one SKU must be provided
        if (!skuInternal && !skuExternal) {
            return res.status(400).json({ message: 'At least one SKU (internal or external) is required' });
        }
        
        // Validate numeric fields
        const validatedPurchasePrice = validateNumber(purchasePrice, 'purchasePrice', { min: 0 });
        const validatedVatRate = validateNumber(vatRate, 'vatRate', { min: 0, max: 100 });
        
        // Validate string fields
        const validatedSkuInternal = validateString(skuInternal, 'skuInternal', { maxLength: 100 });
        const validatedSkuExternal = validateString(skuExternal, 'skuExternal', { maxLength: 100 });
        
        // Ensure SKUs are not empty strings (only whitespace)
        if (validatedSkuInternal !== null && validatedSkuInternal.trim() === '') {
            return res.status(400).json({ message: 'skuInternal cannot be empty' });
        }
        if (validatedSkuExternal !== null && validatedSkuExternal.trim() === '') {
            return res.status(400).json({ message: 'skuExternal cannot be empty' });
        }
        const validatedUnit = validateString(unit, 'unit', { maxLength: 20 });
        const validatedCurrency = validateString(currency, 'currency', { maxLength: 3 });
        
        // Set defaults for optional numeric fields
        const finalPurchasePrice = validatedPurchasePrice !== null ? validatedPurchasePrice : 0;
        const finalVatRate = validatedVatRate !== null ? validatedVatRate : 22; // TITAN CRM standard: 22%
        const finalCurrency = validatedCurrency !== null ? validatedCurrency : 'RUB';
        const finalUnit = validatedUnit !== null ? validatedUnit : 'pcs';

        await db.query('BEGIN');
        const result = await db.query(
            `INSERT INTO products 
            (sku_internal, sku_external, name, description, category_id, unit, purchase_price, currency, vat_rate, dimensions, characteristics, images, translations, is_active, status, type) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
            [validatedSkuInternal, validatedSkuExternal, name, description, categoryId !== undefined ? categoryId : null, finalUnit, finalPurchasePrice, finalCurrency, finalVatRate, dimensions, characteristics ? JSON.stringify(characteristics) : null, images ? JSON.stringify(images) : null, translations ? JSON.stringify(translations) : null, isActive !== undefined ? isActive : true, status, type]
        );
        const productId = result.rows[0].id;

        if (Array.isArray(tags) && tags.length > 0) {
            for (const tag of tags) {
                await db.query('INSERT INTO product_tags (product_id, tag) VALUES ($1, $2)', [productId, tag]);
            }
        }
        await db.query('COMMIT');
        
        result.rows[0].tags = tags || [];
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error creating product:', err);
        if (err.code === '23505') return res.status(400).json({ message: 'SKU already exists' });
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Update an existing product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Updated product
 */
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { skuInternal, skuExternal, name, description, categoryId, unit, purchasePrice, currency, vatRate, dimensions, characteristics, images, translations, isActive, status, type, tags } = req.body;
        
        // Validation
        if (!id) return res.status(400).json({ message: 'Product ID is required' });
        if (!name) return res.status(400).json({ message: 'Name is required' });
        
        // At least one SKU must be provided (if both are being set to null/empty)
        if (skuInternal !== undefined && skuExternal !== undefined) {
            if (!skuInternal && !skuExternal) {
                return res.status(400).json({ message: 'At least one SKU (internal or external) is required' });
            }
        }
        
        // Validate numeric fields
        const validatedPurchasePrice = validateNumber(purchasePrice, 'purchasePrice', { min: 0 });
        const validatedVatRate = validateNumber(vatRate, 'vatRate', { min: 0, max: 100 });
        
        // Validate string fields
        const validatedSkuInternal = validateString(skuInternal, 'skuInternal', { maxLength: 100 });
        const validatedSkuExternal = validateString(skuExternal, 'skuExternal', { maxLength: 100 });
        
        // Ensure SKUs are not empty strings (only whitespace) if provided
        if (validatedSkuInternal !== null && validatedSkuInternal.trim() === '') {
            return res.status(400).json({ message: 'skuInternal cannot be empty' });
        }
        if (validatedSkuExternal !== null && validatedSkuExternal.trim() === '') {
            return res.status(400).json({ message: 'skuExternal cannot be empty' });
        }
        const validatedUnit = validateString(unit, 'unit', { maxLength: 20 });
        const validatedCurrency = validateString(currency, 'currency', { maxLength: 3 });
        
        // Set defaults for optional numeric fields
        const finalPurchasePrice = validatedPurchasePrice !== null ? validatedPurchasePrice : purchasePrice;
        const finalVatRate = validatedVatRate !== null ? validatedVatRate : vatRate;
        const finalCurrency = validatedCurrency !== null ? validatedCurrency : currency;
        const finalUnit = validatedUnit !== null ? validatedUnit : unit;
        
        await db.query('BEGIN');
        const result = await db.query(
            `UPDATE products 
             SET sku_internal = COALESCE($1, sku_internal),
                 sku_external = COALESCE($2, sku_external), 
                 name = COALESCE($3, name), 
                 description = COALESCE($4, description), 
                 category_id = $5, 
                 unit = COALESCE($6, unit), 
                 purchase_price = COALESCE($7, purchase_price), 
                 currency = COALESCE($8, currency), 
                 vat_rate = COALESCE($9, vat_rate), 
                 dimensions = COALESCE($10, dimensions),
                 characteristics = COALESCE($11, characteristics), 
                 images = COALESCE($12, images),
                 translations = COALESCE($13, translations),
                 is_active = COALESCE($14, is_active),
                 status = COALESCE($15, status),
                 type = COALESCE($16, type),
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $17 RETURNING *`,
            [validatedSkuInternal, validatedSkuExternal, name, description, categoryId !== undefined ? categoryId : null, finalUnit, finalPurchasePrice, finalCurrency, finalVatRate, dimensions, characteristics ? JSON.stringify(characteristics) : null, images ? JSON.stringify(images) : null, translations ? JSON.stringify(translations) : null, isActive, status, type, id]
        );
        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Product not found' });
        }

        if (Array.isArray(tags)) {
            await db.query('DELETE FROM product_tags WHERE product_id = $1', [id]);
            for (const tag of tags) {
                await db.query('INSERT INTO product_tags (product_id, tag) VALUES ($1, $2)', [id, tag]);
            }
        }
        await db.query('COMMIT');

        const updated = result.rows[0];
        if (Array.isArray(tags)) updated.tags = tags;
        res.json(updated);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error updating product:', err);
        if (err.code === '23505') return res.status(400).json({ message: 'SKU already exists' });
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Delete a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Deletion confirmation
 */
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Export products as CSV file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - CSV file download
 */
exports.exportProducts = async (req, res) => {
    try {
        const result = await db.query('SELECT sku_internal, sku_external, name, unit, purchase_price, currency, vat_rate, is_active FROM products ORDER BY id ASC');
        if (!result.rows || result.rows.length === 0) {
            return res.status(400).json({ message: 'No products to export' });
        }
        
        // Use csv-stringify for proper escaping of all fields (prevents CSV injection)
        const csvData = stringify(result.rows, { 
            header: true,
            quoted: true,
            quoted_empty: true 
        });
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="products_export.csv"');
        res.send(csvData);
    } catch (err) {
        console.error('Error exporting products:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Import products from CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Import result
 */
exports.importProducts = async (req, res) => {
    try {
        // Implement simple import stub. Since we might not have multer, we'll parse JSON array instead of raw CSV file for simplicity,
        // or just return 501 Not Implemented if the user just wants the button for now.
        // Or if it's a raw string in req.body.csvData
        res.status(501).json({ message: 'CSV Import is partially implemented. Expecting raw CSV parsing via a library like multer/csv-parse in production.' });
    } catch (err) {
        console.error('Error importing products:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Bulk delete multiple products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Bulk deletion result
 */
exports.bulkDeleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Array of ids is required' });
        }

        const result = await db.query('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ANY($1::int[]) RETURNING id', [ids]);
        res.json({ message: `Successfully deleted ${result.rowCount} products`, deletedCount: result.rowCount, deletedIds: result.rows.map(r => r.id) });
    } catch (err) {
        console.error('Error in bulk deleting products:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Bulk update multiple products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Bulk update result
 */
exports.bulkUpdateProducts = async (req, res) => {
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
                UPDATE products 
                SET ${setClauses.join(', ')}, updated_at = NOW() 
                WHERE id = ANY($${idx}::int[]) 
                RETURNING id
            `;
            const result = await client.query(query, values);
            updatedCount = result.rowCount;
        }

        // Handle tags bulk update if provided
        if (updates.tags) {
            // updates.tags.mode can be 'set', 'add', 'remove'
            // for simplicity we assume 'set' all tags to the provided array
            const tags = Array.isArray(updates.tags) ? updates.tags : [];
            await client.query('UPDATE products SET tags = $1 WHERE id = ANY($2::int[])', [tags, ids]);
            updatedCount = ids.length;
        }

        await client.query('COMMIT');
        res.json({ message: `Successfully updated ${updatedCount} products`, updatedCount });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in bulk updating products:', err);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
};

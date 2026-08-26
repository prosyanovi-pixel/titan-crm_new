const db = require('../../../db');

/**
 * Get service categories as a nested tree
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Tree of service categories
 */
exports.getCategoriesTree = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, name, parent_id, description, images, translations, is_active, created_at, updated_at 
             FROM service_categories ORDER BY id ASC`
        );
        
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
        console.error('Error fetching service categories:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Create a new service category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Created service category
 */
exports.createCategory = async (req, res) => {
    try {
        const { name, parentId, description, images, translations, isActive } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const result = await db.query(
            `INSERT INTO service_categories (name, parent_id, description, images, translations, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, parentId || null, description || null, images ? JSON.stringify(images) : '[]', translations ? JSON.stringify(translations) : '{}', isActive !== false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating service category:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Update an existing service category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Updated service category
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parentId, description, images, translations, isActive } = req.body;

        const result = await db.query(
            `UPDATE service_categories 
             SET name = COALESCE($1, name),
                 parent_id = $2,
                 description = COALESCE($3, description),
                 images = COALESCE($4, images),
                 translations = COALESCE($5, translations),
                 is_active = COALESCE($6, is_active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7 RETURNING *`,
            [name, parentId || null, description, images ? JSON.stringify(images) : null, translations ? JSON.stringify(translations) : null, isActive, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating service category:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Delete a service category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Deletion confirmation
 */
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM service_categories WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error('Error deleting service category:', err);
        if (err.code === '23503') return res.status(400).json({ message: 'Cannot delete category with dependent items' });
        res.status(500).json({ message: 'Internal server error' });
    }
};

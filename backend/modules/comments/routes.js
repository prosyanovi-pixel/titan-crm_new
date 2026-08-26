const express = require('express');
const router = express.Router();
const db = require('../../db');

// Get comments for an entity
router.get('/:entityType/:entityId', async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        
        const result = await db.query(`
            SELECT 
                c.id,
                c.entity_type,
                c.entity_id,
                c.content,
                c.created_at,
                c.updated_at,
                u.id as user_id,
                u.name as user_name,
                u.initials as user_initials,
                u.avatar as user_avatar,
                u.role as user_role
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.entity_type = $1 AND c.entity_id = $2
            ORDER BY c.created_at ASC
        `, [entityType, entityId]);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a comment
router.post('/:entityType/:entityId', async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const { content, userId } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        
        // userId should ideally come from auth token, but we'll accept it in body for simplicity or fallback
        const authorId = userId || 'user_001'; // Default fallback just in case
        
        const result = await db.query(`
            INSERT INTO comments (entity_type, entity_id, user_id, content)
            VALUES ($1, $2, $3, $4)
            RETURNING id, entity_type, entity_id, user_id, content, created_at, updated_at
        `, [entityType, entityId, authorId, content]);
        
        const newComment = result.rows[0];
        
        // Fetch user details for the new comment
        const userResult = await db.query(`
            SELECT name, initials, avatar, role 
            FROM users 
            WHERE id = $1
        `, [authorId]);
        
        if (userResult.rows.length > 0) {
            const u = userResult.rows[0];
            newComment.userName = u.name;
            newComment.userInitials = u.initials;
            newComment.userAvatar = u.avatar;
            newComment.userRole = u.role;
        }
        
        res.status(201).json(newComment);
    } catch (err) {
        console.error('Error creating comment:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a comment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query('DELETE FROM comments WHERE id = $1', [id]);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

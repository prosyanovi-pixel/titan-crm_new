const db = require('../../../db');

class MailTemplatesController {
  
  async getTemplates(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const { rows } = await db.query(
        'SELECT * FROM mail_templates WHERE user_id = $1 ORDER BY name ASC',
        [userId]
      );
      res.json(rows);
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const { name, subject, content, isHtml } = req.body;
      
      const { rows } = await db.query(
        `INSERT INTO mail_templates (user_id, name, subject, content, is_html)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, name, subject, content, isHtml || false]
      );
      
      res.status(201).json(rows[0]);
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'];
      const { name, subject, content, isHtml } = req.body;
      
      const { rows } = await db.query(
        `UPDATE mail_templates 
         SET name = $1, subject = $2, content = $3, is_html = $4, updated_at = NOW()
         WHERE id = $5 AND user_id = $6 RETURNING *`,
        [name, subject, content, isHtml, id, userId]
      );
      
      if (rows.length === 0) return res.status(404).json({ error: 'Template not found' });
      res.json(rows[0]);
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'];
      
      const { rowCount } = await db.query(
        'DELETE FROM mail_templates WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (rowCount === 0) return res.status(404).json({ error: 'Template not found' });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MailTemplatesController();

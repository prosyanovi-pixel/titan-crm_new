const db = require('../../../db');
const aiAdapter = require('../services/aiAdapter');

class InsightsController {
  
  // GET /api/ai/insights/:entityType/:entityId
  async getInsights(req, res) {
    try {
      const { entityType, entityId } = req.params;
      
      const { rows } = await db.query(
        'SELECT * FROM ai_insights WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
        [entityType, entityId]
      );
      
      res.json(rows);
    } catch (error) {
      console.error('Error fetching insights:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/ai/insights/generate
  async generateInsight(req, res) {
    try {
      const { entityType, entityId, insightType } = req.body;
      const userId = req.user?.id || null;

      if (!entityType || !entityId || !insightType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Fetch entity data to pass to AI
      let entityData = null;
      if (entityType === 'projects' || entityType === 'project') {
        const { rows } = await db.query('SELECT * FROM projects WHERE id = $1', [entityId]);
        entityData = rows[0];
      } else if (entityType === 'mail') {
        const { rows } = await db.query('SELECT subject, snippet FROM mail_messages WHERE id = $1', [entityId]);
        entityData = rows[0];
      } else {
        // Fallback or generic 
        entityData = { id: entityId };
      }

      if (!entityData) {
        return res.status(404).json({ error: 'Entity not found' });
      }

      // Call AI Adapter
      const insightContent = await aiAdapter.generateInsight(entityType, entityData, insightType);

      // Save to DB
      const { rows: savedRows } = await db.query(`
        INSERT INTO ai_insights (entity_type, entity_id, insight_type, content, created_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (entity_type, entity_id, insight_type) 
        DO UPDATE SET content = EXCLUDED.content, created_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [entityType, entityId, insightType, insightContent, userId]);

      res.status(200).json(savedRows[0]);
    } catch (error) {
      console.error('Error generating insight:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new InsightsController();

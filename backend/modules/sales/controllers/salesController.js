const db = require('../../../db');
const { v4: uuidv4 } = require('uuid');

exports.createDealFromWizard = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { projectData, quoteData, contractData, taskData } = req.body;
    const userId = req.headers['x-user-id'];

    if (!projectData || !projectData.name) {
      throw new Error('Название сделки обязательно');
    }

    // 1. Create Project
    const projectRes = await client.query(
      `INSERT INTO projects (
        name, description, client, project_type, stage, status, manager_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *`,
      [
        projectData.name,
        projectData.description || null,
        projectData.client || null,
        'sales_deal',
        projectData.stage || 'lead',
        projectData.status || 'active',
        projectData.manager_id || userId
      ]
    );
    const newProject = projectRes.rows[0];
    const projectId = newProject.id;

    let newQuote = null;
    let newContract = null;
    let newTask = null;

    // 2. Create Quote if requested
    if (quoteData && quoteData.total_amount) {
      const quoteRes = await client.query(
        `INSERT INTO quotes (
          project_id, number, status, total_amount, date, valid_until, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '14 days', $5, NOW(), NOW())
        RETURNING *`,
        [
          projectId,
          `КП-${Date.now().toString().slice(-6)}`,
          'draft',
          quoteData.total_amount,
          userId
        ]
      );
      newQuote = quoteRes.rows[0];
      
      if (quoteData.items && quoteData.items.length > 0) {
        for (const item of quoteData.items) {
          await client.query(
            `INSERT INTO quote_items (
              quote_id, name, quantity, price, total, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              newQuote.id,
              item.name,
              item.quantity || 1,
              item.price || 0,
              (item.quantity || 1) * (item.price || 0)
            ]
          );
        }
      }
    }

    // 3. Create Contract if requested
    if (contractData && contractData.create) {
      const contractRes = await client.query(
        `INSERT INTO contracts (
          number, type, status, project_id, amount, date, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW(), NOW())
        RETURNING *`,
        [
          `ДОГ-${Date.now().toString().slice(-6)}`,
          contractData.type || 'services',
          'draft',
          projectId,
          contractData.amount || (quoteData ? quoteData.total_amount : 0),
          userId
        ]
      );
      newContract = contractRes.rows[0];
    }

    // 4. Create Task if requested
    if (taskData && taskData.title) {
      const taskRes = await client.query(
        `INSERT INTO tasks (
          title, description, status, priority, assignee_id, project_id, due_date, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *`,
        [
          taskData.title,
          taskData.description || null,
          'todo',
          taskData.priority || 'medium',
          taskData.assignee_id || userId,
          projectId,
          taskData.due_date || null,
          userId
        ]
      );
      newTask = taskRes.rows[0];
    }

    await client.query('COMMIT');
    
    // Add camelCase aliases for response to match typical app conventions
    res.status(201).json({
      success: true,
      data: {
        project: newProject,
        quote: newQuote,
        contract: newContract,
        task: newTask
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createDealFromWizard:', error);
    next(error);
  } finally {
    client.release();
  }
};

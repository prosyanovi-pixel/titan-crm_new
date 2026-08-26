const db = require('../../../db');
const DataProviderFactory = require('../services/data-providers/DataProviderFactory');
const path = require('path');
const fs = require('fs');
const HTMLtoDOCX = require('html-to-docx');

exports.list = async (req, res) => {
  try {
    const { moduleId, templateTypeId, isActive } = req.query;
    
    let query = `
      SELECT t.*, t.html_content as "htmlContent", t.header_html_content as "headerHtmlContent", t.footer_html_content as "footerHtmlContent", t.first_page_header_only as "firstPageHeaderOnly", t.document_settings as "documentSettings", t.target_action as "targetAction", tt.name as template_type_name, tt.code as template_type_code, m.name as module_name, u.name as author_name
      FROM templates t
      LEFT JOIN template_types tt ON t.template_type_id = tt.id
      LEFT JOIN modules m ON t.module_id = m.id
      LEFT JOIN users u ON t.created_by::varchar = u.id::varchar
      WHERE 1=1
    `;
    const params = [];
    
    if (moduleId) {
      params.push(moduleId);
      query += ` AND t.module_id = $${params.length}`;
    }
    
    if (templateTypeId) {
      params.push(templateTypeId);
      query += ` AND t.template_type_id = $${params.length}`;
    }

    if (isActive !== undefined) {
      params.push(isActive === 'true');
      query += ` AND t.is_active = $${params.length}`;
    }

    // OBAC (Object-based access control)
    const isAdmin = req.user && (req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('*')));
    if (req.user && !isAdmin) {
      params.push(req.user.id);
      params.push(req.user.role);
      query += ` AND (t.is_shared = true OR t.created_by = $${params.length - 1} OR t.id IN (SELECT template_id FROM template_access_rules WHERE access_code IN ('U_' || $${params.length - 1}, 'R_' || $${params.length})))`;
    }
    
    query += ` ORDER BY t.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT t.*, t.html_content as "htmlContent", t.header_html_content as "headerHtmlContent", t.footer_html_content as "footerHtmlContent", t.first_page_header_only as "firstPageHeaderOnly", t.document_settings as "documentSettings", t.target_action as "targetAction", tt.name as template_type_name, tt.code as template_type_code, m.name as module_name
      FROM templates t
      LEFT JOIN template_types tt ON t.template_type_id = tt.id
      LEFT JOIN modules m ON t.module_id = m.id
      WHERE t.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const template = result.rows[0];

    // OBAC
    const isAdmin = req.user && (req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('*')));
    if (req.user && !isAdmin && !template.is_shared && template.created_by !== req.user.id) {
      const { rows: accessRows } = await db.query(
        `SELECT 1 FROM template_access_rules WHERE template_id = $1 AND access_code IN ('U_' || $2, 'R_' || $3)`,
        [template.id, req.user.id, req.user.role]
      );
      if (accessRows.length === 0) {
        return res.status(403).json({ error: 'Нет прав на просмотр этого шаблона' });
      }
    }

    const accessRulesResult = await db.query(`
      SELECT * FROM template_access_rules WHERE template_id = $1
    `, [id]);
    template.accessRules = accessRulesResult.rows;
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, moduleId, templateTypeId, isShared, isHtml, htmlContent, headerHtmlContent, footerHtmlContent, firstPageHeaderOnly, numeratorId, documentSettings, targetAction, accessRules } = req.body;
    const userId = req.headers['x-user-id'] || null;

    let parsedAccessRules = [];
    if (accessRules) {
      try {
        parsedAccessRules = typeof accessRules === 'string' ? JSON.parse(accessRules) : accessRules;
      } catch (e) {
        console.error('Failed to parse accessRules:', e);
      }
    }

    let parsedDocumentSettings = {};
    if (documentSettings) {
      try {
        parsedDocumentSettings = typeof documentSettings === 'string' ? JSON.parse(documentSettings) : documentSettings;
      } catch (e) {
        console.error('Failed to parse documentSettings:', e);
      }
    }

    let filePath = null;

    if (isHtml === 'true' && htmlContent) {
      const parsedPageSize = parsedDocumentSettings?.pageSize || 'A4';
      const parsedOrientation = parsedDocumentSettings?.orientation || 'portrait';
      
      const documentOptions = {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: false,
        orientation: parsedOrientation,
        margins: {
          top: 1440,
          right: 1440,
          bottom: 1440,
          left: 1440,
          header: 720,
          footer: 720,
          gutter: 0,
        }
      };
      
      const processHtml = (html) => {
        if (!html) return html;
        return html.replace(/\{PAGENO\}/g, '<span class="pageNumber"></span>');
      };
      
      const fileBuffer = await HTMLtoDOCX(
        processHtml(htmlContent), 
        processHtml(headerHtmlContent) || null,
        documentOptions,
        processHtml(footerHtmlContent) || null
      );
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.docx`;
      const fullPath = path.join(require('../../../config/paths').directories.templates, fileName);
      await fs.promises.writeFile(fullPath, fileBuffer);
      filePath = fileName;
    } else if (req.file) {
      filePath = req.file.filename;
    } else {
      return res.status(400).json({ error: 'Template file or HTML content is required' });
    }

    const result = await db.query(`
      INSERT INTO templates (
        name, description, module_id, template_type_id, file_path, is_shared, created_by, html_content, numerator_id, header_html_content, footer_html_content, first_page_header_only, document_settings, target_action
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [name, description, moduleId, templateTypeId, filePath, isShared === 'true' || isShared === true, userId, htmlContent || null, numeratorId || null, headerHtmlContent || null, footerHtmlContent || null, firstPageHeaderOnly === 'true' || firstPageHeaderOnly === true, parsedDocumentSettings, targetAction || null]);

    const template = result.rows[0];

    if (parsedAccessRules && parsedAccessRules.length > 0) {
      for (const rule of parsedAccessRules) {
        await db.query(`
          INSERT INTO template_access_rules (template_id, access_code, permission)
          VALUES ($1, $2, $3)
        `, [template.id, rule.access_code, rule.permission]);
      }
    }

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error, error.stack);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    // OBAC check
    const isAdmin = req.user && (req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('*')));
    if (req.user && !isAdmin) {
      const { rows } = await db.query('SELECT created_by FROM templates WHERE id = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Template not found' });
      if (rows[0].created_by !== req.user.id) {
        // Проверяем правила доступа
        const { rows: accessRows } = await db.query(
          `SELECT 1 FROM template_access_rules WHERE template_id = $1 AND access_code IN ('U_' || $2, 'R_' || $3) AND permission = 'edit'`,
          [id, req.user.id, req.user.role]
        );
        if (accessRows.length === 0) {
          return res.status(403).json({ error: 'У вас нет прав на редактирование этого шаблона' });
        }
      }
    }

    const { name, description, moduleId, templateTypeId, isShared, isActive, isHtml, htmlContent, headerHtmlContent, footerHtmlContent, firstPageHeaderOnly, numeratorId, documentSettings, targetAction, accessRules } = req.body;
    
    let parsedAccessRules = null;
    if (accessRules) {
      try {
        parsedAccessRules = typeof accessRules === 'string' ? JSON.parse(accessRules) : accessRules;
      } catch (e) {
        console.error('Failed to parse accessRules:', e);
      }
    }
    
    let parsedDocumentSettings = null;
    if (documentSettings !== undefined) {
      try {
        parsedDocumentSettings = typeof documentSettings === 'string' ? JSON.parse(documentSettings) : documentSettings;
      } catch (e) {
        console.error('Failed to parse documentSettings:', e);
      }
    }

    let updateFields = `
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      module_id = COALESCE($3, module_id),
      template_type_id = COALESCE($4, template_type_id),
      is_shared = COALESCE($5, is_shared),
      is_active = COALESCE($6, is_active),
      html_content = COALESCE($7, html_content),
      numerator_id = $8,
      header_html_content = COALESCE($9, header_html_content),
      footer_html_content = COALESCE($10, footer_html_content),
      first_page_header_only = COALESCE($11, first_page_header_only),
      document_settings = COALESCE($12, document_settings),
      target_action = COALESCE($13, target_action),
      updated_at = NOW()
    `;

    const queryArgs = [
      name, 
      description, 
      moduleId, 
      templateTypeId, 
      isShared !== undefined ? (isShared === 'true' || isShared === true) : null,
      isActive !== undefined ? (isActive === 'true' || isActive === true) : null,
      htmlContent || null,
      numeratorId || null,
      headerHtmlContent !== undefined ? (headerHtmlContent || null) : null,
      footerHtmlContent !== undefined ? (footerHtmlContent || null) : null,
      firstPageHeaderOnly !== undefined ? (firstPageHeaderOnly === 'true' || firstPageHeaderOnly === true) : null,
      parsedDocumentSettings,
      targetAction || null,
      id
    ];

    let queryParamIndex = 15;
    if (isHtml === 'true' && htmlContent) {
      const parsedPageSize = parsedDocumentSettings?.pageSize || 'A4';
      const parsedOrientation = parsedDocumentSettings?.orientation || 'portrait';
      
      const documentOptions = {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: false,
        orientation: parsedOrientation,
        margins: {
          top: 1440,
          right: 1440,
          bottom: 1440,
          left: 1440,
          header: 720,
          footer: 720,
          gutter: 0,
        }
      };
      
      const processHtml = (html) => {
        if (!html) return html;
        return html.replace(/\{PAGENO\}/g, '<span class="pageNumber"></span>');
      };
      
      const fileBuffer = await HTMLtoDOCX(
        processHtml(htmlContent), 
        processHtml(headerHtmlContent !== undefined ? headerHtmlContent : null) || null,
        documentOptions,
        processHtml(footerHtmlContent !== undefined ? footerHtmlContent : null) || null
      );
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.docx`;
      const fullPath = path.join(require('../../../config/paths').directories.templates, fileName);
      await fs.promises.writeFile(fullPath, fileBuffer);
      
      updateFields += `, file_path = $${queryParamIndex}`;
      queryArgs.push(fileName);
    } else if (req.file) {
      updateFields += `, file_path = $${queryParamIndex}`;
      queryArgs.push(req.file.filename);
    }

    const result = await db.query(`
      UPDATE templates
      SET ${updateFields}
      WHERE id = $14
      RETURNING *
    `, queryArgs);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (parsedAccessRules !== null) {
      await db.query(`DELETE FROM template_access_rules WHERE template_id = $1`, [id]);
      for (const rule of parsedAccessRules) {
        await db.query(`
          INSERT INTO template_access_rules (template_id, access_code, permission)
          VALUES ($1, $2, $3)
        `, [id, rule.access_code, rule.permission]);
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // OBAC check
    const isAdmin = req.user && (req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('*')));
    if (req.user && !isAdmin) {
      const { rows } = await db.query('SELECT created_by FROM templates WHERE id = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Template not found' });
      if (rows[0].created_by !== req.user.id) {
        // Проверяем правила доступа
        const { rows: accessRows } = await db.query(
          `SELECT 1 FROM template_access_rules WHERE template_id = $1 AND access_code IN ('U_' || $2, 'R_' || $3) AND permission = 'delete'`,
          [id, req.user.id, req.user.role]
        );
        if (accessRows.length === 0) {
          return res.status(403).json({ error: 'У вас нет прав на удаление этого шаблона' });
        }
      }
    }

    const result = await db.query('DELETE FROM templates WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

exports.getFields = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const providerClass = DataProviderFactory.getProviderClass(moduleId);
    
    if (!providerClass) {
      return res.status(404).json({ error: `Provider for module ${moduleId} not found` });
    }
    
    // Получаем статические переменные из кода
    const staticFields = providerClass.getAvailableVariables ? providerClass.getAvailableVariables() : providerClass.getAvailableFields();
    
    // Получаем динамические переменные из БД
    const { rows: customVars } = await db.query(
      'SELECT key, name, description FROM template_variables WHERE module_id = $1',
      [moduleId]
    );

    // Объединяем
    const customFields = customVars.map(v => ({
      key: v.key,
      description: v.name + (v.description ? ` (${v.description})` : '') + ' [Пользовательская]'
    }));

    res.json([...staticFields, ...customFields]);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
};

exports.download = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT file_path, name FROM templates WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const template = result.rows[0];
    if (!template.filePath) {
      return res.status(404).json({ error: 'Template file not found' });
    }

    const uploadsDir = require('../../../config/paths').directories.templates;
    const filePath = path.join(uploadsDir, template.filePath);

    res.download(filePath, `${template.name}.docx`);
  } catch (error) {
    console.error('Error downloading template:', error);
    res.status(500).json({ error: 'Failed to download template' });
  }
};

exports.copy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : 2;

    const result = await db.query('SELECT * FROM templates WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    
    const template = result.rows[0];
    
    let newFilePath = null;
    if (template.file_path) {
      const originalPath = path.join(require('../../../config/paths').directories.templates, template.file_path);
      if (fs.existsSync(originalPath)) {
        const ext = path.extname(template.file_path);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        newFilePath = uniqueSuffix + ext;
        const targetPath = path.join(require('../../../config/paths').directories.templates, newFilePath);
        fs.copyFileSync(originalPath, targetPath);
      }
    }

    const insertResult = await db.query(
      `INSERT INTO templates 
        (name, description, module_id, template_type_id, file_path, html_content, header_html_content, footer_html_content, first_page_header_only, numerator_id, is_active, is_shared, document_settings, target_action, created_by)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        template.name + ' (Копия)', template.description, template.module_id, template.template_type_id,
        newFilePath, template.html_content, template.header_html_content, template.footer_html_content,
        template.first_page_header_only, template.numerator_id, template.is_active, template.is_shared,
        template.document_settings, template.target_action, userId
      ]
    );
    
    const newTemplate = insertResult.rows[0];
    
    const rulesResult = await db.query('SELECT * FROM template_access_rules WHERE template_id = $1', [id]);
    for (const rule of rulesResult.rows) {
      await db.query(
        'INSERT INTO template_access_rules (template_id, access_code, permission) VALUES ($1, $2, $3)',
        [newTemplate.id, rule.access_code, rule.permission]
      );
    }
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error copying template:', error);
    res.status(500).json({ error: 'Failed to copy template' });
  }
};

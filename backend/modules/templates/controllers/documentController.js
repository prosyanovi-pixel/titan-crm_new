const fs = require('fs');
const os = require('os');
const path = require('path');
const db = require('../../../db');
const DocumentGenerator = require('../services/DocumentGenerator');
const DataProviderFactory = require('../services/data-providers/DataProviderFactory');
const DocumentAttachmentService = require('../services/DocumentAttachmentService');
const archiver = require('archiver');

exports.generate = async (req, res) => {
  try {
    const { id } = req.params;          // ID шаблона
    const { entityId } = req.body;      // ID сущности (например, ID договора)

    if (!entityId) {
      return res.status(400).json({ error: 'entityId is required' });
    }

    // 1. Получаем шаблон из БД
    const templateResult = await db.query('SELECT * FROM templates WHERE id = $1', [id]);
    const template = templateResult.rows[0];

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // OBAC
    const isAdmin = req.user && (req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('*')));
    if (req.user && !isAdmin && !template.is_shared && template.created_by !== req.user.id) {
      const { rows: accessRows } = await db.query(
        `SELECT 1 FROM template_access_rules WHERE template_id = $1 AND access_code IN ('U_' || $2, 'R_' || $3)`,
        [template.id, req.user.id, req.user.role]
      );
      if (accessRows.length === 0) {
        return res.status(403).json({ error: 'Нет прав на использование этого шаблона' });
      }
    }

    if (!template.isActive) {
      return res.status(400).json({ error: 'Template is inactive' });
    }

    // 2. Инициализируем провайдер данных для модуля этого шаблона
    let provider;
    try {
      provider = DataProviderFactory.create(template.moduleId, entityId);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // 3. Получаем данные для подстановки
    const templateData = await provider.fetchData();

    // 3.5 Применяем нумератор
    if (template.numeratorId) {
      const { generateNumeratorNextNumber } = require('../../../utils/numbering');
      templateData.DOCUMENT_NUMBER = await generateNumeratorNextNumber(template.numeratorId);
    }

    // 4. Генерируем документ
    const uploadsDir = require('../../../config/paths').directories.templates;
    const templatePath = path.join(uploadsDir, template.filePath);
    
    // В реальном приложении нужно убедиться, что файл шаблона существует на диске
    const buf = DocumentGenerator.generate(templatePath, templateData);

    // 4.5 Автоматическое прикрепление к сущности
    const attach = req.query.attach === 'true';
    if (attach) {
      try {
        const originalName = `generated_${template.name}.docx`;
        const user = { id: req.headers['x-user-id'], name: decodeURIComponent(req.headers['x-user-name'] || 'Система') };
        await DocumentAttachmentService.attachDocument(template.moduleId, entityId, buf, originalName, user);
      } catch (attachErr) {
        console.error('Failed to auto-attach generated document:', attachErr);
        // Мы не прерываем скачивание, если прикрепление не удалось
      }
    }

    // 5. Отправляем готовый файл клиенту
    res.setHeader('Content-Disposition', `attachment; filename="generated_${template.id}.docx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buf);

  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ error: error.message || 'Failed to generate document' });
  }
};

exports.generateAction = async (req, res) => {
  try {
    const { id } = req.params;          
    const { entityId, folderId } = req.body;      

    if (!entityId) {
      return res.status(400).json({ error: 'entityId is required' });
    }

    const templateResult = await db.query('SELECT * FROM templates WHERE id = $1', [id]);
    const template = templateResult.rows[0];

    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (!template.isActive) return res.status(400).json({ error: 'Template is inactive' });

    // OBAC
    const isAdmin = req.user && (req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('*')));
    if (req.user && !isAdmin && !template.is_shared && template.created_by !== req.user.id) {
      const { rows: accessRows } = await db.query(
        `SELECT 1 FROM template_access_rules WHERE template_id = $1 AND access_code IN ('U_' || $2, 'R_' || $3)`,
        [template.id, req.user.id, req.user.role]
      );
      if (accessRows.length === 0) return res.status(403).json({ error: 'Нет прав на использование этого шаблона' });
    }

    let provider;
    try {
      provider = DataProviderFactory.create(template.moduleId, entityId);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const templateData = await provider.fetchData();

    if (template.numeratorId) {
      const { generateNumeratorNextNumber } = require('../../../utils/numbering');
      templateData.DOCUMENT_NUMBER = await generateNumeratorNextNumber(template.numeratorId);
    }

    const uploadsDir = require('../../../config/paths').directories.templates;
    const templatePath = path.join(uploadsDir, template.filePath);
    const buf = DocumentGenerator.generate(templatePath, templateData);

    const originalName = `generated_${template.name}.docx`;
    const userId = req.user ? req.user.id : (req.headers['x-user-id'] || null);

    // Всегда сохраняем в модуль Документы
    const docResult = await DocumentAttachmentService._attachToGenericDocuments(
      'documents', 
      null, 
      buf, 
      originalName, 
      DocumentAttachmentService.generateFilename(originalName), 
      userId,
      folderId
    );

    res.json({
      success: true,
      documentId: docResult.documentId,
      storedFilename: docResult.storedFilename,
      targetAction: template.target_action || 'none'
    });

  } catch (error) {
    console.error('Error generating document action:', error);
    res.status(500).json({ error: error.message || 'Failed to generate document for action' });
  }
};

exports.generateBulk = async (req, res) => {
  try {
    const { id } = req.params;
    const { entityIds } = req.body;

    if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
      return res.status(400).json({ error: 'entityIds array is required' });
    }

    const templateResult = await db.query('SELECT * FROM templates WHERE id = $1', [id]);
    const template = templateResult.rows[0];

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // OBAC
    const isAdmin = req.user && (req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('*')));
    if (req.user && !isAdmin && !template.is_shared && template.created_by !== req.user.id) {
      const { rows: accessRows } = await db.query(
        `SELECT 1 FROM template_access_rules WHERE template_id = $1 AND access_code IN ('U_' || $2, 'R_' || $3)`,
        [template.id, req.user.id, req.user.role]
      );
      if (accessRows.length === 0) {
        return res.status(403).json({ error: 'Нет прав на использование этого шаблона' });
      }
    }

    if (!template.isActive) {
      return res.status(400).json({ error: 'Template is inactive' });
    }

    const uploadsDir = require('../../../config/paths').directories.templates;
    const templatePath = path.join(uploadsDir, template.filePath);

    res.setHeader('Content-Disposition', `attachment; filename="documents_bulk_${template.id}.zip"`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const entityId of entityIds) {
      try {
        const provider = DataProviderFactory.create(template.moduleId, entityId);
        const templateData = await provider.fetchData();

        if (template.numeratorId) {
          const { generateNumeratorNextNumber } = require('../../../utils/numbering');
          templateData.DOCUMENT_NUMBER = await generateNumeratorNextNumber(template.numeratorId);
        }

        const buf = DocumentGenerator.generate(templatePath, templateData);
        // Extract a meaningful name if possible, fallback to entityId
        const docName = `${template.name}_${entityId}.docx`;
        
        archive.append(buf, { name: docName });

      } catch (err) {
        console.error(`Error generating doc for entity ${entityId}:`, err);
        // Continue to the next entity even if one fails
        archive.append(Buffer.from(`Error generating document: ${err.message}`), { name: `error_${entityId}.txt` });
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Error in bulk generation:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to generate documents' });
    }
  }
};

exports.generateBulkAsync = async (req, res) => {
  try {
    const { id } = req.params;
    const { entityIds } = req.body;

    if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
      return res.status(400).json({ error: 'entityIds array is required' });
    }

    const templateResult = await db.query('SELECT * FROM templates WHERE id = $1', [id]);
    const template = templateResult.rows[0];

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // OBAC
    const isAdmin = req.user && (req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('*')));
    if (req.user && !isAdmin && !template.is_shared && template.created_by !== req.user.id) {
      const { rows: accessRows } = await db.query(
        `SELECT 1 FROM template_access_rules WHERE template_id = $1 AND access_code IN ('U_' || $2, 'R_' || $3)`,
        [template.id, req.user.id, req.user.role]
      );
      if (accessRows.length === 0) {
        return res.status(403).json({ error: 'Нет прав на использование этого шаблона' });
      }
    }

    if (!template.isActive) {
      return res.status(400).json({ error: 'Template is inactive' });
    }

    // Отвечаем сразу
    res.status(202).json({ success: true, message: 'Процесс массовой генерации запущен в фоне' });

    // Запускаем асинхронную обработку
    const userId = req.user ? req.user.id : (req.headers['x-user-id'] || null);
    
    setImmediate(async () => {
      let tempFilePath = null;
      try {
        const uploadsDir = require('../../../config/paths').directories.templates;
        const templatePath = path.join(uploadsDir, template.filePath);

        const archive = archiver('zip', { zlib: { level: 9 } });
        tempFilePath = path.join(os.tmpdir(), `bulk_${Date.now()}_${Math.random().toString(36).substring(7)}.zip`);
        const output = fs.createWriteStream(tempFilePath);

        archive.pipe(output);

        for (const entityId of entityIds) {
          try {
            const provider = DataProviderFactory.create(template.moduleId, entityId);
            const templateData = await provider.fetchData();

            if (template.numeratorId) {
              const { generateNumeratorNextNumber } = require('../../../utils/numbering');
              templateData.DOCUMENT_NUMBER = await generateNumeratorNextNumber(template.numeratorId);
            }

            const buf = DocumentGenerator.generate(templatePath, templateData);
            const docName = `${template.name}_${entityId}.docx`;
            
            archive.append(buf, { name: docName });
          } catch (err) {
            console.error(`Error generating doc for entity ${entityId}:`, err);
            archive.append(Buffer.from(`Error generating document: ${err.message}`), { name: `error_${entityId}.txt` });
          }
        }

        await archive.finalize();

        // Ждем окончания записи файла
        await new Promise((resolve, reject) => {
          output.on('close', resolve);
          output.on('error', reject);
        });

        // Сохраняем ZIP в модуль документов
        const buf = fs.readFileSync(tempFilePath);
        const originalName = `Массовая_генерация_${template.name}.zip`;
        const docResult = await DocumentAttachmentService._attachToGenericDocuments(
          'documents', 
          null, 
          buf, 
          originalName, 
          DocumentAttachmentService.generateFilename(originalName), 
          userId,
          null
        );

        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }

        // Отправляем уведомление
        const title = 'Массовая генерация завершена';
        const message = `Архив "${originalName}" успешно создан и сохранен в ваших документах.`;
        const link = `/documents?id=${docResult.documentId}`;

        await db.query(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1, $2, $3, $4, $5)',
          [userId, 'success', title, message, link]
        );

        let websocketServer = null;
        try {
          websocketServer = require('../../notifications/services/websocketServer');
        } catch (e) {}

        if (websocketServer && typeof websocketServer.sendToUser === 'function') {
          websocketServer.sendToUser(userId, {
            type: 'notification',
            data: { title, message, link, timestamp: new Date().toISOString() },
          });
        }

      } catch (err) {
        console.error('Error in background bulk generation:', err);
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try { fs.unlinkSync(tempFilePath); } catch (e) {}
        }
        
        // Отправляем уведомление об ошибке
        try {
          await db.query(
            'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
            [userId, 'error', 'Ошибка массовой генерации', `Не удалось завершить создание архива по шаблону ${template.name}`]
          );
        } catch (e) {}
      }
    });

  } catch (error) {
    console.error('Error starting async bulk generation:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to start background process' });
    }
  }
};

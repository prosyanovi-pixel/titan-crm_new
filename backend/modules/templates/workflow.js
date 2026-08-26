const db = require('../../db');
const path = require('path');
const DocumentGenerator = require('./services/DocumentGenerator');
const DataProviderFactory = require('./services/data-providers/DataProviderFactory');
const DocumentAttachmentService = require('./services/DocumentAttachmentService');

module.exports = {
  actions: {
    generate_document: {
      label: 'Сгенерировать документ',
      inputSchema: {
        properties: {
          template_id: { type: 'template', label: 'Шаблон', required: true },
          folder_id: { type: 'folder', label: 'Папка сохранения (Опционально)' },
          custom_variables: { type: 'dictionary', label: 'Дополнительные переменные' }
        }
      },
      outputSchema: {
        properties: {
          documentId: { type: 'string', label: 'ID созданного документа' },
          targetAction: { type: 'string', label: 'Целевое действие' }
        }
      },
      handler: async (config, context, logger) => {
        const { template_id, folder_id, custom_variables } = config;
        const { entityId, userId } = context;

        if (!entityId) {
          throw new Error('entityId is missing in workflow context');
        }

        const templateResult = await db.query('SELECT * FROM templates WHERE id = $1', [template_id]);
        const template = templateResult.rows[0];

        if (!template) {
          throw new Error('Template not found');
        }

        if (!template.isActive) {
          throw new Error('Template is inactive');
        }

        let provider;
        try {
          provider = DataProviderFactory.create(template.moduleId, entityId);
        } catch (err) {
          throw new Error(`Data provider error: ${err.message}`);
        }

        const templateData = await provider.fetchData();

        // Merge any custom variables defined in the workflow node
        if (custom_variables && typeof custom_variables === 'object') {
          Object.assign(templateData, custom_variables);
        }

        if (template.numeratorId) {
          const { generateNumeratorNextNumber } = require('../../utils/numbering');
          templateData.DOCUMENT_NUMBER = await generateNumeratorNextNumber(template.numeratorId);
        }

        const uploadsDir = require('../../config/paths').directories.templates;
        const templatePath = path.join(uploadsDir, template.filePath);
        const buf = DocumentGenerator.generate(templatePath, templateData);

        const originalName = `generated_${template.name}.docx`;

        const docResult = await DocumentAttachmentService._attachToGenericDocuments(
          'documents', 
          null, 
          buf, 
          originalName, 
          DocumentAttachmentService.generateFilename(originalName), 
          userId,
          folder_id
        );

        return {
          documentId: docResult.documentId,
          targetAction: template.target_action || 'none'
        };
      }
    }
  }
};

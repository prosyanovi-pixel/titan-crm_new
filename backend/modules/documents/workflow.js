const fs = require('fs');
const path = require('path');
const pdfMake = require('pdfmake');
const db = require('../../db');
const { getOrCreateFolder } = require('./utils/helpers');
const storageService = require('./services/storageService');

// Use standard PDF fonts to avoid needing actual TTF files on the server
pdfMake.fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

module.exports = {
  actions: {
    generate_pdf: {
      label: 'Сгенерировать PDF (pdfmake)',
      inputSchema: {
        properties: {
          template_json: { 
            type: 'string', 
            label: 'JSON-структура документа',
            description: 'JSON объект, определяющий структуру (например {"content": ["Привет мир!"]})',
            ui: { widget: 'textarea' }
          },
          filename: { type: 'string', label: 'Имя файла', default: 'document.pdf' },
          save_to_db: { type: 'boolean', label: 'Сохранить в модуль Документы', default: true }
        },
        required: ['template_json', 'filename']
      },
      outputSchema: {
        properties: {
          success: { type: 'boolean' },
          document_id: { type: 'string' },
          base64: { type: 'string', description: 'Base64 encoded PDF' }
        }
      },
      handler: async (config, context, logger) => {
        const { template_json, filename, save_to_db } = config;
        
        let docDefinition;
        try {
          // If the config is a string, parse it. If it's already an object (due to variable substitution), use it.
          docDefinition = typeof template_json === 'string' ? JSON.parse(template_json) : template_json;
        } catch (e) {
          throw new Error(`Failed to parse template_json: ${e.message}`);
        }

        // Set default styles if missing to use the standard fonts correctly
        if (!docDefinition.defaultStyle) {
          docDefinition.defaultStyle = { font: 'Roboto' };
        }

        logger.info(`Generating PDF: ${filename}`);

        try {
          const pdfDoc = pdfMake.createPdf(docDefinition);
          const resultData = await pdfDoc.getBuffer();
          const base64 = resultData.toString('base64');
          
          let documentId = null;

          if (save_to_db) {
            logger.info(`Saving ${filename} to Documents database...`);
            try {
              const sizeBytes = resultData.length;
              const storedFilename = `wf_${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
              
              // Организация папок
              let parentId = null;
              try {
                parentId = await getOrCreateFolder('Модуль Документы');
              } catch (e) {
                logger.error('[generate_pdf] Folder error:', e.message);
              }

              const { rows } = await db.query(
                `INSERT INTO documents (id, name, type, size, date, parent_id, stored_filename)
                 VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6) RETURNING id`,
                [`doc-gen-${Date.now()}`, filename, 'pdf', sizeBytes, parentId, storedFilename]
              );

              // Сохраняем физически через StorageService
              await storageService.saveFile(storedFilename, resultData);

              documentId = rows[0].id;
              logger.info(`Saved document with ID: ${documentId} to storage`);
            } catch (dbError) {
              logger.error(`Failed to save document to DB: ${dbError.message}`);
              // We don't fail the step if DB save fails, just log it.
            }
          }

          return {
            success: true,
            document_id: documentId,
            base64: base64
          };

        } catch (e) {
          throw new Error(`PDF Generation failed: ${e.message}`);
        }
      }
    }
  }
};

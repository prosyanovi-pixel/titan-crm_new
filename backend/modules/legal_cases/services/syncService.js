const logger = require('../../../utils/logger');
const db = require('../../../db');
const { getAllCases } = require('./cases');
const { createCaseUpdate } = require('./updates');
const { createDocumentRecord } = require('./documents');
const { ensureInstance } = require('./instances');
const { syncKadCases } = require('../utils/kadScraper');

async function runSync() {
  logger.info('Запуск синхронизации судебных дел с КАД...');
  
  try {
    // Получаем все дела
    const allCases = await getAllCases();
    
    // Фильтруем только арбитражные дела в активном статусе, у которых есть номер
    const arbitrationCases = allCases.filter(c => 
      c.type === 'court' && 
      c.status !== 'done' && 
      c.status !== 'archived' && 
      (c.firstInstanceNumber || c.caseNumber) &&
      /^[АAаa]/i.test(c.firstInstanceNumber || c.caseNumber)
    );
    
    if (arbitrationCases.length === 0) {
      logger.info('Нет активных арбитражных дел для синхронизации.');
      return { success: true, processed: 0, updated: 0 };
    }
    
    // Извлекаем уникальные номера дел
    const caseMap = new Map();
    arbitrationCases.forEach(c => {
      const num = c.firstInstanceNumber || c.caseNumber;
      caseMap.set(num, c);
    });
    
    const numbersToSync = Array.from(caseMap.keys());
    logger.info(`Найдено ${numbersToSync.length} дел для синхронизации.`);
    
    // Вызываем парсер
    const parsedData = await syncKadCases(numbersToSync);
    
    let updatedCount = 0;
    
    for (const data of parsedData) {
      const legalCase = caseMap.get(data.caseNumber);
      if (!legalCase) continue;
      
      let hasChanges = false;
      const updatesToSave = [];
      
      // Проверяем изменение статуса
      if (data.status && data.status !== legalCase.status) {
        hasChanges = true;
        
        // В реальном приложении здесь нужен маппинг стадий КАД в статусы CRM
        // Для MVP мы просто обновляем
        await db.query(`UPDATE legal_cases SET status = $1 WHERE id = $2`, [data.status, legalCase.id]);
        updatesToSave.push(`Статус дела изменен на: ${data.status}`);
      }
      
      // Добавляем инстанции, если есть
      if (data.instances && data.instances.length > 0) {
        for (const inst of data.instances) {
          await ensureInstance({
            case_id: legalCase.id,
            instance_type: inst.instanceType,
            instance_number: inst.instanceNumber,
            court_name: inst.courtName,
            judge: inst.judge,
            status: inst.status,
            is_active: inst.isActive
          });
          hasChanges = true;
        }
      }
      
      // Добавляем новые обновления в таблицу case_updates
      if (data.updates && data.updates.length > 0) {
        for (const update of data.updates) {
          await createCaseUpdate({
            case_id: legalCase.id,
            update_type: 'system',
            title: update.title,
            description: `Синхронизировано из КАД (${new Date(update.date).toLocaleDateString('ru-RU')})`
          });
          hasChanges = true;
        }
      }
      
      // Добавляем внешние ссылки на документы без скачивания
      if (data.documents && data.documents.length > 0) {
        for (const doc of data.documents) {
          await createDocumentRecord({
            id: doc.id,
            case_id: legalCase.id,
            name: doc.name,
            type: doc.type,
            date: doc.date,
            size: doc.size,
            author: doc.author,
            url: doc.url
          });
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        updatedCount++;
      }
    }
    
    logger.info(`Синхронизация завершена. Обновлено дел: ${updatedCount}`);
    return { success: true, processed: numbersToSync.length, updated: updatedCount };
    
  } catch (error) {
    logger.error('Ошибка при синхронизации с КАД:', error);
    throw error;
  }
}

module.exports = {
  runSync
};

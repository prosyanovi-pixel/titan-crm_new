/**
 * Генерация отчётов об импорте выписок
 * Файл: routes/finance/statementHelpers/reportGenerator.js
 */

/**
 * Формирует отчёт о результатах импорта
 * @param {Array} contractorResults - Результаты обработки контрагентов
 * @param {Object} importStats - Статистика импорта
 * @returns {Object} - Отчёт
 */
function generateImportReport(contractorResults, importStats) {
  const report = {
    summary: {
      totalLines: importStats.linesCount || 0,
      totalCredit: importStats.totalCredit || 0,
      totalDebit: importStats.totalDebit || 0,
      paymentsCreated: importStats.paymentsCreated || 0,
      duplicatesSkipped: importStats.duplicatesSkipped || 0,
    },
    contractors: {
      total: 0,
      new: 0,
      updated: 0,
      newAccounts: 0,
    },
    newContractors: [],
    updatedContractors: [],
    newAccounts: [],
    warnings: [],
    suggestions: [],
  };

  contractorResults.forEach((result) => {
    if (result.contractorId) {
      report.contractors.total++;
      
      if (result.isNew) {
        report.contractors.new++;
        report.newContractors.push({
          id: result.contractorId,
          name: result.contractorName,
          changes: result.changes,
        });
      } else if (result.isUpdated || result.newAccountAdded) {
        report.contractors.updated++;
        report.updatedContractors.push({
          id: result.contractorId,
          name: result.contractorName,
          changes: result.changes,
        });
      }

      if (result.newAccountAdded) {
        report.contractors.newAccounts++;
        const accountChange = result.changes.find(c => c.includes('Добавлен новый счёт'));
        if (accountChange) {
          report.newAccounts.push({
            contractorId: result.contractorId,
            contractorName: result.contractorName,
            accountInfo: accountChange,
          });
        }
      }
    }

    // Собираем предупреждения
    result.warnings.forEach(warning => {
      report.warnings.push({
        contractorId: result.contractorId,
        contractorName: result.contractorName,
        warning,
      });
    });
  });

  // Формируем предложения
  if (report.contractors.new > 0) {
    report.suggestions.push(
      `Создано ${report.contractors.new} новых контрагентов. ` +
      `Рекомендуется проверить корректность данных в карточках контрагентов.`
    );
  }
  
  if (report.contractors.newAccounts > 0) {
    report.suggestions.push(
      `Добавлено ${report.contractors.newAccounts} новых счетов контрагентов. ` +
      `Проверьте, являются ли эти счета основными.`
    );
  }
  
  if (report.warnings.length > 0) {
    report.suggestions.push(
      `Обнаружено ${report.warnings.length} предупреждений. ` +
      `Требуется ручная проверка.`
    );
  }

  return report;
}

/**
 * Проверяет является ли счёт нашим (организации)
 * @param {string} statementAccount - Счёт из выписки
 * @param {string} ourAccount - Наш счёт для сверки
 * @returns {boolean}
 */
function isOurAccount(statementAccount, ourAccount) {
  if (!statementAccount || !ourAccount) return false;
  
  const cleanStatement = String(statementAccount).replace(/\s/g, '');
  const cleanOur = String(ourAccount).replace(/\s/g, '');
  
  return cleanStatement === cleanOur;
}

module.exports = {
  generateImportReport,
  isOurAccount,
};

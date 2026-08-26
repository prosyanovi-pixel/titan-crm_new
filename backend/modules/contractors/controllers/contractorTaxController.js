/**
 * Контроллер для управления налоговой информацией контрагентов
 * Эндпоинты для работы с налоговыми режимами контрагентов
 */

const { sendSuccess, sendCreated, sendNotFound, sendValidationError } = require('../../../utils/responseHelpers');
const contractorTaxService = require('../services/contractorTaxService');
const legalFormService = require('../services/legalFormService');
const ContractorTaxValidator = require('../validators/ContractorTaxValidator');
const financeSettingsService = require('../../finance/services/financeSettingsService');
const { logAction } = require('../../../utils/auditLogger');

/**
 * GET /api/contractors/:id/taxes
 * Получить налоговую информацию контрагента
 */
async function getContractorTaxes(req, res) {
  const { id } = req.params;
  const { include } = req.query; // history, limits, calculations
  
  try {
    const taxInfo = await contractorTaxService.getTaxInfo(parseInt(id));
    
    let result = taxInfo;
    
    // Дополнительные данные по запросу
    if (include) {
      const includes = include.split(',');
      
      if (includes.includes('history')) {
        result.history = await contractorTaxService.getTaxHistory(parseInt(id));
      }
      
      if (includes.includes('limits')) {
        result.limitsCheck = await contractorTaxService.checkLimits(parseInt(id));
      }
      
      if (includes.includes('calculations')) {
        // Пример расчёта налогов за последний квартал
        const today = new Date();
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);
        
        result.calculations = await financeSettingsService.calculateTaxBurden(
          parseInt(id),
          { from: quarterStart, to: quarterEnd },
          1000000 // примерный доход
        );
      }
    }
    
    sendSuccess(res, result);
  } catch (error) {
    console.error(`Error in getContractorTaxes for contractor ${id}:`, error);
    if (error.message.includes('не найден')) {
      sendNotFound(res, error.message);
    } else {
      sendValidationError(res, error.message || 'Failed to get contractor taxes');
    }
  }
}

/**
 * PATCH /api/contractors/:id/tax-system
 * Изменить систему налогообложения контрагента
 */
async function updateContractorTaxSystem(req, res) {
  const { id } = req.params;
  const { regimeId, reason, effectiveFrom, validateLimits = true } = req.body;
  
  if (!regimeId) {
    return sendValidationError(res, 'Параметр regimeId обязателен');
  }
  
  try {
    // Валидация при необходимости
    if (validateLimits) {
      const validation = await ContractorTaxValidator.validateRegimeChange(parseInt(id), regimeId);
      if (!validation.valid) {
        return sendValidationError(res, validation.error, { warnings: validation.warnings });
      }
    }
    
    const result = await contractorTaxService.setTaxRegime(parseInt(id), regimeId, {
      reason,
      effectiveFrom,
      changedBy: req.user?.id || req.headers['x-user-id'] || null,
    });

    // Log action to audit log
    await logAction({
      userId: req.headers['x-user-id'],
      action: 'TAX_CHANGE',
      entityType: 'contractor',
      entityId: id,
      newData: {
        regimeId,
        reason,
        effectiveFrom,
        result
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    sendSuccess(res, result);
  } catch (error) {
    console.error(`Error in updateContractorTaxSystem for contractor ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to update tax system');
  }
}

/**
 * GET /api/contractors/:id/taxes/calculate
 * Рассчитать налоги для периода
 */
async function calculateContractorTaxes(req, res) {
  const { id } = req.params;
  const { year, quarter, month, estimatedIncome } = req.query;
  
  try {
    let period;
    const today = new Date();
    
    if (year && quarter) {
      const quarterStartMonth = (parseInt(quarter) - 1) * 3;
      period = {
        from: new Date(parseInt(year), quarterStartMonth, 1),
        to: new Date(parseInt(year), quarterStartMonth + 3, 0),
      };
    } else if (year && month) {
      period = {
        from: new Date(parseInt(year), parseInt(month) - 1, 1),
        to: new Date(parseInt(year), parseInt(month), 0),
      };
    } else {
      // Последний квартал по умолчанию
      const currentQuarter = Math.floor(today.getMonth() / 3);
      period = {
        from: new Date(today.getFullYear(), currentQuarter * 3, 1),
        to: new Date(today.getFullYear(), currentQuarter * 3 + 3, 0),
      };
    }
    
    const income = estimatedIncome ? parseFloat(estimatedIncome) : 1000000;
    
    const calculation = await financeSettingsService.calculateTaxBurden(
      parseInt(id),
      period,
      income
    );
    
    sendSuccess(res, calculation);
  } catch (error) {
    console.error(`Error in calculateContractorTaxes for contractor ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to calculate taxes');
  }
}

/**
 * GET /api/contractors/:id/taxes/history
 * Получить историю изменений системы налогообложения
 */
async function getContractorTaxHistory(req, res) {
  const { id } = req.params;
  
  try {
    const history = await contractorTaxService.getTaxHistory(parseInt(id));
    sendSuccess(res, history);
  } catch (error) {
    console.error(`Error in getContractorTaxHistory for contractor ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to get tax history');
  }
}

/**
 * GET /api/contractors/:id/taxes/limits-check
 * Проверить соответствие лимитам
 */
async function checkContractorTaxLimits(req, res) {
  const { id } = req.params;
  
  try {
    const limitsCheck = await contractorTaxService.checkLimits(parseInt(id));
    sendSuccess(res, limitsCheck);
  } catch (error) {
    console.error(`Error in checkContractorTaxLimits for contractor ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to check limits');
  }
}

/**
 * GET /api/contractors/legal-forms
 * Получить справочник юридических форм
 */
async function getLegalForms(req, res) {
  const { activeOnly = 'true' } = req.query;
  
  try {
    const forms = await legalFormService.getAll(activeOnly === 'true');
    sendSuccess(res, forms);
  } catch (error) {
    console.error('Error in getLegalForms:', error);
    sendValidationError(res, error.message || 'Failed to get legal forms');
  }
}

/**
 * GET /api/contractors/legal-forms/:code/tax-regimes
 * Получить доступные налоговые режимы для юридической формы
 */
async function getLegalFormTaxRegimes(req, res) {
  const { code } = req.params;
  const { date } = req.query;
  
  try {
    const mapping = await legalFormService.getTaxRegimesMapping(code);
    
    if (!mapping) {
      return sendNotFound(res, `Юридическая форма с кодом "${code}" не найдена`);
    }
    
    sendSuccess(res, mapping.availableRegimes);
  } catch (error) {
    console.error(`Error in getLegalFormTaxRegimes for form ${code}:`, error);
    sendValidationError(res, error.message || 'Failed to get tax regimes for legal form');
  }
}

/**
 * GET /api/contractors/:id/taxes/optimization-suggestions
 * Получить рекомендации по оптимизации налогов
 */
async function getTaxOptimizationSuggestions(req, res) {
  const { id } = req.params;
  
  try {
    const suggestions = await contractorTaxService.getTaxOptimizationSuggestions(parseInt(id));
    sendSuccess(res, suggestions);
  } catch (error) {
    console.error(`Error in getTaxOptimizationSuggestions for contractor ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to get optimization suggestions');
  }
}

module.exports = {
  getContractorTaxes,
  updateContractorTaxSystem,
  calculateContractorTaxes,
  getContractorTaxHistory,
  checkContractorTaxLimits,
  getLegalForms,
  getLegalFormTaxRegimes,
  getTaxOptimizationSuggestions,
};
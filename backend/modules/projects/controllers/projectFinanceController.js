/**
 * Контроллеры для финансовой аналитики проектов
 */

const { sendSuccess, sendNotFound, sendValidationError } = require('../../../utils/responseHelpers');
const projectFinanceService = require('../services/projectFinanceService');
const projectReportService = require('../services/projectReportService');

/**
 * GET /api/projects/:id/pnl - P&L отчёт по проекту
 */
async function getPnLReport(req, res) {
  const { id: projectId } = req.params;

  try {
    const report = await projectFinanceService.getPnLReport(parseInt(projectId));

    if (!report) {
      return sendNotFound(res, 'Project not found');
    }

    sendSuccess(res, report);
  } catch (error) {
    console.error(`Error in getPnLReport for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to generate P&L report');
  }
}

/**
 * GET /api/projects/:id/finance/summary - Краткая финансовая сводка
 */
async function getFinanceSummary(req, res) {
  const { id: projectId } = req.params;

  try {
    const summary = await projectFinanceService.getProjectFinanceSummary(parseInt(projectId));

    if (!summary) {
      return sendNotFound(res, 'Project not found');
    }

    sendSuccess(res, summary);
  } catch (error) {
    console.error(`Error in getFinanceSummary for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to get finance summary');
  }
}

/**
 * GET /api/projects/:id/finance/taxes - Расчёт налогов
 */
async function getProjectTaxes(req, res) {
  const { id: projectId } = req.params;

  try {
    const financeData = await projectFinanceService.getProjectFinanceData(parseInt(projectId));

    if (!financeData) {
      return sendNotFound(res, 'Project not found');
    }

    const taxes = await projectFinanceService.calculateTaxes(financeData);
    sendSuccess(res, taxes);
  } catch (error) {
    console.error(`Error in getProjectTaxes for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to calculate taxes');
  }
}

/**
 * GET /api/projects/:id/finance/report/pdf - Экспорт P&L отчета в PDF
 */
async function exportPnLReportPdf(req, res) {
  const { id: projectId } = req.params;

  try {
    const pdfBuffer = await projectReportService.generateFinanceReportPdf(parseInt(projectId));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=project_${projectId}_finance_report.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(`Error generating PDF for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to generate PDF report');
  }
}

module.exports = {
  getPnLReport,
  getFinanceSummary,
  getProjectTaxes,
  exportPnLReportPdf,
};

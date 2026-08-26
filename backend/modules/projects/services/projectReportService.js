const { generatePdfBuffer } = require('../../../utils/pdfGenerator');
const financeService = require('./projectFinanceService');
const db = require('../../../db');

/**
 * Генерирует PDF отчет P&L по проекту.
 * Возвращает Promise, который резолвится с буфером PDF.
 */
async function generateFinanceReportPdf(projectId) {
  const pnl = await financeService.getPnLReport(projectId);
  if (!pnl) {
    throw new Error('Project not found or no finance data');
  }

  // Получаем информацию о проекте и этапах
  const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  const project = projectRes.rows[0];

  const docDefinition = {
    content: [
      { text: `Финансовый отчёт: ${project.name}`, style: 'header' },
      { text: `Дата: ${new Date().toLocaleString('ru-RU')}`, style: 'subheader' },
      { text: '\n' },
      
      { text: 'Общие показатели', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', '*'],
          body: [
            ['Бюджет', `${Number(pnl.budget || 0).toLocaleString('ru-RU')} RUB`],
            ['Использовано бюджета', `${pnl.budgetUsagePercent}%`],
            ['Рентабельность', `${pnl.profitability}%`]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },

      { text: 'Доходы и Расходы', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', '*'],
          body: [
            ['Общая выручка', `${Number(pnl.revenue || 0).toLocaleString('ru-RU')} RUB`],
            ['НДС', `- ${Number(pnl.vatAmount || 0).toLocaleString('ru-RU')} RUB`],
            [{ text: 'Выручка (без НДС)', bold: true }, { text: `${Number(pnl.revenueExcludingVat || 0).toLocaleString('ru-RU')} RUB`, bold: true }],
            ['Прямые расходы', `- ${Number(pnl.directExpenses || 0).toLocaleString('ru-RU')} RUB`],
            [{ text: 'Валовая прибыль', bold: true }, { text: `${Number(pnl.grossProfit || 0).toLocaleString('ru-RU')} RUB`, bold: true }]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },

      { text: 'Прибыль и Налоги', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', '*'],
          body: [
            ['Операционная прибыль', `${Number(pnl.operatingProfit || 0).toLocaleString('ru-RU')} RUB`],
            ['Налоги (всего)', `- ${Number(pnl.taxes?.total || 0).toLocaleString('ru-RU')} RUB`],
            [{ text: 'Чистая прибыль', bold: true }, { text: `${Number(pnl.netProfit || 0).toLocaleString('ru-RU')} RUB`, bold: true }],
            ['Чистая маржа', `${pnl.netMargin}%`]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 12,
        color: 'gray',
        margin: [0, 0, 0, 10]
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 10]
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };
  return await generatePdfBuffer(docDefinition);
}

module.exports = {
  generateFinanceReportPdf
};

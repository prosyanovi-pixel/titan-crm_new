/**
 * Контроллер экспорта отчётов
 *
 * Маршруты:
 *   POST /api/reports/export - Экспорт данных отчёта в CSV или PDF
 */

const express = require('express');
const router = express.Router();
const pdfGenerator = require('../../../utils/pdfGenerator');

/**
 * Конвертировать массив объектов в CSV-строку (UTF-8 с BOM для Excel)
 * @param {Array<Object>} rows
 * @param {string[]} columns - порядок колонок
 * @returns {string}
 */
function toCsv(rows, columns) {
  if (!rows.length) return '';
  const headers = columns.length ? columns : Object.keys(rows[0]);
  const lines = [
    headers.join(';'),
    ...rows.map(r =>
      headers.map(h => {
        const val = r[h] ?? '';
        const str = String(val);
        // Экранировать кавычки и обернуть в кавычки если содержит спецсимволы
        return str.includes(';') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(';')
    ),
  ];
  // BOM для корректного открытия в Excel
  return '\uFEFF' + lines.join('\n');
}

// POST /api/reports/export - Экспорт в CSV или PDF
router.post('/', async (req, res) => {
  try {
    const { data = [], columns = [], columnLabels = {}, filename = 'report', format = 'csv', title = 'Отчёт' } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'data должен быть массивом' });
    }

    if (format === 'csv') {
      const csv = toCsv(data, columns);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      // Используем encodeURIComponent для поддержки кириллицы в именах файлов
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.csv"`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      console.log(`[Export] Starting PDF generation for "${filename}", title: "${title}"`);
      console.log(`[Export] Columns: ${columns.length}, Data rows: ${data.length}`);
      
      const headers = columns.map(c => columnLabels[c] || c);
      const body = data.map(row => columns.map(c => {
        const val = row[c];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
      }));
      
      try {
        const buffer = await pdfGenerator.generateTableReport(title, headers, body);
        console.log(`[Export] PDF buffer generated, size: ${buffer.length} bytes`);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.pdf"`);
        return res.send(buffer);
      } catch (pdfErr) {
        console.error('[Export] PDF Generation logic error:', pdfErr);
        throw pdfErr;
      }
    }

    return res.status(400).json({ error: `Формат "${format}" не поддерживается` });
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

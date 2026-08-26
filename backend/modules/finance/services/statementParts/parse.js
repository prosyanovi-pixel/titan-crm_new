const { parse1cTxt, parseCsv } = require('../../parsers');

function parseStatementContent(content, importType) {
  const type = (importType || 'csv').toLowerCase();
  return type === '1c_txt' ? parse1cTxt(content) : parseCsv(content);
}

function createImportPreview(parsedLines, options) {
  const dates = parsedLines.map(l => l.date).filter(Boolean).sort();
  const totalCredit = parsedLines
    .filter(l => l.direction === 'credit')
    .reduce((s, l) => s + l.amount, 0);
  const totalDebit = parsedLines
    .filter(l => l.direction === 'debit')
    .reduce((s, l) => s + l.amount, 0);

  return {
    fileName: options.fileName,
    importType: options.importType,
    account: options.account || null,
    dateFrom: dates[0] || null,
    dateTo: dates[dates.length - 1] || null,
    totalCredit,
    totalDebit,
    linesCount: parsedLines.length,
    lines: parsedLines.slice(0, 100),
    summary: {
      incomeCount: parsedLines.filter(l => l.direction === 'credit').length,
      expenseCount: parsedLines.filter(l => l.direction === 'debit').length,
      uniqueContractors: new Set(
        parsedLines.map(l => l.counterpartyInn || l.counterparty).filter(Boolean)
      ).size,
    },
  };
}

module.exports = { parseStatementContent, createImportPreview };

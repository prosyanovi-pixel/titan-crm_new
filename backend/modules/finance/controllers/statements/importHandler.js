/**
 * Обработчик для импорта выписок
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../../../../db');
const { getOrCreateFolder } = require('../../../documents/utils/helpers');
const { getStatementStorageInfo } = require('./helpers');
const {
  parseStatementContent,
  createImportPreview,
  createStatement,
  processStatementLine,
} = require('../../services/statements');
const { autoReconcile } = require('../../services/statementReconciliation');
const { generateImportReport } = require('../../statementHelpers');
const logger = require('../../../../utils/logger');

/**
 * Импортировать выписку
 * @route POST /api/finance/statements/import
 */
async function importStatement(req, res) {
  const { content, fileName, importType, account, draft = false } = req.body || {};

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  const type = (importType || 'csv').toLowerCase();
  if (!['csv', '1c_txt'].includes(type)) {
    return res.status(400).json({ error: 'Unsupported importType. Use csv or 1c_txt.' });
  }

  const parsedLines = parseStatementContent(content, type);

  if (parsedLines.length === 0) {
    return res.status(400).json({ error: 'No valid lines parsed from file' });
  }

  // Draft mode — только превью
  if (draft) {
    const preview = createImportPreview(parsedLines, {
      fileName,
      importType: type,
      account,
    });
    return res.json({ mode: 'preview', preview });
  }

  // Создание выписки
  const stmtId = `stmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Сохраняем контент в файл и создаем документ
  try {
    const { absPath, relPathForDB } = await getStatementStorageInfo();
    const ext = type === '1c_txt' ? '.txt' : '.csv';
    const uuid = uuidv4();
    const storedFilename = `${relPathForDB}${uuid}${ext}`;
    const filePath = path.join(absPath, `${uuid}${ext}`);
    
    // Пишем контент в файл
    fs.writeFileSync(filePath, content);
    const size = fs.statSync(filePath).size;
    
    const docId = `doc-stmt-${Date.now()}`;
    const docName = fileName || `Выписка от ${new Date().toLocaleDateString('ru-RU')}${ext}`;
    const folderId = await getOrCreateFolder('Workflow');

    await db.query(
      `INSERT INTO documents (id, name, type, size, date, stored_filename, parent_id)
       VALUES ($1, $2, 'file', $3, $4, $5, $6)`,
      [docId, docName, size, new Date().toISOString().split('T')[0], storedFilename, folderId]
    );
  } catch (saveErr) {
    logger.error('[importStatement] Failed to save statement file:', saveErr.message);
    // Продолжаем импорт данных в БД даже если файл не сохранился
  }

  const dates = parsedLines.map(l => l.date).filter(Boolean).sort();
  const totalCredit = parsedLines
    .filter(l => l.direction === 'credit')
    .reduce((s, l) => s + l.amount, 0);
  const totalDebit = parsedLines
    .filter(l => l.direction === 'debit')
    .reduce((s, l) => s + l.amount, 0);

  const userId = req.headers['x-user-id'] || null;

  await createStatement(
    {
      id: stmtId,
      fileName: fileName || 'import',
      importType: type,
      account: account || null,
      dateFrom: dates[0] || null,
      dateTo: dates[dates.length - 1] || null,
      totalCredit,
      totalDebit,
    },
    userId
  );

  // Обработка строк
  let contractorsCreated = 0;
  let contractorsUpdated = 0;
  let newAccountsAdded = 0;
  let paymentsCreated = 0;
  let duplicatesSkipped = 0;
  let warningsCount = 0;
  const contractorResults = [];

  for (const line of parsedLines) {
    const result = await processStatementLine(line, stmtId, userId);

    contractorResults.push(result.contractorResult);

    if (result.contractorResult.isNew) contractorsCreated++;
    if (result.contractorResult.isUpdated) contractorsUpdated++;
    if (result.contractorResult.newAccountAdded) newAccountsAdded++;
    warningsCount += result.contractorResult.warnings.length;

    if (result.paymentResult.duplicate) duplicatesSkipped++;
    if (result.paymentResult.created) paymentsCreated++;
  }

  // Автоматическая сверка со счетами (reconciliation)
  logger.info(`Starting auto-reconciliation for statement ${stmtId}`);
  const reconcileResult = await autoReconcile(stmtId, account || null);
  logger.info(`Auto-reconciliation completed: matched=${reconcileResult.matched}, total=${reconcileResult.total}`);

  // Генерация отчёта
  const report = generateImportReport(contractorResults, {
    linesCount: parsedLines.length,
    totalCredit,
    totalDebit,
    paymentsCreated,
    duplicatesSkipped,
  });

  res.status(201).json({
    mode: 'imported',
    statementId: stmtId,
    linesCount: parsedLines.length,
    totalCredit,
    totalDebit,
    contractorsCreated,
    contractorsUpdated,
    newAccountsAdded,
    paymentsCreated,
    duplicatesSkipped,
    warningsCount,
    report,
    reconcileMatched: reconcileResult.matched,
    reconcileTotal: reconcileResult.total,
  });
}

module.exports = {
  importStatement,
};

/**
 * Workflow Actions для модуля Finance
 * Эти действия доступны в визуальном конструкторе воркфлоу
 */

const db = require('../../db');

module.exports = {
  actions: {

    /**
     * Создать счёт в системе
     */
    create_invoice: {
      label: 'Создать счёт',
      inputSchema: {
        properties: {
          title:         { type: 'string', label: 'Название счёта',       placeholder: '{{trigger.body.title}}' },
          amount_total:  { type: 'number', label: 'Сумма',                 placeholder: '{{trigger.body.amount}}' },
          currency:      { type: 'string', label: 'Валюта (RUB / USD)',    default: 'RUB' },
          contractor_id: { type: 'string', label: 'ID контрагента',        placeholder: '{{trigger.body.contractorId}}' },
          project_id:    { type: 'string', label: 'ID проекта',            placeholder: '{{step1.projectId}}' },
          issue_date:    { type: 'string', label: 'Дата выставления (YYYY-MM-DD)', placeholder: '' },
          due_date:      { type: 'string', label: 'Срок оплаты (YYYY-MM-DD)',      placeholder: '' },
          invoice_type:  { type: 'string', label: 'Тип (income / expense)',        default: 'income' },
          description:   { type: 'string', label: 'Описание',             placeholder: '' },
        }
      },
      handler: async (config, context) => {
        const { title, amount_total, currency, contractor_id, project_id, issue_date, due_date, invoice_type, description } = config;
        if (!title || !amount_total) throw new Error('[finance.create_invoice] "title" и "amount_total" обязательны');

        const invoiceId  = `inv-wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const today      = new Date().toISOString().split('T')[0];

        const { rows } = await db.query(
          `INSERT INTO finance_invoices (
             id, contractor_id, project_id, title, description, currency,
             amount_total, amount_paid, amount_due,
             issue_date, due_date, status, invoice_type
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,0,$7,$8,$9,'draft',$10)
           RETURNING *`,
          [
            invoiceId,
            contractor_id || null,
            project_id    || null,
            title,
            description   || '',
            currency      || 'RUB',
            parseFloat(amount_total),
            issue_date    || today,
            due_date      || null,
            invoice_type  || 'income',
          ]
        );

        return { invoice: rows[0], invoiceId: rows[0].id };
      }
    },

    /**
     * Обновить статус счёта
     */
    update_invoice_status: {
      label: 'Изменить статус счёта',
      inputSchema: {
        properties: {
          invoice_id: { type: 'string', label: 'ID счёта',     placeholder: '{{step1.invoiceId}}' },
          status:     { type: 'string', label: 'Новый статус', default: 'sent',
            description: 'Допустимые значения: draft, sent, paid, overdue, cancelled' },
        }
      },
      handler: async (config, context) => {
        const { invoice_id, status } = config;
        if (!invoice_id) throw new Error('[finance.update_invoice_status] "invoice_id" обязателен');

        const valid = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
        if (status && !valid.includes(status)) {
          throw new Error(`[finance.update_invoice_status] Недопустимый статус: ${status}. Допустимые: ${valid.join(', ')}`);
        }

        const { rows } = await db.query(
          `UPDATE finance_invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
          [status, invoice_id]
        );
        if (rows.length === 0) throw new Error(`Invoice ${invoice_id} not found`);

        return { updated: true, invoice: rows[0] };
      }
    },

    /**
     * Найти счета по статусу или контрагенту
     */
    find_invoices: {
      label: 'Найти счета',
      inputSchema: {
        properties: {
          status:        { type: 'string', label: 'Статус (оставьте пустым для всех)', placeholder: 'sent' },
          contractor_id: { type: 'string', label: 'ID контрагента (необязательно)',    placeholder: '' },
          limit:         { type: 'number', label: 'Максимум результатов',              default: 10 },
        }
      },
      handler: async (config, context) => {
        const { status, contractor_id, limit = 10 } = config;

        let query  = 'SELECT * FROM finance_invoices WHERE 1=1';
        const params = [];
        let idx = 1;

        if (status) {
          query += ` AND status = $${idx++}`;
          params.push(status);
        }
        if (contractor_id) {
          query += ` AND contractor_id = $${idx++}`;
          params.push(contractor_id);
        }
        query += ` ORDER BY created_at DESC LIMIT $${idx}`;
        params.push(parseInt(limit));

        const { rows } = await db.query(query, params);
        return { invoices: rows, count: rows.length };
      }
    },

    /**
     * Записать платёж по счёту
     */
    record_payment: {
      label: 'Записать оплату по счёту',
      inputSchema: {
        properties: {
          invoice_id:    { type: 'string', label: 'ID счёта',         placeholder: '{{step1.invoiceId}}' },
          amount:        { type: 'number', label: 'Сумма платежа',    placeholder: '{{trigger.body.amount}}' },
          payment_date:  { type: 'string', label: 'Дата (YYYY-MM-DD)', placeholder: '' },
          description:   { type: 'string', label: 'Описание',          placeholder: 'Оплата по договору №...' },
        }
      },
      handler: async (config, context) => {
        const { invoice_id, amount, payment_date, description } = config;
        if (!invoice_id || !amount) throw new Error('[finance.record_payment] "invoice_id" и "amount" обязательны');

        const today = new Date().toISOString().split('T')[0];
        const payId = `pay-wf-${Date.now()}`;

        // Insert payment record
        const { rows: payRows } = await db.query(
          `INSERT INTO finance_payments (id, invoice_id, amount, payment_date, description)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [payId, invoice_id, parseFloat(amount), payment_date || today, description || '']
        );

        // Recalculate invoice paid amount
        await db.query(
          `UPDATE finance_invoices fi
           SET amount_paid = (SELECT COALESCE(SUM(amount),0) FROM finance_payments WHERE invoice_id = fi.id),
               amount_due  = GREATEST(0, fi.amount_total - (SELECT COALESCE(SUM(amount),0) FROM finance_payments WHERE invoice_id = fi.id)),
               updated_at  = NOW()
           WHERE id = $1`,
          [invoice_id]
        );

        return { payment: payRows[0], paymentId: payRows[0].id };
      }
    },

    /**
     * Обработать документ выписки (парсинг и импорт в финансы)
     */
        process_statement_document: {
      label: 'Обработать документ банковской выписки',
      inputSchema: {
        properties: {
          document_id: { type: 'string', label: 'ID документа', placeholder: '{{step1.firstDocumentId}}' },
          documents: { type: 'string', label: 'Список документов' },
          account:     { type: 'string', label: 'Расчётный счет (необязательно)' }
        }
      },
      handler: async (config, context, logger) => {
        const { document_id, documents, account } = config;
        
        let docsToProcess = [];
        if (documents && Array.isArray(documents)) {
          docsToProcess = documents.map(d => typeof d === 'string' ? d : d.documentId).filter(Boolean);
        } else if (documents && typeof documents === 'string' && documents.startsWith('[')) {
          try {
            const parsed = JSON.parse(documents);
            docsToProcess = parsed.map(d => typeof d === 'string' ? d : d.documentId).filter(Boolean);
          } catch(e) {}
        }
        
        if (docsToProcess.length === 0 && document_id) {
          if (!document_id.startsWith('{{')) {
            docsToProcess = [document_id];
          }
        }

        if (docsToProcess.length === 0) {
           logger?.info('Пропуск обработки выписки: документы не были предоставлены.');
           return { success: true, skipped: true, reason: 'No documents provided' };
        }

        let totalParsed = 0, totalContractors = 0, totalAccounts = 0, totalPayments = 0;
        const processedIds = [];

        for (const docId of docsToProcess) {
          try {
            const { rows: docs } = await db.query('SELECT name, stored_filename FROM documents WHERE id = $1', [docId]);
            if (docs.length === 0) {
              logger?.warn(`Документ ${docId} не найден`);
              continue;
            }

            const doc = docs[0];
            const storedFileName = doc.storedFilename || doc.stored_filename;
            const filePath = require('path').join(__dirname, '../../uploads/documents', storedFileName);
            if (!require('fs').existsSync(filePath)) {
              logger?.warn(`Файл документа ${storedFileName} не найден на диске`);
              continue;
            }

            const ext = require('path').extname(storedFileName).toLowerCase();
            let importType = 'csv';
            if (ext === '.txt') importType = '1c_txt';

            let contentStr;
            if (importType === '1c_txt') {
                const buffer = require('fs').readFileSync(filePath);
                const iconv = require('iconv-lite');
                contentStr = iconv.decode(buffer, 'win1251');
            } else {
                contentStr = require('fs').readFileSync(filePath, 'utf8');
            }

            const { parseStatementContent, createStatement, processStatementLine } = require('./services/statements');
            const parsedLines = parseStatementContent(contentStr, importType);
            if (parsedLines.length === 0) {
              logger?.warn(`Не найдено строк для импорта в выписке ${doc.name}`);
              continue;
            }

            const stmtId = `stmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const dates = parsedLines.map(l => l.date).filter(Boolean).sort();
            const totalCredit = parsedLines.filter(l => l.direction === 'credit').reduce((s, l) => s + l.amount, 0);
            const totalDebit = parsedLines.filter(l => l.direction === 'debit').reduce((s, l) => s + l.amount, 0);

            const userId = context.user_id || context.userId || context.trigger?.user || null;

            await createStatement({
              id: stmtId,
              fileName: doc.name || 'import',
              importType,
              account: account || null,
              dateFrom: dates[0] || null,
              dateTo: dates[dates.length - 1] || null,
              totalCredit,
              totalDebit,
            }, userId);

            let contractorsCreated = 0, newAccountsAdded = 0, paymentsCreated = 0;

            for (const line of parsedLines) {
              const result = await processStatementLine(line, stmtId, userId);
              if (result.contractorResult?.isNew) contractorsCreated++;
              if (result.contractorResult?.newAccountAdded) newAccountsAdded++;
              if (result.paymentResult?.created) paymentsCreated++;
            }

            try {
              const { autoReconcile } = require('./services/statementReconciliation');
              await autoReconcile(stmtId, account || null);
            } catch (e) {
              logger?.error(`Auto-reconciliation error: ${e.message}`);
            }

            logger?.info(`Выписка ${doc.name} обработана. Строк: ${parsedLines.length}, новых контрагентов: ${contractorsCreated}, новых счетов: ${newAccountsAdded}, платежей создано: ${paymentsCreated}`);

            totalParsed += parsedLines.length;
            totalContractors += contractorsCreated;
            totalAccounts += newAccountsAdded;
            totalPayments += paymentsCreated;
            processedIds.push(stmtId);
          } catch (err) {
            logger?.error(`Ошибка обработки документа ${docId}: ${err.message}`);
          }
        }

        return {
          success: true,
          statementIds: processedIds,
          linesCount: totalParsed,
          contractorsCreated: totalContractors,
          newAccountsAdded: totalAccounts,
          paymentsCreated: totalPayments
        };
      }
    },

  }
};

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const db = require('../../../db');
const logger = require('../../../utils/logger');

const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function generateDocument(req, res, dependencies) {
  const { mapInvoiceWithDerivedStatus } = dependencies;

  try {
    const { id } = req.params;
    const { documentType } = req.body || {};

    const supportedType = documentType === 'invoice_factura' ? 'invoice_factura' : 'act';

    const invoiceRes = await db.query(
      `SELECT fi.*, c.name AS contractor_name, p.name AS project_name, u.name AS lawyer_name
       FROM finance_invoices fi
       LEFT JOIN contractors c ON c.id = fi.contractor_id
       LEFT JOIN projects p ON p.id = fi.project_id
       LEFT JOIN users u ON u.id = fi.lawyer_user_id
       WHERE fi.id = $1`,
      [id]
    );

    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = mapInvoiceWithDerivedStatus(invoiceRes.rows[0]);
    if (invoice.status !== 'paid') {
      return res.status(400).json({ error: 'Document can be generated only for paid invoices' });
    }

    const title = supportedType === 'act' ? 'Акт выполненных работ' : 'Счет-фактура';
    const docName = `${title} ${invoice.identifier}.html`;
    const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<title>${docName}</title>
<style>
body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
h1 { font-size: 20px; margin-bottom: 16px; }
table { width: 100%; border-collapse: collapse; margin-top: 16px; }
th, td { border: 1px solid #D1D5DB; padding: 8px; text-align: left; }
.small { color: #6B7280; font-size: 12px; margin-top: 24px; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div>Номер счета: ${invoice.identifier}</div>
  <div>Дата счета: ${invoice.issueDate || ''}</div>
  <div>Контрагент: ${invoice.contractorName || '—'}</div>
  <div>Проект: ${invoice.projectName || '—'}</div>
  <div>Ответственный: ${invoice.lawyerName || '—'}</div>

  <table>
    <thead>
      <tr>
        <th>Описание</th>
        <th>Сумма</th>
        <th>Валюта</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${invoice.title}</td>
        <td>${invoice.amountTotal}</td>
        <td>${invoice.currency}</td>
      </tr>
    </tbody>
  </table>

  <p class="small">Сгенерировано автоматически в TITAN CRM.</p>
</body>
</html>`;

    const storedFilename = `${crypto.randomUUID()}.html`;
    const filePath = path.join(uploadsDir, storedFilename);
    fs.writeFileSync(filePath, html, 'utf8');

    const documentId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const docInsert = await db.query(
      `INSERT INTO documents (id, name, type, size, date, parent_id, stored_filename)
       VALUES ($1,$2,'file',$3,$4,$5,$6)
       RETURNING *`,
      [
        documentId,
        docName,
        Buffer.byteLength(html, 'utf8'),
        new Date().toISOString().split('T')[0],
        null,
        storedFilename,
      ]
    );

    const financeDocId = `fidoc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await db.query(
      `INSERT INTO finance_invoice_documents (id, invoice_id, document_type, document_id, template_payload, status, created_by)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)`,
      [
        financeDocId,
        id,
        supportedType,
        documentId,
        JSON.stringify({ invoice, html }),
        'generated',
        req.headers['x-user-id'] || null,
      ]
    );

    res.status(201).json({
      financeDocumentId: financeDocId,
      documentId: docInsert.rows[0].id,
      redirectTo: '/documents',
    });
  } catch (error) {
    logger.error('Generate document error', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { generateDocument };
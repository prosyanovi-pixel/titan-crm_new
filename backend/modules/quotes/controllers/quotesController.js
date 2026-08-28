const db = require('../../../db');
const { generatePdfBuffer } = require('../../../utils/pdfGenerator');

exports.getQuotes = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT q.*, c.name as contractor_name, p.name as project_name 
       FROM quotes q 
       LEFT JOIN contractors c ON q.contractor_id = c.id
       LEFT JOIN projects p ON q.project_id = p.id
       ORDER BY q.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.getQuoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT q.*, c.name as contractor_name, p.name as project_name 
       FROM quotes q 
       LEFT JOIN contractors c ON q.contractor_id = c.id
       LEFT JOIN projects p ON q.project_id = p.id
       WHERE q.id = $1`, [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    const quote = rows[0];

    // Fetch items
    const { rows: items } = await db.query(
      `SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY id ASC`, [id]
    );

    quote.items = items;
    res.json(quote);
  } catch (error) {
    next(error);
  }
};

exports.createQuote = async (req, res, next) => {
  try {
    const { number, date, validUntil, status, contractorId, projectId, addressedTo, totalAmount, taxAmount, discountAmount, notes, items } = req.body;

    if (!number) {
      return res.status(400).json({ message: 'Quote number is required' });
    }

    await db.query('BEGIN');

    const result = await db.query(
      `INSERT INTO quotes 
      (number, date, valid_until, status, contractor_id, project_id, addressed_to, total_amount, tax_amount, discount_amount, notes) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [number, date || new Date(), validUntil || null, status || 'draft', contractorId || null, projectId || null, addressedTo || null, totalAmount || 0, taxAmount || 0, discountAmount || 0, notes || null]
    );

    const quoteId = result.rows[0].id;

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO quote_items 
          (quote_id, item_type, item_id, name, quantity, price, discount_percent, total) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [quoteId, item.itemType || 'custom', item.itemId || null, item.name, item.quantity || 1, item.price || 0, item.discountPercent || 0, item.total || 0]
        );
      }
    }

    await db.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    next(error);
  }
};

exports.updateQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { number, date, validUntil, status, contractorId, projectId, addressedTo, totalAmount, taxAmount, discountAmount, notes, items } = req.body;

    if (!number) {
      return res.status(400).json({ message: 'Quote number is required' });
    }

    await db.query('BEGIN');

    const result = await db.query(
      `UPDATE quotes SET 
        number = $1, date = $2, valid_until = $3, status = $4, contractor_id = $5, project_id = $6, addressed_to = $7, 
        total_amount = $8, tax_amount = $9, discount_amount = $10, notes = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [number, date, validUntil || null, status || 'draft', contractorId || null, projectId || null, addressedTo || null, totalAmount || 0, taxAmount || 0, discountAmount || 0, notes || null, id]
    );

    if (result.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Quote not found' });
    }

    if (items) {
      await db.query(`DELETE FROM quote_items WHERE quote_id = $1`, [id]);
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await db.query(
            `INSERT INTO quote_items 
            (quote_id, item_type, item_id, name, quantity, price, discount_percent, total) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, item.itemType || 'custom', item.itemId || null, item.name, item.quantity || 1, item.price || 0, item.discountPercent || 0, item.total || 0]
          );
        }
      }
    }

    await db.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    next(error);
  }
};

exports.deleteQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM quotes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.generatePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT q.*, c.name as contractor_name 
       FROM quotes q 
       LEFT JOIN contractors c ON q.contractor_id = c.id
       WHERE q.id = $1`, [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    const quote = rows[0];
    const { rows: items } = await db.query(
      `SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY id ASC`, [id]
    );

    const docDefinition = {
      content: [
        { text: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', style: 'header', alignment: 'center' },
        { text: `№ ${quote.number} от ${new Date(quote.date).toLocaleDateString()}`, alignment: 'center', margin: [0, 0, 0, 20] },
        { text: `Клиент: ${quote.contractor_name || 'Частное лицо'}`, margin: [0, 0, 0, 5] },
        { text: `Кому адресовано: ${quote.addressed_to || '-'}`, margin: [0, 0, 0, 5] },
        { text: `Действительно до: ${quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'Бессрочно'}`, margin: [0, 0, 0, 20] },
        
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Наименование', style: 'tableHeader' },
                { text: 'Кол-во', style: 'tableHeader' },
                { text: 'Цена (₽)', style: 'tableHeader' },
                { text: 'Скидка (%)', style: 'tableHeader' },
                { text: 'Сумма (₽)', style: 'tableHeader' }
              ],
              ...items.map(item => [
                item.name,
                item.quantity.toString(),
                Number(item.price).toLocaleString(),
                item.discount_percent.toString(),
                Number(item.total).toLocaleString()
              ])
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },
        
        { text: `Скидка: ${Number(quote.discount_amount).toLocaleString()} ₽`, alignment: 'right', margin: [0, 0, 0, 5] },
        { text: `Налог: ${Number(quote.tax_amount).toLocaleString()} ₽`, alignment: 'right', margin: [0, 0, 0, 5] },
        { text: `ИТОГО: ${Number(quote.total_amount).toLocaleString()} ₽`, style: 'total', alignment: 'right', margin: [0, 0, 0, 20] },
        
        { text: 'Примечания:', style: 'subheader', margin: [0, 20, 0, 5] },
        { text: quote.notes || 'Нет примечаний.' }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 14,
          bold: true,
        },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: 'black',
          fillColor: '#eeeeee'
        },
        total: {
          fontSize: 14,
          bold: true
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    const pdfBuffer = await generatePdfBuffer(docDefinition);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="КП_${quote.number}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

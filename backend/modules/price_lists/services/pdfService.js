const db = require('../../../db');
const pdfGenerator = require('../../../utils/pdfGenerator');

exports.generatePriceListPdf = async (priceListId) => {
  const { rows: plRows } = await db.query('SELECT * FROM price_lists WHERE id = $1', [priceListId]);
  if (!plRows.length) throw new Error('Price list not found');
  const priceList = plRows[0];

  // Fetch items
  const { rows: items } = await db.query(`
    SELECT pli.*, 
           COALESCE(p.name, s.name) as item_name,
           COALESCE(pc.name, sc.name, 'Без категории') as category_name
    FROM price_list_items pli
    LEFT JOIN products p ON pli.item_type = 'product' AND pli.item_id = p.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN services s ON pli.item_type = 'service' AND pli.item_id = s.id
    LEFT JOIN service_categories sc ON s.category_id = sc.id
    WHERE pli.price_list_id = $1
    ORDER BY category_name, item_name
  `, [priceListId]);

  // Group by category
  const groupedItems = items.reduce((acc, item) => {
    const cat = item.category_name;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const docDefinition = {
    content: [
      { text: `Прайс-лист: ${priceList.name}`, style: 'header' },
      { text: `Валюта: ${priceList.currency}`, margin: [0, 0, 0, 10] },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 5],
      },
      categoryHeader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
        fillColor: '#eeeeee',
      },
      tableExample: {
        margin: [0, 5, 0, 15],
      },
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
    },
  };

  if (items.length === 0) {
    docDefinition.content.push({ text: 'Прайс-лист пуст.' });
    return pdfGenerator(docDefinition);
  }

  for (const [category, catItems] of Object.entries(groupedItems)) {
    docDefinition.content.push({ text: category, style: 'categoryHeader' });
    
    const tableBody = [
      [{ text: 'Наименование', bold: true }, { text: 'Цена', bold: true }]
    ];
    
    for (const item of catItems) {
      tableBody.push([
        item.item_name,
        { text: Number(item.price).toFixed(2), alignment: 'right' }
      ]);
    }
    
    docDefinition.content.push({
      style: 'tableExample',
      table: {
        widths: ['*', 100],
        body: tableBody,
      },
      layout: 'lightHorizontalLines'
    });
  }

  return pdfGenerator(docDefinition);
};

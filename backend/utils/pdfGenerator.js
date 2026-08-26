/**
 * Утилита для генерации PDF документов на базе pdfmake
 */

const PdfPrinter = require('pdfmake/js/Printer').default;
const URLResolver = require('pdfmake/js/URLResolver').default;
const virtualfs = require('pdfmake/js/virtual-fs').default;
const path = require('path');

const pdfMakePath = path.dirname(require.resolve('pdfmake/package.json'));

// Шрифты Roboto (встроенные в pdfmake)
const fonts = {
  Roboto: {
    normal: path.join(pdfMakePath, 'fonts/Roboto/Roboto-Regular.ttf'),
    bold: path.join(pdfMakePath, 'fonts/Roboto/Roboto-Medium.ttf'),
    italics: path.join(pdfMakePath, 'fonts/Roboto/Roboto-Italic.ttf'),
    bolditalics: path.join(pdfMakePath, 'fonts/Roboto/Roboto-MediumItalic.ttf')
  }
};

const urlResolver = new URLResolver(virtualfs);
const printer = new PdfPrinter(fonts, virtualfs, urlResolver);

/**
 * Создать PDF поток из определения документа
 * @param {Object} docDefinition - Определение pdfmake
 * @returns {Promise<Buffer>}
 */
async function generatePdfBuffer(docDefinition) {
  const pdfDoc = await printer.createPdfKitDocument(docDefinition);
  
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];

      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Генерирует простой табличный отчет
 * @param {string} title - Заголовок
 * @param {string[]} headers - Заголовки колонок
 * @param {Array<Array>} body - Данные таблицы
 */
async function generateTableReport(title, headers, body) {
  const docDefinition = {
    content: [
      { text: title, style: 'header' },
      {
        table: {
          headerRows: 1,
          widths: Array(headers.length).fill('*'),
          body: [
            headers.map(h => ({ text: h, style: 'tableHeader' })),
            ...body.map(row => row.map(cell => ({ text: String(cell ?? ''), style: 'tableCell' })))
          ]
        },
        layout: 'lightHorizontalLines'
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: 'black',
        fillColor: '#eeeeee'
      },
      tableCell: {
        fontSize: 10,
        margin: [0, 2, 0, 2]
      }
    },
    defaultStyle: {
      font: 'Roboto'
    },
    pageOrientation: headers.length > 5 ? 'landscape' : 'portrait'
  };

  return generatePdfBuffer(docDefinition);
}

module.exports = {
  generatePdfBuffer,
  generateTableReport
};

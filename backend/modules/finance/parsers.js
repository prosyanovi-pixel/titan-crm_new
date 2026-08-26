// backend/routes/finance/parsers.js
/**
 * Парсеры банковских выписок: 1С (1CClientBankExchange) и CSV.
 */

const { parseDateValue, toNumber } = require('./utils');
const { parseCsv } = require('./parserParts/csv');

/**
 * Применяет поле к текущему документу.
 * @param {object} doc
 * @param {string} key
 * @param {string} val
 */
function applyField(doc, key, val) {
  switch (key) {
    case 'Номер':               doc.docNum = val; break;
    case 'Дата':                doc.date = parseDateValue(val); break;
    case 'Сумма':               doc.amount = toNumber(val.replace(/\s/g, '').replace(',', '.')); break;
    case 'ДатаСписано':         if (val) doc.dateSpisano = parseDateValue(val); break;
    case 'ДатаПоступило':       if (val) doc.datePostupilo = parseDateValue(val); break;
    // Плательщик
    case 'ПлательщикСчет':      doc.payerAccount = val; break;
    case 'Плательщик':          doc.payerName = val; break;
    case 'ПлательщикИНН':       doc.payerInn = val; break;
    case 'ПлательщикКПП':       doc.payerKpp = val; break;
    case 'ПлательщикРасчСчет':  doc.payerSettleAccount = val; break;
    case 'ПлательщикБанк1':     doc.payerBank = val; break;
    case 'ПлательщикБИК':       doc.payerBik = val; break;
    case 'ПлательщикКорсчет':   doc.payerKorAccount = val; break;
    // Получатель
    case 'ПолучательСчет':      doc.recipientAccount = val; break;
    case 'Получатель':          doc.recipientName = val; break;
    case 'ПолучательИНН':       doc.recipientInn = val; break;
    case 'ПолучательКПП':       doc.recipientKpp = val; break;
    case 'ПолучательРасчСчет':  doc.recipientSettleAccount = val; break;
    case 'ПолучательБанк1':     doc.recipientBank = val; break;
    case 'ПолучательБИК':       doc.recipientBik = val; break;
    case 'ПолучательКорсчет':   doc.recipientKorAccount = val; break;
    // Назначение
    case 'НазначениеПлатежа':   doc.purpose = val; break;
  }
}

/**
 * Извлекает НДС из назначения платежа
 * @param {string} purpose
 * @returns {{vatRate: number, vatAmount: number} | null}
 */
function extractVatFromPurpose(purpose) {
  if (!purpose) return null;
  
  // Паттерны: "НДС (22%) 38411-72", "НДС 22% 38411.72", "в т.ч. НДС (22%) 38411-72"
  const vatPatterns = [
    /НДС\s*\((\d+)%\)\s*([\d\s,-]+)/i,
    /НДС\s+(\d+)%\s*([\d\s,-]+)/i,
    /в\s*т\.ч\.\s*НДС\s*\((\d+)%\)\s*([\d\s,-]+)/i,
  ];
  
  for (const pattern of vatPatterns) {
    const match = purpose.match(pattern);
    if (match) {
      const rate = parseInt(match[1]);
      const amountStr = match[2].replace(/\s/g, '').replace(',', '.');
      const amount = parseFloat(amountStr);
      if (!isNaN(rate) && !isNaN(amount)) {
        return { vatRate: rate, vatAmount: amount };
      }
    }
  }
  
  // Проверка на "Без НДС" или "НДС не облагается"
  if (/без\s+налога\s*\(НДС\)|НДС\s+не\s+облагается|Без\s+НДС/i.test(purpose)) {
    return { vatRate: 0, vatAmount: 0 };
  }
  
  return null;
}

/**
 * Парсинг выписки в формате 1CClientBankExchange (Альфа-Банк, Сбербанк и др.).
 * @param {string} content
 * @returns {Array<object>}
 */
const parse1cTxt = (content) => {
  const rawLines = content.split(/\r?\n/);
  const docs = [];
  const ourAccounts = new Set();

  // Собираем наши расчётные счета из заголовка
  let inHeader = true;
  for (const raw of rawLines) {
    const line = raw.trim();
    if (line.startsWith('СекцияДокумент') || line.startsWith('СекцияРасчСчет')) {
      inHeader = false;
    }
    if (inHeader && line.startsWith('РасчСчет=')) {
      const acc = line.substring('РасчСчет='.length).trim();
      if (acc) ourAccounts.add(acc);
    }
  }

  let inSection = false;
  let current = null;
  let lastKey = null;

  const isValidKey = (k) => /^[А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z0-9]*$/.test(k);

  for (const raw of rawLines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('СекцияДокумент')) {
      inSection = true;
      current = {};
      docs.push(current);
      const eqIdx = line.indexOf('=');
      if (eqIdx >= 0) current.docType = line.substring(eqIdx + 1).trim();
      lastKey = null;
      continue;
    }
    if (line.startsWith('КонецДокумента')) {
      inSection = false;
      current = null;
      lastKey = null;
      continue;
    }
    if (!inSection || !current) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx < 0) {
      if (lastKey === 'НазначениеПлатежа') {
        current.purpose = (current.purpose || '') + ' ' + line;
      }
      continue;
    }

    const keyPart = line.substring(0, eqIdx);
    const val = line.substring(eqIdx + 1).trim();

    if (keyPart.includes(' ')) {
      const spaceIdx = keyPart.lastIndexOf(' ');
      const continuation = keyPart.substring(0, spaceIdx).trim();
      const newKey = keyPart.substring(spaceIdx + 1).trim();
      if (lastKey === 'НазначениеПлатежа' && continuation) {
        current.purpose = (current.purpose || '') + ' ' + continuation;
      }
      if (isValidKey(newKey)) {
        lastKey = newKey;
        applyField(current, newKey, val);
      }
      continue;
    }

    lastKey = keyPart.trim();
    applyField(current, lastKey, val);
  }

  return docs
    .filter(d => d.amount > 0 || d.dateSpisano || d.datePostupilo)
    .map(d => {
      let direction = 'debit';
      if (d.dateSpisano && !d.datePostupilo) direction = 'debit';
      else if (d.datePostupilo && !d.dateSpisano) direction = 'credit';
      else if (d.dateSpisano) direction = 'debit';
      else direction = 'credit';

      const date = direction === 'debit'
        ? (d.dateSpisano || d.date)
        : (d.datePostupilo || d.date);

      let cpName, cpInn, cpKpp, cpAccount, cpBankName, cpBik, cpKorAccount;
      if (direction === 'debit') {
        cpName = d.recipientName; cpInn = d.recipientInn; cpKpp = d.recipientKpp;
        cpAccount = d.recipientAccount || d.recipientSettleAccount;
        cpBankName = d.recipientBank; cpBik = d.recipientBik; cpKorAccount = d.recipientKorAccount;
      } else {
        cpName = d.payerName; cpInn = d.payerInn; cpKpp = d.payerKpp;
        cpAccount = d.payerAccount || d.payerSettleAccount;
        cpBankName = d.payerBank; cpBik = d.payerBik; cpKorAccount = d.payerKorAccount;
      }

      // Извлекаем НДС из назначения платежа
      const vatInfo = extractVatFromPurpose(d.purpose);

      return {
        date,
        amount: d.amount || 0,
        vatRate: vatInfo ? vatInfo.vatRate : null,
        vatAmount: vatInfo ? vatInfo.vatAmount : null,
        direction,
        counterparty: cpName || '',
        counterpartyInn: cpInn || '',
        counterpartyKpp: cpKpp || '',
        counterpartyAccount: cpAccount || '',
        counterpartyBankName: cpBankName || '',
        counterpartyBik: cpBik || '',
        counterpartyKorAccount: cpKorAccount || '',
        purpose: (d.purpose || '').trim(),
        reference: d.docNum || '',
        docType: d.docType || '',
      };
    })
    .filter(l => l.date && l.amount >= 0);
};

module.exports = { parse1cTxt, parseCsv };

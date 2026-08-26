const { parseDateValue, toNumber } = require('../utils');

/**
 * Парсинг CSV выписки.
 * @param {string} content
 * @returns {Array<object>}
 */
const parseCsv = (content) => {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];

  const firstRowCols = lines[0].split(/[,;\t]/).map(h => h.trim());
  const headers = firstRowCols.map(h => h.toLowerCase());

  const findCol = (...names) => {
    for (const n of names) {
      const idx = headers.findIndex(h => h.includes(n));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  let dateIdx = findCol('дата', 'date');
  let amtIdx  = findCol('сумма', 'amount', 'sum');
  let dirIdx  = findCol('направление', 'direction', 'вид', 'тип');
  let cpIdx   = findCol('контрагент', 'counterparty', 'плательщик');
  let purpIdx = findCol('назначение', 'purpose', 'описание');
  let refIdx  = findCol('номер', 'reference', 'п/п');

  if (dateIdx === -1 || amtIdx === -1 || cpIdx === -1 || purpIdx === -1) {
    const sampleCols = firstRowCols.length;
    if (dateIdx === -1) dateIdx = 0;
    if (amtIdx === -1) amtIdx = sampleCols > 3 ? 3 : Math.max(1, sampleCols - 3);
    if (cpIdx === -1) cpIdx = sampleCols > 2 ? 2 : 1;
    if (refIdx === -1) refIdx = sampleCols > 6 ? 6 : Math.max(2, sampleCols - 2);
    if (purpIdx === -1) purpIdx = sampleCols - 1;
  }

  const firstIsDate = /^\d{2}\.\d{2}\.\d{4}$/.test(firstRowCols[0]);
  const dataRows = firstIsDate ? lines : lines.slice(1);

  return dataRows.map(raw => {
    const cols = raw.split(/[,;\t]/);
    const get = (idx) => (idx >= 0 ? (cols[idx] || '').trim() : '');
    const rawAmt = get(amtIdx).replace(/\s/g, '').replace(',', '.');
    const amount = toNumber(rawAmt);
    const rawDir = get(dirIdx).toLowerCase();
    const direction = rawDir.includes('приход') || rawDir.includes('credit') || rawDir.includes('кред')
      ? 'credit' : 'debit';
    return {
      date: parseDateValue(get(dateIdx)),
      amount: Math.abs(amount),
      direction: amount < 0 ? 'debit' : direction,
      counterparty: get(cpIdx),
      purpose: get(purpIdx),
      reference: get(refIdx),
    };
  }).filter(l => l.date && l.amount);
};

module.exports = { parseCsv };
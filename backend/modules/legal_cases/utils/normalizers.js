/**
 * Нормализация данных кейса
 * Преобразование полей к единому формату
 */

const { pickFirstDefined } = require('./utils');

/**
 * Нормализует основные поля кейса
 * @param {Object} caseRow - Строка из БД
 * @returns {Object} Нормализованный кейс
 */
const normalizeCaseCoreFields = (caseRow) => {
  if (!caseRow) return caseRow;

  caseRow.creationDate = pickFirstDefined(caseRow.creationDate, caseRow.creation_date, caseRow.creationdate);
  caseRow.lawyerName   = pickFirstDefined(caseRow.lawyerName,   caseRow.lawyer_name,   caseRow.lawyername);
  caseRow.caseNumber   = pickFirstDefined(caseRow.caseNumber,   caseRow.case_number,   caseRow.casenumber);
  caseRow.courtName    = pickFirstDefined(caseRow.courtName,    caseRow.court_name,    caseRow.courtname);
  caseRow.startDate    = pickFirstDefined(caseRow.startDate,    caseRow.start_date,    caseRow.startdate);
  caseRow.lawyerId     = pickFirstDefined(caseRow.lawyerId,     caseRow.lawyer_id,     caseRow.lawyerid);
  caseRow.plaintiff    = pickFirstDefined(caseRow.plaintiff,    caseRow.plaintiff);
  caseRow.defendant    = pickFirstDefined(caseRow.defendant,    caseRow.defendant);
  caseRow.judge        = pickFirstDefined(caseRow.judge,        caseRow.judge);
  caseRow.client       = pickFirstDefined(caseRow.client,       caseRow.client);
  caseRow.outcome      = pickFirstDefined(caseRow.outcome,      caseRow.outcome);
  caseRow.description  = pickFirstDefined(caseRow.description,  caseRow.description);
  caseRow.sentDate     = pickFirstDefined(caseRow.sentDate,     caseRow.sent_date,     caseRow.sentdate);
  caseRow.responseDueDate = pickFirstDefined(caseRow.responseDueDate, caseRow.response_due_date, caseRow.responseduedate);
  caseRow.lawyerAvatar    = pickFirstDefined(caseRow.lawyerAvatar,    caseRow.lawyer_avatar,   caseRow.lawyeravatar);

  const optionalFields = [
    'creationDate', 'lawyerName', 'caseNumber', 'courtName', 'startDate',
    'lawyerId', 'plaintiff', 'defendant', 'judge', 'client', 'outcome', 
    'description', 'sentDate', 'responseDueDate', 'deadline', 'firstInstanceNumber', 'lawyerAvatar'
  ];

  optionalFields.forEach(field => {
    if (caseRow[field] === null || caseRow[field] === '' || caseRow[field] === undefined) {
      delete caseRow[field];
    }
  });

  return caseRow;
};

/**
 * Нормализует заметку
 * @param {Object} note - Заметка
 * @returns {Object} Нормализованная заметка
 */
const normalizeNote = (note) => ({
  ...note,
  isInternal: note.isInternal || false,
  // Гарантируем что authorId всегда присутствует
  // Используем author как fallback если authorId не задан
  authorId: note.authorId || note.author || 'unknown',
});

module.exports = {
  normalizeCaseCoreFields,
  normalizeNote,
};

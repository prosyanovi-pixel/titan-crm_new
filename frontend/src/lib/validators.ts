/**
 * Утилиты для валидации данных (ИНН, КПП, ОГРН и др.)
 */

/**
 * Валидация ИНН (10 или 12 цифр)
 */
export const validateINN = (inn: string): boolean => {
  const re = /^\d{10}(\d{2})?$/;
  return re.test(inn);
};

/**
 * Валидация КПП (9 цифр)
 */
export const validateKPP = (kpp: string): boolean => {
  if (!kpp) return true; // КПП опционален
  const re = /^\d{9}$/;
  return re.test(kpp);
};

/**
 * Валидация ОГРН (13 или 15 цифр)
 */
export const validateOGRN = (ogrn: string): boolean => {
  if (!ogrn) return true; // ОГРН опционален
  const re = /^\d{13}(\d{2})?$/;
  return re.test(ogrn);
};

/**
 * Валидация БИК (9 цифр)
 */
export const validateBIK = (bik: string): boolean => {
  if (!bik) return true;
  const re = /^\d{9}$/;
  return re.test(bik);
};

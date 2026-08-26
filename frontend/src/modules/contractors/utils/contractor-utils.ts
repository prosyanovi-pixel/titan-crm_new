import { format, parse, isValid } from "date-fns";
import { Contractor, LegalEntityType, LegalForm } from "../types/contractor.types";

/**
 * Форматирует строку даты (ISO или DD.MM.YYYY) в формат DD.MM.YYYY для отображения.
 * 
 * @param dateStr - Исходная строка даты
 * @returns Отформатированная дата или исходная строка
 */
export const formatDateDisplay = (dateStr?: string): string => {
  if (!dateStr) return "";
  
  // Try parsing DD.MM.YYYY first
  let parsed = parse(dateStr, "dd.MM.yyyy", new Date());
  if (isValid(parsed)) return format(parsed, "dd.MM.yyyy");

  // Try parsing ISO
  parsed = new Date(dateStr);
  if (isValid(parsed)) return format(parsed, "dd.MM.yyyy");
  
  return dateStr;
};

/**
 * Проверяет, является ли контрагент физическим лицом.
 * 
 * @param contractor - Данные контрагента (частичные)
 * @returns true, если это физ. лицо
 */
export const isPrivateContractor = (contractor: Partial<Contractor> | null): boolean => {
  if (!contractor) return false;
  return contractor.legalEntityType === 'private' || 
         contractor.legalForm === 'private' || 
         contractor.legalForm === 'self' ||
         contractor.groupId === 'private';
};

/**
 * Проверяет, является ли контрагент индивидуальным предпринимателем (ИП).
 * 
 * @param contractor - Данные контрагента (частичные)
 * @returns true, если это ИП
 */
export const isIndividualEntrepreneur = (contractor: Partial<Contractor> | null): boolean => {
  if (!contractor) return false;
  return contractor.legalEntityType === 'individual' || contractor.legalForm === 'ip';
};

/**
 * Проверяет, является ли контрагент иностранной организацией.
 * 
 * @param contractor - Данные контрагента (частичные)
 * @returns true, если это иностранная организация
 */
export const isForeignEntity = (contractor: Partial<Contractor> | null): boolean => {
  if (!contractor) return false;
  return contractor.legalEntityType === 'foreign' || contractor.legalForm === 'foreign';
};

/**
 * Проверяет, является ли контрагент бизнес-сущностью (Юр. лицо, ИП или иностранная орг.).
 * 
 * @param contractor - Данные контрагента (частичные)
 * @returns true, если это бизнес-сущность
 */
export const isBusinessContractor = (contractor: Partial<Contractor> | null): boolean => {
  if (!contractor) return false;
  return !isPrivateContractor(contractor);
};

/**
 * Сопоставляет тип контрагента с конкретными LegalEntityType и LegalForm.
 * 
 * @param type - Тип контрагента
 * @returns Объект с entityType и form
 */
export const mapTypeToLegalDetails = (type: string): { entityType: LegalEntityType; form: LegalForm } => {
  switch (type) {
    case "private":
      return { entityType: "private", form: "private" };
    case "individual":
      return { entityType: "individual", form: "ip" };
    case "foreign":
      return { entityType: "foreign", form: "foreign" };
    case "legal":
    default:
      return { entityType: "legal", form: "ooo" };
  }
};

/**
 * Определяет ID юридической формы по полному наименованию, используя ключевые слова.
 * 
 * @param fullName - Полное наименование контрагента
 * @param legalFormsList - Список доступных юридических форм со словарями ключевых слов
 * @returns Объект с id и groupId юридической формы или null
 */
export const detectLegalFormFromName = (
  fullName: string, 
  legalFormsList: Array<{ id: string; keywords?: string; groupId?: string }>
): { id: string; groupId?: string } | null => {
  if (!fullName || !legalFormsList || legalFormsList.length === 0) return null;
  
  const lowerName = fullName.toLowerCase();
  
  for (const lf of legalFormsList) {
    if (lf.keywords) {
      const keywords = lf.keywords.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
      if (keywords.some((k: string) => lowerName.includes(k))) {
        return { id: lf.id, groupId: lf.groupId };
      }
    }
  }
  
  return null;
};


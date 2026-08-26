export type LawyerStatus = "active" | "vacation" | "sick" | "fired" | "archived";
export type Specialization = "corporate" | "criminal" | "family" | "arbitration" | "civil";
export type CaseStatus = "new" | "preparation" | "filing" | "hearing" | "decision" | "enforcement" | "done" | "archived" | "in_progress" | "paused" | "draft" | "claim_draft" | "claim_sent" | "claim_negotiation";
/** Статусы претензий */
export type ClaimStatus = "draft" | "sent" | "rejected" | "satisfied" | "transferred_to_court";
export type Currency = "RUB" | "USD" | "EUR" | "CNY" | "GBP";
export type CaseType = "claim" | "court";
export type CaseOutcome = "won" | "won_partial" | "lost";
export type LawyerTabType = "specialists" | "cases" | "claims" | "courts";
export type CaseUpdateType = "case_update" | "case_note" | "document_added";

export type CaseInstanceType = 'first' | 'appeal' | 'cassation' | 'supervision';

export interface CaseInstance {
  id: string;
  caseId: string;
  instanceType: CaseInstanceType;
  instanceNumber: string;
  courtName?: string;
  judge?: string;
  status?: string;
  isActive: boolean;
  creationDate?: string;
  updatedAt?: string;
}

export interface CaseRecordUpdate {
  id: string;
  case_id: string;
  lawyer_id?: string;
  update_type: CaseUpdateType;
  title: string;
  description?: string;
  is_viewed: boolean;
  viewed_at?: string;
  viewed_by?: string;
  created_at: string;
}

export interface Lawyer {
  id: string;
  name: string;
  fullName?: string;
  avatar?: string;
  email: string;
  phone: string;
  status: LawyerStatus;
  specializations: Specialization[];
  rating: number;
  activeCasesCount: number;
  wonCasesCount: number;
  hourlyRate: number;
  telegramId?: string;
  notes?: string;
}

export interface MoneyAmount {
  amount: number;
  currency: Currency;
}

export interface TimelineEvent {
  id: string;
  caseId?: string;
  instanceId?: string;
  date: string;
  type: "court" | "document" | "finance" | "communication" | "quick_action";
  title: string;
  description?: string;
  author: string;
}

export interface DocumentComment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface CaseDocument {
  id: string;
  caseId?: string;
  instanceId?: string;
  name: string;
  type: string;
  date: string;
  size: string;
  author: string;
  authorId?: string;
  url?: string;
  file?: File; // Файл для загрузки (если еще не загружен)
  comments?: DocumentComment[];
}

export interface CaseNote {
  id: string;
  caseId?: string;
  instanceId?: string;
  author: string;
  authorId?: string;
  initials: string;
  date: string;
  text: string;
  isInternal: boolean;
  attachments?: CaseNoteAttachment[];  // Прикреплённые документы (ссылки)
}

export interface CaseNoteAttachment {
  id: string;
  name: string;        // Название документа
  url: string;         // Ссылка на документ
  type: string;        // Тип документа (договор, счёт, письмо...)
  addedAt: string;     // Дата добавления
}

export interface ThirdParty {
  name: string;
  role: string;
}

/** Элемент взысканной суммы */
export interface RecoveredItem {
  id: string;
  type: string;        // тип взыскания (деньги, услуги, имущество...)
  amount: number;
  currency: Currency;
}

/** Элемент расходов */
export interface ExpenseItem {
  id: string;
  type: string;        // тип расходов (транспорт, перевод, экспертиза...)
  performer: string;   // исполнитель
  amount: number;
  currency: Currency;
}

export interface Court {
  id: string;
  name: string;
  address: string;
}

export interface Judge {
  id: string;
  name: string;
  courtId: string;
  courtName?: string;
  secretaryPhone?: string;  // Телефон секретаря
  assistantPhone?: string;  // Телефон помощника
  email?: string;           // Эл. почта
  office?: string;          // Кабинет
  composition?: string;     // Состав суда (однофамилица/тройка и т.д.)
}

export interface LegalCase {
  id: string;
  type: CaseType;
  title: string;
  /** @deprecated Используйте firstInstanceNumber для судебных дел */
  caseNumber?: string;
  /** Номер дела в первой инстанции — фиксированный идентификатор, не меняется при апелляциях */
  firstInstanceNumber?: string;
  lawyerId: string;
  lawyerName: string;
  lawyerAvatar?: string;
  client: string;        // Клиент (по умолчанию "ТИТАН")
  plaintiff: string;     // Истец
  defendant: string;     // Ответчик
  thirdParties?: ThirdParty[];
  courtName?: string;
  courtAddress?: string;
  judge?: string;
  status: CaseStatus;
  outcome?: CaseOutcome;  // Исход дела
  creationDate: string;
  startDate: string;
  deadline: string;
  /** Дата отправления претензии (claim) */
  sentDate?: string;
  /** Дата до которой должен поступить ответ на претензию (claim) */
  responseDueDate?: string;
  price: number;
  claimAmount: MoneyAmount;
  stateDuty: number;
  expertiseCost: number;
  otherClaimCosts: number;
  recoveredAmount: MoneyAmount;         // Основная взысканная сумма
  recoveredItems: RecoveredItem[];      // Детализация взысканий
  enforcementFee: number;
  executionCosts: number;
  transportExpenses: number;
  translationExpenses: number;
  otherExpenses: number;
  expenses: ExpenseItem[];              // Детализация расходов
  description?: string;
  events?: TimelineEvent[];
  documents?: CaseDocument[];
  notes?: CaseNote[];
  instances?: CaseInstance[];
  // Обновления дела (отслеживание новых изменений)
  unviewedUpdates?: CaseRecordUpdate[];
  hasUnviewedUpdates?: boolean;
  // Метаинформация
  hasDocuments?: boolean;                // Есть ли прикрепленные документы
  updatedAt?: string;                    // Дата последнего обновления
}

export interface CaseFilters {
  status?: CaseStatus;
  lawyerId?: string;
  searchQuery?: string;
  hasDocuments?: boolean;                // Фильтр: только дела с документами
  sortBy?: 'created_at' | 'updated_at'; // Сортировка: по дате создания или обновления
}

export interface LawyerFilters {
  status?: LawyerStatus;
  specialization?: Specialization;
  searchQuery?: string;
}

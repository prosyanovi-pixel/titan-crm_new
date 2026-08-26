// Shared types and constants for Mail Filters

export interface FilterCondition {
  id?: string;
  conditionType: string;
  operator: string;
  conditionValue: string;
  isRegex?: boolean;
  displayOrder?: number;
}

export interface MailFilter {
  id: string;
  filterName: string;
  description?: string;
  matchType: 'all' | 'any';
  targetFolderId?: string;
  applyStar?: boolean;
  applyRead?: boolean;
  applyLabelId?: string;
  deleteMail?: boolean;
  forwardTo?: string;
  isActive: boolean;
  displayOrder?: number;
  conditions?: FilterCondition[];
}

export interface MailFolder {
  id: string;
  folderName: string;
  folderType: string;
}

export const CONDITION_TYPES = [
  { value: 'from', labelKey: 'mail.filters.from' },
  { value: 'to', labelKey: 'mail.filters.to' },
  { value: 'subject', labelKey: 'mail.filters.subject_field' },
  { value: 'body', labelKey: 'mail.filters.body' },
  { value: 'has_attachment', labelKey: 'mail.filters.has_attachment' },
  { value: 'size', labelKey: 'mail.filters.size' },
  { value: 'date', labelKey: 'mail.filters.date' },
];

export const OPERATORS = [
  { value: 'contains', labelKey: 'mail.filters.operator_contains' },
  { value: 'equals', labelKey: 'mail.filters.operator_equals' },
  { value: 'starts_with', labelKey: 'mail.filters.operator_starts_with' },
  { value: 'ends_with', labelKey: 'mail.filters.operator_ends_with' },
  { value: 'not_contains', labelKey: 'mail.filters.operator_not_contains' },
  { value: 'regex', labelKey: 'mail.filters.operator_regex' },
  { value: 'greater_than', labelKey: 'mail.filters.operator_greater_than' },
  { value: 'less_than', labelKey: 'mail.filters.operator_less_than' },
];

export const DEFAULT_CONDITION: FilterCondition = {
  conditionType: 'from',
  operator: 'contains',
  conditionValue: '',
};

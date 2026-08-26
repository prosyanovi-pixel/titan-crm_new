/**
 * Схемы валидации Zod для модуля Projects
 * 
 * Используются для валидации форм создания/редактирования
 */
import { z } from 'zod';

/** Тип для функции перевода, совместимый с локальной реализацией i18n */
type TFunction = (key: string, params?: any) => string;

/**
 * Схема для создания/редактирования проекта
 */
export const createProjectSchema = (t: TFunction) => z.object({
  name: z.string().min(1, t('projects.validation.name_required')),
  client: z.string().min(1, t('projects.validation.client_min')),
  manager: z.string().min(1, t('projects.validation.manager_min')),
  status: z.string().min(1, t('projects.validation.status_required')),
  priority: z.string().min(1, t('projects.validation.priority_required')),
  budget: z.number().min(0, t('projects.validation.budget_negative')),
  deadline: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, t('projects.validation.deadline_format')).optional().or(z.literal('')),
  description: z.string().optional(),
  parentId: z.number().nullable().optional(),
  contractorId: z.number().optional(),
  taxRegime: z.string().optional(),
});

/**
 * Схема для создания этапа проекта
 */
export const createProjectStageSchema = (t: TFunction) => z.object({
  name: z.string().min(1, t('projects.validation.stage_name_required')),
  type: z.string().optional().default('stage'),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, t('projects.validation.stage_start_format')).optional().or(z.literal('')),
  endDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, t('projects.validation.stage_end_format')).optional().or(z.literal('')),
  plannedStartDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, t('projects.validation.stage_planned_start_format')).optional().or(z.literal('')),
  plannedEndDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, t('projects.validation.stage_planned_end_format')).optional().or(z.literal('')),
  budget: z.number().min(0, t('projects.validation.budget_negative')).optional().default(0),
  progress: z.number().min(0).max(100).optional().default(0),
  isCompleted: z.boolean().optional().default(false),
  color: z.string().optional().or(z.literal('')),
});

/**
 * Схема для создания дохода проекта
 */
export const createProjectRevenueSchema = (t: TFunction) => z.object({
  name: z.string().min(1, t('projects.validation.revenue_name_required')),
  description: z.string().optional(),
  amount: z.number().min(0.01, t('projects.validation.revenue_amount_min')),
  currency: z.enum(['RUB', 'USD', 'EUR']).default('RUB'),
  plannedDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, t('projects.validation.revenue_date_format')).optional().or(z.literal('')),
  vatRate: z.number().min(0).max(100).optional().default(0),
  isTaxable: z.boolean().optional().default(false),
  stageId: z.number().optional(),
  contractorId: z.number().optional(),
});

/**
 * Схема для создания расхода проекта
 */
export const createProjectExpenseSchema = (t: TFunction) => z.object({
  name: z.string().min(1, t('projects.validation.expense_name_required')),
  description: z.string().optional(),
  amount: z.number().min(0.01, t('projects.validation.amount_min')),
  category: z.string().min(1, t('projects.validation.expense_category_required')),
  plannedDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, t('projects.validation.expense_date_format')).optional().or(z.literal('')),
  vatRate: z.number().min(0).max(100).optional().default(0),
  isTaxable: z.boolean().optional().default(false),
  stageId: z.number().optional(),
});

/**
 * Схема для создания платежа
 */
export const createPaymentScheduleSchema = (t: TFunction) => z.object({
  name: z.string().min(1, t('projects.validation.payment_name_required')),
  description: z.string().optional(),
  amount: z.number().min(0.01, t('projects.validation.amount_min')),
  currency: z.enum(['RUB', 'USD', 'EUR']).default('RUB'),
  dueDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, t('projects.validation.payment_date_format')).optional().or(z.literal('')),
  paymentMethod: z.enum(['bank', 'cash', 'card', 'other']).default('bank'),
  stageId: z.number().optional(),
});

/**
 * Типы для схем
 */
export type ProjectFormData = z.infer<ReturnType<typeof createProjectSchema>>;
export type ProjectStageFormData = z.infer<ReturnType<typeof createProjectStageSchema>>;
export type ProjectRevenueFormData = z.infer<ReturnType<typeof createProjectRevenueSchema>>;
export type ProjectExpenseFormData = z.infer<ReturnType<typeof createProjectExpenseSchema>>;
export type PaymentScheduleFormData = z.infer<ReturnType<typeof createPaymentScheduleSchema>>;


/**
 * Хелпер для валидации формы
 * 
 * @example
 * ```typescript
 * const result = validateForm(projectSchema, formData);
 * if (!result.success) {
 *   console.error(result.errors);
 *   return;
 * }
 * // result.data — валидные данные
 * ```
 */
export function validateForm<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError['errors'] } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors,
    };
  }
  
  return {
    success: true,
    data: result.data,
  };
}

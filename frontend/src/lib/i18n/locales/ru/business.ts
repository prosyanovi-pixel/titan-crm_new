// Для поддержки t("business.confirm.delete_task") и т.д.
import { tasks, task_sheet, confirm, validation } from '@/modules/tasks/i18n/ru/tasks';
// Импортируем contractor переводы для вложения в business
import { 
  contractors, 
  contractor_sheet, 
  contractor, 
  contractor_type,
  quick_sheet
} from '@/modules/contractors/i18n/ru/contractors';

export const tasks_direct = tasks;

export const business = {
  confirm: {
    ...confirm,
    delete_task: "Удалить задачу «{0}»?",
    delete_selected_tasks: "Удалить выбранные задачи?",
  },
  validation: {
    ...validation,
    title_required: "Название обязательно",
    due_date_required_for_meeting: "Для встречи необходимо указать дату",
  },
  tasks,
  task_sheet,
  // Вкладываем contractor переводы внутрь business для корректной работы flattenObject
  contractors,
  contractor_sheet,
  contractor,
  contractor_type,
  quick_sheet,
  toast: contractors.toast,
  logs: contractors.logs,
  enrichment: contractor_sheet.enrichment,
  messages: contractor_sheet.messages,
  delete_task: "Подтвердите удаление задачи",
  title_required: "Название обязательно",
  due_date_required_for_meeting: "Для встречи укажите дату",
  delete_selected_tasks: "Удалить выбранные задачи",
};

/**
 * Переводы модуля «Задачи»
 */
export const tasks = {
  title: "Задачи",
  subtitle: "Управление задачами",
  new_task: "Создать задачу",
  general_project: "Общий",
  unassigned: "Не назначен",
  unassigned_initials: "UN",
  return_to_work: "Вернуть в работу",
  complete: "Завершить",
  search_placeholder: "Поиск по задачам...",
  stats: {
    total: "Всего задач",
    in_progress: "В работе",
    overdue: "Просрочено",
    high_priority: "Высокий приоритет",
    completed: "Завершено"
  },
  tabs: {
    list: "Список",
    board: "Доска"
  },
  columns: {
    todo: "К выполнению",
    in_progress: "В работе",
    done: "Выполнено"
  },
  table: {
    id: "ID",
    title: "Название",
    assignee: "Исполнитель",
    due_date: "Срок"
  },
  found: "задач найдено",
  empty_column: "Нет задач",
  bulk_actions: {
    title: "Массовое редактирование",
    complete: "Завершить задачи"
  },
  filters: {
    status_label: "Статус",
    all: "Все",
    priority_label: "Приоритет",
    assignee_label: "Исполнитель",
    hide_archived: "Кроме архивных"
  },
  archive: {
    title: "Архивировать задачу",
    description: "Вы уверены, что хотите архивировать задачу «{name}»? Она перестанет отображаться в активных списках.",
  },
  status: {
    "To Do": "К выполнению",
    "In Progress": "В работе",
    "Done": "Завершено",
    todo: "К выполнению",
    in_progress: "В работе",
    review: "На проверке",
    done: "Выполнено",
    archived: "В архиве"
  },
  actions: {
    detach_from_project: "Открепить от проекта"
  },
  confirm: {
    delete_task: "Удалить задачу «{{name}}»?",
    delete_selected_tasks: "Удалить выбранные задачи ({{count}})?"
  },
  toast: {
    loaded: "Задачи загружены",
    load_error: "Ошибка при загрузке задач",
    created: "Задача создана",
    updated: "Задача обновлена",
    deleted: "Задача удалена",
    bulk_deleted: "Задачи удалены",
    save_error: "Ошибка при сохранении",
    delete_error: "Ошибка при удалении",
    status_updated: "Статус задачи обновлен",
    status_error: "Ошибка при обновлении статуса",
    completed: "Задача завершена!",
    add_comment: "Добавление комментария к задаче",
    attach_file: "Прикрепление файла к задаче"
  },
  validation: {
    title_required: "Название задачи обязательно",
    due_date_required_for_meeting: "Для встреч необходимо указать дату и время"
  },
  keywords: {
    meeting: "Встреча"
  }
};

export const task_sheet = {
  title_new: "Новая задача",
  title_edit: "Редактирование задачи",
  title_placeholder: "Введите название задачи",
  checklist: "Чек-лист",
  description: "Заполните детали задачи",
  field: {
    title: "Название",
    status: "Статус",
    priority: "Приоритет",
    project: "Проект",
    assignee: "Исполнитель",
    due_date: "Срок выполнения",
    description: "Описание"
  },
  placeholder: {
    add_subtask: "Добавить подзадачу...",
    due_date: "Выберите дату",
    description: "Описание задачи"
  }
};

export const confirm = {
  delete_task: "Удалить задачу \"{0}\"?",
  delete_selected_tasks: "Удалить выбранные задачи ({0})?",
  complete_task_all_subtasks: "Все подзадачи выполнены. Отметить задачу как выполненную?"
};

export const toast = {
  deleted: "Задача удалена",
  delete_error: "Ошибка удаления задачи",
  updated: "Задача обновлена",
  update_error: "Ошибка обновления задачи"
};

export const validation = {
  title_required: "Название задачи обязательно для заполнения",
  due_date_required_for_meeting: "Для встречи необходимо указать дату"
};

export const activity = {
  empty: "История активности пуста",
};

export const keywords = {
  meeting: "Встреча"
};

export const modulesTasks = {
  title: "Задача",
  new_task: "Новая задача",
  general_project: "Общий",
  unassigned: "Не назначен",
  unassigned_initials: "UN",
  return_to_work: "Вернуть в работу",
  complete: "Завершить"
};

export default {
  tasks,
  task_sheet,
  confirm,
  validation,
  keywords,
  modulesTasks
};

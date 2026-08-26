/**
 * Переводы модуля Договоры
 */
export const contracts = {
  title: "Договоры",
  subtitle: "Управление договорами и шаблонами",
  add_button: "Новый договор",
  
  list: {
    title: "Договоры",
    empty: "Договоры не найдены",
  },
  
  templates: {
    title: "Шаблоны",
    create: "Создать шаблон",
    create_desc: "Создайте новый шаблон для быстрого формирования договоров",
    content: "Содержание",
    category: "Категория",
    delete: "Удалить шаблон?",
    no_templates: "Шаблоны не найдены",
  },
  
  toolbar: {
    create: "Создать договор",
    search: "Поиск договоров...",
    filter_status: "Фильтр по статусу",
  },
  
  table: {
    contract_number: "Номер",
    name: "Название",
    start_date: "Дата подписания",
    end_date: "Дата окончания",
    status: "Статус",
    assigned_to: "Назначено",
    created_by: "Создано",
    created_at: "Дата создания",
    updated_at: "Дата обновления",
    actions: "Действия",
    contractor: "Клиент",
    type: "Тип",
    amount: "Сумма",
    payment_status: "Статус оплаты",
  },
  
  filters: {
    all_statuses: "Все статусы",
    search_placeholder: "Поиск договоров...",
    filter_status: "Фильтр по статусу",
    filter_assigned: "Фильтр по назначенному",
    search: "Поиск",
    min_amount: "Мин. сумма",
    max_amount: "Макс. сумма",
    contractor_id: "Контрагент ID",
    expires_soon: "Истекают скоро:",
    expires_none: "Нет",
    expires_7_days: "7 дней",
    expires_30_days: "30 дней",
    expires_90_days: "90 дней",
    apply: "Применить",
    reset: "Сброс",
  },
  
  status: {
    draft: "Черновик",
    pending_approval: "На согласовании",
    approved: "Заключен",
    rejected: "Отклонен",
    archived: "Архивирован",
  },
  
  tabs: {
    details: "Детали",
    versions: "Версии",
    finance: "Финансы",
    approvals: "Согласование",
    files: "Файлы",
    cases: "Дела",
  },
  
  messages: {
    created: "Договор создан успешно",
    updated: "Договор обновлен успешно",
    deleted: "Договор удален успешно",
    bulk_deleted: "Выбранные договоры удалены",
    bulk_status_updated: "Статус выбранных договоров обновлен",
    approved: "Договор согласован успешно",
    rejected: "Договор отклонен успешно",
    reverted: "Договор восстановлен до предыдущей версии",
    files_uploaded: "Файлы загружены успешно",
    file_deleted: "Файл удален успешно",
    case_linked: "Дело связано успешно",
    case_unlinked: "Дело отвязано успешно",
    expiring_soon: "Истекает скоро",
  },
  
  errors: {
    create_error: "Ошибка при создании договора",
    update_error: "Ошибка при обновлении договора",
    delete_error: "Ошибка при удалении договора",
    bulk_delete_error: "Ошибка при массовом удалении",
    bulk_status_update_error: "Ошибка при массовом обновлении статуса",
    approve_error: "Ошибка при согласовании договора",
    reject_error: "Ошибка при отклонении договора",
    revert_error: "Ошибка при восстановлении версии",
    upload_error: "Ошибка при загрузке файла",
    delete_file_error: "Ошибка при удалении файла",
    not_found: "Договор не найден",
    unauthorized: "У вас нет прав на это действие",
  },
  
  actions: {
    create: "Новый договор",
    edit: "Редактировать",
    delete: "Удалить",
    export: "Экспортировать",
    view: "Просмотреть",
    cancel: "Отмена",
  },
  
  form: {
    fields: {
      name: "Название",
      description: "Описание",
      start_date: "Дата подписания",
      end_date: "Дата окончания",
      status: "Статус",
      assigned_to: "Назначено",
      template: "Шаблон договора",
      general: "Общая информация",
      related_cases: "Связанные дела",
      files: "Документы",
      contractor: "Контрагент",
      project: "Проект",
      type: "Тип договора",
      amount: "Сумма",
      currency: "Валюта",
      payment_status: "Статус оплаты",
      tags: "Теги",
      contract_number: "Номер договора",
    },
    placeholders: {
      tags: "Выберите или создайте теги",
      contract_number: "Автоматически при сохранении",
      template: "Выберите шаблон",
      amount: "0.00",
    },
    hints: {
      contract_number: "Оставьте пустым для автогенерации по шаблону",
    },
    delete: "Удалить договор?",
  },
  types: {
    service: "Оказание услуг",
    supply: "Поставка",
    lease: "Аренда",
    sale: "Продажа",
    agency: "Агентский",
    license: "Лицензионный",
    nda: "NDA",
    other: "Прочее",
  },
  payment: {
    unpaid: "Не оплачен",
    partially_paid: "Частично оплачен",
    paid: "Оплачен",
    overdue: "Просрочен",
  },
  empty: "Договоры не найдены",

  finance: {
    total_invoiced: "Выставлено",
    total_paid: "Оплачено",
    total_due: "К оплате",
    invoices: "Счета",
    payments: "Платежи",
  },

  bulk_actions: {
    selected_count: "Выбрано: {count}",
    change_status: "Изменить статус",
    apply_status: "Применить",
    delete_selected: "Удалить",
    delete_confirm_title: "Удалить {count} договор(ов)?",
    delete_confirm_description: "Это действие нельзя отменить. Все связанные данные будут удалены.",
    status_confirm_title: "Изменить статус для {count} договор(ов) на «{status}»?",
    status_confirm_description: "Статус всех выбранных договоров будет изменен.",
    edit: "Редактировать",
  },
};

export const contract_sheet = {
  title_new: "Новый договор",
  title_edit: "Редактировать договор",
  
  section: {
    general: "Общая информация",
    related_cases: "Связанные дела",
    files: "Документы",
  },
  
  description_new: "Создание нового договора",
  description_edit: "Редактирование договора",
  
  field: {
    name: "Название договора",
    description: "Описание",
    status: "Статус",
    assigned_to: "Назначено",
    template: "Шаблон договора",
  },
  
  placeholder: {
    name: "Введите название договора",
    description: "Введите описание договора",
    assigned_to: "Выберите пользователя",
    project: "Выберите проект",
    template: "Выберите шаблон договора",
    contractor: "Выберите контрагента",
  },
  
  validation: {
    name_required: "Название договора обязательно",
  },
  
  action: {
    save: "Сохранить изменения",
    cancel: "Отмена",
    delete: "Удалить договор",
    delete_confirm: "Вы уверены, что хотите удалить этот договор?",
    send_for_approval: "Отправить на согласование",
  },
};

export const contract = {
  title: "Детали договора",
  empty: "Договор не найден",
};

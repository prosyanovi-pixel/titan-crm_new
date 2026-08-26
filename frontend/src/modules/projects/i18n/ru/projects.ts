/**
 * Переводы модуля «Проекты»
 */
export const projects = {
  title: "Проекты",
  subtitle: "Управление проектами и задачами",
  new_project: "Новый проект",
  edit_project: "Редактировать проект",
  new_project_description: "Создание нового проекта",
  archive_project: "Архивировать проект",
  confirm_archive_project: "Вы уверены, что хотите архивировать проект?",
  activity: {
    empty: "История активности пуста",
    unavailable: "Активность недоступна",
  },
  field: {
    parent_project: "Родительский проект"
  },
  placeholder: {
    no_parent: "Нет родительского проекта"
  },
  stats: {
    total: "Всего проектов",
    budget: "Бюджет",
    active: "Активные"
  },
  status: {
    active: "Активен",
    pending: "Ожидание",
    paused: "Пауза",
    finished: "Завершён",
    archived: "Архив"
  },
  completion_stage: {
    todo: "К выполнению",
    in_progress: "В работе",
    review: "На проверке",
    done: "Готово"
  },
  common: {
    stage: "Этап"
  },
  stage: "Этап",
  tabs: {
    list: "Список",
    board: "Доска",
    gantt: "Гант",
    analytics: "Аналитика",
    resources: "Ресурсы",
    payments: "График платежей",
    revenues: "Доходы",
    expenses: "Расходы",
    finance: "Финансы"
  },
  columns: {
    todo: "К выполнению",
    in_progress: "В работе",
    review: "На проверке",
    done: "Готово"
  },
  table: {
    name: "Название проекта",
    client: "Клиент",
    manager: "Менеджер",
    status: "Статус",
    stage: "Этап",
    priority: "Приоритет",
    budget: "Бюджет",
    budget_used: "Бюджет освоен",
    deadline: "Дедлайн",
    progress: "Прогресс",
    tags: "Теги"
  },
  empty: "Нет проектов",
  validation: {
    name_required: "Укажите название проекта",
    client_required: "Укажите клиента",
    manager_required: "Укажите менеджера",
    deadline_required: "Укажите срок (дедлайн)",
    // Zod validation messages
    name_min: "Название проекта обязательно",
    client_min: "Клиент обязателен",
    manager_min: "Менеджер обязателен",
    budget_min: "Бюджет не может быть отрицательным",
    deadline_format: "Неверный формат даты (ДД.ММ.ГГГГ)",
    date_format: "Неверный формат даты",
    amount_min: "Сумма должна быть больше нуля",
    progress_range: "Прогресс должен быть от 0 до 100",
    category_required: "Категория обязательна",
    status_invalid: "Неверный статус",
    priority_invalid: "Неверный приоритет",
    currency_invalid: "Неверная валюта",
    payment_method_invalid: "Неверный способ оплаты",
    status_required: "Статус обязателен",
    priority_required: "Приоритет обязателен",
    budget_negative: "Бюджет не может быть отрицательным",
    stage_name_required: "Название этапа обязательно",
    stage_start_format: "Неверный формат даты начала (ДД.ММ.ГГГГ)",
    stage_end_format: "Неверный формат даты завершения (ДД.ММ.ГГГГ)",
    stage_planned_start_format: "Неверный формат планового начала (ДД.ММ.ГГГГ)",
    stage_planned_end_format: "Неверный формат планового завершения (ДД.ММ.ГГГГ)",
    revenue_name_required: "Название дохода обязательно",
    revenue_amount_min: "Сумма должна быть больше нуля",
    revenue_date_format: "Неверный формат даты дохода (ДД.ММ.ГГГГ)",
    expense_name_required: "Название расхода обязательно",
    expense_category_required: "Категория обязательна",
    expense_date_format: "Неверный формат даты расхода (ДД.ММ.ГГГГ)",
    payment_name_required: "Название платежа обязательно",
    payment_date_format: "Неверный формат даты платежа (ДД.ММ.ГГГГ)",
  },
  sheet: {
    contractor_label: "Контрагент",
    tax_regime_label: "Режим налогообложения",
    tax_regime_placeholder: "Выберите режим налогообложения",
    width: {
      drag_to_resize: "Потяните для изменения ширины",
      presets: {
        sm: "Маленькая",
        md: "Средняя",
        lg: "Большая",
        xl: "Очень большая",
        '2xl': "Максимальная"
      }
    }
  },
  confirm_delete: "Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.",
  confirm_delete_project: "Вы уверены, что хотите удалить проект «{name}»? Это действие нельзя отменить.",
  confirm_bulk_delete_with_subprojects: "Выбрано {count} проектов. Среди них есть проекты с вложенными под-проектами. При удалении эти связи будут разорваны, либо под-проекты будут удалены каскадно. Вы уверены?",
  confirm_delete_with_tasks: "В проекте есть активные задачи ({count}). Они будут откреплены от проекта. Вы уверены?",
  filters: {
    status_label: "Статус",
    all: "Все",
    priority_label: "Приоритет",
    manager_label: "Менеджер",
    hide_archived: "Кроме архивных",
    tree_view: "Дерево проектов"
  },
  archive: {
    title: "Архивировать проект",
    description: "Вы уверены, что хотите архивировать проект «{name}»? Он перестанет отображаться в активных списках.",
  },
  bulk_edit: {
    title: "Массовое редактирование",
    field: "Поле для изменения",
    value: "Новое значение",
    button: "Изменить выбранные"
  },
    gantt: {
      timeline: "Временная шкала",
      month: "Месяц"
    },
    contracts: {
      empty: "Нет связанных договоров",
      link: "Привязать существующий",
      link_existing: "Привязать существующий договор",
      link_warning_title: "Внимание",
      type_to_search: "Введите текст для поиска",
      unlink: "Отвязать",
      unlink_title: "Отвязать договор",
      unlink_confirm: "Вы уверены, что хотите отвязать этот договор от проекта?"
    },
    analytics: {
      budget_by_client: "Бюджет по клиентам",
      top_10_clients: "Топ-10 клиентов по объему бюджетов",
// ...
    status_distribution: "Распределение по статусам",
    project_count_by_status: "Количество проектов в каждом статусе",
    profitability: "Освоение бюджетов и прибыль",
    budget_vs_used: "Сравнение планового бюджета и фактических затрат",
  },
  resources: {
    load: "Загрузка",
    assigned_projects: "Проектов в работе",
    no_projects: "Нет активных проектов",
    no_employees: "Нет активных сотрудников"
  },
  stages: {
    title: "Этапы",
    add: "Добавить этап",
    edit_title: "Редактировать этап «{name}»",
    edit_title_base: "Редактировать этап",
    create_title: "Новый этап проекта",
    description: "Заполните информацию об этапе проекта",
    empty: "Этапы не добавлены. Добавьте первый этап, чтобы начать планирование.",
    no_project_selected: "Проект не выбран",
    planned: "План",
    used: "Освоено",
    confirm_delete: "Вы уверены, что хотите удалить этап «{name}»? Это действие нельзя отменить.",
    back_to_list: "Назад к списку",
    stage_type: "Тип этапа",
    stage_type_options: {
      stage: "Этап проекта",
      milestone: "Веха (Milestone)",
      meeting: "Встреча",
      delivery: "Сдача/Приемка"
    },
    actual_dates: "Фактические сроки",
    actual_start: "Начало",
    actual_end: "Конец",
    planned_dates: "Плановые сроки",
    planned_start_label: "План с",
    planned_end_label: "План по",
    stage_description: "Описание этапа",
    task_notes: "Заметки",
    due_date_label: "Крайний срок",
    checklist: "Чек-лист",
    add_item: "Добавить пункт...",
    task_title_placeholder: "Название задачи",
    field: {
      name: "Название этапа",
      description: "Описание",
      start_date: "Дата начала",
      end_date: "Дата окончания",
      planned_start_date: "План. дата начала",
      planned_end_date: "План. дата окончания",
      budget: "Бюджет этапа",
      progress: "Прогресс",
      responsible: "Ответственный",
      task_title: "Название задачи *",
      priority: "Приоритет",
      due_date: "Срок выполнения",
      status: "Статус",
      assignee: "Исполнитель",
      color: "Цвет этапа",
      dates: "Сроки"
    },
    placeholder: {
      name: "Введите название этапа",
      description: "Введите описание этапа",
      task_title: "Введите название задачи",
      assignee: "Исполнитель",
    },
    table: {
      name: "Название этапа",
      dates: "Даты",
      progress: "Прогресс",
      budget: "Бюджет",
      status: "Статус"
    },
    actions: {
      move_up: "Переместить вверх",
      move_down: "Переместить вниз",
      complete: "Завершить этап"
    },
    summary: {
      total: "Всего этапов",
      completed: "Завершено",
      progress: "Ср. прогресс",
      budget: "Бюджет"
    },
    tasks: {
      title: "Задачи этапа",
      add: "Добавить задачу",
      add_first: "Создайте первую задачу для этого этапа..."
    },
    no_tasks: "Нет задач",
    add_task: "Добавить задачу",
    edit_task_title: "Редактировать задачу «{title}»",
    edit_task_description: "Внесите изменения в задачу",
    create_task_description: "Создайте новую задачу для этого этапа",
    error: {
      load: "Ошибка загрузки этапов",
      create: "Ошибка создания этапа",
      update: "Ошибка обновления этапа",
      delete: "Ошибка удаления этапа",
      complete: "Ошибка завершения этапа",
      reorder: "Ошибка перемещения этапа",
      no_project: "Проект не выбран",
      create_task: "Ошибка создания задачи",
      save_task: "Ошибка при сохранении задачи этапа",
      unfinished_tasks: "Нельзя завершить этап: есть {count} незавершённых задач(и)",
      prev_stage_not_completed: "Нельзя завершить этап: предыдущий этап «{name}» не завершён"
    },
    toast: {
      task_created: "Задача успешно добавлена",
      task_updated: "Задача успешно обновлена",
      task_deleted: "Задача удалена",
      task_moved: "Задача перемещена в другой этап"
    },
    priority: {
      low: "Низкий",
      medium: "Средний",
      high: "Высокий"
    },
    status: {
      completed: "Завершён",
      in_progress: "В работе",
      pending: "Ожидает"
    },
    task_status: {
      "To Do": "К выполнению",
      "In Progress": "В работе",
      "Done": "Завершено",
      "Review": "На проверке"
    }
  },
  payments: {
    title: "График платежей",
    add: "Добавить платёж",
    edit_title: "Редактировать платёж «{name}»",
    create_title: "Новый платёж",
    description: "Заполните информацию о платеже",
    empty: "Платежи не добавлены",
    no_project_selected: "Проект не выбран",
    partial: "Осталось {remaining}",
    confirm_delete: "Вы уверены, что хотите удалить платёж «{name}»?",
    mark_as_paid: "Отметить оплаченным",
    mark_paid_description: "Введите информацию об оплате",
    field: {
      name: "Название платежа",
      description: "Описание",
      amount: "Сумма",
      paid_amount: "Оплаченная сумма",
      currency: "Валюта",
      due_date: "Дата оплаты",
      payment_date: "Дата оплаты (факт)",
      payment_method: "Способ оплаты",
      payment_reference: "№ платёжного документа"
    },
    placeholder: {
      name: "Введите название платежа",
      description: "Введите описание",
      payment_reference: "Номер документа"
    },
    table: {
      name: "Название платежа",
      amount: "Сумма",
      paid: "Оплачено",
      due_date: "Дата оплаты",
      status: "Статус"
    },
    status: {
      paid: "Оплачено",
      partial: "Частично",
      overdue: "Просрочено",
      pending: "Ожидает",
      cancelled: "Отменено"
    },
    method: {
      bank: "Банковский перевод",
      cash: "Наличные",
      card: "Карта",
      other: "Другое"
    },
    actions: {
      mark_paid: "Отметить оплаченным"
    },
    summary: {
      total: "Всего платежей",
      paid: "Оплачено",
      overdue: "Просрочено",
      pending: "Ожидает"
    },
    toast: {
      created: "Платёж успешно создан",
      updated: "Платёж успешно обновлён",
      deleted: "Платёж успешно удалён",
      paid: "Платёж отмечен как оплаченный"
    },
    error: {
      load: "Ошибка загрузки платежей",
      create: "Ошибка создания платежа",
      update: "Ошибка обновления платежа",
      delete: "Ошибка удаления платежа",
      mark_paid: "Ошибка отметки оплаты",
      no_project: "Проект не выбран"
    }
  },
  revenues: {
    title: "Доходы проекта",
    add: "Добавить доход",
    edit_title: "Редактировать доход «{name}»",
    create_title: "Новый доход",
    description: "Заполните информацию о доходе",
    empty: "Доходы не добавлены",
    no_project_selected: "Проект не выбран",
    confirm_delete: "Вы уверены, что хотите удалить доход «{name}»?",
    received_on: "Получено",
    field: {
      name: "Название дохода",
      description: "Описание",
      amount: "Сумма",
      currency: "Валюта",
      vat_rate: "Ставка НДС",
      is_taxable: "Облагается НДС",
      planned_date: "Плановая дата поступления",
      actual_date: "Фактическая дата"
    },
    placeholder: {
      name: "Введите название дохода",
      description: "Введите описание"
    },
    table: {
      name: "Название дохода",
      amount: "Сумма",
      vat: "НДС",
      planned_date: "Дата поступления",
      status: "Статус",
      invoice_name: "Наименование счета",
      notes: "Примечания"
    },
    tooltip: {
      paid_on: "Оплачено {date}",
      overdue_by_days: "Просрочено на {days} дн.",
      received: "Получено",
      expired: "Истёк срок",
      invoiced: "Счёт выставлен",
      expected: "Ожидается оплата"
    },
    status: {
      received: "Получен",
      invoiced: "Счёт выставлен",
      overdue: "Просрочен",
      planned: "Планируется",
      cancelled: "Отменён"
    },
    actions: {
      mark_received: "Отметить полученным"
    },
    summary: {
      total: "Всего доходов",
      received: "Получено",
      overdue: "Просрочено",
      vat: "НДС"
    },
    toast: {
      created: "Доход успешно создан",
      updated: "Доход успешно обновлён",
      deleted: "Доход успешно удалён",
      received: "Доход отмечен как полученный"
    },
    error: {
      load: "Ошибка загрузки доходов",
      create: "Ошибка создания дохода",
      update: "Ошибка обновления дохода",
      delete: "Ошибка удаления дохода",
      mark_received: "Ошибка отметки получения",
      no_project: "Проект не выбран"
    },
    received_error: "Ошибка при получении дохода",
    received_success: "Доход получен"
  },
  expenses: {
    title: "Расходы проекта",
    add: "Добавить расход",
    edit_title: "Редактировать расход «{name}»",
    create_title: "Новый расход",
    description: "Заполните информацию о расходе",
    empty: "Расходы не добавлены",
    no_project_selected: "Проект не выбран",
    confirm_delete: "Вы уверены, что хотите удалить расход «{name}»?",
    actual_on: "Фактически",
    field: {
      name: "Название расхода",
      description: "Описание",
      category: "Категория",
      amount: "Сумма",
      planned_date: "Плановая дата",
      actual_date: "Фактическая дата"
    },
    placeholder: {
      name: "Введите название расхода",
      description: "Введите описание"
    },
    table: {
      name: "Название расхода",
      category: "Категория",
      amount: "Сумма",
      planned_date: "Дата",
      status: "Статус"
    },
    status: {
      paid: "Оплачено",
      approved: "Утверждён",
      pending: "Ожидает"
    },
    actions: {
      approve: "Утвердить",
      mark_paid: "Отметить оплаченным",
      delete: "Удалить"
    },
    summary: {
      total: "Всего расходов",
      total_amount: "Общая сумма",
      approved: "Утверждено",
      pending: "Ожидает оплаты"
    },
    toast: {
      created: "Расход успешно создан",
      updated: "Расход успешно обновлён",
      deleted: "Расход успешно удалён",
      approved: "Расход утверждён",
      paid: "Расход отмечен как оплаченный"
    },
    error: {
      load: "Ошибка загрузки расходов",
      create: "Ошибка создания расхода",
      update: "Ошибка обновления расхода",
      delete: "Ошибка удаления расхода",
      approve: "Ошибка утверждения расхода",
      mark_paid: "Ошибка отметки оплаты",
      no_project: "Проект не выбран",
      required_fields: "Заполните обязательные поля"
    },
    approve_error: "Ошибка при одобрении расхода",
    approve_success: "Расход одобрен",
    paid_error: "Ошибка при оплате расхода",
    paid_success: "Расход оплачен"
  },
  finance: {
    pnl_title: "P&L Отчёт по проекту",
    revenue_expenses: "Выручка и расходы",
    profit_taxes: "Прибыль и налоги",
    revenue_total: "Выручка всего",
    vat: "НДС",
    revenue_excluding_vat: "Выручка без НДС",
    direct_expenses: "Прямые расходы",
    salary: "ФОТ",
    materials: "Материалы",
    services: "Услуги",
    other: "Прочие",
    gross_profit: "Валовая прибыль",
    gross_margin: "Валовая маржа",
    overhead: "Накладные расходы",
    operating_profit: "Операционная прибыль",
    operating_margin: "Операционная маржа",
    taxes_total: "Налоги всего",
    tax_vat: "НДС",
    tax_usn: "УСН",
    tax_profit: "Налог на прибыль",
    tax_insurance: "Страховые взносы",
    tax_ndfl: "НДФЛ",
    net_profit: "Чистая прибыль",
    net_margin: "Чистая маржа",
    profitability: "Рентабельность",
    budget_usage: "Освоение бюджета",
    tax_load: "Налоговая нагрузка",
    calculated_at: "Рассчитано",
    no_project_selected: "Проект не выбран",
    no_data: "Нет данных для отображения",
    error: {
      load: "Ошибка загрузки финансового отчёта"
    }
  },
  /**
   * Toast уведомления — единая система для всех операций
   */
  toasts: {
    success: {
      created: "{entity} успешно создан(а)",
      updated: "{entity} успешно обновлён(а)",
      deleted: "{entity} успешно удалён(а)",
      saved: "{entity} успешно сохранён(а)"
    },
    error: {
      create: "Ошибка создания {entity}",
      update: "Ошибка обновления {entity}",
      delete: "Ошибка удаления {entity}",
      load: "Ошибка загрузки {entity}",
      save: "Ошибка сохранения {entity}"
    },
    info: {
      action_completed: "Действие выполнено"
    },
    entities: {
      project: "проект",
      stage: "этап",
      revenue: "доход",
      expense: "расход",
      payment: "платёж",
      task: "задача"
    }
  },
  ai: {
    win_probability_desc: "Оценка вероятности успешного завершения проекта на основе текущих данных."
  }
};

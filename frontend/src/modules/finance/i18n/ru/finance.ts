export const finance = {
  module_name: 'Финансы',
  title: 'Управление финансами',
  subtitle: 'Счета, платежи и отчеты',
  
  // Top-level payment_kind (used in PaymentsTable)
  payment_kind: {
    income: 'Поступление',
    expense: 'Расход',
  },
  
  // Navigation
  nav: {
    invoices: 'Счета',
    payments: 'Платежи',
    reports: 'Отчёты',
  },

  // Stats
  stats: {
    receivables: 'Открытая задолженность',
    overdue: 'Просрочено',
    paid_invoices: 'Оплачено счетов',
    total_invoices: 'Всего счетов',
  },

  // Table Headers
  table: {
    identifier: 'Номер счёта',
    contractor: 'Контрагент',
    project: 'Проект',
    task: 'Задача',
    amount: 'Сумма',
    vat: 'НДС',
    status: 'Статус',
    due_date: 'Срок оплаты',
    issue_date: 'Дата выставления',
    kind: 'Тип',
    description: 'Описание',
    invoice: 'Счёт',
    payer: 'Плательщик',
    payment_date: 'Дата платежа',
    payment_method: 'Способ оплаты',
    payment_number: 'Номер платежки',
    category: 'Категория',
  },

  // Period / Payment filters
  filter: {
    period_month: 'Месяц',
    period_quarter: 'Квартал',
    period_year: 'Год',
    period_all: 'Всё время',
    period_custom: 'Период...',
    payer: 'Плательщик',
    amount_from: 'Сумма от',
    amount_to: 'Сумма до',
    debtor_only: 'Только должники',
  },
  
  // Invoices
  invoice: {
    label: 'Счёт',
    title_singular: 'Счёт',
    title_plural: 'Счета',
    title: 'Счёт',
    create: 'Новый счёт',
    edit: 'Редактировать счёт',
    delete: 'Удалить счёт',
    send: 'Отправить счёт',
    generate_document: 'Сформировать документ',
    
    action: {
      unlink: 'Отвязать',
    },
    
    create_description: 'Создание нового счёта',
    edit_description: 'Редактирование счёта',
    
    table: {
      identifier: 'Номер счёта',
      contractor: 'Контрагент',
      project: 'Проект',
      amount: 'Сумма',
      status: 'Статус',
      due_date: 'Срок оплаты',
      issue_date: 'Дата выставления',
      amountDue: 'Остаток',
    },
    
    field: {
      identifier: 'Номер счёта',
      contractor: 'Контрагент',
      project: 'Проект',
      lawyer: 'Юрист',
      task: 'Задача',
      contract: 'Контракт',
      amount: 'Сумма счёта',
      currency: 'Валюта',
      description: 'Описание',
      issue_date: 'Дата выставления',
      due_date: 'Срок оплаты',
      status: 'Статус',
      tax_regime: 'Налоговый режим',
      is_taxable: 'Облагается НДС',
      vat_rate: 'Ставка НДС',
      vat_amount: 'Сумма НДС',
      total_with_vat: 'Итого с НДС',
    },
    
    placeholder: {
      select_contractor: 'Выберите контрагента',
      select_project: 'Выберите проект',
      select_lawyer: 'Выберите юриста',
      select_task: 'Выберите задачу',
      select_contract: 'Выберите контракт...',
    },
    
    status: {
      draft: 'Черновик',
      sent: 'Отправлен',
      partial_paid: 'Частично оплачен',
      paid: 'Оплачен',
      overdue: 'Просрочен',
    },
  },
  
  // Payments
  payment: {
    title_singular: 'Платёж',
    title_plural: 'Платежи',
    create: 'Записать платёж',
    edit: 'Редактировать платёж',
    delete: 'Удалить платёж',
    unlink: 'Отвязать от счёта',

    table: {
      date: 'Дата платежа',
      kind: 'Тип',
      invoice: 'Счёт',
      contractor: 'Контрагент',
      project: 'Проект',
      amount: 'Сумма',
      description: 'Описание',
    },
    
    field: {
      date: 'Дата платежа',
      kind: 'Тип платежа',
      invoice: 'Счёт',
      contractor: 'Контрагент',
      project: 'Проект',
      contract: 'Контракт',
      amount: 'Сумма',
      description: 'Описание',
      category: 'Статья ДДС',
    },
    
    kind: {
      income: 'Доход',
      expense: 'Расход',
    },

    placeholder: {
      select_contract: 'Выберите контракт...',
    },

    payment_kind: {
      income: 'Поступление',
      expense: 'Расход',
    },
  },
  
  // Reports
  report: {
    receivables: 'Задолженность',
    receivables_by_contractor: 'По контрагентам',
    receivables_by_project: 'По проектам',
    
    table: {
      contractor: 'Контрагент',
      project: 'Проект',
      amount: 'Сумма',
      days_overdue: 'Дней просрочено',
      invoices: 'Счета',
    },
  },
  
  // Finance Summary
  summary: {
    total_invoiced: 'Выставлено счётов',
    total_paid: 'Получено платежей',
    total_expenses: 'Расходы',
    open_receivables: 'Открытая задолженность',
    profit_loss: 'Прибыль/Убыток',
  },
  
  message: {
    invoice_created: 'Счёт создан',
    invoice_updated: 'Счёт обновлен',
    invoice_sent: 'Счёт отправлен',
    invoice_deleted: 'Счёт удален',
    invoice_status_updated: 'Статус счёта обновлен',
    payment_recorded: 'Платёж записан',
    payment_updated: 'Платёж обновлен',
    payment_deleted: 'Платёж удален',
    document_generated: 'Документ создан',
    payment_unlinked: 'Платёж отвязан',
    error_unlink: 'Ошибка при отвязке платежа',
    no_payments: 'Нет платежей',

    error_creating_invoice: 'Ошибка при создании счёта',
    error_updating_invoice: 'Ошибка при обновлении счёта',
    error_saving_invoice: 'Ошибка при сохранении счёта',
    error_sending_invoice: 'Ошибка при отправке счёта',
    error_deleting_invoice: 'Ошибка при удалении счёта',
    error_recording_payment: 'Ошибка при записи платежа',
    error_updating_payment: 'Ошибка при обновлении платежа',
    error_saving_payment: 'Ошибка при сохранении платежа',
    error_deleting_payment: 'Ошибка при удалении платежа',
    error_generating_document: 'Ошибка при создании документа',
    error_updating_status: 'Ошибка при обновлении статуса',

    document_generated_success: 'Документ сформирован',
    document_generate_error: 'Ошибка генерации документа',
    payment_registered_success: 'Платеж зарегистрирован',
    payment_register_error: 'Ошибка регистрации платежа',
    payment_updated_success: 'Платеж обновлен',
    payment_update_error: 'Ошибка обновления платежа',
    payment_deleted_success: 'Платеж удален',
    payment_delete_error: 'Ошибка удаления платежа',
    dds_article_added: 'Статья DDS добавлена',
    dds_article_add_error: 'Ошибка добавления статьи',
    dds_article_updated: 'Статья DDS обновлена',
    dds_article_update_error: 'Ошибка обновления статьи',
    dds_article_deleted: 'Статья DDS удалена',
    dds_article_delete_error: 'Ошибка удаления статьи',
    statement_imported_success: 'Выписка успешно загружена',
    statement_import_error: 'Ошибка импорта выписки',
    statement_assign_success: 'Операция привязана',
    statement_assign_error: 'Ошибка привязки',
    statement_reconcile_success: 'Сверка завершена',
    statement_deleted_success: 'Выписка удалена',
    statement_line_updated_success: 'Данные обновлены',
    payment_unlinked_success: 'Платеж отвязан от счёта',
    payment_unlink_error: 'Ошибка отвязки платежа',
    try_again_later: 'Попробуйте позже',
    check_file_format: 'Проверьте формат файла',
  },
  
  // Status
  status: {
    draft: 'Черновик',
    sent: 'Отправлен',
    partial_paid: 'Частично оплачен',
    paid: 'Оплачен',
    overdue: 'Просрочен',
  },
  
  // Actions
  action: {
    cancel: 'Отмена',
    create: 'Создать',
    save: 'Сохранить',
    record: 'Записать',
  },

  // Empty states
  no_invoices: 'Счета не найдены',
  no_payments: 'Платежи не найдены',
  no_report_data: 'Данные отчета не доступны',
  overdue_days: 'Просрочено на {0} дн.',

  // Invoice type
  invoice_type: {
    outgoing: 'Исходящий (клиенту)',
    incoming: 'Входящий (от поставщика)',
    label: 'Тип счёта',
  },

  // Tabs (extended)
  tabs: {
    invoices: 'Счета',
    invoices_outgoing: 'Исходящие',
    invoices_incoming: 'Входящие',
    payments: 'Платежи',
    statements: 'Выписки',
    debts: 'Долги',
    dds: 'ДДС',
    reports: 'Отчёты',
  },

  // Bank statements
  statement: {

    unlink_invoice_confirm: 'Вы уверены, что хотите отвязать счет? Связанный платеж будет удален, а статус счета пересчитан.',
    unlink_invoice: 'Отвязать счет',
    invoice_unlinked: 'Счет отвязан',
    invoice_linked: 'Счёт привязан',
    select_invoice_first: 'Выберите счёт сначала',
    select_category_first: 'Выберите категорию сначала',
    category_linked: 'Категория привязана',
    title: 'Банковские выписки',
    import: 'Импортировать выписку',
    import_type: 'Формат файла',
    import_type_csv: 'CSV / TXT',
    import_type_1c: '1С (txt)',
    file_name: 'Имя файла',
    account: 'Расчётный счёт',
    date_from: 'Период с',
    date_to: 'по',
    total_credit: 'Итого приходов',
    total_debit: 'Итого расходов',
    lines_count: 'Строк',
    status: 'Статус',
    status_pending: 'Ожидает разноса',
    status_reconciled: 'Разнесено',
    reconcile: 'Авто-реконсиляция',
    reconcile_result: 'Совпало {matched} из {total} строк',
    line_date: 'Дата',
    line_amount: 'Сумма',
    line_direction: 'Направление',
    line_credit: 'Приход',
    line_debit: 'Расход',
    line_counterparty: 'Контрагент',
    line_purpose: 'Назначение',
    line_reference: 'Номер п/п',
    line_invoice: 'Счёт',
    line_status: 'Статус разноса',
    line_unmatched: 'Не разнесено',
    line_auto: 'Авто',
    line_manual: 'Вручную',
    assign: 'Привязать к счёту',
    no_statements: 'Выписки не импортированы',
    delete_confirm: 'Удалить выписку?',
    reconcile_title: 'Авто-разноска',
    reconcile_description: 'Выберите счёт для автоматической разноски платежей',
    account_number: 'Номер счёта',
    reconcile_hint: 'Оставьте пустым для поиска по контрагенту',
    reconcile_info: 'Система автоматически привяжет платежи к счетам по сумме',
    reconciling: 'Разноска...',
    without_account: 'Без счёта',
    import_preview_title: 'Предпросмотр импорта',
    import_confirm: 'Подтвердить импорт',
    preview_summary: 'Общая сводка',
    preview_contractors: 'Контрагенты',
    preview_warnings: 'Предупреждения',
    preview_incomes: 'Поступления',
    preview_expenses: 'Списания',
    preview_operations: '{count} операций',
    preview_total_lines: 'Всего строк',
    preview_unique_contractors: 'Уникальных контрагентов',
    preview_type: 'Тип',
    preview_new_contractors: 'Новые контрагенты:',
    preview_new_badge: '🆕 {count} новых',
    preview_updated_badge: '🔄 {count} обновлено',
    preview_accounts_badge: '🏦 {count} счетов',
    preview_more: '+ ещё {count}',
    preview_warnings_count: '{count} предупреждений',
    preview_warning_attention: 'Требуется внимание перед импортом',
    preview_new_title: 'Новые контрагенты ({count})',
    preview_updated_title: 'Обновлённые контрагенты ({count})',
    preview_new_accounts_title: 'Новые счета ({count})',
    importing: 'Импорт...',
  },

  // Debts dashboard
  debts: {
    title: 'Контроль задолженности',
    receivables: 'Дебиторская задолженность',
    payables: 'Кредиторская задолженность',
    overdue: 'Просрочено',
    upcoming: 'Предстоящие платежи',
    days_overdue: 'дн. просрочки',
    days_until: 'дн. до оплаты',
    reconciliation_act: 'Акт сверки',
    generate_act: 'Сформировать акт сверки',
    act_title: 'Акт сверки взаиморасчётов',
    act_contractor: 'Контрагент',
    act_period: 'Период',
    act_total_invoiced: 'Итого выставлено',
    act_total_paid: 'Итого оплачено',
    act_balance: 'Баланс',
    act_debit: 'В пользу поставщика',
    act_credit: 'В пользу покупателя',
    no_debts: 'Просроченных задолженностей нет',
  },

  // DDS
  dds: {
    title: 'Движение денежных средств',
    category: 'Статья ДДС',
    select_category: 'Выберите статью...',
    categories: 'Статьи расходов',
    manage_categories: 'Управление статьями',
    add_category: 'Новая статья',
    income: 'Доходы',
    expense: 'Расходы',
    total_income: 'Итого доходов',
    total_expense: 'Итого расходов',
    profit: 'Прибыль / убыток',
    by_category: 'По статьям',
    no_data: 'Нет данных за выбранный период',
    category_dialog: {
      title_new: 'Новая статья ДДС',
      title_edit: 'Редактировать статью',
      name_label: 'Название',
      name_placeholder: 'Название статьи',
      name_required: 'Введите название статьи',
      type_label: 'Тип',
      kind_income: 'Доход',
      kind_expense: 'Расход',
      type_locked: 'Тип системной статьи нельзя изменить',
      color_label: 'Цвет',
      save: 'Сохранить',
      saving: 'Сохранение…',
      cancel: 'Отмена',
      confirm_delete: 'Удалить статью «{name}»?',
      system_no_delete: 'Системные статьи нельзя удалить',
      created: 'Статья создана',
      updated: 'Статья обновлена',
      deleted: 'Статья удалена',
      create_error: 'Ошибка создания статьи',
      update_error: 'Ошибка обновления статьи',
      delete_error: 'Ошибка удаления',
    },
  },

  // Reports (extended)
  reports: {
    pl_title: 'Отчёт P&L (Прибыль и убытки)',
    pl_period: 'Период',
    pl_income: 'Доходы',
    pl_expense: 'Расходы',
    pl_profit: 'Прибыль',
    pl_loss: 'Убыток',
    register_title: 'Реестр платежей',
    register_export: 'Экспорт в CSV',
    calendar_title: 'Платёжный календарь',
    calendar_planned: 'Плановые платежи',
    calendar_upcoming: 'Ожидаемые поступления',
    no_pl_data: 'Нет данных P&L за выбранный период',
    no_register_data: 'Реестр платежей пуст',
  },

  // Payment types
  payment_types: {
    income: 'Входящий платёж (доход)',
    expense: 'Исходящий платёж (расход)',
  },

  // Button states
  buttons: {
    saving: 'Сохранение...',
    creating: 'Создание...',
    save: 'Сохранить',
    create_payment: 'Создать платёж',
  },

  // Validation messages
  validation: {
    date_required: 'Укажите дату',
    amount_positive: 'Сумма должна быть больше 0',
    due_date_invalid: 'Срок оплаты не может быть раньше даты выставления',
  },

  // Messages
  messages: {
    statement_imported: 'Импортировано {lines} строк',
    contractors_created: 'создано контрагентов: {count}',
    payments_created: 'создано платежей: {count}',
    statement_line_matched: 'Строка разнесена',
    error_reconcile: 'Ошибка разноса',
    statement_deleted: 'Выписка удалена',
    error_delete: 'Ошибка удаления',
    no_article: 'Без статьи',
    import: 'Импорт',
    importing: 'Импорт…',
    invoice_linked: 'Счёт привязан',
    category_linked: 'Категория привязана',
    select_invoice_first: 'Сначала выберите счёт',
    select_category_first: 'Сначала выберите категорию',
    invoice_unlinked: 'Счет отвязан',
    payment_unlinked: 'Платеж отвязан от счёта',
    error_unlink: 'Ошибка отвязки платежа',
    close: 'Закрыть',
  },

  // Confirmations
  confirm: {
    delete_invoices: 'Удалить {count} счёт(ов)?',
    delete_payments: 'Удалить {count} платёж(ей)?',
  },
};

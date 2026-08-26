/**
 * Переводы модуля «Воркфлоу» / Workflow Engine
 */
export const workflows = {
  title: 'Процессы',
  subtitle: 'Автоматизируйте бизнес-процессы и интеграции',
  new_workflow: 'Создать процесс',
  search_placeholder: 'Поиск по процессам...',

  status: {
    draft: 'Черновик',
    active: 'Активен',
    paused: 'Приостановлен',
  },

  trigger_type: {
    webhook: 'Вебхук / API',
    schedule: 'Расписание',
    event: 'Событие',
  },

  // ─── Таблица ───
  table: {
    name:        'Название',
    trigger:     'Триггер',
    status:      'Статус',
    steps:       'Шагов',
    steps_count: 'шагов',
    last_run:    'Последний запуск',
    actions:     'Действия',
    status_success: 'Успешно',
    status_failed:  'Ошибка',
  },

  list: {
    empty_title:       'Нет процессов',
    empty_description: 'Создайте первый автоматизированный процесс.',
    no_description:    'Описание не указано.',
    configure:         'Настроить',
  },

  // ─── Редактор ───
  editor: {
    title_new:  'Создать процесс',
    title_edit: 'Редактировать процесс',
    subtitle:   'Настройте триггеры и шаги автоматизации.',
    step_by_step: 'Пошаговый вид',

    section_general: 'Общие настройки',
    section_steps:   'Шаги выполнения',

    field: {
      name:        'Название процесса',
      description: 'Описание',
      trigger_type:'Тип триггера',
      status:      'Статус',
      event_name:  'Имя события (Event Name)',
      cron:        'Cron-расписание',
      webhook_url: 'URL вебхука',
      module:      'Модуль',
      action:      'Действие',
      delay:       'Задержка (сек.)',
      on_fail:     'При ошибке',
      condition:   'Условие (IF)',
      cond_field:  'Поле (путь через точку)',
      cond_op:     'Оператор',
      cond_value:  'Значение',
    },

    placeholder: {
      name:        'Например: Обработать входящие письма',
      description: 'Что делает этот процесс?',
      cron:        '0 0 * * *',
      cron_hint:   'Стандартный cron (например 0 0 * * * — каждый день в полночь)',
      module:      'Выберите модуль',
      action:      'Выберите действие',
      cond_field:  'step1.found  или  trigger.body.email',
      cond_value:  'true / false / текст',
      config_var:  '{{step1.output}}',
      select_account: 'Выберите аккаунт',
    },

    on_fail: {
      stop:  'Остановить выполнение',
      skip:  'Пропустить шаг',
      retry: 'Повторить',
    },

    trigger_options: {
      webhook:  'Вебхук / API вызов',
      schedule: 'Расписание (Cron)',
      event:    'Системное событие',
    },

    status_options: {
      draft:  'Черновик (выключен)',
      active: 'Активен (включён)',
      paused: 'Приостановлен',
    },

    condition_hint:    'Шаг выполнится только если это условие истинно. Иначе — пропускается.',
    condition_on:      'Условие включено',
    condition_not_initialized: 'Условие не инициализировано',

    add_rule:            'Добавить правило',
    add_group:           'Добавить группу',

    no_steps_description:'Шаги ещё не добавлены.',
    add_step:            'Добавить первый шаг',
    add_step_short:      'Добавить шаг',
    add_another_step:    'Добавить ещё шаг',
    step_label:          'Шаг',
    config_section:      'Конфигурация',
    new_step:            'Новый шаг',
    remove_step:         'Удалить шаг',
    trigger_settings:    'Настройки триггера',
    step_settings:       'Настройки шага',
    insert_variable:     'Вставить переменную',
    available_vars:      'Доступные переменные (контекст)',
  },

  // ─── Условия / Логика ───
  condition: {
    group:          'Группа',
    level:          'Уровень',
    no_rules:       'Пока нет правил в этой группе. Нажмите "Добавить правило", чтобы начать.',
    field_label:    'Поле / Переменная',
    operator_label: 'Оператор',
    value_label:    'Значение',
    value_not_required: 'Значение не требуется',
    max_depth:      'Максимальная вложенность достигнута',
    logical_op: {
      AND: 'И (AND)',
      OR:  'ИЛИ (OR)',
    }
  },

  // ─── Выбор переменных ───
  variable_picker: {
    trigger:      'Триггер',
    body:         'Тело (JSON)',
    account_id:   'ID аккаунта',
    step:         'Шаг',
    full_output:  'Весь результат',
  },

  // ─── Операторы условий ───
  condition_operators: {
    exists:       'Есть (не пустое)',
    not_exists:   'Пусто / нет значения',
    equals:       'Равно',
    not_equals:   'Не равно',
    contains:     'Содержит',
    not_contains: 'Не содержит',
    regex:        'Соответствует regex',
    gt:           '> Больше',
    gte:          '>= Больше или равно',
    lt:           '< Меньше',
    lte:          '<= Меньше или равно',
  },

  // ─── Кнопки / действия ───
  actions: {
    cancel: 'Отмена',
    save:   'Сохранить процесс',
    retry:  'Повторить',
    edit:   'Редактировать',
    delete: 'Удалить',
    confirm_delete: 'Да',
    cancel_delete:  'Нет',
    confirm_delete_bulk: 'Удалить выбранные процессы?',
    history: 'История запусков',
    run_now: 'Запустить сейчас',
    dry_run: 'Тестовый запуск (Dry Run)',
    validate: 'Проверить настройки',
    auto_layout: 'Авто-выравнивание',
  },

  history: {
    title: 'История запусков',
    empty: 'Запусков еще не было.',
    details: 'Детали запуска',
    context: 'Финальный контекст',
    summary_title: 'Итог',
    summary_steps: 'Шаги',
    summary_cases: 'Обновлённые дела',
    summary_documents: 'Документы',
    summary_status: 'Статус обработки',
    summary_processing: 'Обработка писем',
    summary_updated_cases: 'Справка по делам',
    summary_notes: 'Заметки',
    summary_document_fallback: 'Документ',
    step_order: 'Шаг {order}',
    clear_history: 'Очистить историю',
    clear_all_confirm: 'Очистить всю историю запусков этого процесса?',
    delete_confirm: 'Удалить этот запуск из истории?',
    retry_started: 'Повторный запуск начат',
    approved: 'Одобрено',
    rejected: 'Отклонено',
    failed_msg: 'Процесс завершился с ошибкой. Вы можете продолжить с места сбоя.',
    retry_btn: 'Перезапустить',
    waiting_approval: 'Ожидает одобрения человеком',
    waiting_approval_short: 'Ожидание',
    approve_btn: 'Одобрить',
    reject_btn: 'Отклонить',
    paused_msg: 'Процесс ожидает (sleep). Он возобновится автоматически.',
    output_data: 'Результат шага (Output)',
    execution_console: 'Консоль выполнения (Logs)',
    no_console_logs: 'Логи консоли отсутствуют для этого запуска.',
    final_context_title: 'Финальный контекст (Переменные)',
  },

  // ─── Тосты ───
  toast: {
    created:    'Процесс создан!',
    updated:    'Процесс обновлён!',
    deleted:    'Процесс удалён',
    save_error: 'Ошибка сохранения',
    load_error: 'Не удалось загрузить процесс',
    delete_error: 'Ошибка удаления',
    run_started: 'Процесс запущен вручную',
    dry_run_started: 'Тестовый запуск начат',
    run_error: 'Не удалось запустить процесс',
    validation_success: 'Все настройки корректны!',
    validation_failed: 'Обнаружены ошибки в настройках',
    validation_error: 'Ошибка при валидации',
  },

  // ─── Ошибки ───
  errors: {
    name_required: 'Название обязательно',
    load_failed:   'Не удалось загрузить процесс',
    save_first_vaildates: 'Сначала сохраните процесс, чтобы проверить его.',
  },

  sonar: {
    title: 'Workflow Sonar',
    scan: 'Сканировать',
    valid: 'Ошибок не обнаружено. Процесс готов к запуску.',
    invalid: 'Обнаружены потенциальные проблемы:',
    error_step: 'Шаг {{step}}: {{error}}',
    no_workflow: 'Процесс не найден',
    scanning: 'Анализ процесса...',
    errors: 'Критические ошибки',
    warnings: 'Предупреждения',
  },

  registry: {
    modules: {
      core: 'Система',
      legal_cases: 'Судебные дела',
      mail: 'Почта',
      contractors: 'Контрагенты',
      tasks: 'Задачи',
      projects: 'Проекты',
      documents: 'Документы',
    }
  }
};


export default { workflows };

/**
 * Переводы модуля Контрагенты
 */
export const contractors = {
  title: "Контрагенты",
  subtitle: "Управление контрагентами и партнерами",
  add_button: "Новый клиент",
  stats: {
    active: "Активные",
    turnover: "Оборот"
  },
  tabs: {
    all: "Все",
    ip: "ИП",
    legal: "Юридическое лицо",
    foreign: "Иностранная организация",
    employee: "Сотрудник",
    card: "Карточка",
    contacts: "Контакты",
    activity: "Активность"
  },
  activity: {
    title: "История активности",
    empty: "История активности пуста",
    actions: {
      create: "Создан контрагент",
      update: "Обновлены данные",
      delete: "Удален контрагент",
      tax_change: "Изменен налоговый режим"
    }
  },
  table: {
    name: "Название организации",
    tags: "Теги",
    type: "Тип отношений",
    status: "Статус",
    phone: "Телефон",
    manager: "Менеджер",
    actions: "Действия"
  },
  filters: {
    all_statuses: "Все статусы",
    vip: "VIP",
    pending: "На паузе",
    hide_archived: "Кроме архивных"
  },
  archive: {
    title: "Архивировать контрагента",
    description: "Вы уверены, что хотите архивировать контрагента «{name}»? Он перестанет отображаться в активных списках.",
  },
  bulk_actions: {
    title: "Массовые действия",
    delete_selected: "Удалить выбранные",
    change_status: "Изменить статус",
    select_status: "Выберите статус",
    select_none: "Не менять",
    relationship_type: "Тип отношений",
    legal_form: "Правовая форма",
    tags: "Теги",
    replace_tags: "Заменить теги"
  },
  tags: {
    gov: "Госсектор",
    prod: "Производство"
  },
  toast: {
    created: "Контрагент создан",
    updated: "Контрагент обновлён",
    deleted: "Контрагент удалён",
    bulk_updated: "Контрагенты обновлены",
    bulk_deleted: "Контрагенты удалены",
    save_card_first: "Сначала сохраните карточку контрагента",
    inn_not_specified: "У контрагента не указан ИНН",
    reminder_created: "Напоминание создано",
    tax_system_updated_success: "Система налогообложения успешно обновлена",
    tax_system_updated_error: "Ошибка при обновлении системы налогообложения"
  },
  logs: {
    tax_regimes_load_error: "Ошибка загрузки налоговых режимов:"
  },
  quick_actions: {
    event_name: "Событие: {name}",
    reminder_name: "Напоминание: {name}",
    event_description: "Контрагент: {name}\nИНН: {inn}\nТелефон: {phone}",
    reminder_description: "Связаться с контрагентом: {name}\nТелефон: {phone}",
    send_email: "Отправить письмо: {name}",
    create_contract: "Создать договор: {name}",
    add_note: "Добавить заметку: {name}",
  },
  errors: {
    no_phone: "У контрагента не указан номер телефона",
    save_failed: "Ошибка при сохранении",
    delete_failed: "Ошибка при удалении",
  },
  ai: {
    summary_desc: "Автоматически сгенерированный анализ контрагента."
  }
};

export const contractor_sheet = {
  title_new: "Новый контрагент",
  section: {
    general: "Общая информация",
    requisites: "Реквизиты и адреса",
    banks: "Банковские реквизиты",
    notes: "Заметки",
    contacts: "Контактные лица",
    tags: "Теги",
    extra_info: "Дополнительные сведения",
    company_contacts: "Контакты организации",
    passport: "Паспортные данные"
  },
  field: {
    type: "Тип отношений",
    legal_form: "Правовая форма",
    legal_entity_type: "Правовая сущность",
    tags: "Теги",
    currency: "Валюта расчётов",
    full_name: "Полное наименование",
    registration_date: "Дата регистрации",
    birthday: "День рождения",
    inn: "ИНН",
    kpp: "КПП",
    ogrn: "ОГРН",
    ogrnip: "ОГРНИП",
    director: "Руководитель / Подписант",
    position: "Должность",
    legal_address: "Юридический адрес",
    address: "Адрес проживания",
    bank_name: "Название банка",
    bik: "БИК",
    swift: "SWIFT",
    account_number: "Расчетный счет",
    correspondent_account: "Корр. счет",
    contact_name: "ФИО",
    contact_phone: "Телефон",
    contact_email: "Email",
    contact_position: "Должность",
    status: "Статус",
    name: "Название",
    short_name: "Краткое наименование",
    phone: "Телефон",
    manager: "Менеджер",
    email: "Email организации",
    website: "Сайт",
    okved: "ОКВЭД",
    okved_name: "Вид деятельности",
    okpo: "ОКПО",
    okato: "ОКАТО",
    authorized_capital: "Уставный капитал",
    org_status: "Статус организации",
    gender: "Пол",
    private_name: "ФИО физического лица",
    passport_series: "Серия",
    passport_number: "Номер",
    passport_issued_by: "Кем выдан",
    passport_issued_date: "Дата выдачи",
    passport_unit_code: "Код подразделения",
    registration_address: "Адрес регистрации",
    case_type: "Тип дела",
    project_type: "Тип проекта"
  },
  status: {
    active: "Действующая",
    liquidated: "Ликвидирована"
  },
  gender: {
    male: "Мужской",
    female: "Женский"
  },
  legal_form_options: {
    ooo: "ООО",
    ip: "ИП",
    self: "Самозанятый",
    foreign: "Иностранное"
  },
  legal_entity_type_options: {
    individual: "Индивидуальные предприниматели",
    legal: "Юридические лица",
    private: "Физические лица",
    foreign: "Иностранные организации"
  },
  tabs: {
    card: "Карточка",
    activity: "Активность",
    contacts: "Контакты"
  },
  action: {
    configure: "настроить",
    save: "Сохранить изменения",
    delete: "Удалить контрагента",
    cancel: "Отмена",
    refresh_from_sources: "Обновить из открытых источников",
    add_bank: "Добавить счет",
    add_bank_desc: "Заполните реквизиты банковского счета для добавления",
    add_contact: "Добавить контакт",
    add_contact_desc: "Добавьте новое контактное лицо для связи",
    add_custom_tag: "Добавить «{tag}»",
    create_position: "Создать «{position}»",
    comparison: {
      title: "Сверка данных",
      description: "Проверьте данные, полученные из ЕГРЮЛ, перед обновлением карточки",
      field_column: "Поле",
      old_value: "Было",
      new_value: "Станет",
      apply_action: "Применить изменения",
      warning_legal_form: "Изменение правовой формы может повлиять на автоматическое распределение по вкладкам",
      success_enriched: "Данные успешно обогащены"
    },
    group: {
      select: "Выбрать группу",
      change: "Сменить группу",
      none: "Без группы"
    }
  },
  lookup_success: "Данные успешно загружены",
  lookup_no_data: "По данному ИНН ничего не найдено",
  placeholder: {
    add_tag: "Добавить тег...",
    search_tag: "Поиск тега...",
    contact_name: "ФИО контакта",
    search_or_new: "Поиск или новая...",
    no_tags: "Нет тегов",
    no_tags_found: "Теги не найдены",
    activity: "История активности будет доступна в следующей версии",
    bank_details: "Банковские реквизиты будут доступны в следующей версии",
    no_banks: "Нет добавленных счетов",
    no_contacts: "Список контактов пуст",
    notes: "Дополнительные заметки...",
    select_status: "Выберите статус",
    select_priority: "Выберите приоритет",
    select_type: "Выберите тип",
    location_or_video: "Место или видеовызов",
    private_name_placeholder: "Иванов Иван Иванович",
    company_name_placeholder: "ООО «Название компании»",
    legal_address_placeholder: "127030, РОССИЯ, Г. МОСКВА, УЛ. СУЩЁВСКАЯ, Д. 12",
    date_format_placeholder: "ДД.ММ.ГГГГ"
  },
  enrichment: {
    sources: {
      fns: "api-fns.ru (ЕГРЮЛ)",
      manual: "Ручной ввод"
    },
    error_search: "Ошибка при поиске данных",
    error_apply: "Ошибка при применении",
    enter_query: "Введите запрос",
    data_matches_or_no_new_data: "Данные совпадают или источник не вернул новых сведений",
    fields_filled: "Заполнено полей: {count}. Нажмите «Сохранить» чтобы применить.",
    find_in_registry: "Найти в реестре (Rusprofile.ru)",
    inn_ogrn_or_company_name: "ИНН, ОГРН или название компании",
    source: "Источник",
    differences: "{count} отличий",
    fill_selected: "Заполнить выбранные ({count})",
    field: "Поле",
    current: "Сейчас",
    found: "Найдено",
    empty: "пусто",
    unchanged: "{count} совпадают",
    select_all_fields: "Выбрать все поля ({selected}/{total})",
    apply: "Применить",
    apply_with_count: "Применить ({count})"
  },
  messages: {
    updated_fields: "Обновлено полей: {count}",
    call: "Звонок: {phone}",
    delete_confirm: "Удалить выбранные записи ({count})?",
    meeting_keyword: "Встреча",
    client_description: "Клиент: {name}"
  },
  legal_forms: {
    individual: "ИП"
  },
  generated: {
    aleksandr_admin: "Александр Админ",
    mariya_menedzher: "Мария Менеджер",
    ivan_petrov: "Иван Петров"
  }
};

export const contractor = {
  tab_taxes: "Налоги",
  legal_form_description: "Налоговый режим и связанные расчёты контрагента",
  last_name: "Фамилия",
  first_name: "Имя",
  middle_name: "Отчество",
  snils: "СНИЛС",
  citizenship: "Гражданство",
  no_vat: "Без НДС",
  tax_regimes_title: "Режимы налогообложения",
  active_taxes_2026: "Активные налоги на 2026 год",
  tax_burden_estimate: "Оценка налоговой нагрузки",
  valid_from: "Действует с",
  no_active_taxes: "Активные налоги не найдены",
  limits_verification: "Проверка лимитов",
  all_limits_passed: "Все лимиты соблюдены",
  from: "Из",
  change_tax_system_title: "Сменить систему налогообложения",
  change_tax_system_description: "Выберите новый налоговый режим для контрагента.",
  select_new_regime: "Новый режим",
  reason_placeholder: "Укажите причину изменения",
  tax_regime_limit: "(до {{limit}})"
};

export const contractor_type = {
  title: "Создание контрагента",
  subtitle: "Выберите тип контрагента для начала",
  select_type: "Выберите тип",
  private: {
    label: "Физическое лицо",
    description: "Сотрудник, клиент-физлицо, самозанятый"
  },
  individual: {
    label: "Индивидуальный предприниматель (ИП)",
    description: "Индивидуальный предприниматель с ИНН",
    inn_placeholder: "ИНН ИП (12 цифр)"
  },
  legal: {
    label: "Юридическое лицо",
    description: "ООО, АО, НКО и другие организации",
    inn_placeholder: "ИНН организации (10 цифр)"
  },
  foreign: {
    label: "Иностранная организация",
    description: "Компания, зарегистрированная за рубежом"
  },
  error: {
    select_type: "Выберите тип контрагента",
    name_required: "Название обязательно",
    inn_required: "Для выбранного типа необходимо указать ИНН",
    invalid_inn: "Неверный формат ИНН",
    invalid_inn_format: "Неверный формат ИНН",
    invalid_bik: "Неверный формат БИК (9 цифр)",
    invalid_kpp: "Неверный формат КПП",
    invalid_ogrn: "Неверный формат ОГРН",
    invalid_account_number: "Номер счета должен состоять из 20 цифр",
    invalid_corr_account: "Корр. счет должен состоять из 20 цифр",
    fill_required_fields: "Заполните обязательные поля",
    form_has_errors: "Форма содержит ошибки",
    enter_inn: "Введите ИНН для поиска",
    lookup_failed: "Не удалось найти данные по ИНН. Вы можете продолжить вручную."
  },
  lookup: "Найти по ИНН",
      inn_hint: "Введите ИНН для автоматического заполнения данных"
  };
  
  export const quick_sheet = {
    create_task: "Создать задачу",
    create_claim: "Создать претензию",
    new_event: "Новое событие",
    new_reminder: "Новое напоминание",
    create_project: "Создать проект"
  };
  

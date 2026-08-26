const calendar = {
  title: "Календарь",
  subtitle: "Планирование встреч и задач",
  add_event: "Добавить событие",
  add_task: "Добавить задачу",
  today: "Сегодня",
  month: "Месяц",
  week: "Неделя",
  day: "День",
  list: "Список",
  no_events: "Нет событий",
  no_tasks: "Нет задач",
  all_day: "Весь день",
  event: "Событие",
  task: "Задача",
  placeholder: "Название события...",
  create_event: "Создать событие",
  create_task: "Создать задачу",
  edit_event: "Редактировать событие",
  edit_task: "Редактировать задачу",
  delete_event: "Удалить событие",
  delete_task: "Удалить задачу",
  event_details: "Детали события",
  task_details: "Детали задачи",
  start_time: "Время начала",
  end_time: "Время окончания",
  date: "Дата",
  description: "Описание",
  participants: "Участники",
  location: "Место",
  reminder: "Напоминание",
  save: "Сохранить",
  cancel: "Отмена",
  delete: "Удалить",
  confirm_delete: "Вы уверены, что хотите удалить это событие?",
  confirm_delete_task: "Вы уверены, что хотите удалить эту задачу?",
  search_events: "Поиск",
  search_placeholder: "Поиск событий...",
  today_button: "Сегодня",
  add_button: "Добавить",
  views: {
    month: "Месяц",
    week: "Неделя",
    day: "День",
    list: "Список"
  },
  weekdays: {
    short: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    initials: ["П", "В", "С", "Ч", "П", "С", "В"]
  },
  relative_dates: {
    tomorrow: "Завтра",
    yesterday: "Вчера",
    today: "Сегодня"
  },
  locations: {
    court: "Суд"
  },
  event_descriptions: {
    project: "Проект: {project}",
    executor: "Исполнитель: {assignee}",
    deadline: "Дедлайн: {name}",
    manager: "Менеджер: {manager}",
    budget: "Бюджет: {budget}",
    contact_client: "Связаться с {client}"
  },
  // Event creation form translations
  new_event: "Новое событие",
  edit_event_form: "Редактирование события",
  event_title: "Название события",
  add_event_title: "Добавьте название",
  event_types: {
    title: "Типы событий",
    description: "Управление типами событий календаря и их цветами",
    meeting: "Встреча",
    task: "Задача",
    call: "Звонок",
    court: "Суд",
    project: "Проект",
    reminder: "Напоминание",
    personal: "Личное",
    cannot_delete_default: "Нельзя удалить системный тип события",
    panel: {
      default_badge: "По умолчанию",
      edit_title: "Редактировать тип события",
      add_title: "Добавить новый тип события",
      dialog_desc: "Введите название и выберите цвет",
      name_label: "Название",
      name_placeholder: "Например: Презентация",
      color_label: "Цвет",
    }
  },
  all_day_event: "Весь день",
  until_text: "до",
  event_client: "Клиент",
  select_client: "Выбрать",
  notify_client: "Уведомить",
  event_assignee: "Исполнитель",
  assign_user: "Назначить",
  add_location: "Добавьте месторасположение",
  add_description: "Добавьте описание",
  contact_type: "Контакт",
  system_notification: "Система",
  no_available_contacts: "Нет доступных контактов",
  create_follow_up_task: "Создать задачу на звонок",
  // Reminders
  reminder_for_me: "Напоминание для меня",
  in_15_minutes: "За 15 минут",
  in_1_hour: "За 1 час",
  in_1_day: "За 1 день",
  timer: "Таймер",
  date_time: "Дата",
  minutes: "мин.",
  hour: "ч.",
  days: "дн.",
  add_reminder: "Добавить",
  notification_will_be_sent: "Уведомление будет отправлено при сохранении",
  select_contact: "Выбрать контакт",
  // Validation errors
  validation: {
    title_required: "Название события обязательно",
    date_required: "Дата события обязательна",
    invalid_date: "Выберите корректную дату",
    end_time_before_start: "Время окончания должно быть позже времени начала"
  },
  // Notification messages
  error_title_required: "Название события обязательно",
  event_updated: "Событие обновлено",
  event_created: "Событие создано",
  event_deleted: "Событие удалено",
  contractor_linked: "Клиент привязан",
  start: "Начало",
  end: "Окончание",
  event_title_placeholder: "Название события...",
  select_contractor: "Выберите клиента",
  select_project: "Выберите проект",
  // Contractor creation
  create_contractor: "Создавать клиентов",
  contractor_sheet_title: "Новый клиент",
  contractor_created: "Клиент успешно создан",
  contractor_error: "Ошибка при создании клиента",
  // Birthday settings
  settings: {
    title: "Настройки календаря",
    birthdays: {
      title: "Дни рождения",
      enabled: "Показывать дни рождения",
      show_contractors: "Показывать дни регистрации контрагентов",
      show_employees: "Показывать дни рождения сотрудников",
      show_hire_dates: "Показывать годовщины найма",
      warning_days: "Напоминать за N дней до дня рождения",
      on_birth_day: "Показывать в день события"
    }
  },
  // Birthday event types
  event_type: {
    birthday: "День рождения",
    contractor_anniversary: "Годовщина регистрации",
    hire_anniversary: "Годовщина найма"
  },
  birthday_alert: "Завтра день рождения у {name}",
  birthday_alert_today: "Сегодня день рождения у {name}"
};

export default calendar;
export { calendar };
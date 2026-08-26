/**
 * Локализации для компонентов
 * Путь: src/lib/i18n/locales/ru/components.ts */
export const components = {
  category_tree: {
    catalog: "Каталог",
    all_content: "Всё содержимое",
    no_categories: "Нет категорий",
    add_nested: "Добавить вложенную",
    edit: "Редактировать",
    delete: "Удалить",
  },
  category_dialog: {
    edit_title: "Редактировать раздел",
    new_title: "Новый раздел",
    basic_tab: "Основное",
    cms_tab: "Сайт (CMS)",
    name_label: "Название раздела",
    name_placeholder: "Например: Монтажные работы",
    parent_label: "ID родительского раздела (необязательно)",
    parent_placeholder: "Оставьте пустым для корневого раздела",
    desc_label: "Описание для сайта",
    desc_placeholder: "Описание появится на сайте в разделе каталога",
    name_translated: "Название",
    desc_translated: "Описание",
    cancel: "Отмена",
    saving: "Сохранение...",
    save: "Сохранить"
  },
  tag_multi_select: {
    placeholder: "Добавить тег",
    create_label: "Создать:",
    search_placeholder: "Поиск тегов..."
  },
  onboarding_wizard: {
    welcome_title: "Добро пожаловать в TITAN CRM!",
    welcome_desc: "Мы подготовили небольшой тур, чтобы помочь вам освоиться в системе. Это займет всего минуту.",
    search_title: "Глобальный поиск",
    search_desc: "Ищите клиентов, проекты, документы и письма из любой точки системы. Быстрый вызов — <b>Cmd+K</b> (или <b>Ctrl+K</b>).",
    menu_title: "Главное меню",
    menu_desc: "Здесь находятся все основные модули CRM. Вы можете сворачивать меню для экономии места на экране.",
    settings_title: "Настройки",
    settings_desc: "Настройте внешний вид системы, уведомления и параметры модулей под себя.",
    profile_title: "Ваш профиль",
    profile_desc: "Управляйте личными данными или выходите из системы. Здесь же можно повторно запустить этот тур.",
    controls: {
      back: "Назад",
      close: "Закрыть",
      last: "Завершить",
      next: "Далее",
      skip: "Пропустить"
    }
  },
  grid_color_picker: {
    select_color: "Выбрать цвет {0}",
    reset: "Сбросить"
  },
  comment_input: {
    placeholder: "Написать..."
  },
  date_picker: {
    placeholder: "Выберите дату"
  },
  status_system: {
    priority: {
      low: "Низкий",
      medium: "Средний",
      high: "Высокий",
      urgent: "Срочный",
      all: "Все"
    },
    outcome: {
      placeholder: "Выберите результат"
    },
    tag: {
      remove: "Удалить тег",
      placeholder: "Добавьте тег..."
    }
  },
  button: {
    upload_photo: "Загрузить фото",
    save_changes: "Сохранить изменения",
    change_password: "Изменить пароль",
    save_settings: "Сохранить настройки"
  },
  tabs: {
    trigger: {
      "personal_data": "Личные данные",
      "appearance": "Внешний вид",
      "security": "Безопасность",
      "notifications": "Уведомления",
      "mail": "Почта"
    }
  },
  card: {
    title: {
      "personal_data": "Личные данные",
      "appearance": "Внешний вид",
      "security": "Безопасность",
      "notifications": "Уведомления"
    },
    description: {
      "personal_data": "Обновите информацию о себе",
      "appearance": "Настройте тему и цветовую схему приложения",
      "security": "Измените пароль для защиты аккаунта",
      "notifications": "Настройте, какие уведомления вы хотите получать"
    }
  },
  label: {
    "full_name": "Имя",
    "last_name": "Фамилия",
    "email": "Email",
    "phone": "Телефон",
    "position": "Должность",
    "theme": "Тема",
    "accent_color": "Акцентный цвет",
    "current_password": "Текущий пароль",
    "new_password": "Новый пароль",
    "confirm_password": "Подтвердите пароль",
    "light": "Светлая",
    "light_theme_description": "Классическая светлая тема",
    "dark": "Тёмная",
    "dark_theme_description": "Для работы в темноте",
    "working_hours": "Рабочие часы",
    "notification_channels": "Каналы уведомлений",
    "email_notifications": "Email уведомления",
    "email_notifications_description": "Получать уведомления на почту",
    "push_notifications": "Push уведомления",
    "push_notifications_description": "Уведомления в браузере",
    "notification_types": "Типы уведомлений",
    "task": "Задача",
    "tasks": "Задачи",
    "tasks_notifications_description": "Новые задачи и изменения статусов",
    "projects": "Проекты",
    "projects_notifications_description": "Обновления по проектам",
    "contractors": "Контрагенты",
    "contractors_notifications_description": "Изменения в карточках контрагентов",
    "claim": "Претензия",
    "event": "Событие",
    "reminder": "Напоминание",
    "action": "Действие"
  },
  breadcrumbs: {
    "workspace": "Рабочее пространство"
  },
  header: {
    "report_bug": "Сообщить о проблеме",
    "help": "Справка",
    "ai_assistant": "AI Ассистент"
  },
  global_search: {
    "search_button": "Поиск...",
    "placeholder": "Введите запрос для поиска...",
    "searching": "Идёт поиск...",
    "no_results": "Ничего не найдено.",
    "type_to_search": "Начните печатать для поиска по контрагентам, проектам и задачам.",
    "contractors": "Контрагенты",
    "projects": "Проекты",
    "tasks": "Задачи"
  },
  placeholder_page: {
    "under_development": "Этот модуль находится в разработке",
    "coming_soon": "Скоро будет доступно",
    "development_message": "Модуль \"{0}\" находится в активной разработке и будет доступен в ближайшем обновлении TITAN CRM."
  },
  select: {
    "no_users_found": "Пользователи не найдены"
  },
  comments: {
    title: "Комментарии",
    placeholder: "Напишите комментарий...",
    send: "Отправить",
    empty: "Нет комментариев. Будьте первым!",
    delete_confirm: "Удалить комментарий?",
    save_to_add_comments: "Сначала сохраните, чтобы оставлять комментарии"
  }
}; 
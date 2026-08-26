export default {
  title: "Профиль",
  tabs: {
    personal_data: "Личные данные",
    mail: "Почта",
    appearance: "Внешний вид",
    security: "Безопасность",
    notifications: "Уведомления"
  },
  cards: {
    personal_data: {
      title: "Личные данные",
      description: "Обновите информацию о себе"
    },
    mail: {
      title: "Почтовые аккаунты",
      description: "Управляйте вашими почтовыми аккаунтами и их настройками"
    },
    appearance: {
      title: "Внешний вид",
      description: "Настройте тему и цветовую схему приложения"
    },
    security: {
      title: "Безопасность",
      description: "Измените пароль для защиты аккаунта"
    },
    notifications: {
      title: "Уведомления",
      description: "Настройте, какие уведомления вы хотите получать"
    }
  },
  fields: {
    full_name: "Имя",
    last_name: "Фамилия",
    email: "Email",
    phone: "Телефон",
    position: "Должность",
    theme: "Тема",
    accent_color: "Акцентный цвет",
    current_password: "Текущий пароль",
    new_password: "Новый пароль",
    confirm_password: "Подтвердите пароль"
  },
  themes: {
    light: "Светлая",
    light_description: "Классическая светлая тема",
    dark: "Тёмная",
    dark_description: "Для работы в темноте"
  },
  notifications: {
    title: "Уведомления",
    description: "Настройте, какие уведомления вы хотите получать",
    browser: {
      title: "Браузерные уведомления",
      description: "Уведомления в браузере"
    },
    email: {
      title: "Email уведомления",
      description: "Уведомления на почту"
    },
    workflow: {
      title: "Уведомления о задачах",
      description: "Уведомления об изменениях в задачах"
    },
    working_hours: "Рабочие часы",
    channels: "Каналы уведомлений",
    types: "Типы уведомлений",
    tasks: "Задачи",
    tasks_description: "Новые задачи и изменения статусов",
    projects: "Проекты",
    projects_description: "Обновления по проектам",
    contractors: "Контрагенты",
    contractors_description: "Изменения в карточках контрагентов"
  },
  buttons: {
    upload_photo: "Загрузить фото",
    save_changes: "Сохранить изменения",
    change_password: "Изменить пароль",
    save_settings: "Сохранить настройки"
  },
  personal: {
    email: "Email",
    full_name: "Имя",
    phone: "Телефон"
  },
  security: {
    title: "Безопасность",
    description: "Измените пароль для защиты аккаунта",
    current_password: "Текущий пароль",
    new_password: "Новый пароль",
    confirm_password: "Подтвердите пароль",
    action: {
      update_password: "Изменить пароль"
    }
  },
  toast: {
    success_update: "Профиль обновлён",
    success_settings_update: "Настройки сохранены",
    success_password_change: "Пароль изменён",
    error_update: "Ошибка обновления",
    error_settings_update: "Ошибка сохранения",
    error_password_change: "Ошибка смены пароля",
    passwords_not_match: "Пароли не совпадают"
  },
  errors: {
    title: "Ошибка",
    load_profile: "Не удалось загрузить данные профиля",
    save_profile: "Не удалось сохранить профиль",
    change_password: "Не удалось изменить пароль",
    save_notifications: "Не удалось сохранить настройки уведомлений"
  }
};
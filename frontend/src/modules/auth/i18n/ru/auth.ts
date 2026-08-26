/**
 * Локализации для аутентификации
 * Путь: src/modules/auth/i18n/ru/auth.ts
 */
export const auth = {
  login: {
    title: "Вход в систему",
    description: "Введите свои учетные данные для доступа к системе",
    email: "Email или Имя пользователя",
    email_placeholder: "admin@example.com или admin",
    password: "Пароль",
    password_placeholder: "Введите пароль",
    sign_in: "Войти",
    signing_in: "Вход...",
    forgot_password: "Забыли пароль?",
    invalid_credentials: "Неверный логин или пароль"
  },
  logout: {
    confirm: "Вы уверены, что хотите выйти?",
    logout: "Выйти",
    cancel: "Отмена"
  },
  welcome: "Добро пожаловать, {name}",
  recovery: {
    instructions_sent: "Инструкции отправлены",
    error_recovery: "Ошибка при восстановлении",
    error_server: "Ошибка сервера",
    error_reset: "Ошибка сброса пароля",
    email_description: "Укажите, куда отправить ссылку для сброса пароля:",
    account_description: "Введите ваш Email или Никнейм, чтобы найти аккаунт."
  },
  unauthorized: "Недостаточно прав"
};
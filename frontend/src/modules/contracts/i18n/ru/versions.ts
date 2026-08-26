/**
 * Переводы для Истории версий договоров
 */
export const contract_versions = {
  title: "История версий",
  
  table: {
    version: "Версия",
    name: "Название",
    created_by: "Создана",
    created_at: "Дата создания",
    changes: "Изменения",
    actions: "Действия",
  },
  
  status: {
    current: "Текущая версия",
    previous: "Предыдущая версия",
  },
  
  actions: {
    create: "Создать версию",
    view: "Просмотреть",
    revert: "Восстановить",
    compare: "Сравнить",
  },
  
  dialogs: {
    create: "Создать версию договора",
    create_desc: "Добавьте новую версию договора с описанием изменений",
    revert_confirm: "Вы уверены, что хотите восстановить эту версию?",
    compare_versions: "Сравнение версий",
  },
  
  messages: {
    reverted: "Договор восстановлен до выбранной версии",
    created: "Версия успешно создана",
  },
  
  errors: {
    revert_error: "Ошибка при восстановлении версии",
    create_error: "Ошибка при создании версии",
  },
  
  placeholder: {
    changes: "Опишите изменения в этой версии",
  },

  version: "Версия",
  
  empty: "История версий пуста",

  revert: "Восстановить",
  revert_confirm: "Вы уверены, что хотите восстановить эту версию?",
};

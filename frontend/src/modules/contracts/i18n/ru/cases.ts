/**
 * Переводы для Связи договоров с делами
 */
export const contract_cases = {
  title: "Связанные дела",
  
  table: {
    name: "Название дела",
    case_number: "Номер дела",
    status: "Статус",
    linked_at: "Дата связи",
    actions: "Действия",
  },
  
  actions: {
    link: "Связать с делом",
    unlink: "Отвязать",
  },
  
  dialogs: {
    link_case: "Связать договор с судебным делом",
    select_case: "Выберите дело",
    unlink_confirm: "Вы уверены, что хотите отвязать это дело?",
  },
  
  messages: {
    linked: "Дело связано успешно",
    unlinked: "Дело отвязано успешно",
  },
  
  errors: {
    link_error: "Ошибка при связи дела",
    unlink_error: "Ошибка при отвязке дела",
  },
  
  empty: "Договор не связан ни с одним делом",
};

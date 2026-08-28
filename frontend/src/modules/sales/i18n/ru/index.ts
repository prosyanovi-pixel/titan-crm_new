/**
 * Переводы модуля «Продажи»
 */
export default {
  title: "Воронка продаж",
  subtitle: "Управление сделками, КП и договорами",
  new_deal: "Новая сделка",
  pipeline: "Воронка",
  stages: {
    lead: "Новый лид",
    negotiation: "Переговоры",
    quote: "Подготовка КП",
    contract: "Договор и счета",
    won: "Успешно реализовано",
    lost: "Отказ"
  },
  metrics: {
    quotes: "КП",
    contracts: "Договоры",
    claims: "Рекламации",
    margin: "Ожидаемая маржа"
  },
  hub: {
    title: "Хаб сделки",
    actions: {
      create_quote: "Создать КП",
      create_contract: "Подписать договор",
      create_invoice: "Выставить счет"
    }
  },
  empty: {
    title: "Нет сделок",
    description: "В этой колонке пока нет сделок."
  }
};

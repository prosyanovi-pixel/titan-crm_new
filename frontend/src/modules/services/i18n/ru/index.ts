/**
 * Локализации для модуля Услуги
 * Путь: src/lib/i18n/locales/ru/services.ts
 */
export const services = {
  title: "Услуги",
  subtitle: "Каталог услуг",
  breadcrumb: "Услуги",
  add_button: "Добавить услугу",
  tabs: {
    services: "Услуги",
  },
  service: {
    name: "Название услуги",
    type: "Тип",
    category: "Категория",
    cost: "Себестоимость",
    cost_type: "Тип расчета",
    status: "Статус",
    tags: "Теги",
  },
  new_service: "Добавить услугу",
  empty: "Нет услуг. Добавьте первую услугу.",
  types: {
    pnr: "ПНР",
    installation: "Монтаж",
    delivery: "Доставка",
    consulting: "Консультация",
    maintenance: "Техобслуживание"
  },
  cost_types: {
    fixed: "Фикс.",
    hourly: "В час",
    percentage: "% от суммы"
  },
  table: {
    headers: {
      name: 'Наименование',
      category: 'Категория',
      type: 'Тип',
      base_cost: 'Стоимость',
      status: 'Статус',
    },
    empty_message: 'Нет услуг. Добавьте первую услугу.',
  },
  categories: 'Категории',
  delete_category_title: 'Удалить категорию?',
  delete_category_desc: 'Это действие необратимо.',
  delete_confirm_title: 'Удалить услугу?',
  delete_confirm_desc: 'Это действие необратимо.',
  delete_bulk_confirm_title: 'Удалить выбранные услуги?',
  delete_bulk_confirm_desc: 'Вы уверены, что хотите удалить {{count}} услуг(и)?',
  form: {
    title_edit: "Редактировать услугу",
    title_add: "Новая услуга",
    tabs: {
      basic: "Основные",
      financial: "Финансы & Налоги",
      cms: "Сайт (CMS)",
      translation: "Перевод",
    },
    fields: {
      name: "Название услуги",
      description: "Описание услуги",
      type: "Тип услуги",
      status: "Статус",
      category: "Категория (Раздел)",
      tags: "Теги",
      cost_type: "Тип расчета стоимости",
      base_cost: "Базовая стоимость (или процент)",
      tax_contributions: "Налогообложение (ФОТ)",
      tax_contributions_desc: "Налоги, уплачиваемые с фонда оплаты труда для данной услуги.",
      tax_contributions_rate: "Ставка страховых взносов (%)",
      tax_contributions_hint: "Обычно 30% (ОПС, ОМС, ВНиМ)",
      vat: "НДС",
      vat_rate: "Ставка НДС (%)",
    },
    placeholders: {
      name: "Название услуги",
      description: "Описание услуги",
      type: "Выберите тип",
      status: "Выберите статус",
      category: "Без категории",
      tags: "Добавьте теги...",
      base_cost: "Базовая стоимость",
      tax_contributions_rate: "30",
      vat_rate: "Выберите ставку",
    },
    cost_types: {
      fixed: "Фиксированная ставка",
      hourly: "Почасовая ставка",
      percentage: "Процент от стоимости оборудования",
    },
    vat_rates: {
      none: "Без НДС (0%)",
      rate_10: "10%",
      rate_20: "20%",
      rate_22: "22%",
    },
    actions: {
      cancel: "Отмена",
      save: "Сохранить",
      saving: "Сохранение...",
    },
    without_category: "-- Без категории --",
  },
};

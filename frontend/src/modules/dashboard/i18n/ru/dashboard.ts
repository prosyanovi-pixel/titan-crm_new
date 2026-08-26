const dashboard = {
  title: "Дашборд",
  subtitle: "Обзор ключевых показателей и активности",
  widget_settings: "Настройки виджета",

  stats: {
    contractors: "Контрагенты",
    active_projects: "Активные проекты",
    turnover: "Оборот (мес.)",
    tasks: "Задачи",
    total_projects: "Всего проектов",
    tasks_completion: "Выполнение задач",
    total_tasks: "Всего задач",
    budget_total: "Общий бюджет"
  },
  
  weekdays: {
    short_0: "Пн",
    short_1: "Вт",
    short_2: "Ср",
    short_3: "Чт",
    short_4: "Пт",
    short_5: "Сб",
    short_6: "Вс"
  },

  recent_activity: "Последняя активность",
  upcoming_deadlines: "Ближайшие дедлайны",
  no_deadlines: "Нет ближайших дедлайнов",
  no_activity: "Нет недавней активности",
  no_projects: "Нет проектов",
  no_overdue: "Нет просроченных задач",

  sections: {
    projects: "Проекты",
    tasks: "Задачи",
    overdue_tasks: "Просроченные задачи",
    calendar: "Календарь"
  },

  actions: {
    open: "Открыть",
    view_all: "Все",
    go_to_projects: "К проектам",
    go_to_tasks: "К задачам"
  },

  deadline: {
    overdue: "Просрочен",
    today: "Сегодня",
    tomorrow: "Завтра"
  },

  calendar: {
    title: "Календарь",
    range: "Диапазон",
    today: "Сегодня",
    no_plans: "Нет событий или задач"
  },

  quick_stats: {
    revenue_growth: "Рост выручки",
    vs_last_month: "по сравнению с прошлым месяцем",
    new_clients: "Новые клиенты",
    last_30_days: "за последние 30 дней",
    completed_tasks: "Выполнено задач",
    team_efficiency: "эффективность команды"
  },
  fallbacks: {
    recent_activity: "Недавняя активность",
    upcoming_deadlines: "Ближайшие дедлайны"
  },
  customize: "Настроить",
  visible_blocks: "Виджеты",
  blocks: {
    stats: "Показатели",
    analytics: "Аналитика",
    activity: "Активность",
    deadlines: "Дедлайны",
    overdue: "Просрочено",
    calendar: "Календарь",
    projects: "Проекты"
  },
  analytics: {
    budget_by_client: "Бюджет по клиентам",
    top_10_clients: "Топ-10 клиентов по объему бюджетов",
    status_distribution: "Распределение по статусам",
    project_count_by_status: "Количество проектов в каждом статусе",
    profitability: "Освоение бюджетов и прибыль",
    budget_vs_used: "Сравнение планового бюджета и фактических затрат",
  },
  view_type: "Вид",
  view: {
    chart: "График",
    numbers: "Цифры"
  },
  sizes: {
    title: "Размеры блоков",
    full: "На всю ширину",
    half: "Половина",
    compact: "Компактный"
  },
  settings: {
    refresh: {
      title: "Автообновление",
      never: "Вручную",
      m1: "1 мин",
      m5: "5 мин",
      m15: "15 мин"
    },
    size: {
      "1/3": "1/3 колонки",
      "1/2": "1/2 колонки",
      "2/3": "2/3 колонки",
      "full": "Во всю ширину"
    },
    period: {
      title: "Период",
      week: "Эта неделя",
      month: "Этот месяц",
      quarter: "Этот квартал"
    },
    items: "записей"
  }
};

export default dashboard;
export { dashboard };
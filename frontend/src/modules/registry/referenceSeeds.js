export const moduleReferenceSeeds = [
  {
    id: "dashboard",
    name: "Дашборд",
    icon: "LayoutDashboard",
    displayOrder: 10,
  },
  {
    id: "contractors",
    name: "Контрагенты",
    icon: "Users",
    displayOrder: 20,
    quickActions: [
      { id: "contractors_send_email", name: "Отправить письмо", icon: "Mail", action: "send_email", displayOrder: 1 },
      { id: "contractors_make_call", name: "Позвонить", icon: "Phone", action: "make_call", displayOrder: 2 },
      { id: "contractors_create_task", name: "Создать задачу", icon: "Plus", action: "create_task", displayOrder: 3 },
      { id: "contractors_create_event", name: "Создать событие", icon: "Calendar", action: "create_event", displayOrder: 4 },
      { id: "contractors_create_claim", name: "Создать претензию", icon: "Gavel", action: "create_claim", displayOrder: 5 },
      { id: "contractors_create_project", name: "Создать проект", icon: "FolderKanban", action: "create_project", displayOrder: 6 },
      { id: "contractors_add_note", name: "Добавить заметку", icon: "StickyNote", action: "add_note", displayOrder: 7 },
    ],
  },
  {
    id: "projects",
    name: "Проекты",
    icon: "FolderKanban",
    displayOrder: 30,
    quickActions: [
      { id: "projects_create_project", name: "Создать проект", icon: "Plus", action: "create_project", displayOrder: 1 },
      { id: "projects_create_task", name: "Создать задачу", icon: "CheckSquare", action: "create_task", displayOrder: 2 },
      { id: "projects_create_event", name: "Создать событие", icon: "Calendar", action: "create_event", displayOrder: 3 },
      { id: "projects_assign_manager", name: "Назначить менеджера", icon: "User", action: "assign_manager", displayOrder: 4 },
      { id: "projects_change_status", name: "Изменить статус", icon: "RefreshCw", action: "change_status", displayOrder: 5 },
    ],
  },
  {
    id: "mail",
    name: "Почта",
    icon: "Mail",
    displayOrder: 40,
    quickActions: [
      { id: "mail_compose", name: "Написать письмо", icon: "Mail", action: "send_email", displayOrder: 1 },
      { id: "mail_inbox", name: "Входящие", icon: "Inbox", action: "view_inbox", displayOrder: 2 },
    ],
  },
  {
    id: "documents",
    name: "Документы",
    icon: "FileText",
    displayOrder: 50,
    // Нет sheet для загрузки — действия не добавляем
  },
  {
    id: "tasks",
    name: "Задачи",
    icon: "CheckSquare",
    displayOrder: 60,
    quickActions: [
      { id: "tasks_create_task", name: "Создать задачу", icon: "Plus", action: "create_task", displayOrder: 1 },
      { id: "tasks_create_event", name: "Создать событие", icon: "Calendar", action: "create_event", displayOrder: 2 },
      { id: "tasks_assign_task", name: "Назначить задачу", icon: "UserCog", action: "assign_task", displayOrder: 3 },
      { id: "tasks_change_status", name: "Изменить статус", icon: "RefreshCw", action: "change_status", displayOrder: 4 },
    ],
  },
  {
    id: "calendar",
    name: "Календарь",
    icon: "Calendar",
    displayOrder: 70,
    quickActions: [
      { id: "calendar_create_event", name: "Создать событие", icon: "Plus", action: "create_event", displayOrder: 1 },
      { id: "calendar_schedule_meeting", name: "Запланировать встречу", icon: "Video", action: "schedule_meeting", displayOrder: 2 },
      { id: "calendar_set_reminder", name: "Установить напоминание", icon: "Bell", action: "set_reminder", displayOrder: 3 },
    ],
  },
  {
    id: "lawyers",
    name: "Юристы",
    icon: "Scale",
    displayOrder: 80,
    quickActions: [
      { id: "lawyers_create_task", name: "Создать задачу", icon: "Plus", action: "create_task", displayOrder: 1 },
      { id: "lawyers_create_case", name: "Создать дело", icon: "Gavel", action: "create_case", displayOrder: 2 },
      { id: "lawyers_create_event", name: "Создать событие", icon: "Calendar", action: "create_event", displayOrder: 3 },
    ],
  },
  {
    id: "finance",
    name: "Финансы",
    icon: "Wallet",
    displayOrder: 90,
    quickActions: [
      { id: "finance_create_invoice", name: "Создать счёт", icon: "Plus", action: "create_invoice", displayOrder: 1 },
      { id: "finance_record_payment", name: "Записать платёж", icon: "DollarSign", action: "record_payment", displayOrder: 2 },
    ],
  },
  {
    id: "cases",
    name: "Дела",
    icon: "Gavel",
    displayOrder: 100,
    quickActions: [
      { id: "cases_create_case", name: "Создать дело", icon: "Plus", action: "create_case", displayOrder: 1 },
      { id: "cases_create_event", name: "Создать событие", icon: "Calendar", action: "create_event", displayOrder: 2 },
      { id: "cases_assign_lawyer", name: "Назначить юриста", icon: "UserCog", action: "assign_lawyer", displayOrder: 3 },
      { id: "cases_add_document", name: "Добавить документ", icon: "FilePlus", action: "add_document", displayOrder: 4 },
      { id: "cases_send_to_court", name: "Отправить в суд", icon: "Send", action: "send_to_court", displayOrder: 5 },
    ],
  },
  {
    id: "contracts",
    name: "Договоры",
    icon: "FileSignature",
    displayOrder: 110,
    // Нет специфичных действий — не добавляем
  },
  {
    id: 'reports',
    name: 'Отчёты',
    icon: 'BarChart2',
    displayOrder: 95,
    quickActions: [
      { id: 'reports_new_report', name: 'Создать отчёт', icon: 'Plus', action: 'create_report', displayOrder: 1 },
    ],
  },
  {
    id: "marketing",
    name: "Маркетинг",
    icon: "Megaphone",
    displayOrder: 96,
    quickActions: [
      { id: "marketing_create_campaign", name: "Создать кампанию", icon: "Plus", action: "create_campaign", displayOrder: 1 },
    ],
  },
  {
    id: "workflows",
    name: "Воркфлоу",
    icon: "Network",
    displayOrder: 115,
  },
  {
    id: "products",
    name: "Товары",
    icon: "Package",
    displayOrder: 116,
    quickActions: [
      { id: "products_create_product", name: "Создать товар", icon: "Plus", action: "create_product", displayOrder: 1 },
    ],
  },
  {
    id: "services",
    name: "Услуги",
    icon: "Wrench",
    displayOrder: 117,
    quickActions: [
      { id: "services_create_service", name: "Создать услугу", icon: "Plus", action: "create_service", displayOrder: 1 },
    ],
  },
  {
    id: "warehouse",
    name: "Склад",
    icon: "Warehouse",
    displayOrder: 118,
    quickActions: [
      { id: "warehouse_receive", name: "Оприходовать", icon: "Plus", action: "receive", displayOrder: 1 },
      { id: "warehouse_transfer", name: "Переместить", icon: "ArrowRight", action: "transfer", displayOrder: 2 },
    ],
  },
  {
    id: "price_lists",
    name: "Прайс-листы",
    icon: "FileSpreadsheet",
    displayOrder: 119,
    quickActions: [
      { id: "price_lists_create", name: "Создать прайс-лист", icon: "Plus", action: "create_price_list", displayOrder: 1 },
    ],
  },
  {
    id: "quotes",
    name: "КП",
    icon: "FileSpreadsheet",
    displayOrder: 121,
  },
  {
    id: "settings",
    name: "Настройки",
    icon: "Settings",
    displayOrder: 120,
  },
  {
    id: "profile",
    name: "Профиль",
    icon: "User",
    displayOrder: 130,
  },
];

export const getModuleReferenceSeed = (id) =>
  moduleReferenceSeeds.find((moduleSeed) => moduleSeed.id === id);

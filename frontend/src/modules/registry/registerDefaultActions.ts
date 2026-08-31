import { ActionRegistry } from "./ActionRegistry";

/**
 * Регистрация системных действий для всех модулей.
 * Этот файл — единственное место, где определяются стандартные действия строк (Row Actions)
 * и массовые действия (Bulk Actions) для модулей CRM.
 *
 * Паттерн использования в компонентах таблиц:
 *   const systemActions = useModuleActions("имя_модуля");
 *   const { actions: bulkActions } = useBulkActions("имя_модуля");
 */
export function registerDefaultActions() {
  // ── Модули с базовым набором действий (view, edit, delete, bulk_delete) ──
  const commonModules = [
    "contractors",
    "projects",
    "tasks",
    "services",
    "warehouse",
    "finance",
    "documents",
    "calendar",
    "lawyers",
    "cases",
    "marketing",
    "products",
    "price_lists",
    "contracts",
    "quotes",
    "templates",
    "reports",
  ];

  commonModules.forEach((mod) => {
    // Row Actions
    ActionRegistry.registerAction({
      id: "view",
      targetModule: mod,
      type: "row",
      labelKey: "common.view",
      icon: "Eye",
      defaultOrder: 1,
      handler: () => {}, // Будет переопределено локально
    });
    ActionRegistry.registerAction({
      id: "edit",
      targetModule: mod,
      type: "row",
      labelKey: "common.edit",
      icon: "Pencil",
      defaultOrder: 2,
      handler: () => {}, // Будет переопределено локально
    });
    ActionRegistry.registerAction({
      id: "delete",
      targetModule: mod,
      type: "row",
      labelKey: "common.delete",
      icon: "Trash2",
      defaultOrder: 90,
      handler: () => {}, // Будет переопределено локально
    });

    // Bulk Actions (массовое редактирование)
    ActionRegistry.registerAction({
      id: "bulk_delete",
      targetModule: mod,
      type: "bulk",
      labelKey: "common.delete",
      icon: "Trash2",
      defaultOrder: 90,
      handler: () => {}, // Будет переопределено локально
    });
  });

  // Массовое редактирование (Bulk Edit)
  const bulkEditModules = ["contractors", "marketing", "projects", "tasks"];
  bulkEditModules.forEach((mod) => {
    ActionRegistry.registerAction({
      id: "bulk_edit",
      targetModule: mod,
      type: "bulk",
      labelKey: "common.edit",
      icon: "Users", // or Pencil, depending on context, Users is generic for contractors but maybe Pencil is better? using Pencil.
      defaultOrder: 10,
      handler: () => {},
    });
  });

  // ── Переиспользуемые действия для конкретных модулей ──
  // Эти действия могут быть активированы/деактивированы через настройки модулей.
  // При необходимости их легко добавить к другим модулям — достаточно дописать moduleId в массив.

  // Скачать PDF — для модулей, где можно выгрузить документ
  const downloadPdfModules = ["price_lists", "quotes", "contracts"];
  downloadPdfModules.forEach((mod) => {
    ActionRegistry.registerAction({
      id: "download_pdf",
      targetModule: mod,
      type: "row",
      labelKey: "common.download",
      icon: "Download",
      defaultOrder: 10,
      handler: () => {},
    });
  });

  // Активировать / Деактивировать — для сущностей с признаком активности
  const activateModules = ["price_lists", "products", "services", "templates"];
  activateModules.forEach((mod) => {
    ActionRegistry.registerAction({
      id: "activate",
      targetModule: mod,
      type: "row",
      labelKey: "common.activate",
      icon: "CheckCircle2",
      defaultOrder: 15,
      handler: () => {},
    });
    ActionRegistry.registerAction({
      id: "deactivate",
      targetModule: mod,
      type: "row",
      labelKey: "common.deactivate",
      icon: "Circle",
      defaultOrder: 16,
      handler: () => {},
    });
  });

  // Копировать / Дублировать — создание копии сущности
  const copyModules = ["templates", "reports", "quotes"];
  copyModules.forEach((mod) => {
    ActionRegistry.registerAction({
      id: "copy",
      targetModule: mod,
      type: "row",
      labelKey: "common.copy",
      icon: "Copy",
      defaultOrder: 5,
      handler: () => {},
    });
  });

  // Поделиться — открытие / закрытие доступа другим пользователям
  const shareModules = ["reports", "documents", "templates"];
  shareModules.forEach((mod) => {
    ActionRegistry.registerAction({
      id: "share",
      targetModule: mod,
      type: "row",
      labelKey: "common.share",
      icon: "Share2",
      defaultOrder: 8,
      handler: () => {},
    });
  });

  // Назначить по умолчанию — price_lists
  ActionRegistry.registerAction({
    id: "make_default",
    targetModule: "price_lists",
    type: "row",
    labelKey: "common.default",
    icon: "Star",
    defaultOrder: 17,
    handler: () => {},
  });
}

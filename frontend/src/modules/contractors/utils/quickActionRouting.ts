/** Тип категории быстрой панели для контрагента */
export type ContractorQuickSheetKind = "task" | "claim" | "project" | "event" | "reminder";

const contractorQuickActionSheetKinds: Record<string, ContractorQuickSheetKind> = {
  task: "task",
  create_task: "task",
  claim: "claim",
  create_claim: "claim",
  project: "project",
  create_project: "project",
  event: "event",
  create_event: "event",
  reminder: "reminder",
  create_reminder: "reminder",
};

/**
 * Определяет категорию быстрой панели по названию действия.
 * @param action - Код действия (task, create_task, claim и т.д.)
 * @returns Тип панели или null, если действие не найдено
 */
export function getContractorQuickSheetKind(action: string): ContractorQuickSheetKind | null {
  return contractorQuickActionSheetKinds[action] ?? null;
}

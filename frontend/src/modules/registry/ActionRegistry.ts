import { ReactNode } from "react";
import { PermissionId } from "@/constants/permissions";

export type ActionType = "row" | "bulk";

export interface ActionDefinition<TData = any> {
  /** Уникальный идентификатор действия (например, 'tasks.create_for_contractor') */
  id: string;
  /** Модуль, в котором это действие будет отображаться (например, 'contractors') */
  targetModule: string;
  /** Тип действия: для одной строки или массовое */
  type: ActionType;
  /** Текст или ключ перевода для действия */
  labelKey: string;
  /** Иконка (имя иконки lucide-react или компонент) */
  icon: string | ReactNode;
  /** Права, необходимые для выполнения действия */
  permission?: PermissionId;
  /** Сортировка по умолчанию */
  defaultOrder?: number;
  /** 
   * Обработчик действия 
   * Для row type `data` - объект одной строки
   * Для bulk type `data` - массив выбранных ID или объектов
   */
  handler: (data: TData) => void;
  /**
   * Функция проверки, применимо ли действие к данным.
   * Если возвращает false, действие может быть скрыто или задизейблено.
   */
  isVisible?: (data: TData) => boolean;
}

class ActionRegistryClass {
  private actions: Map<string, ActionDefinition[]> = new Map();

  /**
   * Зарегистрировать новое действие в реестре
   */
  registerAction(action: ActionDefinition) {
    const moduleActions = this.actions.get(action.targetModule) || [];
    // Проверка на дубликаты
    if (moduleActions.some((a) => a.id === action.id)) {
      console.warn(`Action ${action.id} is already registered for module ${action.targetModule}`);
      return;
    }
    moduleActions.push(action);
    // Сортировка по умолчанию
    moduleActions.sort((a, b) => (a.defaultOrder || 99) - (b.defaultOrder || 99));
    this.actions.set(action.targetModule, moduleActions);
  }

  /**
   * Получить список всех действий для конкретного модуля
   */
  getActionsForModule(moduleName: string, type?: ActionType): ActionDefinition[] {
    const allActions = this.actions.get(moduleName) || [];
    if (type) {
      return allActions.filter((a) => a.type === type);
    }
    return allActions;
  }
}

export const ActionRegistry = new ActionRegistryClass();

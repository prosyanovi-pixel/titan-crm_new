
// Module settings data types
export interface StatusItem {
  id: string;
  name: string;
  color: 'active' | 'pending' | 'vip' | 'paused' | 'default' | string;
  module: string;
}

export interface TagItem {
  id: string;
  name: string;
  color: string;
  module: string;
}

export interface PriorityItem {
  id: string;
  name: string;
  level: number;
  color: string;
  module: string;
}

export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  action: string;
  module: string;
}

export interface RelationshipTypeItem {
  id: string;
  name: string;
  color: string;
  module: string;
  showAsTab?: boolean;
}

export interface ModuleItem {
    id: string;
    name: string;
    icon: string;
}

// UI Constants (Theme colors)
export const statusColors = [
  { value: 'active', label: 'common.colors.green_active', className: 'bg-status-active' },
  { value: 'pending', label: 'common.colors.yellow_pending', className: 'bg-status-pending' },
  { value: 'vip', label: 'common.colors.blue_vip', className: 'bg-status-vip' },
  { value: 'paused', label: 'common.colors.red_paused', className: 'bg-status-paused' },
  { value: 'default', label: 'common.colors.gray', className: 'bg-muted' },
];

export const accentColors = [
  { id: 'blue', name: 'common.colors.blue_vip', primary: '217 91% 60%', hue: 217 },
  { id: 'green', name: 'common.colors.green_active', primary: '142 71% 45%', hue: 142 },
  { id: 'purple', name: 'common.colors.purple', primary: '262 83% 58%', hue: 262 },
  { id: 'orange', name: 'common.colors.orange', primary: '25 95% 53%', hue: 25 },
  { id: 'rose', name: 'common.colors.pink', primary: '346 77% 50%', hue: 346 },
  { id: 'cyan', name: 'common.colors.teal', primary: '186 94% 41%', hue: 186 },
];

// Fallbacks are now empty as data comes from API
export const modules: ModuleItem[] = [];
export const defaultStatuses: StatusItem[] = [
  // Calendar module statuses
  { id: 'pending', name: 'Ожидание', color: 'pending', module: 'calendar' },
  { id: 'confirmed', name: 'Подтверждено', color: 'active', module: 'calendar' },
  { id: 'cancelled', name: 'Отменено', color: 'paused', module: 'calendar' },
  { id: 'completed', name: 'Завершено', color: 'default', module: 'calendar' },
];
export const defaultTags: TagItem[] = [];
export const defaultPriorities: PriorityItem[] = [
  // Calendar module priorities
  { id: 'low', name: 'Низкий', level: 1, color: 'green', module: 'calendar' },
  { id: 'medium', name: 'Средний', level: 2, color: 'yellow', module: 'calendar' },
  { id: 'high', name: 'Высокий', level: 3, color: 'red', module: 'calendar' },
];
export const defaultQuickActions: QuickAction[] = [];
export const defaultRelationshipTypes: RelationshipTypeItem[] = [];

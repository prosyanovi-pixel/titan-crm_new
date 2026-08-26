export type Theme = 'light' | 'dark';

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
  displayOrder?: number;
}

export interface PriorityItem {
  id: string;
  name: string;
  level: number;
  color: string;
  module: string;
}

export interface ProjectStageItem {
  id: string;
  name: string;
  displayorder?: number;
  color?: string;
  variant?: string;
  module?: string;
  [key: string]: unknown;
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
  isActive?: boolean;
}

export interface LegalFormItem {
  id: string;
  name: string;
  color?: string;
  showAsTab?: boolean;
  groupId?: string;  // Группа, к которой принадлежит форма
  keywords?: string; // Ключевые слова для поиска
}

export interface LegalFormGroupItem {
  id: string;
  name: string;
  nameRu?: string;  // Ключ перевода
  displayOrder: number;
  color: string;
  showAsTab: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PositionItem {
  id: string;
  name: string;
}

export interface ModuleItem {
  id: string;
  name: string;
  icon: string;
}

export interface AccentColor {
  id: string;
  name: string;
  primary: string;
  hue: number;
}

export interface StatusColor {
  value: string;
  label: string;
  className: string;
}

export interface UserSettings {
  theme: Theme;
  accentColor: string;
  sidebarCollapsed: boolean;
  language: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

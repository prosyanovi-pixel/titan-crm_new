import {
  StatusItem, TagItem, PriorityItem, ProjectStageItem, QuickAction, RelationshipTypeItem, LegalFormGroupItem, LegalFormItem, PositionItem,
} from '../modules/settings/types/settings.types';

export type ThemeType = 'light' | 'dark' | 'system';
export type DensityType = 'comfortable' | 'compact' | 'high';
export type FontSizeType = 'small' | 'medium' | 'large';

export interface SettingsContextType {
  theme: ThemeType;
  accentColor: string;
  sidebarCollapsed: boolean;
  density: DensityType;
  tableFontSize: FontSizeType;
  loading: boolean;
  
  statuses: StatusItem[];
  tags: TagItem[];
  priorities: PriorityItem[];
  projectStages: ProjectStageItem[];
  quickActions: QuickAction[];
  relationshipTypes: RelationshipTypeItem[];
  taxRegimes: Array<{ id: number; name: string; code: string }>;
  legalForms: LegalFormItem[];
  legalFormGroups: LegalFormGroupItem[];
  contractorTypes: Record<string, unknown>[];
  positions: PositionItem[];
  modules: Record<string, unknown>[];
  
  setTheme: (theme: ThemeType) => void;
  setAccentColor: (color: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDensity: (density: DensityType) => void;
  setTableFontSize: (size: FontSizeType) => void;
  refresh: () => Promise<void>;
  
  // CRUD methods
  addItem: (table: string, item: Record<string, unknown>) => Promise<unknown>;
  updateItem: (table: string, item: Record<string, unknown>) => Promise<unknown>;
  deleteItem: (table: string, id: string | number, module?: string) => Promise<void>;
  saveQuickActions: (actions: QuickAction[]) => Promise<void>;
  addLegalForm: (form: Record<string, unknown>) => Promise<unknown>;
  updateLegalForm: (id: string, form: Record<string, unknown>) => Promise<unknown>;
  deleteLegalForm: (id: string) => Promise<void>;

  getStatusesByModule: (module: string) => StatusItem[];
  getTagsByModule: (module: string) => TagItem[];
  getPrioritiesByModule: (module: string) => PriorityItem[];
  getProjectStages: () => ProjectStageItem[];
  getQuickActionsByModule: (module: string) => QuickAction[];
  getRelationshipTypesByModule: (module: string) => RelationshipTypeItem[];
  getContractorTypesByModule: () => Record<string, unknown>[];
  getLegalFormsByModule: () => LegalFormItem[];
  getPositions: () => PositionItem[];
}

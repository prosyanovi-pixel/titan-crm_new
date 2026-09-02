import {
  StatusItem, TagItem, PriorityItem, ProjectStageItem, QuickAction, RelationshipTypeItem, LegalFormGroupItem, LegalFormItem, PositionItem,
} from '../modules/settings/types/settings.types';

/** Профиль компании с налоговым режимом */
export interface CompanyProfile {
  id?: number;
  fullName?: string;
  shortName?: string;
  inn?: string;
  kpp?: string;
  taxRegimeId?: number | null;
  [key: string]: unknown;
}

/** Налоговый режим из справочника */
export interface TaxRegimeItem {
  id: number;
  code: string;
  name: string;
  /** Применяется ли НДС (из поля has_vat в БД) */
  hasVat?: boolean;
  /** Синоним hasVat из расширенной миграции */
  requiresNds?: boolean;
  /** Ставка НДС по умолчанию для режима, в процентах */
  defaultVatRate?: number;
}

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
  allQuickActions: QuickAction[];
  relationshipTypes: RelationshipTypeItem[];
  taxRegimes: TaxRegimeItem[];
  companyProfile: CompanyProfile | null;
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

// Types
export type {
  Theme,
  StatusItem,
  TagItem,
  PriorityItem,
  QuickAction,
  RelationshipTypeItem,
  LegalFormItem,
  ModuleItem,
  AccentColor,
  StatusColor,
  UserSettings,
  ModuleWithSettings,
  ModuleSettings,
  ModuleSettingsResponse,
  DisplaySettings,
  FeatureFlags,
  ValidationRules,
  DefaultValues,
  SMTPSettings,
  TelegramSettings,
} from "./types";

// API
export { settingsService, settingsApi, ENDPOINTS } from "./api";

// Hooks
export {
  useSettings,
  useModuleSettings,
  useAllModuleSettings,
  useSaveModuleSetting,
  useUpdateModuleSettings,
  useDeleteModuleSetting,
} from "./hooks";

// Components
export {
  IntegrationsEditor,
  PermissionEditor,
  PriorityEditor,
  QuickActionEditor,
  RelationshipTypeEditor,
  RoleEditor,
  StatusEditor,
  TagEditor,
  UserEditor,
  ModuleSettingsEditor,
  AllModuleSettingsPanel,
} from "./components";

// Pages
export { default as SettingsPage } from "./pages/SettingsPage";

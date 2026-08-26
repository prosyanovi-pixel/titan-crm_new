/**
 * Types for module-specific settings
 */

export interface ModuleWithSettings {
  id: string;
  name: string;
  folder: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  settings: ModuleSettings;
}

export interface ModuleSettings {
  [key: string]: unknown;
}

export interface ModuleSettingsResponse {
  moduleId: string;
  settings: ModuleSettings;
}

export interface DisplaySettings {
  itemsPerPage?: number;
  defaultSort?: string;
  showInactive?: boolean;
  showArchived?: boolean;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface ValidationRules {
  minNameLength?: number;
  maxNameLength?: number;
  minTitleLength?: number;
  maxTitleLength?: number;
  requiredFields?: string[];
}

export interface DefaultValues {
  status?: string;
  priority?: string;
  type?: string;
}

export interface SMTPSettings {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  password: string;
  from?: string;
}

export interface TelegramSettings {
  botToken: string;
  enabled: boolean;
}

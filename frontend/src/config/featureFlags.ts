export type FeatureFlagKey =
  | "dashboard"
  | "contractors"
  | "projects"
  | "contracts"
  | "tasks"
  | "mail"
  | "documents"
  | "lawyers"
  | "calendar"
  | "finance"
  | "settings"
  | "profile"
  | "workflows"
  | "marketing"
  | "reports"
  | "products"
  | "templates"
  | "warehouse"
  | "services"
  | "price_lists"
  | "quotes"
  | "trash";

const toBool = (value: string | undefined, defaultValue = true): boolean => {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
};

export const featureFlags: Record<FeatureFlagKey, boolean> = {
  dashboard: toBool(import.meta.env.VITE_FEATURE_DASHBOARD, true),
  contractors: toBool(import.meta.env.VITE_FEATURE_CONTRACTORS, true),
  projects: toBool(import.meta.env.VITE_FEATURE_PROJECTS, true),
  contracts: toBool(import.meta.env.VITE_FEATURE_CONTRACTS, true),
  tasks: toBool(import.meta.env.VITE_FEATURE_TASKS, true),
  mail: toBool(import.meta.env.VITE_FEATURE_MAIL, true),
  documents: toBool(import.meta.env.VITE_FEATURE_DOCUMENTS, true),
  lawyers: toBool(import.meta.env.VITE_FEATURE_LAWYERS, true),
  calendar: toBool(import.meta.env.VITE_FEATURE_CALENDAR, true),
  finance: toBool(import.meta.env.VITE_FEATURE_FINANCE, true),
  settings: toBool(import.meta.env.VITE_FEATURE_SETTINGS, true),
  profile: toBool(import.meta.env.VITE_FEATURE_PROFILE, true),
  workflows: toBool(import.meta.env.VITE_FEATURE_WORKFLOWS, true),
  marketing: toBool(import.meta.env.VITE_FEATURE_MARKETING, true),
  reports: toBool(import.meta.env.VITE_FEATURE_REPORTS, true),
  products: toBool(import.meta.env.VITE_FEATURE_PRODUCTS, true),
  templates: toBool(import.meta.env.VITE_FEATURE_TEMPLATES, true),
  warehouse: toBool(import.meta.env.VITE_FEATURE_WAREHOUSE, true),
  services: toBool(import.meta.env.VITE_FEATURE_SERVICES, true),
  price_lists: toBool(import.meta.env.VITE_FEATURE_PRICE_LISTS, true),
  quotes: toBool(import.meta.env.VITE_FEATURE_QUOTES, true),
  trash: toBool(import.meta.env.VITE_FEATURE_TRASH, true),
};

export const isFeatureEnabled = (feature: FeatureFlagKey): boolean => featureFlags[feature];

import type { ReactNode } from "react";
import type { FeatureFlagKey } from "@/config/featureFlags";
import type { LucideIcon } from "lucide-react";

export interface ModuleNavigationItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  order: number;
  featureFlag?: FeatureFlagKey;
}

export interface ModuleQuickActionSeed {
  id: string;
  name: string;
  icon: string;
  action: string;
  displayOrder: number;
}

export interface ModuleReferenceSeed {
  id: string;
  name: string;
  icon: string;
  displayOrder: number;
  quickActions?: ModuleQuickActionSeed[];
}

export interface ModuleRouteItem {
  path: string;
  titleKey: string;
  featureFlag: FeatureFlagKey;
  element: ReactNode;
}

export interface ModuleManifest {
  id: string;
  route: ModuleRouteItem;
  navigation?: ModuleNavigationItem;
  settingsModuleId?: string;
  quickActionsModuleId?: string;
  i18nNamespaces?: string[];
  reference?: ModuleReferenceSeed;
}

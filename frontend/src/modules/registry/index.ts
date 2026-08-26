import { moduleManifests } from "./manifests";
import type {
  ModuleManifest,
  ModuleNavigationItem,
  ModuleReferenceSeed,
  ModuleRouteItem,
} from "./types";

export type { ModuleManifest, ModuleNavigationItem, ModuleRouteItem } from "./types";

const byOrder = (a: ModuleNavigationItem, b: ModuleNavigationItem) => a.order - b.order;

export const getModuleManifests = (): ModuleManifest[] => moduleManifests;

export const getModuleRoutes = (): ModuleRouteItem[] =>
  moduleManifests.map(manifest => manifest.route);

export const getModuleNavigation = (): ModuleNavigationItem[] =>
  moduleManifests
    .filter(manifest => !!manifest.navigation)
    .map(manifest => ({
      ...(manifest.navigation as Omit<ModuleNavigationItem, "featureFlag">),
      featureFlag: manifest.route.featureFlag,
    }))
    .sort(byOrder);

export const getModuleReferenceSeeds = (): ModuleReferenceSeed[] =>
  moduleManifests
    .filter(manifest => !!manifest.reference)
    .map(manifest => manifest.reference as ModuleReferenceSeed)
    .sort((a, b) => a.displayOrder - b.displayOrder);

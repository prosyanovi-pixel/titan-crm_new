import { lazy } from 'react';
import {
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Scale,
  Settings,
  Users,
  Wallet,
  Network,
  File,
  BarChart2,
  Megaphone,
  Trash2,
  Inbox,
} from "lucide-react";
const DashboardPage = lazy(() => import("@/modules/dashboard").then(m => ({ default: m.DashboardPage })));
const ContractorsPage = lazy(() => import("@/modules/contractors").then(m => ({ default: m.ContractorsPage })));
const ProjectsPage = lazy(() => import("@/modules/projects").then(m => ({ default: m.ProjectsPage })));
const LawyersPage = lazy(() => import("@/modules/lawyers").then(m => ({ default: m.LawyersPage })));
const TasksPage = lazy(() => import("@/modules/tasks").then(m => ({ default: m.TasksPage })));
const MailPage = lazy(() => import("@/modules/mail").then(m => ({ default: m.MailPage })));
const DocumentsPage = lazy(() => import("@/modules/documents").then(m => ({ default: m.DocumentsPage })));
const CalendarPage = lazy(() => import("@/modules/calendar").then(m => ({ default: m.CalendarPage })));
const FinancePage = lazy(() => import("@/modules/finance").then(m => ({ default: m.FinancePage })));
const SettingsPage = lazy(() => import("@/modules/settings").then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import("@/modules/profile").then(m => ({ default: m.ProfilePage })));
const WorkflowsPage = lazy(() => import("@/modules/workflow").then(m => ({ default: m.WorkflowsPage })));
const ContractsPage = lazy(() => import("@/modules/contracts/pages/ContractsPage"));
const ReportsRouter = lazy(() => import("@/modules/reports").then(m => ({ default: m.ReportsRouter })));
const MarketingPage = lazy(() => import("@/modules/marketing").then(m => ({ default: m.MarketingPage })));
const TrashPage = lazy(() => import("@/modules/trash").then(m => ({ default: m.TrashPage })));
import type { ModuleManifest } from "./types";

import { SalesPipelinePage } from "../sales/pages/SalesPipelinePage";
import { getModuleReferenceSeed } from "./referenceSeeds";
import { PackageSearch, FileType, Warehouse } from "lucide-react";
const ProductsPage = lazy(() => import("@/modules/products/pages/ProductsPage").then(m => ({ default: m.ProductsPage })));
const TemplatesPage = lazy(() => import("@/modules/templates").then(m => ({ default: m.TemplatesPage })));
const WarehousePage = lazy(() => import("@/modules/warehouse").then(m => ({ default: m.WarehousePage })));
const ServicesPage = lazy(() => import("@/modules/services").then(m => ({ default: m.ServicesPage })));
const PriceListsPage = lazy(() => import("@/modules/price_lists").then(m => ({ default: m.PriceListsPage })));
const QuotesPage = lazy(() => import("@/modules/quotes/pages/QuotesPage").then(m => ({ default: m.QuotesPage })));
const QuoteDetailPage = lazy(() => import("@/modules/quotes/pages/QuoteDetailPage").then(m => ({ default: m.QuoteDetailPage })));
import { Briefcase, FileSpreadsheet } from "lucide-react";

export const moduleManifests: ModuleManifest[] = [
  {
    id: "dashboard",
    route: {
      path: "/",
      titleKey: "sidebar.dashboard",
      featureFlag: "dashboard",
      element: <DashboardPage />,
    },
    navigation: {
      href: "/",
      labelKey: "sidebar.dashboard",
      icon: LayoutDashboard,
      order: 10,
    },
    reference: getModuleReferenceSeed("dashboard"),
  },
  {
    id: "contractors",
    route: {
      path: "/contractors",
      titleKey: "sidebar.contractors",
      featureFlag: "contractors",
      element: <ContractorsPage />,
    },
    navigation: {
      href: "/contractors",
      labelKey: "sidebar.contractors",
      icon: Users,
      order: 20,
    },
    settingsModuleId: "contractors",
    quickActionsModuleId: "contractors",
    reference: getModuleReferenceSeed("contractors"),
  },
  {
    id: "projects",
    route: {
      path: "/projects",
      titleKey: "sidebar.projects",
      featureFlag: "projects",
      element: <ProjectsPage />,
    },
    navigation: {
      href: "/projects",
      labelKey: "sidebar.projects",
      icon: FolderKanban,
      order: 30,
    },
    settingsModuleId: "projects",
    quickActionsModuleId: "projects",
    reference: getModuleReferenceSeed("projects"),
  },
  {
    id: "sales",
    route: {
      path: "/sales",
      titleKey: "sidebar.sales",
      featureFlag: "projects",
      element: <SalesPipelinePage />,
    },
    navigation: {
      href: "/sales",
      labelKey: "sidebar.sales",
      icon: FolderKanban,
      order: 32,
    },
    settingsModuleId: "projects",
    quickActionsModuleId: "projects",
    reference: getModuleReferenceSeed("projects"),
  },
  {
    id: "contracts",
    route: {
      path: "/contracts/*",
      titleKey: "sidebar.contracts",
      featureFlag: "contracts",
      element: <ContractsPage />,
    },
    navigation: {
      href: "/contracts",
      labelKey: "sidebar.contracts",
      icon: File,
      order: 35,
    },
    settingsModuleId: "contracts",
    quickActionsModuleId: "contracts",
    reference: getModuleReferenceSeed("contracts"),
  },
  {
    id: "mail",
    route: {
      path: "/mail",
      titleKey: "sidebar.mail",
      featureFlag: "mail",
      element: <MailPage />,
    },
    navigation: {
      href: "/mail",
      labelKey: "sidebar.mail",
      icon: Inbox,
      order: 40,
    },
    settingsModuleId: "mail",
    quickActionsModuleId: "mail",
    reference: getModuleReferenceSeed("mail"),
  },
  {
    id: "documents",
    route: {
      path: "/documents",
      titleKey: "sidebar.documents",
      featureFlag: "documents",
      element: <DocumentsPage />,
    },
    navigation: {
      href: "/documents",
      labelKey: "sidebar.documents",
      icon: FileText,
      order: 50,
    },
    settingsModuleId: "documents",
    quickActionsModuleId: "documents",
    reference: getModuleReferenceSeed("documents"),
  },
  {
    id: "tasks",
    route: {
      path: "/tasks",
      titleKey: "sidebar.tasks",
      featureFlag: "tasks",
      element: <TasksPage />,
    },
    navigation: {
      href: "/tasks",
      labelKey: "sidebar.tasks",
      icon: CheckSquare,
      order: 60,
    },
    settingsModuleId: "tasks",
    quickActionsModuleId: "tasks",
    reference: getModuleReferenceSeed("tasks"),
  },
  {
    id: "calendar",
    route: {
      path: "/calendar",
      titleKey: "sidebar.calendar",
      featureFlag: "calendar",
      element: <CalendarPage />,
    },
    navigation: {
      href: "/calendar",
      labelKey: "sidebar.calendar",
      icon: Calendar,
      order: 70,
    },
    settingsModuleId: "calendar",
    quickActionsModuleId: "calendar",
    reference: getModuleReferenceSeed("calendar"),
  },
  {
    id: "lawyers",
    route: {
      path: "/lawyers",
      titleKey: "sidebar.lawyers",
      featureFlag: "lawyers",
      element: <LawyersPage />,
    },
    navigation: {
      href: "/lawyers",
      labelKey: "sidebar.lawyers",
      icon: Scale,
      order: 80,
    },
    settingsModuleId: "lawyers",
    quickActionsModuleId: "lawyers",
    reference: getModuleReferenceSeed("lawyers"),
  },
  {
    id: "finance",
    route: {
      path: "/finance",
      titleKey: "sidebar.finance",
      featureFlag: "finance",
      element: <FinancePage />,
    },
    navigation: {
      href: "/finance",
      labelKey: "sidebar.finance",
      icon: Wallet,
      order: 90,
    },
    settingsModuleId: "finance",
    quickActionsModuleId: "finance",
    reference: getModuleReferenceSeed("finance"),
  },
  {
    id: "reports",
    route: {
      path: "/reports/*",
      titleKey: "sidebar.reports",
      featureFlag: "reports",
      element: <ReportsRouter />,
    },
    navigation: {
      href: "/reports",
      labelKey: "sidebar.reports",
      icon: BarChart2,
      order: 95,
    },
    reference: getModuleReferenceSeed("reports"),
  },
  {
    id: "marketing",
    route: {
      path: "/marketing",
      titleKey: "sidebar.marketing",
      featureFlag: "marketing",
      element: <MarketingPage />,
    },
    navigation: {
      href: "/marketing",
      labelKey: "sidebar.marketing",
      icon: Megaphone,
      order: 96,
    },
    settingsModuleId: "marketing",
    quickActionsModuleId: "marketing",
    reference: getModuleReferenceSeed("marketing"),
  },
  {
    id: "settings",
    route: {
      path: "/settings",
      titleKey: "sidebar.settings",
      featureFlag: "settings",
      element: <SettingsPage />,
    },
    navigation: {
      href: "/settings",
      labelKey: "sidebar.settings",
      icon: Settings,
      order: 120,
    },
    settingsModuleId: "settings",
    reference: getModuleReferenceSeed("settings"),
  },
  {
    id: "profile",
    route: {
      path: "/profile",
      titleKey: "generated.profil",
      featureFlag: "profile",
      element: <ProfilePage />,
    },
    reference: getModuleReferenceSeed("profile"),
  },
  {
    id: "workflows",
    route: {
      path: "/workflows",
      titleKey: "sidebar.workflows",
      featureFlag: "workflows",
      element: <WorkflowsPage />,
    },
    navigation: {
      href: "/workflows",
      labelKey: "sidebar.workflows",
      icon: Network,
      order: 110,
    },
    reference: getModuleReferenceSeed("workflows"),
  },
  {
    id: "products",
    route: {
      path: "/products",
      titleKey: "sidebar.products",
      featureFlag: "products",
      element: <ProductsPage />,
    },
    navigation: {
      href: "/products",
      labelKey: "sidebar.products",
      icon: PackageSearch,
      order: 85,
    },
    settingsModuleId: "products",
    quickActionsModuleId: "products",
    reference: getModuleReferenceSeed("products"),
  },
  {
    id: "templates",
    route: {
      path: "/templates/*",
      titleKey: "sidebar.templates",
      featureFlag: "templates",
      element: <TemplatesPage />,
    },
    navigation: {
      href: "/templates",
      labelKey: "sidebar.templates",
      icon: FileType,
      order: 88,
    },
    settingsModuleId: "templates",
    quickActionsModuleId: "templates",
    reference: getModuleReferenceSeed("templates"),
  },
  {
    id: "warehouse",
    route: {
      path: "/warehouse/*",
      titleKey: "warehouse.title",
      featureFlag: "warehouse",
      element: <WarehousePage />,
    },
    navigation: {
      href: "/warehouse",
      labelKey: "warehouse.title",
      icon: Warehouse,
      order: 86,
    },
    settingsModuleId: "warehouse",
    quickActionsModuleId: "warehouse",
    reference: getModuleReferenceSeed("warehouse"),
  },
  {
    id: "services",
    route: {
      path: "/services",
      titleKey: "sidebar.services",
      featureFlag: "services",
      element: <ServicesPage />,
    },
    navigation: {
      href: "/services",
      labelKey: "sidebar.services",
      icon: Briefcase,
      order: 87,
    },
    settingsModuleId: "services",
    quickActionsModuleId: "services",
    reference: getModuleReferenceSeed("services"),
  },
  {
    id: "price_lists",
    route: {
      path: "/price-lists",
      titleKey: "price_lists.title",
      featureFlag: "price_lists",
      element: <PriceListsPage />,
    },
    navigation: {
      href: "/price-lists",
      labelKey: "price_lists.title",
      icon: FileSpreadsheet,
      order: 89,
    },
    settingsModuleId: "price_lists",
    quickActionsModuleId: "price_lists",
  },
  {
    id: "quotes",
    route: {
      path: "/quotes",
      titleKey: "quotes.title",
      featureFlag: "quotes",
      element: <QuotesPage />,
    },
    navigation: {
      href: "/quotes",
      labelKey: "quotes.title",
      icon: FileSpreadsheet,
      order: 91,
    },
    settingsModuleId: "quotes",
    quickActionsModuleId: "quotes",
  },
  {
    id: "quote-form",
    route: {
      path: "/quotes/:id",
      titleKey: "quotes.edit",
      featureFlag: "quotes",
      element: <QuoteDetailPage />,
    },
    settingsModuleId: "quotes"
  },
  {
    id: "trash",
    route: {
      path: "/trash",
      titleKey: "common.trash",
      featureFlag: "trash",
      element: <TrashPage />,
    },
    navigation: {
      href: "/trash",
      labelKey: "common.trash",
      icon: Trash2,
      order: 150,
    },
  },
];

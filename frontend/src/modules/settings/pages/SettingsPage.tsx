
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { usePageSettings } from "@/context/LayoutContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  StatusEditor,
  TagEditor,
  RelationshipTypeEditor,
  LegalFormEditor,
  PriorityEditor,
  QuickActionEditor,
  UserEditor,
  RoleEditor,
  PermissionEditor,
  IntegrationsEditor,
  NumberingEditor,
  CompanyProfileEditor,
  CurrencyEditor,
  CompanyAccountEditor,
  PositionEditor,
  DepartmentEditor,
  EmployeeEditor,
  SystemEditor,
  UsersTab,
  ModuleSettingsEditor,
  FinanceTaxSettings,
  FinanceCategoriesSettings,
  CalendarSettingsPanel,
  EventTypesPanel,
  ContractorsSettingsTab,
  ContractsSettingsTab,
  ReportsSettingsTab,
  ProjectStageEditor,
  MarketingStatusEditor,
  MarketingTypeEditor,
  TypesEditor,
  TabsEditor,
  AiSettingsEditor,
} from "../components";
import { BulkEditSettingsEditor } from "@/components/settings/BulkEditSettingsEditor";
import { OutcomeEditor } from "../components";
import { useSettings } from "@/hooks/use-settings";
import { ModuleItem } from "../types";
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ModulesMarketplace } from '../components/ModulesMarketplace';
import * as LucideIcons from 'lucide-react';
import {
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  FileSignature,
  Mail,
  Scale,
  Gavel,
  Calendar,
  Shield,
  UserCog,
  Key,
  Search,
  Layout,
  Briefcase,
  Globe,
  Hash,
  Building2,
  Landmark,
  Coins,
  Network,
  UsersRound,
  ServerCog,
  ChevronLeft,
  Warehouse,
  Package,
  Wrench,
  PackageSearch,
  Sparkles,
  Tag,
  Zap,
  Settings2,
  SlidersHorizontal,
  Layers,
  CalendarDays,
  Gift,
  Target,
} from 'lucide-react';

type ModuleTabId = 'statuses' | 'tags' | 'relationships' | 'priorities' | 'project_stages' | 'actions' | 'legal_forms' | 'params' | 'outcomes' | 'bulk_edit' | 'tax' | 'categories' | 'birthday_settings' | 'event_types' | 'marketing_statuses' | 'marketing_types' | 'types' | 'tabs';

const MODULE_TABS_CONFIG: Record<string, ModuleTabId[]> = {
  contractors: ['statuses', 'tags', 'relationships', 'priorities', 'actions', 'legal_forms', 'params', 'bulk_edit'],
  projects:    ['statuses', 'project_stages', 'tags', 'priorities', 'actions', 'params', 'bulk_edit'],
  tasks:       ['statuses', 'tags', 'priorities', 'actions', 'params', 'bulk_edit'],
  documents:   ['statuses', 'tags', 'actions', 'params', 'bulk_edit'],
  mail:        ['statuses', 'tags', 'actions', 'params', 'bulk_edit'],
  lawyers:     ['statuses', 'tags', 'priorities', 'actions', 'outcomes', 'params', 'bulk_edit'],
  calendar:    ['event_types', 'birthday_settings', 'statuses', 'tags', 'priorities', 'actions', 'params', 'bulk_edit'],
  finance:     ['statuses', 'tags', 'priorities', 'actions', 'categories', 'tax', 'params', 'bulk_edit'],
  cases:       ['statuses', 'tags', 'priorities', 'actions', 'params', 'bulk_edit'],
  contracts:   ['statuses', 'tags', 'actions', 'params', 'bulk_edit'],
  reports:     ['params', 'statuses', 'tags'],
  marketing:   ['marketing_statuses', 'marketing_types', 'tags', 'actions', 'params', 'bulk_edit'],
  workflows:   ['params', 'bulk_edit'],
  warehouse:   ['statuses', 'tags', 'actions', 'params', 'bulk_edit'],
  products:    ['types', 'tabs', 'statuses', 'tags', 'actions', 'params', 'bulk_edit'],
  services:    ['types', 'tabs', 'statuses', 'tags', 'actions', 'params', 'bulk_edit'],
  price_lists: ['statuses', 'tags', 'actions', 'params', 'bulk_edit'],
};

const DEFAULT_MODULE_TABS: ModuleTabId[] = ['statuses', 'tags', 'actions', 'params', 'bulk_edit'];

const getDynamicIcon = (iconName: string, FallbackIcon: React.ElementType = Layout) => {
  return (LucideIcons as any)[iconName] || FallbackIcon;
};

type SettingSection = 'users' | 'roles' | 'permissions' | 'integrations' | string;

export default function Settings() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingSection>(searchParams.get('section') || 'system');
  const [mobileContentVisible, setMobileContentVisible] = useState(false);

  // Синхронизация URL с активным разделом
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && section !== activeSection) {
      const timer = setTimeout(() => {
        setActiveSection(section);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, activeSection]);

  const handleSelectSection = (id: string) => {
    setActiveSection(id);
    setMobileContentVisible(true);
    // Обновляем URL без перезагрузки страницы
    setSearchParams((prev) => {
      prev.set('section', id);
      prev.delete('tab'); // Сбрасываем вкладку при смене раздела
      return prev;
    });
  };

  const handleMobileBack = () => {
    setMobileContentVisible(false);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const { data: modules = [], isLoading: loading } = useQuery({
    queryKey: ['settings-references-modules'],
    queryFn: async () => {
      try {
        const data = await api.get('/references');
        return data.modules || [];
      } catch (error) {
        console.error('Failed to load references:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    relationshipTypes,
    legalForms,
    addItem,
    updateItem,
    deleteItem,
    quickActions,
    allQuickActions,
    saveQuickActions,
  } = useSettings() as Record<string, unknown> & ReturnType<typeof useSettings>;
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen for references updates from useSettings and force re-render
    const onReferencesUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['settings-references-modules'] });
    };
    window.addEventListener('references:updated', onReferencesUpdated);
    return () => window.removeEventListener('references:updated', onReferencesUpdated);
  }, [queryClient]);

  const menuItems = useMemo(() => {
    const items = [
      {
        category: t('settings.categories.company'),
        items: [
          { id: 'company-profile', label: t('settings.section.company_profile'), icon: Building2 },
          { id: 'company-accounts', label: t('settings.section.company_accounts'), icon: Landmark },
          { id: 'currencies', label: t('settings.section.currencies'), icon: Coins },
        ]
      },
      {
        category: t('settings.categories.hr'),
        items: [
          { id: 'employees', label: t('settings.section.employees'), icon: UsersRound },
          { id: 'positions', label: t('settings.section.positions'), icon: Briefcase },
          { id: 'departments', label: t('settings.section.departments'), icon: Network },
        ]
      },
      {
        category: t('settings.categories.access'),
        items: [
          { id: 'users', label: t('settings.section.users'), icon: Users },
          { id: 'roles', label: t('settings.section.roles'), icon: Shield },
          { id: 'permissions', label: t('settings.section.permissions'), icon: Key },
        ]
      },
      {
        category: t('settings.categories.integrations'),
        items: [
          { id: 'integrations', label: t('settings.section.integrations'), icon: Globe },
          { id: 'numbering', label: t('settings.section.numbering'), icon: Hash },
        ]
      },
      {
        category: t('settings.categories.system'),
        items: [
          { id: 'system', label: t('settings.section.system_admin'), icon: ServerCog },
          { id: 'marketplace', label: t('settings.section.marketplace') /* 'Маркетплейс' */, icon: PackageSearch },
        ]
      },
      {
        category: t('settings.categories.modules'),
        items: modules.map(m => ({
          id: m.id,
          label: t(`settings.modules.${m.id}`),
          icon: getDynamicIcon(m.icon, Layout)
        }))
      }
    ];

    // Filter out empty groups only when searching
    if (searchQuery) {
      const filteredItems = items.map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(group => group.items.length > 0);
      return filteredItems;
    }
    
    // When not searching, return all items except empty module groups
    return items.filter(group => {
      if (group.category === t('settings.categories.modules')) {
        return modules.length > 0; // Only show modules category if there are modules
      }
      return true; // Always show other categories
    });

  }, [modules, searchQuery, t]);

  const activeModule = modules.find(m => m.id === activeSection);
  const isModuleSettings = !!activeModule;

  const renderContent = () => {
    // Компания
    if (activeSection === 'company-profile') return <CompanyProfileEditor />;
    if (activeSection === 'company-accounts') return <CompanyAccountEditor />;
    if (activeSection === 'currencies') return <CurrencyEditor />;
    // HR
    if (activeSection === 'employees') return <EmployeeEditor />;
    if (activeSection === 'positions') return <PositionEditor />;
    if (activeSection === 'departments') return <DepartmentEditor />;
    // Users & Access
    if (activeSection === 'users') return <UserEditor selectedModule="users" />;
    if (activeSection === 'roles') return <RoleEditor />;
    if (activeSection === 'permissions') return <PermissionEditor selectedModule="permissions" />;
    if (activeSection === 'integrations') return <IntegrationsEditor />;
    if (activeSection === 'numbering') return <NumberingEditor modules={modules} />;
    if (activeSection === 'ai') return <AiSettingsEditor />;
    
    // System
    if (activeSection === 'system') return <SystemEditor />;
    if (activeSection === 'marketplace') return <ModulesMarketplace />;

    if (activeSection === 'contractors') return <ContractorsSettingsTab />;
    if (activeSection === 'contracts') return <ContractsSettingsTab />;
    if (activeSection === 'reports') return <ReportsSettingsTab />;


    if (isModuleSettings) {
      const tabs = MODULE_TABS_CONFIG[activeSection] ?? DEFAULT_MODULE_TABS;

      const TAB_LABELS: Record<ModuleTabId, string> = {
        statuses:      t('settings.tabs.statuses'),
        tags:          t('settings.tabs.tags'),
        relationships: t('settings.tabs.relationships'),
        priorities:    t('settings.tabs.priorities'),
        project_stages: t('settings.project_stages.title'),
        actions:       t('settings.tabs.actions'),
        legal_forms:   t('settings.tabs.legal_forms'),
        params:        t('settings.tabs.params'),
        outcomes:      t('settings.tabs.outcomes'),
        bulk_edit:     t('settings.tabs.bulk_edit'),
        tax:           t('settings.tabs.tax'),
        categories:    t('settings.tabs.categories'),
        event_types:   t('settings.tabs.event_types'),
        birthday_settings: t('settings.tabs.birthday_settings'),
        marketing_statuses: t('marketing.settings.statuses'),
        marketing_types: t('marketing.settings.types'),
        types:         t('settings.tabs.types'),
        tabs:          t('settings.tabs.tabs'),
      };

      const TAB_ICONS: Record<string, React.ElementType> = {
        statuses: Users, // Using a fallback, or we can use specific ones if we map them better. Actually let's map them explicitly:
        tags: Tag,
        relationships: Users,
        priorities: Target,
        project_stages: Layers,
        actions: Zap,
        legal_forms: Scale,
        params: Settings2,
        outcomes: Target,
        bulk_edit: SlidersHorizontal,
        tax: Coins,
        categories: FolderKanban,
        event_types: Calendar,
        birthday_settings: Gift,
        marketing_statuses: Users,
        marketing_types: Layers,
        types: Layers,
        tabs: Layout,
      };

      const activeTab = searchParams.get('tab') || tabs[0];

      const handleTabChange = (val: string) => {
        setSearchParams((prev) => {
          prev.set('tab', val);
          return prev;
        });
      };

      return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 border border-border/50 p-1 rounded-lg mb-6 justify-start">
            {tabs.map(tab => {
              const Icon = TAB_ICONS[tab] || Settings2;
              return (
                <TabsTrigger key={tab} value={tab} className="gap-2">
                  <Icon className="w-4 h-4" />
                  {TAB_LABELS[tab]}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.includes('statuses') && (
            <TabsContent value="statuses" className="mt-0">
              <StatusEditor
                selectedModule={activeSection}
                modules={modules}
              />
            </TabsContent>
          )}

          {tabs.includes('tags') && (
            <TabsContent value="tags" className="mt-0">
              <TagEditor
                selectedModule={activeSection}
                modules={modules}
              />
            </TabsContent>
          )}

          {tabs.includes('relationships') && (
            <TabsContent value="relationships" className="mt-0">
              <RelationshipTypeEditor
                relationshipTypes={relationshipTypes}
                onAdd={(item) => addItem('relationshipType', item as unknown as Record<string, unknown>)}
                onUpdate={(item) => updateItem('relationshipType', item as unknown as Record<string, unknown>)}
                onDelete={(id, module) => deleteItem('relationshipType', id, module)}
                selectedModule={activeSection}
                modules={modules}
              />
            </TabsContent>
          )}

          {tabs.includes('priorities') && (
            <TabsContent value="priorities" className="mt-0">
              <PriorityEditor
                selectedModule={activeSection}
                modules={modules}
              />
            </TabsContent>
          )}

          {tabs.includes('project_stages') && (
            <TabsContent value="project_stages" className="mt-0">
              <ProjectStageEditor />
            </TabsContent>
          )}

          {tabs.includes('actions') && (
            <TabsContent value="actions" className="mt-0 space-y-6">
              <ModuleSettingsEditor
                moduleId={activeSection}
                moduleName={activeModule?.name ?? activeSection}
                showActionsOnly={true}
              />
              <QuickActionEditor
                quickActions={quickActions}
                onSave={saveQuickActions}
                selectedModule={activeSection}
                modules={modules}
              />
            </TabsContent>
          )}

          {tabs.includes('legal_forms') && (
            <TabsContent value="legal_forms" className="mt-0">
              <LegalFormEditor
                legalForms={legalForms}
              />
            </TabsContent>
          )}

          {tabs.includes('outcomes') && (
            <TabsContent value="outcomes" className="mt-0">
              <OutcomeEditor />
            </TabsContent>
          )}

          {tabs.includes('params') && (
            <TabsContent value="params" className="mt-0">
              <ModuleSettingsEditor
                moduleId={activeSection}
                moduleName={activeModule?.name ?? activeSection}
              />
            </TabsContent>
          )}

          {tabs.includes('bulk_edit') && (
            <TabsContent value="bulk_edit" className="mt-0">
              <BulkEditSettingsEditor
                moduleId={activeSection}
                moduleName={activeModule?.name ?? activeSection}
              />
            </TabsContent>
          )}

          {tabs.includes('tax') && (
            <TabsContent value="tax" className="mt-0">
              <FinanceTaxSettings />
            </TabsContent>
          )}

          {tabs.includes('categories') && (
            <TabsContent value="categories" className="mt-0">
              <FinanceCategoriesSettings />
            </TabsContent>
          )}

          {tabs.includes('event_types') && (
            <TabsContent value="event_types" className="mt-0">
              <EventTypesPanel />
            </TabsContent>
          )}

          {tabs.includes('birthday_settings') && (
            <TabsContent value="birthday_settings" className="mt-0">
              <CalendarSettingsPanel />
            </TabsContent>
          )}

          {tabs.includes('marketing_statuses') && (
            <TabsContent value="marketing_statuses" className="mt-0">
              <MarketingStatusEditor />
            </TabsContent>
          )}

          {tabs.includes('marketing_types') && (
            <TabsContent value="marketing_types" className="mt-0">
              <MarketingTypeEditor />
            </TabsContent>
          )}
          
          {tabs.includes('types') && (
            <TabsContent value="types" className="mt-0">
              <TypesEditor selectedModule={activeSection} modules={modules} />
            </TabsContent>
          )}

          {tabs.includes('tabs') && (
            <TabsContent value="tabs" className="mt-0">
              <TabsEditor selectedModule={activeSection} modules={modules} />
            </TabsContent>
          )}
        </Tabs>
      );
    }

    return <div>Select a setting</div>;
  };

  const getPageHeader = () => {
    if (activeSection === 'company-profile') return { title: t('settings.company.profile.title'), desc: t('settings.company.profile.description'), icon: Building2 };
    if (activeSection === 'company-accounts') return { title: t('settings.company.accounts.title'), desc: t('settings.company.accounts.description'), icon: Landmark };
    if (activeSection === 'currencies') return { title: t('settings.currencies.title'), desc: t('settings.currencies.description'), icon: Coins };
    if (activeSection === 'employees') return { title: t('settings.employees.title'), desc: t('settings.employees.description'), icon: UsersRound };
    if (activeSection === 'positions') return { title: t('settings.positions.title'), desc: t('settings.positions.description'), icon: Briefcase };
    if (activeSection === 'departments') return { title: t('settings.departments.title'), desc: t('settings.departments.description'), icon: Network };
    if (activeSection === 'users') return { title: t('settings.users.title'), desc: t('settings.users.description'), icon: Users };
    if (activeSection === 'roles') return { title: t('settings.roles.title'), desc: t('settings.roles.description'), icon: Shield };
    if (activeSection === 'permissions') return { title: t('settings.permissions.title'), desc: t('settings.permissions.description'), icon: Key };
    if (activeSection === 'integrations') return { title: t('settings.integrations.title'), desc: t('settings.integrations.description'), icon: Globe };
    if (activeSection === 'numbering') return { title: t('settings.numbering.title'), desc: t('settings.numbering.description'), icon: Hash };
    if (activeSection === 'ai') return { title: t('settings.ai.title'), desc: t('settings.ai.description'), icon: Sparkles };
    if (activeSection === 'system') return { title: t('settings.system.title'), desc: t('settings.system.description'), icon: ServerCog };
    
    if (activeModule) {
      const Icon = getDynamicIcon(activeModule.icon, Layout);
      return { 
        title: t(`settings.modules.${activeModule.id}`), 
        desc: t('settings.select_module.description'),
        icon: Icon
      };
    }
    return { title: t('settings.title'), desc: '', icon: Layout };
  };

  const headerInfo = getPageHeader();
  const HeaderIcon = headerInfo.icon;

  usePageSettings({
    title: t('settings.title'),
    subtitle: t('settings.subtitle'),
    breadcrumbs: [{ label: t('settings.breadcrumb') }]
  });

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        
        {/* Settings Sidebar */}
        <Card className={cn(
          "w-full lg:w-64 flex flex-col h-full overflow-hidden border-r-0 lg:border-r bg-card/50",
          mobileContentVisible ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('settings.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 space-y-4">
              {menuItems.map((group, i) => (
                <div key={i}>
                  <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.category}
                  </h4>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectSection(item.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {modules.length === 0 && (
                <div className="text-sm text-muted-foreground p-3">
                  {t('generated.zagruzka_moduley')}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Settings Content Area */}
        <div className={cn(
          "flex-1 min-w-0 overflow-y-auto pb-10",
          mobileContentVisible ? "block" : "hidden lg:block"
        )}>
          {/* Mobile back button */}
          <button
            onClick={handleMobileBack}
            className="lg:hidden flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('settings.title')}
          </button>
          <Card className="min-h-full">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <HeaderIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{headerInfo.title}</CardTitle>
                  <CardDescription>{headerInfo.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {renderContent()}
            </CardContent>
          </Card>
        </div>

      </div>
    </>
  );
}

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  StatusEditor,
  RelationshipTypeEditor,
  PositionEditor,
  LegalFormEditor,
  TagEditor,
  QuickActionEditor
} from '../components';
import { useSettings } from '@/hooks/use-settings';
import {
  Users,
  UserCheck,
  Briefcase,
  Scale,
  Tag,
  Settings2,
  Users2
} from 'lucide-react';
import { ModuleSettingsEditor } from './ModuleSettingsEditor';
import { BulkEditSettingsEditor } from '@/components/settings/BulkEditSettingsEditor';

export function ContractorsSettingsTab() {
  const { t } = useTranslation();
  const {
    relationshipTypes,
    legalForms,
    modules,
    addItem,
    updateItem,
    deleteItem,
    refresh,
    quickActions,
    allQuickActions,
    saveQuickActions
  } = useSettings() as any;

  return (
    <Tabs defaultValue="statuses" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg mb-6 justify-start border border-border/50">
        <TabsTrigger value="statuses" className="gap-2">
          <Users className="w-4 h-4" />
          {t('settings.tabs.statuses')}
        </TabsTrigger>
        <TabsTrigger value="relationships" className="gap-2">
          <UserCheck className="w-4 h-4" />
          {t('settings.tabs.relationships')}
        </TabsTrigger>
        <TabsTrigger value="positions" className="gap-2">
          <Briefcase className="w-4 h-4" />
          {t('settings.section.positions')}
        </TabsTrigger>
        <TabsTrigger value="legal_forms" className="gap-2">
          <Scale className="w-4 h-4" />
          {t('settings.tabs.legal_forms')}
        </TabsTrigger>
        <TabsTrigger value="tags" className="gap-2">
          <Tag className="w-4 h-4" />
          {t('settings.tabs.tags')}
        </TabsTrigger>
        <TabsTrigger value="params" className="gap-2">
          <Settings2 className="w-4 h-4" />
          {t('settings.tabs.params')}
        </TabsTrigger>
        <TabsTrigger value="actions" className="gap-2">
          <Settings2 className="w-4 h-4" />
          {t('settings.tabs.actions')}
        </TabsTrigger>
        <TabsTrigger value="bulk_edit" className="gap-2">
          <Users2 className="w-4 h-4" />
          {t('settings.tabs.bulk_edit')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="statuses" className="mt-0">
        <StatusEditor selectedModule="contractors" modules={modules} />
      </TabsContent>

      <TabsContent value="relationships" className="mt-0">
        <RelationshipTypeEditor
          relationshipTypes={relationshipTypes}
          onAdd={(item) => addItem('relationship_type', item)}
          onUpdate={(item) => updateItem('relationship_type', item)}
          onDelete={(id, module) => deleteItem('relationship_type', id, module)}
          selectedModule="contractors"
          modules={modules}
        />
      </TabsContent>

      <TabsContent value="positions" className="mt-0">
        <PositionEditor />
      </TabsContent>

      <TabsContent value="legal_forms" className="mt-0">
        <LegalFormEditor
          legalForms={legalForms}
          onRefresh={refresh}
        />
      </TabsContent>

      <TabsContent value="tags" className="mt-0">
        <TagEditor selectedModule="contractors" modules={modules} />
      </TabsContent>

      <TabsContent value="params" className="mt-0">
        <ModuleSettingsEditor
          moduleId="contractors"
          moduleName={t('sidebar.contractors')}
        />
      </TabsContent>

      <TabsContent value="actions" className="mt-0 space-y-6">
        <ModuleSettingsEditor
          moduleId="contractors"
          moduleName={t('sidebar.contractors')}
          showActionsOnly={true}
        />
        <QuickActionEditor
          quickActions={allQuickActions}
          onSave={saveQuickActions}
          selectedModule="contractors"
          modules={modules}
        />
      </TabsContent>

      <TabsContent value="bulk_edit" className="mt-0">
        <BulkEditSettingsEditor
          moduleId="contractors"
          moduleName={t('sidebar.contractors')}
        />
      </TabsContent>
    </Tabs>
  );
}

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  StatusEditor, 
  TagEditor,
  QuickActionEditor,
  ModuleSettingsEditor
} from '../components';
import { BulkEditSettingsEditor } from '@/components/settings/BulkEditSettingsEditor';
import { useSettings } from '@/hooks/use-settings';
import { 
  FileSignature,
  Coins,
  Tag,
  Zap,
  Settings2,
  SlidersHorizontal
} from 'lucide-react';

export function ContractsSettingsTab() {
  const { t } = useTranslation();
  const { 
    modules,
    quickActions,
    saveQuickActions
  } = useSettings() as any;

  return (
    <Tabs defaultValue="statuses" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg mb-6 justify-start border border-border/50">
        <TabsTrigger value="statuses" className="gap-2">
          <FileSignature className="w-4 h-4" />
          {t('settings.tabs.statuses')}
        </TabsTrigger>
        <TabsTrigger value="payment_statuses" className="gap-2">
          <Coins className="w-4 h-4" />
          {t('settings.tabs.payment_statuses')}
        </TabsTrigger>
        <TabsTrigger value="tags" className="gap-2">
          <Tag className="w-4 h-4" />
          {t('settings.tabs.tags')}
        </TabsTrigger>
        <TabsTrigger value="actions" className="gap-2">
          <Zap className="w-4 h-4" />
          {t('settings.tabs.actions')}
        </TabsTrigger>
        <TabsTrigger value="params" className="gap-2">
          <Settings2 className="w-4 h-4" />
          {t('settings.tabs.params')}
        </TabsTrigger>
        <TabsTrigger value="bulk_edit" className="gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          {t('settings.tabs.bulk_edit')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="statuses" className="mt-0">
        <StatusEditor selectedModule="contracts" modules={modules} />
      </TabsContent>

      <TabsContent value="payment_statuses" className="mt-0">
        <StatusEditor selectedModule="contracts_payment" modules={modules} />
      </TabsContent>

      <TabsContent value="tags" className="mt-0">
        <TagEditor selectedModule="contracts" modules={modules} />
      </TabsContent>

      <TabsContent value="actions" className="mt-0">
        <QuickActionEditor
          quickActions={quickActions}
          onSave={saveQuickActions}
          selectedModule="contracts"
          modules={modules}
        />
      </TabsContent>

      <TabsContent value="params" className="mt-0">
        <ModuleSettingsEditor 
          moduleId="contracts" 
          moduleName={t('sidebar.contracts')} 
        />
      </TabsContent>

      <TabsContent value="bulk_edit" className="mt-0">
        <BulkEditSettingsEditor 
          moduleId="contracts" 
          moduleName={t('sidebar.contracts')} 
        />
      </TabsContent>
    </Tabs>
  );
}

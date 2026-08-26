import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  StatusEditor, 
  TagEditor,
  ModuleSettingsEditor
} from '../components';
import { 
  BarChart2,
  Tag,
  Settings2
} from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';

export function ReportsSettingsTab() {
  const { t } = useTranslation();
  const { modules } = useSettings() as any;

  return (
    <Tabs defaultValue="params" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg mb-6 justify-start border border-border/50">
        <TabsTrigger value="params" className="gap-2">
          <Settings2 className="w-4 h-4" />
          {t('settings.tabs.params')}
        </TabsTrigger>
        <TabsTrigger value="statuses" className="gap-2">
          <BarChart2 className="w-4 h-4" />
          {t('settings.tabs.statuses')}
        </TabsTrigger>
        <TabsTrigger value="tags" className="gap-2">
          <Tag className="w-4 h-4" />
          {t('settings.tabs.tags')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="params" className="mt-0">
        <ModuleSettingsEditor 
          moduleId="reports" 
          moduleName={t('sidebar.reports')} 
        />
      </TabsContent>

      <TabsContent value="statuses" className="mt-0">
        <StatusEditor selectedModule="reports" modules={modules} />
      </TabsContent>

      <TabsContent value="tags" className="mt-0">
        <TagEditor selectedModule="reports" modules={modules} />
      </TabsContent>
    </Tabs>
  );
}

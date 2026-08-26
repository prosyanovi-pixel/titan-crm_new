import { useTranslation } from '@/lib/i18n';
import { Activity, Database, FileText, Wrench, Users, Sparkles, HardDrive, Clock, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HealthTab } from './system/HealthTab';
import { DbTablesTab } from './system/DbTablesTab';
import { LogsTab } from './system/LogsTab';
import { MaintenanceTab } from './system/MaintenanceTab';
import { UsersTab } from './system/UsersTab';
import { EnrichmentTab } from './system/enrichment/EnrichmentTab';
import { BackupTab } from './system/BackupTab';
import { ScheduleTab } from './system/ScheduleTab';
import { LanguagesTab } from './system/LanguagesTab';

export function SystemEditor() {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="health" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg mb-4 justify-start">
        <TabsTrigger value="health" className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />{t('generated.sostoyanie')}
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />{t('generated.pol_zovateli')}
        </TabsTrigger>
        <TabsTrigger value="db" className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />{t('generated.tablitsy_bd')}
        </TabsTrigger>
        <TabsTrigger value="backup" className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5" />{t('generated.bekapy')}
        </TabsTrigger>
        <TabsTrigger value="schedule" className="flex items-center gap-1.5">
          {/* @ts-ignore */}
          <Clock className="w-3.5 h-3.5" />{t('settings.maintenance.schedule.label')}
        </TabsTrigger>
        <TabsTrigger value="logs" className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />{t('generated.logi')}
        </TabsTrigger>
        <TabsTrigger value="maintenance" className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5" />{t('generated.obsluzhivanie')}
        </TabsTrigger>
        <TabsTrigger value="languages" className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />Языки контента
        </TabsTrigger>
        <TabsTrigger value="enrichment" className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />{t('generated.obogaschenie')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="health" className="mt-0"><HealthTab /></TabsContent>
      <TabsContent value="users" className="mt-0"><UsersTab /></TabsContent>
      <TabsContent value="db" className="mt-0"><DbTablesTab /></TabsContent>
      <TabsContent value="backup" className="mt-0"><BackupTab /></TabsContent>
      <TabsContent value="schedule" className="mt-0"><ScheduleTab /></TabsContent>
      <TabsContent value="logs" className="mt-0"><LogsTab /></TabsContent>
      <TabsContent value="maintenance" className="mt-0"><MaintenanceTab /></TabsContent>
      <TabsContent value="languages" className="mt-0"><LanguagesTab /></TabsContent>
      <TabsContent value="enrichment" className="mt-0"><EnrichmentTab /></TabsContent>
    </Tabs>
  );
}

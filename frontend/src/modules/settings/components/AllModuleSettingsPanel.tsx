/**
 * All Module Settings Panel
 * Displays settings for all active modules with ability to switch between them
 */

import React, { useState } from "react";
import { useAllModuleSettings } from "../hooks";
import { ModuleWithSettings } from "../types";
import { ModuleSettingsEditor } from "./ModuleSettingsEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "@/lib/i18n";

export function AllModuleSettingsPanel() {
  const { t } = useTranslation();
  const { modules, isLoading, error } = useAllModuleSettings();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Set the first module as default
  React.useEffect(() => {
    if (modules.length > 0 && !selectedModule) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedModule(modules[0].id);
    }
  }, [modules, selectedModule]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('settings.common.errors.module_load')}: {error instanceof Error ? error.message : "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  if (modules.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('settings.common.errors.no_active_modules')}
        </AlertDescription>
      </Alert>
    );
  }

  const currentModule = modules.find((m) => m.id === selectedModule);

  return (
    <Tabs value={selectedModule || ""} onValueChange={setSelectedModule} className="w-full">
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(120px, 1fr))` }}>
        {modules.map((module) => (
          <TabsTrigger key={module.id} value={module.id} className="text-xs">
            {module.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {modules.map((module) => (
        <TabsContent key={module.id} value={module.id} className="mt-6">
          <ModuleSettingsEditor moduleId={module.id} moduleName={module.name} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

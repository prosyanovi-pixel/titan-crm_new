import React, { useState } from "react";
import { useModuleSettings, useUpdateModuleSettings } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CharacteristicTemplate } from "@/modules/products/types";

export function CharacteristicTemplatesEditor() {
  const { t } = useTranslation();
  const moduleId = 'products';
  const { settings, isLoading } = useModuleSettings(moduleId);
  const updateModuleSettings = useUpdateModuleSettings();
  
  const [templates, setTemplates] = useState<CharacteristicTemplate[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [prevSettings, setPrevSettings] = useState(settings);

  if (settings !== prevSettings) {
    setPrevSettings(settings);
    setTemplates((settings?.characteristicTemplates as CharacteristicTemplate[]) || []);
    setIsDirty(false);
  }

  const handleSave = async () => {
    try {
      await updateModuleSettings.mutateAsync({
        moduleId,
        settings: {
          characteristicTemplates: templates,
        },
      });
      setIsDirty(false);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const addTemplate = () => {
    const newTemplate: CharacteristicTemplate = {
      id: crypto.randomUUID(),
      name: "Новый шаблон",
      characteristics: []
    };
    setTemplates([...templates, newTemplate]);
    setIsDirty(true);
  };

  const removeTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    setIsDirty(true);
  };

  const updateTemplateName = (id: string, name: string) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, name } : t));
    setIsDirty(true);
  };

  const addCharacteristic = (templateId: string) => {
    setTemplates(templates.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          characteristics: [...t.characteristics, { section: "", name: "", value: "", unit: "" }]
        };
      }
      return t;
    }));
    setIsDirty(true);
  };

  const updateCharacteristic = (templateId: string, index: number, field: keyof CharacteristicTemplate['characteristics'][0], value: string) => {
    setTemplates(templates.map(t => {
      if (t.id === templateId) {
        const newChars = [...t.characteristics];
        newChars[index] = { ...newChars[index], [field]: value };
        return { ...t, characteristics: newChars };
      }
      return t;
    }));
    setIsDirty(true);
  };

  const removeCharacteristic = (templateId: string, index: number) => {
    setTemplates(templates.map(t => {
      if (t.id === templateId) {
        const newChars = [...t.characteristics];
        newChars.splice(index, 1);
        return { ...t, characteristics: newChars };
      }
      return t;
    }));
    setIsDirty(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Шаблоны характеристик</h3>
          <p className="text-sm text-muted-foreground">Управление шаблонами характеристик для товаров</p>
        </div>
        <Button onClick={addTemplate}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить шаблон
        </Button>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {templates.map((template) => (
          <AccordionItem key={template.id} value={template.id} className="border rounded-md px-4 bg-card">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-4 flex-1 pr-4">
                <span className="font-medium flex-1 text-left">{template.name}</span>
                <span className="text-sm text-muted-foreground">{template.characteristics.length} характеристик</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-0 pb-4 space-y-4">
              <div className="flex items-end gap-4 mb-6">
                <div className="flex-1 space-y-1">
                  <Label>Название шаблона</Label>
                  <Input 
                    value={template.name} 
                    onChange={e => updateTemplateName(template.id, e.target.value)} 
                  />
                </div>
                <Button variant="destructive" size="icon" onClick={() => removeTemplate(template.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Характеристики</Label>
                  <Button variant="outline" size="sm" onClick={() => addCharacteristic(template.id)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить строку
                  </Button>
                </div>
                
                {template.characteristics.length === 0 ? (
                  <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground text-sm">
                    Нет характеристик в этом шаблоне
                  </div>
                ) : (
                  <div className="space-y-2 mt-4">
                    {template.characteristics.map((char, index) => (
                      <div key={index} className="flex gap-2 items-start bg-muted/30 p-2 rounded-md">
                        <div className="w-32 space-y-1">
                          {index === 0 && <Label className="text-xs text-muted-foreground">Раздел</Label>}
                          <Input value={char.section || ''} onChange={e => updateCharacteristic(template.id, index, "section", e.target.value)} placeholder="Раздел" />
                        </div>
                        <div className="flex-1 space-y-1">
                          {index === 0 && <Label className="text-xs text-muted-foreground">Название</Label>}
                          <Input value={char.name || ''} onChange={e => updateCharacteristic(template.id, index, "name", e.target.value)} placeholder="Название" />
                        </div>
                        <div className="flex-1 space-y-1">
                          {index === 0 && <Label className="text-xs text-muted-foreground">Значение по умолчанию</Label>}
                          <Input value={char.value || ''} onChange={e => updateCharacteristic(template.id, index, "value", e.target.value)} placeholder="Значение" />
                        </div>
                        <div className="w-24 space-y-1">
                          {index === 0 && <Label className="text-xs text-muted-foreground">Ед. изм.</Label>}
                          <Input value={char.unit || ''} onChange={e => updateCharacteristic(template.id, index, "unit", e.target.value)} placeholder="Ед. изм." />
                        </div>
                        <div className={index === 0 ? "pt-5" : ""}>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeCharacteristic(template.id, index)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} disabled={!isDirty || updateModuleSettings.isPending}>
          {updateModuleSettings.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.saving')}</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />{t('common.save')}</>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => { setTemplates((settings?.characteristicTemplates as CharacteristicTemplate[]) || []); setIsDirty(false); }}
          disabled={!isDirty}
        >
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}

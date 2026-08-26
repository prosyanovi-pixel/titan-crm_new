import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Service, ServiceCategory } from '../types';
import { useSaveService } from '../hooks';
import { useContentLanguages } from '@/modules/settings/hooks';
import { useModuleSettings } from '@/modules/settings/hooks/useModuleSettings';
import { ResizableSheet, SheetTabSettings } from '@/components/shared';
import { useSheetTabs } from '@/hooks/useSheetTabs';
import { TagInput, useStatuses } from '@/components/ui/status-system';
import { useTranslation } from '@/lib/i18n';
import { Info, Calculator, Globe, Languages } from 'lucide-react';

interface ServiceFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  categories: ServiceCategory[];
  selectedCategoryId: number | null;
}

export function ServiceFormSheet({ open, onOpenChange, service, categories, selectedCategoryId }: ServiceFormSheetProps) {
  const { t } = useTranslation();
  const saveMutation = useSaveService();
  const { languages, defaultLanguage } = useContentLanguages();
  const { settings } = useModuleSettings("services");
  const { statuses } = useStatuses({ module: "services" });
  const types = (settings?.types || []) as Array<{id: string, name: string}>;
  
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    description: '',
    categoryId: null,
    type: 'pnr',
    baseCost: 0,
    costType: 'fixed',
    taxContributionsRate: 30,
    vatRate: 22,
    isActive: true,
    status: 'active',
    tags: [],
    translations: {},
    images: []
  });

  useEffect(() => {
    queueMicrotask(() => {
      if (open) {
        if (service) {
          setFormData({ ...service });
        } else {
          setFormData({
            name: '',
            description: '',
            categoryId: selectedCategoryId,
            type: 'pnr',
            baseCost: 0,
            costType: 'fixed',
            taxContributionsRate: 30,
            vatRate: 22,
            isActive: true,
            status: 'active',
            tags: [],
            translations: {},
            images: []
          });
        }
      }
    });
  }, [open, service, selectedCategoryId]);

  const handleChange = (field: keyof Service, value: string | number | boolean | Array<{id: number, name: string, depth: number}> | Record<string, unknown> | string[] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const flattenCategories = (cats: ServiceCategory[], depth = 0): {id: number, name: string, depth: number}[] => {
    let result: {id: number, name: string, depth: number}[] = [];
    cats.forEach(c => {
      result.push({ id: c.id, name: c.name, depth });
      if (c.children && c.children.length > 0) {
        result = result.concat(flattenCategories(c.children, depth + 1));
      }
    });
    return result;
  };

  const { tabs, toggleTab, moveTab } = useSheetTabs([
    { id: "basic", label: "services.form.tabs.basic", visible: true, icon: Info },
    { id: "financial", label: "services.form.tabs.financial", visible: true, icon: Calculator },
    { id: "cms", label: "services.form.tabs.cms", visible: true, icon: Globe },
    ...languages.filter(l => !l.isDefault).map(lang => ({
      id: `lang_${lang.code}`,
      label: `services.form.tabs.translation (${lang.code.toUpperCase()})`,
      visible: true,
      icon: Languages
    }))
  ]);
  const [activeTab, setActiveTab] = useState("basic");

  // Ensure active tab is visible when opening or changing configuration
  useEffect(() => {
    const currentTab = tabs.find(t => t.id === activeTab);
    if (currentTab && !currentTab.visible) {
      const firstVisible = tabs.find(t => t.visible);
      if (firstVisible) {
        setTimeout(() => setActiveTab(firstVisible.id), 0);
      }
    }
  }, [tabs, activeTab]);

  const flatCats = flattenCategories(categories);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await saveMutation.mutateAsync(formData);
    onOpenChange(false);
  };

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSubmit}
      title={service ? t('services.form.title_edit') : t('services.form.title_add')}
      description={service?.name}
      moduleKey="services-sheet"
      defaultWidth="lg"
      showDeleteButton={false}
      saveButtonLabel="common.save"
      cancelButtonLabel="common.cancel"
    >
      <form id="service-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              {tabs.map(tab => {
                if (!tab.visible) return null;
                // For custom dynamic translations labels
                const label = tab.label.includes('(') ? tab.label : t(tab.label);
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs">
                    {tab.id === 'basic' ? `${label} (${defaultLanguage.code.toUpperCase()})` : label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <SheetTabSettings tabs={tabs} onToggle={toggleTab} onMove={moveTab} />
        </div>
        
        {tabs.find(t => t.id === "basic")?.visible && activeTab === "basic" && (
          <div className="space-y-4 pt-4 animate-in fade-in-50">
            <div className="space-y-2">
              <Label>{t('services.form.fields.name')} *</Label>
              <Input value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} required />
            </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('services.form.fields.type')} *</Label>
                  <Select value={formData.type} onValueChange={v => handleChange('type', v)}>
                    <SelectTrigger><SelectValue placeholder={t('services.form.placeholders.type')} /></SelectTrigger>
                    <SelectContent>
                      {types.length > 0 ? types.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      )) : (
                        <>
                          <SelectItem value="pnr">{t('services.types.pnr')}</SelectItem>
                          <SelectItem value="installation">{t('services.types.installation')}</SelectItem>
                          <SelectItem value="delivery">{t('services.types.delivery')}</SelectItem>
                          <SelectItem value="consulting">{t('services.types.consulting')}</SelectItem>
                          <SelectItem value="maintenance">{t('services.types.maintenance')}</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('services.form.fields.status')}</Label>
                  <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('services.form.placeholders.status')} />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('services.form.fields.category')}</Label>
                <Select 
                  value={formData.categoryId?.toString() || 'none'} 
                  onValueChange={v => handleChange('categoryId', v === 'none' ? null : parseInt(v))}
                >
                  <SelectTrigger><SelectValue placeholder={t('services.form.placeholders.category')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('services.form.without_category')}</SelectItem>
                    {flatCats.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {'\u00A0'.repeat(c.depth * 4)}{c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('services.form.fields.tags')}</Label>
                <TagInput 
                  placeholder={t('services.form.placeholders.tags')} 
                  value={formData.tags || []} 
                  onChange={(tags) => handleChange('tags', tags)} 
                  module="services"
                />
              </div>
              </div>
          )}
        {tabs.find(t => t.id === "cms")?.visible && activeTab === "cms" && (
          <div className="space-y-4 pt-4 animate-in fade-in-50">
            <div className="space-y-2">
              <Label>{t('services.form.fields.description')} ({defaultLanguage.code.toUpperCase()})</Label>
              <Textarea 
                value={formData.description || ''} 
                onChange={e => handleChange('description', e.target.value)} 
                rows={4}
                placeholder={`${t('services.form.placeholders.description')} на ${defaultLanguage.name}`}
              />
            </div>
          </div>
        )}

        {languages.filter(l => !l.isDefault).map(lang => (
          tabs.find(t => t.id === `lang_${lang.code}`)?.visible && activeTab === `lang_${lang.code}` && (
            <div key={lang.code} className="space-y-4 pt-4 animate-in fade-in-50">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('services.form.fields.name')} ({lang.code.toUpperCase()})</Label>
                  <Input 
                    value={(formData.translations as Record<string, {name?: string, description?: string}>)?.[lang.code]?.name || ''} 
                    onChange={e => {
                      const tr = { ...(formData.translations as Record<string, {name?: string, description?: string}>), [lang.code]: { ...(formData.translations as Record<string, {name?: string, description?: string}>)?.[lang.code], name: e.target.value } };
                      handleChange('translations', tr);
                    }} 
                    placeholder={`${t('services.form.placeholders.name')} на ${lang.name}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('services.form.fields.description')} ({lang.code.toUpperCase()})</Label>
                  <Textarea 
                    value={(formData.translations as Record<string, {name?: string, description?: string}>)?.[lang.code]?.description || ''} 
                    onChange={e => {
                      const tr = { ...(formData.translations as Record<string, {name?: string, description?: string}>), [lang.code]: { ...(formData.translations as Record<string, {name?: string, description?: string}>)?.[lang.code], description: e.target.value } };
                      handleChange('translations', tr);
                    }} 
                    rows={4}
                    placeholder={`${t('services.form.placeholders.description')} на ${lang.name}`}
                  />
                </div>
              </div>
            </div>
          )
        ))}
        
        {tabs.find(t => t.id === "financial")?.visible && activeTab === "financial" && (
          <div className="space-y-4 pt-4 animate-in fade-in-50">
            <div className="space-y-2">
              <Label>{t('services.form.fields.cost_type')}</Label>
              <Select value={formData.costType} onValueChange={v => handleChange('costType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{t('services.form.cost_types.fixed')}</SelectItem>
                  <SelectItem value="hourly">{t('services.form.cost_types.hourly')}</SelectItem>
                  <SelectItem value="percentage">{t('services.form.cost_types.percentage')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('services.form.fields.base_cost')}</Label>
              <Input 
                type="number" 
                value={formData.baseCost || 0} 
                onChange={e => handleChange('baseCost', parseFloat(e.target.value))} 
              />
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="text-muted-foreground font-semibold">{t('services.form.fields.tax_contributions')}</Label>
              <p className="text-xs text-muted-foreground mb-2">{t('services.form.fields.tax_contributions_desc')}</p>
              <div className="space-y-1">
                <Label>{t('services.form.fields.tax_contributions_rate')}</Label>
                <Input 
                  type="number" 
                  value={formData.taxContributionsRate || 0} 
                  onChange={e => handleChange('taxContributionsRate', parseFloat(e.target.value))} 
                />
                <p className="text-xs text-slate-500 mt-1">{t('services.form.fields.tax_contributions_hint')}</p>
              </div>
            </div>

              <div className="space-y-2 border-t pt-4">
                <Label className="text-muted-foreground font-semibold">{t('services.form.fields.vat')}</Label>
                <div className="space-y-1">
                  <Label>{t('services.form.fields.vat_rate')}</Label>
                  <Select 
                    value={formData.vatRate?.toString() || '22'} 
                    onValueChange={v => handleChange('vatRate', parseFloat(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t('services.form.vat_rates.none')}</SelectItem>
                      <SelectItem value="10">{t('services.form.vat_rates.rate_10')}</SelectItem>
                      <SelectItem value="20">{t('services.form.vat_rates.rate_20')}</SelectItem>
                      <SelectItem value="22">{t('services.form.vat_rates.rate_22')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
      </form>
    </ResizableSheet>
  );
}

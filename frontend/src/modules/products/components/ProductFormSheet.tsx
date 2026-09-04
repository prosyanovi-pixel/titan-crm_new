import React, { useState, useEffect } from "react";
import { ProductCategory, Product } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProduct, useUpdateProduct } from "../hooks";
import { Plus, Trash2, Info, ListChecks, Package, Globe, Languages } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useContentLanguages } from "@/modules/settings/hooks";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { useSheetTabs } from "@/hooks/useSheetTabs";
import { ResizableSheet, SheetTabSettings } from "@/components/shared";
import { TagInput, useStatuses } from "@/components/ui/status-system";
import { useTranslation } from "@/lib/i18n";
import { ProductBalancesTab } from "./ProductBalancesTab";
import { ProductBundlesTab } from "./ProductBundlesTab";
import { Layers } from "lucide-react";
import { useCompanyVat } from "@/hooks/useCompanyVat";
import { CHARACTERISTIC_TEMPLATES } from "../constants/characteristicTemplates";

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ProductCategory[];
  product?: Product | null;
}

interface StatusType {
  id: string;
  name: string;
}

export function ProductFormSheet({ open, onOpenChange, categories, product }: ProductFormSheetProps) {
  const { t } = useTranslation();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const { settings } = useModuleSettings("products");
  const { statuses } = useStatuses({ module: "products" });
  const types = (settings?.types || []) as StatusType[];
  const charTemplates = (settings?.characteristicTemplates as typeof CHARACTERISTIC_TEMPLATES) || CHARACTERISTIC_TEMPLATES || [];

  /** НДС компании — единый хук, не дублируем логику */
  const { hasVat, vatRate: companyVatRate, taxRegimeName } = useCompanyVat();

  /**
   * Нормализует ставку НДС к строке, совместимой с вариантами Select.
   * Например: 22.0 → "22", 10.5 → "10" (ближайший стандартный)
   */
  const normalizeVatRate = (rate: number | string | undefined | null): string => {
    const n = Math.round(parseFloat(String(rate ?? '0')) || 0);
    const allowed = [0, 5, 7, 10, 20, 22];
    const closest = allowed.reduce((prev, curr) =>
      Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev
    );
    return String(closest);
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [skuInternal, setSkuInternal] = useState("");
  const [skuExternal, setSkuExternal] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [vatRate, setVatRate] = useState("0");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<string>("active");
  const [type, setType] = useState<string>("");
  const [isSubmitError, setIsSubmitError] = useState(false);
  const [characteristics, setCharacteristics] = useState<Array<{ id: string, section: string, name: string, value: string, unit: string }>>([]);
  const [tags, setTags] = useState<string[]>([]);
  
  // Bundles
  const [isComposite, setIsComposite] = useState(false);
  const [components, setComponents] = useState<Array<{ componentId: number; quantity: number; writeOffFromWarehouse: boolean; isIncludedInPrice: boolean }>>([]);
  
  // CMS fields
  const [imageUrls, setImageUrls] = useState("");
  const { languages, defaultLanguage } = useContentLanguages();
  const [translations, setTranslations] = useState<Record<string, {name: string, description: string}>>({});

  const resetForm = () => {
    setName("");
    setDescription("");
    setSkuInternal("");
    setSkuExternal("");
    setPurchasePrice("");
    setVatRate("0");
    setCategoryId("");
    setStatus("active");
    setType("");
    setTags([]);
    setCharacteristics([]);
    setIsComposite(false);
    setComponents([]);
    setTranslations({});
    setImageUrls("");
  };

  const { tabs, toggleTab, moveTab } = useSheetTabs([
    { id: "main", label: "products.form.tabs.main", visible: true, icon: Info },
    { id: "characteristics", label: "products.form.tabs.characteristics", visible: true, icon: ListChecks },
    { id: "bundles", label: "products.bundles.title", visible: true, icon: Layers },
    { id: "balances", label: "warehouse.tabs.balances", visible: !!product?.id, icon: Package },
    { id: "cms", label: "products.form.tabs.cms", visible: true, icon: Globe },
    ...languages.filter(l => !l.isDefault).map(lang => ({
      id: `lang_${lang.code}`,
      label: `${t('products.form.tabs.translation')} (${lang.code.toUpperCase()})`,
      visible: true,
      icon: Languages
    }))
  ], "product-form-sheet");
  const [activeTab, setActiveTab] = useState("main");

  useEffect(() => {
    const currentTab = tabs.find(t => t.id === activeTab);
    if (currentTab && !currentTab.visible) {
      const firstVisible = tabs.find(t => t.visible);
      if (firstVisible) {
        setTimeout(() => setActiveTab(firstVisible.id), 0);
      }
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    queueMicrotask(() => {
      if (open && product) {
        setName(product.name || "");
        setDescription(product.description || "");
        setSkuInternal(product.skuInternal || "");
        setSkuExternal(product.skuExternal || "");
        setPurchasePrice(product.purchasePrice?.toString() || "");

        // Логика ставки НДС при редактировании:
        // — если у товара уже есть ненулевая ставка → берём её
        // — если ставка = 0 и у компании ОСН (hasVat) → подставляем ставку компании
        const productVatRate = parseFloat(String(product.vatRate ?? '0')) || 0;
        if (productVatRate > 0) {
          setVatRate(normalizeVatRate(productVatRate));
        } else if (hasVat) {
          setVatRate(normalizeVatRate(companyVatRate));
        } else {
          setVatRate("0");
        }

        setCategoryId(product.categoryId?.toString() || "");
        setStatus(product.status || "active");
        setType(product.type || "");
        setTags(product.tags || []);
        setIsComposite(product.isComposite || false);
        setComponents((product.components || []).map(c => ({
          componentId: c.componentId,
          quantity: c.quantity,
          writeOffFromWarehouse: c.writeOffFromWarehouse,
          isIncludedInPrice: c.isIncludedInPrice
        })));
        setCharacteristics((product.characteristics || []).map(c => ({ id: crypto.randomUUID(), section: c.section || "", name: c.name, value: c.value, unit: c.unit })));
        setImageUrls((product.images || []).join('\n'));
        const rawTr = product.translations || {};
          setTranslations(Object.fromEntries(Object.entries(rawTr).map(([k, v]) => [k, { name: v?.name || '', description: v?.description || '' }])));
        } else if (open && !product) {
        resetForm();
        // При создании: ставка из настроек компании
        if (hasVat) {
          setVatRate(normalizeVatRate(companyVatRate));
        }
      }
    });
  }, [open, product, hasVat, companyVatRate]);


  const handleTranslationChange = (langCode: string, field: 'name' | 'description', value: string) => {
    setTranslations(prev => ({
      ...prev,
      [langCode]: {
        ...(prev[langCode] || { name: '', description: '' }),
        [field]: value
      }
    }));
  };

  const addCharacteristic = () => {
    setCharacteristics(prev => [...prev, { id: crypto.randomUUID(), section: "", name: "", value: "", unit: "" }]);
  };

  const updateCharacteristic = (id: string, field: "section" | "name" | "value" | "unit", val: string) => {
    setCharacteristics(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const removeCharacteristic = (id: string) => {
    setCharacteristics(prev => prev.filter(c => c.id !== id));
  };

  const loadTemplate = (templateId: string) => {
    const template = charTemplates.find((t: any) => t.id === templateId);
    if (template) {
      const newChars = template.characteristics.map((c: any) => ({
        id: crypto.randomUUID(),
        section: c.section,
        name: c.name,
        value: c.value,
        unit: c.unit
      }));
      setCharacteristics(prev => [...prev, ...newChars]);
    }
  };

  const templateSections = Array.from(new Set(charTemplates.flatMap((t: any) => t.characteristics.map((c: any) => c.section)))).filter(Boolean);
  const templateNames = Array.from(new Set(charTemplates.flatMap((t: any) => t.characteristics.map((c: any) => c.name)))).filter(Boolean);
  const templateUnits = Array.from(new Set(charTemplates.flatMap((t: any) => t.characteristics.map((c: any) => c.unit)))).filter(Boolean);

  const flattenCategories = (cats: ProductCategory[], depth = 0): {id: number, name: string, depth: number}[] => {
    let result: {id: number, name: string, depth: number}[] = [];
    cats.forEach(c => {
      result.push({ id: c.id, name: c.name, depth });
      if (c.children && c.children.length > 0) {
        result = result.concat(flattenCategories(c.children, depth + 1));
      }
    });
    return result;
  };

  const flatCats = flattenCategories(categories || []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Parse image URLs from multiline string
    const images = imageUrls.split('\n').map(url => url.trim()).filter(url => url.length > 0);
    
    const payload = {
      name,
      description: description || undefined,
      skuInternal: skuInternal || undefined,
      skuExternal: skuExternal || undefined,
      categoryId: categoryId && categoryId !== "none" ? parseInt(categoryId) : undefined,
      purchasePrice: parseFloat(purchasePrice) || 0,
      vatRate: parseFloat(vatRate) || 0,
      status: status || undefined,
      type: type || undefined,
      tags: tags.length > 0 ? tags : undefined,
      isComposite,
      components: isComposite && components.length > 0 ? components.filter(c => c.componentId > 0) : undefined,
      characteristics: characteristics.map(({ section, name, value, unit }) => ({ section, name, value, unit })),
      images: images.length > 0 ? images : undefined,
      translations: Object.keys(translations).length > 0 ? translations : undefined
    };

    if (product?.id) {
      updateProductMutation.mutate({ id: product.id, data: payload }, {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        }
      });
    } else {
      createProductMutation.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        }
      });
    }
  };


  return (
    <ResizableSheet
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
      onSave={handleSubmit}
      title={product ? t('products.form.title_edit') : t('products.form.title_add')}
      description={t('products.form.description')}
      defaultWidth="2xl"
      moduleKey="products"
      saveButtonLabel="common.save"
      cancelButtonLabel="common.cancel"
    >
      <form id="product-form" onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-2 mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {tabs.map(tab => {
                  if (!tab.visible) return null;
                  const label = tab.label.includes('(') ? tab.label : t(tab.label);
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs">
                      {tab.id === 'main' ? `${label} (${defaultLanguage.code.toUpperCase()})` : label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
            <SheetTabSettings tabs={tabs} onToggle={toggleTab} onMove={moveTab} />
          </div>

          {tabs.find(t => t.id === "main")?.visible && activeTab === "main" && (
            <div className="space-y-4 animate-in fade-in-50">
              <div className="space-y-2">
                <Label>{t('products.form.fields.name')} ({defaultLanguage.code.toUpperCase()}) *</Label>
                <Input required value={name} onChange={e => setName(e.target.value)} placeholder={t('products.form.placeholders.name')} />
              </div>
              
              <div className="space-y-2">
                <Label>{t('products.form.fields.description')} ({defaultLanguage.code.toUpperCase()})</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('products.form.placeholders.description')} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('products.form.fields.sku_internal')}</Label>
                  <Input value={skuInternal} onChange={e => setSkuInternal(e.target.value)} placeholder={t('products.form.placeholders.sku_internal')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('products.form.fields.sku_external')}</Label>
                  <Input value={skuExternal} onChange={e => setSkuExternal(e.target.value)} placeholder={t('products.form.placeholders.sku_external')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('products.form.fields.category')}</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('products.form.placeholders.category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('products.form.without_category')}</SelectItem>
                    {flatCats.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {'\u00A0'.repeat(cat.depth * 4)}{cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">{t('products.form.fields.purchase_price')}</Label>
                  {hasVat && (
                    <span className="text-xs text-muted-foreground">
                      {t('settings.finance.tax_regimes')}: {taxRegimeName ?? '—'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('products.form.fields.purchase_price')}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={purchasePrice}
                      onChange={e => setPurchasePrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('products.form.fields.vat_rate')}</Label>
                    <Select
                      value={vatRate}
                      onValueChange={setVatRate}
                      disabled={!hasVat && parseFloat(vatRate || "0") === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0%" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">{t('services.form.vat_rates.none')}</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="7">7%</SelectItem>
                        <SelectItem value="10">{t('services.form.vat_rates.rate_10')}</SelectItem>
                        <SelectItem value="20">{t('services.form.vat_rates.rate_20')}</SelectItem>
                        <SelectItem value="22">{t('services.form.vat_rates.rate_22')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Динамический расчёт НДС.
                    Показывается если: есть цена И ставка > 0
                    Не зависит от hasVat — редактируемый товар может иметь свою ставку */}
                {parseFloat(purchasePrice || "0") > 0 && parseFloat(vatRate || "0") > 0 && (
                  <div className="rounded-md border bg-muted/40 px-4 py-3 grid grid-cols-3 gap-2 text-sm">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{t('products.form.fields.purchase_price')}</p>
                      <p className="font-medium">
                        {parseFloat(purchasePrice || "0").toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{t('products.form.fields.vat_rate')} ({vatRate}%)</p>
                      <p className="font-medium text-amber-600 dark:text-amber-400">
                        {(parseFloat(purchasePrice || "0") * (parseFloat(vatRate || "0") / 100))
                          .toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{t('finance.invoice.field.total_with_vat')}</p>
                      <p className="font-semibold text-primary">
                        {(parseFloat(purchasePrice || "0") * (1 + parseFloat(vatRate || "0") / 100))
                          .toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Подсказка: только если у компании нет НДС И ставка товара = 0 */}
                {!hasVat && parseFloat(vatRate || "0") === 0 && (
                  <p className="text-xs text-muted-foreground">{t('quotes.no_vat')}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('products.form.fields.product_type')}</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('products.form.placeholders.product_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('products.form.fields.status')}</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('products.form.placeholders.status')} />
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
                <Label>{t('products.form.fields.tags')}</Label>
                <TagInput placeholder={t('products.form.placeholders.tags')} value={tags} onChange={setTags} module="products" />
              </div>
          </div>
        )}

        {tabs.find(t => t.id === "characteristics")?.visible && activeTab === "characteristics" && (
          <div className="space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">{t('products.form.fields.characteristics')}</h3>
                <p className="text-sm text-muted-foreground">{t('products.form.fields.characteristics_desc')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select onValueChange={loadTemplate}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Шаблоны" />
                  </SelectTrigger>
                  <SelectContent>
                    {charTemplates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    let newSec = "Новый раздел";
                    let counter = 1;
                    while (characteristics.some(c => (c.section || "") === newSec)) {
                      newSec = `Новый раздел ${counter}`;
                      counter++;
                    }
                    setCharacteristics(prev => [...prev, { id: crypto.randomUUID(), section: newSec, name: "", value: "", unit: "" }]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить раздел
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setCharacteristics(prev => [...prev, { id: crypto.randomUUID(), section: "", name: "", value: "", unit: "" }])}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('products.form.fields.add_characteristic')}
                </Button>
              </div>
            </div>

            <datalist id="characteristic-sections">
              {templateSections.map(s => <option key={s} value={s} />)}
            </datalist>
            <datalist id="characteristic-names">
              {templateNames.map(n => <option key={n} value={n} />)}
            </datalist>
            <datalist id="characteristic-units">
              {templateUnits.map(u => <option key={u} value={u} />)}
            </datalist>

            {characteristics.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-md text-muted-foreground text-sm">
                {t('products.form.fields.no_characteristics')}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  characteristics.reduce((acc, curr) => {
                    const sec = curr.section || "";
                    if (!acc[sec]) acc[sec] = [];
                    acc[sec].push(curr);
                    return acc;
                  }, {} as Record<string, typeof characteristics>)
                ).map(([section, chars]) => (
                  <div key={chars[0].id} className="space-y-3 border rounded-md p-4 bg-card shadow-sm">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                      <Input 
                        value={section} 
                        onChange={e => {
                          const newSec = e.target.value;
                          setCharacteristics(prev => prev.map(c => (c.section || "") === section ? { ...c, section: newSec } : c));
                        }}
                        placeholder="Без раздела (оставьте пустым для общего списка)"
                        className="font-semibold text-base bg-transparent border-none px-1 h-auto focus-visible:ring-1 shadow-none flex-1"
                        list="characteristic-sections"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCharacteristics(prev => [...prev, { id: crypto.randomUUID(), section, name: "", value: "", unit: "" }])}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Параметр
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {chars.map((char, i) => (
                        <div key={char.id} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-1">
                            {i === 0 && <Label className="text-xs text-muted-foreground">{t('products.form.fields.characteristic_name_placeholder')}</Label>}
                            <Input value={char.name} onChange={e => updateCharacteristic(char.id, "name", e.target.value)} placeholder={t('products.form.fields.characteristic_name')} list="characteristic-names" />
                          </div>
                          <div className="flex-1 space-y-1">
                            {i === 0 && <Label className="text-xs text-muted-foreground">{t('products.form.fields.characteristic_value_placeholder')}</Label>}
                            <Input value={char.value} onChange={e => updateCharacteristic(char.id, "value", e.target.value)} placeholder={t('products.form.fields.characteristic_value')} />
                          </div>
                          <div className="w-32 space-y-1">
                            {i === 0 && <Label className="text-xs text-muted-foreground">{t('products.form.fields.characteristic_unit_placeholder')}</Label>}
                            <Input value={char.unit} onChange={e => updateCharacteristic(char.id, "unit", e.target.value)} placeholder={t('products.form.fields.characteristic_unit')} list="characteristic-units" />
                          </div>
                          <div className={i === 0 ? "pt-5" : ""}>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeCharacteristic(char.id)} className="text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tabs.find(t => t.id === "bundles")?.visible && activeTab === "bundles" && (
          <div className="space-y-4 animate-in fade-in-50">
            <ProductBundlesTab 
              isComposite={isComposite} 
              setIsComposite={setIsComposite} 
              components={components} 
              setComponents={setComponents}
              currentProductId={product?.id}
            />
          </div>
        )}

        {tabs.find(t => t.id === "balances")?.visible && activeTab === "balances" && (
          <div className="space-y-4 animate-in fade-in-50">
            <ProductBalancesTab productId={product?.id} />
          </div>
        )}
        
        {tabs.find(t => t.id === "cms")?.visible && activeTab === "cms" && (
          <div className="space-y-4 animate-in fade-in-50">
            <div>
              <h3 className="text-lg font-medium">{t('products.form.fields.images')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('products.form.fields.images_desc')}</p>
              <Textarea 
                value={imageUrls} 
                onChange={e => setImageUrls(e.target.value)} 
                placeholder={t('products.form.placeholders.images')} 
                rows={4}
              />
            </div>
          </div>
        )}

        {languages.filter(l => !l.isDefault).map(lang => (
          tabs.find(t => t.id === `lang_${lang.code}`)?.visible && activeTab === `lang_${lang.code}` && (
            <div key={lang.code} className="space-y-4 animate-in fade-in-50">
              <div>
                <h3 className="text-lg font-medium">{t('products.form.fields.version')} ({lang.code.toUpperCase()})</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('products.form.fields.translations_desc')} ({lang.name}).</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('products.form.fields.name')} ({lang.code.toUpperCase()})</Label>
                    <Input 
                      value={translations[lang.code]?.name || ""} 
                      onChange={e => handleTranslationChange(lang.code, 'name', e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('products.form.fields.description')} ({lang.code.toUpperCase()})</Label>
                    <Textarea 
                      value={translations[lang.code]?.description || ""} 
                      onChange={e => handleTranslationChange(lang.code, 'description', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        ))}
        </div>
      </form>
    </ResizableSheet>
  );
}

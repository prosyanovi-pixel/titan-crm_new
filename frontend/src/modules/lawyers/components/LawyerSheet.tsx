
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, User, Briefcase, Phone, Mail, FileText, X, Send, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Lawyer, LegalCase } from "../types";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-system";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { useSheetTabs } from "@/hooks/useSheetTabs";
import { SheetTabSettings, ResizableSheet } from "@/components/shared";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";

interface LawyerSheetProps {
  lawyer: Lawyer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lawyer: Lawyer) => void;
  onDelete?: (id: string) => void;
  allCases?: LegalCase[]; // Pass real cases from API
}

export function LawyerSheet({
  lawyer,
  open,
  onOpenChange,
  onSave,
  onDelete,
  allCases = []
}: LawyerSheetProps) {
  const { t } = useTranslation();
  const { settings } = useModuleSettings("lawyers");
  const [formData, setFormData] = useState<Partial<Lawyer>>({});
  const [lawyerCases, setLawyerCases] = useState<LegalCase[]>([]);

  // Tab Management
  const { tabs, toggleTab, moveTab } = useSheetTabs([
    { id: "overview", label: "sheet.tabs.overview", icon: User, visible: true },
    { id: "cases", label: "sheet.tabs.cases", icon: Briefcase, visible: !!lawyer && settings.features?.enableCaseAssignment !== false },
    { id: "stats", label: "sheet.tabs.stats", icon: FileText, visible: !!lawyer && settings.features?.enableWorkloadTracking !== false },
    { id: "additional", label: "lawyers.tabs.additional", icon: Info, visible: true },
  ], "lawyer-sheet");
  
  const [activeTab, setActiveTab] = useState("overview");

  // Ensure active tab is visible
  useEffect(() => {
      const currentTab = tabs.find(t => t.id === activeTab);
      if (currentTab && !currentTab.visible) {
          const firstVisible = tabs.find(t => t.visible);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          if (firstVisible) setActiveTab(firstVisible.id);
      }
  }, [tabs, activeTab]);

  useEffect(() => {
    if (lawyer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        ...lawyer,
        fullName: lawyer.fullName || lawyer.name,
        telegramId: lawyer.telegramId || "",
        notes: lawyer.notes || ""
      });
      // Filter real cases from API instead of static data
      setLawyerCases(allCases.filter(c => c.lawyerId === lawyer.id));
      setActiveTab("overview");
    } else {
      setFormData({
        status: "active",
        specializations: [],
        rating: 0,
        activeCasesCount: 0,
        wonCasesCount: 0,
        phone: "",
        fullName: "",
        telegramId: "",
        notes: ""
      });
      setLawyerCases([]);
      setActiveTab("overview");
    }
  }, [lawyer, open, allCases]);

  const handleInputChange = (field: keyof Lawyer, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Validation logic here
    onSave(formData as Lawyer);
    onOpenChange(false);
  };

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSave}
      onDelete={lawyer ? () => onDelete && onDelete(lawyer.id) : undefined}
      title={lawyer ? (formData.name || t('lawyers.sheet.title_edit')) : t('lawyers.sheet.title_new')}
      description={lawyer
        ? (formData.status === "active" ? t('lawyers.status.active') : t('lawyers.status.vacation'))
        : null}
      moduleKey="lawyer-sheet"
      defaultWidth="lg"
      showDeleteButton={!!lawyer}
      saveButtonLabel="common.save"
      cancelButtonLabel="common.cancel"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              {tabs.map(tab => {
                if (!tab.visible) return null;
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                    <Icon className="w-4 h-4" />
                    {t(tab.label)}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <SheetTabSettings 
            tabs={tabs} 
            onToggle={toggleTab} 
            onMove={moveTab} 
          />
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('lawyers.sheet.field.status')}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => handleInputChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('lawyers.status.active')}</SelectItem>
                      <SelectItem value="vacation">{t('lawyers.status.vacation')}</SelectItem>
                      <SelectItem value="sick">{t('lawyers.status.sick')}</SelectItem>
                      <SelectItem value="fired">{t('lawyers.status.fired')}</SelectItem>
                    </SelectContent>
                  </Select>
                  </div>

                  {settings.features?.enableRating !== false && (
                  <div className="space-y-2">
                    <Label>{t('lawyers.table.rating')}</Label>
                    <Input 
                      type="number" 
                      value={formData.rating} 
                      onChange={(e) => handleInputChange("rating", parseFloat(e.target.value))}
                      max={5}
                      min={0}
                      step={0.1}
                    />
                  </div>
                  )}
                  </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('lawyers.sheet.field.name')}</Label>
                <Input 
                  value={formData.name || ""} 
                  onChange={(e) => handleInputChange("name", e.target.value)} 
                  placeholder={t('lawyers.sheet.placeholder.name')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('lawyers.sheet.field.full_name')}</Label>
                <Input 
                  value={formData.fullName || ""} 
                  onChange={(e) => handleInputChange("fullName", e.target.value)} 
                  placeholder={t('lawyers.sheet.placeholder.full_name')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('lawyers.sheet.field.phone')}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <MaskedInput 
                    className="pl-9"
                    value={formData.phone || ""} 
                    onChange={(e) => handleInputChange("phone", e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('lawyers.sheet.field.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    className="pl-9"
                    value={formData.email || ""} 
                    onChange={(e) => handleInputChange("email", e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {settings.features?.enableSpecializations !== false && (
              <div className="space-y-2">
                <Label>{t('lawyers.sheet.field.specialization')}</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {Array.isArray(formData.specializations) && formData.specializations.map(spec => (
                    <Badge key={spec} variant="secondary" className="gap-1 pr-1">
                      {t(`lawyers.specialization.${spec}`)}
                      <button
                        type="button"
                        onClick={() => {
                          const current = Array.isArray(formData.specializations) ? formData.specializations : [];
                          handleInputChange("specializations", current.filter(s => s !== spec));
                        }}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {/* Simplified Multi-select simulation for now */}
                <Select 
                  onValueChange={(v) => {
                    const current = Array.isArray(formData.specializations) ? formData.specializations : [];
                    if (!current.includes(v as import('../types/lawyer.types').Specialization)) {
                      handleInputChange("specializations", [...current, v as import('../types/lawyer.types').Specialization]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('generated.dobavit_spetsializatsiyu')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate">{t('lawyers.specialization.corporate')}</SelectItem>
                    <SelectItem value="criminal">{t('lawyers.specialization.criminal')}</SelectItem>
                    <SelectItem value="family">{t('lawyers.specialization.family')}</SelectItem>
                    <SelectItem value="civil">{t('lawyers.specialization.civil')}</SelectItem>
                    <SelectItem value="arbitration">{t('lawyers.specialization.arbitration')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {settings.features?.enableHourlyRate !== false && (
              <div className="space-y-2">
                <Label>{t('lawyers.sheet.field.hourly_rate')}</Label>
                <MoneyInput 
                  value={formData.hourlyRate || 0}
                  onValueChange={(v) => handleInputChange("hourlyRate", v)}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "additional" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>{t('lawyers.sheet.field.telegram')}</Label>
              <div className="relative">
                <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  className="pl-9"
                  value={formData.telegramId || ""} 
                  onChange={(e) => handleInputChange("telegramId", e.target.value)} 
                  placeholder="@username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('lawyers.sheet.field.notes')}</Label>
              <Textarea 
                value={formData.notes || ""} 
                onChange={(e) => handleInputChange("notes", e.target.value)} 
                placeholder={t('lawyers.sheet.placeholder.notes')}
                className="min-h-[150px]"
              />
            </div>
          </div>
        )}

        {activeTab === "cases" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">{t('lawyers.tabs.cases')}</h4>
              <Button size="sm" variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('addCase', { detail: { lawyerId: lawyer?.id } }))}>{t('lawyers.add_case')}</Button>
            </div>
            {lawyerCases.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 border border-dashed rounded-md">
                {t('generated.net_aktivnyh_del')}
              </div>
            ) : (
              <div className="space-y-2">
                {lawyerCases.map(c => (
                  <div key={c.id} className="p-3 border rounded-md flex justify-between items-center bg-card">
                    <div>
                      <div className="font-medium text-sm">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.plaintiff} • до {c.deadline}</div>
                    </div>
                    <StatusBadge statusId={c.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/20 rounded-lg text-center">
              <div className="text-2xl font-bold">{formData.activeCasesCount}</div>
              <div className="text-xs text-muted-foreground">{t('lawyers.stats.active_cases')}</div>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{formData.wonCasesCount}</div>
              <div className="text-xs text-muted-foreground">{t('lawyers.stats.won_cases')}</div>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg text-center col-span-2">
              <div className="text-2xl font-bold">{formData.hourlyRate?.toLocaleString()} ₽</div>
              <div className="text-xs text-muted-foreground">{t('lawyers.sheet.field.hourly_rate')}</div>
            </div>
          </div>
        )}
      </div>
    </ResizableSheet>
  );
}

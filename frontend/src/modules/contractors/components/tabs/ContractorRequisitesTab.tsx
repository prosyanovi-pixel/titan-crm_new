import { useState } from "react";
import { useCurrencies } from "@/hooks/useCurrencies";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ResizableSheet } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, MapPin, FileText, CreditCard, Trash2, Plus, Landmark, Pencil, Globe, Tag, Search, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Contractor, BankAccount } from "../../types/contractor.types";
import { DatePicker } from "@/components/ui/date-picker";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { validateBIK } from "@/lib/validators";
import { useSettings } from "@/hooks/use-settings";
import { EntityCombobox } from "@/components/shared/EntityCombobox";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ContractorRequisitesTabProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  isCreating?: boolean;
}

const EMPTY_BANK: Partial<BankAccount> = { currency: "RUB", isPrimary: false };

export function ContractorRequisitesTab({ formData, handleChange, isCreating = false }: ContractorRequisitesTabProps) {
  const { t } = useTranslation();
  const { getPositions, getLegalFormsByModule } = useSettings();
  const { data: currencies = [] } = useCurrencies();
  const [isBankSheetOpen, setIsBankSheetOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState<Partial<BankAccount>>(EMPTY_BANK);
  const [isEnrichLoading, setIsEnrichLoading] = useState(false);

  const availablePositions = getPositions().map(p => ({ id: p.name, label: p.name }));
  const legalFormsList = getLegalFormsByModule();

  // Determine contractor type for conditional rendering
  const legalEntityType = formData.legalEntityType;
  const legalForm = formData.legalForm;
  const isIndividual = legalEntityType === 'individual' || legalForm === 'ip';
  const isPrivate = legalEntityType === 'private' || legalForm === 'private';
  const isForeign = legalEntityType === 'foreign' || legalForm === 'foreign';
  const isLegal = legalEntityType === 'legal' || (!isIndividual && !isPrivate && !isForeign);

  const openAddBank = () => {
    setEditingBankId(null);
    setBankForm(EMPTY_BANK);
    setIsBankSheetOpen(true);
  };

  const openEditBank = (account: BankAccount) => {
    setEditingBankId(account.id);
    setBankForm({ ...account });
    setIsBankSheetOpen(true);
  };

  const validateBankAccount = (bank: Partial<BankAccount>) => {
    if (!bank.bik || !validateBIK(bank.bik)) {
      toast.error(t('contractor_type.error.invalid_bik'));
      return false;
    }
    if (!bank.accountNumber || !/^\d{20}$/.test(bank.accountNumber)) {
      toast.error(t('contractor_type.error.invalid_account_number'));
      return false;
    }
    if (bank.correspondentAccount && !/^\d{20}$/.test(bank.correspondentAccount)) {
      toast.error(t('contractor_type.error.invalid_corr_account'));
      return false;
    }
    return true;
  };

  const handleEnrichByInn = async () => {
    const inn = formData.inn?.trim();
    if (!inn) {
      toast.error(t('contractor_type.error.enter_inn'));
      return;
    }
    setIsEnrichLoading(true);
    try {
      const response = await api.get(`/enrichment/lookup-by-inn/${inn}`);
      const data = response?.data;
      if (data) {
        if (data.name) handleChange('name', data.name);
        if (data.fullName) handleChange('fullName', data.fullName);
        if (data.inn) handleChange('inn', data.inn);
        if (data.kpp) handleChange('kpp', data.kpp);
        if (data.ogrn) handleChange('ogrn', data.ogrn);
        if (data.legalAddress) handleChange('legalAddress', data.legalAddress);
        if (data.director) handleChange('director', data.director);
        if (data.directorPosition) handleChange('directorPosition', data.directorPosition);
        if (data.okved) handleChange('okved', data.okved);
        if (data.okvedName) handleChange('okvedName', data.okvedName);
        if (data.okpo) handleChange('okpo', data.okpo);
        if (data.okato) handleChange('okato', data.okato);
        toast.success(t('contractor_sheet.action.comparison.success_enriched'));
      }
    } catch (err) {
      console.error('Failed to enrich by INN:', err);
    } finally {
      setIsEnrichLoading(false);
    }
  };

  const handleSaveBank = () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.bik) {
      toast.error(t('contractor_type.error.fill_required_fields'));
      return;
    }
    if (!validateBankAccount(bankForm)) return;
    const currentAccounts = formData.bankAccounts || [];
    if (editingBankId) {
      const updated = currentAccounts.map(acc => acc.id === editingBankId ? { ...acc, ...bankForm } as BankAccount : acc);
      handleChange("bankAccounts", updated);
    } else {
      const account: BankAccount = {
        id: `ba_${Date.now()}`,
        bankName: bankForm.bankName!,
        bik: bankForm.bik!,
        accountNumber: bankForm.accountNumber!,
        correspondentAccount: bankForm.correspondentAccount || "",
        currency: bankForm.currency || "RUB",
        isPrimary: currentAccounts.length === 0,
      };
      handleChange("bankAccounts", [...currentAccounts, account]);
    }
    setIsBankSheetOpen(false);
    setBankForm(EMPTY_BANK);
    setEditingBankId(null);
  };

  const removeBank = (id: string) => {
    handleChange("bankAccounts", (formData.bankAccounts || []).filter(acc => acc.id !== id));
  };

  const setPrimaryBank = (id: string) => {
    handleChange("bankAccounts", (formData.bankAccounts || []).map(acc => ({ ...acc, isPrimary: acc.id === id })));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* При создании скрываем всё, что уже есть в основной форме (ИНН, Адрес, ФИО) */}
        {!isCreating && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              {t('contractor_sheet.section.requisites')}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">{t('contractor_sheet.field.full_name')}</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={formData.fullName || ""} onChange={(e) => handleChange("fullName", e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase">{t('contractor_sheet.field.registration_date')}</Label>
                <DatePicker value={formData.registrationDate || ""} onChange={(date) => handleChange("registrationDate", date)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase">{t('contractor_sheet.field.inn')}</Label>
                <Input value={formData.inn || ""} onChange={(e) => handleChange("inn", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">{t('contractor_sheet.field.legal_address')}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={formData.legalAddress || ""} onChange={(e) => handleChange("legalAddress", e.target.value)} className="pl-9" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CreditCard className="w-4 h-4 text-primary" />
                {t('contractor_sheet.section.banks')}
            </div>
            <Button size="sm" variant="ghost" onClick={openAddBank}>
                <Plus className="w-4 h-4 mr-2" />
                {t('contractor_sheet.action.add_bank')}
            </Button>
        </div>

        <div className="space-y-3">
            {formData.bankAccounts?.map((account) => (
                <div key={account.id} className="border rounded-md p-3 relative bg-card flex gap-3 items-start group hover:border-primary/50 transition-colors">
                    <div className="p-2 bg-muted/30 rounded text-muted-foreground">
                        <Landmark className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{account.bankName}</span>
                            {account.isPrimary && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-blue-200">{t('generated.osnovnoy')}</span>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            <div>{t('generated.bik')}: {account.bik}</div>
                            <div className="font-mono">{account.accountNumber}</div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => openEditBank(account)}>
                            <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeBank(account.id)}>
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            ))}
            {(!formData.bankAccounts || formData.bankAccounts.length === 0) && (
                <div className="text-center py-6 text-muted-foreground text-xs border border-dashed rounded-md bg-muted/10">
                    {t('contractor_sheet.placeholder.no_banks')}
                </div>
            )}
        </div>
      </div>

      <ResizableSheet 
        open={isBankSheetOpen} 
        onOpenChange={setIsBankSheetOpen}
        moduleKey="contractor-requisites-bank"
        defaultWidth="sm"
        title={editingBankId ? t('common.edit') : t('contractor_sheet.action.add_bank')}
        description={t('contractor_sheet.action.add_bank_desc')}
        onSave={handleSaveBank}
      >
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label>{t('contractor_sheet.field.bik')}</Label>
                <Input value={bankForm.bik || ""} onChange={(e) => setBankForm({...bankForm, bik: e.target.value})} maxLength={9} />
            </div>
            <div className="grid gap-2">
                <Label>{t('contractor_sheet.field.bank_name')}</Label>
                <Input value={bankForm.bankName || ""} onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})} />
            </div>
            <div className="grid gap-2">
                <Label>{t('contractor_sheet.field.account_number')}</Label>
                <Input value={bankForm.accountNumber || ""} onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})} maxLength={20} />
            </div>
            <div className="grid gap-2">
                <Label>{t('contractor_sheet.field.currency')}</Label>
                <Select value={bankForm.currency || "RUB"} onValueChange={(v) => setBankForm({...bankForm, currency: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{currencies.map(c => <SelectItem key={c.id} value={c.id}>{c.id} — {c.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>
      </ResizableSheet>
    </div>
  );
}

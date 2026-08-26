import { Label } from "@/components/ui/label";
import { useCurrencies } from '@/hooks/useCurrencies';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, DollarSign, Plus, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LegalCase, RecoveredItem, ExpenseItem } from "../../types";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntityCombobox } from "@/components/shared/EntityCombobox";
import type { ComboboxOption } from "@/components/shared/EntityCombobox";
import { Contractor } from "@/modules/contractors";

interface CaseFinanceTabProps {
  formData: Partial<LegalCase>;
  handleChange: (field: keyof LegalCase, value: unknown) => void;
  contractors?: Contractor[];
  onCreateContractor?: (name: string) => Promise<string>;
}

export function CaseFinanceTab({ 
  formData, 
  handleChange,
  contractors = [],
  onCreateContractor
}: CaseFinanceTabProps) {
  const { t } = useTranslation();
  const { data: currencies = [] } = useCurrencies();

  const handleCurrencyChange = (value: string) => {
    handleChange("claimAmount", { ...formData.claimAmount, currency: value });
  };

  const handleClaimAmountChange = (value: number) => {
    handleChange("claimAmount", { ...formData.claimAmount, amount: value });
  };

  const handleRecoveredAmountChange = (value: number) => {
    handleChange("recoveredAmount", { ...formData.recoveredAmount, amount: value });
  };

  // Block 1 Calc - Сумма иска
  const totalClaim = (formData.claimAmount?.amount || 0) + 
                     (formData.stateDuty || 0) + 
                     (formData.expertiseCost || 0) + 
                     (formData.otherClaimCosts || 0);

  // Block 2 Calc - Взыскано
  const totalRecovered = (formData.recoveredAmount?.amount || 0) +
                         (formData.recoveredItems || []).reduce((sum, item) => sum + item.amount, 0);

  // Block 3 Calc - Расходы
  const totalExpenses = (formData.transportExpenses || 0) + 
                        (formData.translationExpenses || 0) + 
                        (formData.otherExpenses || 0) +
                        (formData.expenses || []).reduce((sum, item) => sum + item.amount, 0);

  // ИТОГ = сумма иска - расходы
  const netResult = totalClaim - totalExpenses;

  // ── Взысканные суммы (таблица) ──────────────────────────────────────────────────

  const handleAddRecoveredItem = () => {
    const newItem: RecoveredItem = {
      id: `ri-${Date.now()}`,
      type: "",
      amount: 0,
      currency: formData.recoveredAmount?.currency || "RUB"
    };
    handleChange("recoveredItems", [...(formData.recoveredItems || []), newItem]);
  };

  const handleRecoveredItemChange = (index: number, field: keyof RecoveredItem, value: unknown) => {
    const newItems = [...(formData.recoveredItems || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    handleChange("recoveredItems", newItems);
  };

  const handleRemoveRecoveredItem = (index: number) => {
    const newItems = [...(formData.recoveredItems || [])];
    newItems.splice(index, 1);
    handleChange("recoveredItems", newItems);
  };

  // ── Расходы (таблица) ──────────────────────────────────────────────────

  const handleAddExpenseItem = () => {
    const newItem: ExpenseItem = {
      id: `ex-${Date.now()}`,
      type: "",
      performer: "",
      amount: 0,
      currency: formData.recoveredAmount?.currency || "RUB"
    };
    handleChange("expenses", [...(formData.expenses || []), newItem]);
  };

  const handleExpenseItemChange = (index: number, field: keyof ExpenseItem, value: unknown) => {
    const newItems = [...(formData.expenses || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    handleChange("expenses", newItems);
  };

  const handleRemoveExpenseItem = (index: number) => {
    const newItems = [...(formData.expenses || [])];
    newItems.splice(index, 1);
    handleChange("expenses", newItems);
  };

  return (
    <div className="space-y-6">

      {/* 1. Расчет требований */}
      <div className="p-4 bg-muted/20 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">{t('lawyers.case_sheet.finance.claim_block')}</h3>
        </div>
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                    <Label className="text-xs">{t('lawyers.case_sheet.finance.claim_sum')}</Label>
                    <MoneyInput
                        value={formData.claimAmount?.amount || 0}
                        onValueChange={handleClaimAmountChange}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">{t('lawyers.case_sheet.finance.currency')}</Label>
                    <Select value={formData.claimAmount?.currency || "RUB"} onValueChange={handleCurrencyChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {currencies.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label className="text-xs">{t('lawyers.case_sheet.field.state_duty')}</Label>
                    <MoneyInput
                        value={formData.stateDuty || 0}
                        onValueChange={(v) => handleChange("stateDuty", v)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">{t('lawyers.case_sheet.finance.expertise')}</Label>
                    <MoneyInput
                        value={formData.expertiseCost || 0}
                        onValueChange={(v) => handleChange("expertiseCost", v)}
                    />
                </div>
            </div>
            <div className="space-y-1">
                <Label className="text-xs">{t('lawyers.case_sheet.finance.other')}</Label>
                <MoneyInput
                    value={formData.otherClaimCosts || 0}
                    onValueChange={(v) => handleChange("otherClaimCosts", v)}
                />
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>{t('lawyers.case_sheet.finance.total_claim')}:</span>
                <span className="text-primary">
                    {new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(totalClaim)} {formData.claimAmount?.currency}
                </span>
            </div>
        </div>
      </div>

      {/* 2. Фактическое взыскание */}
      <div className="p-4 bg-muted/20 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-green-600" />
          <h3 className="font-semibold text-sm">{t('lawyers.case_sheet.finance.recovery_block')}</h3>
        </div>
        <div className="space-y-3">
            <div className="space-y-1">
                <Label className="text-xs">{t('lawyers.case_sheet.finance.recovered')}</Label>
                <MoneyInput
                    value={formData.recoveredAmount?.amount || 0}
                    onValueChange={handleRecoveredAmountChange}
                />
            </div>
            
            {/* Таблица взысканных сумм */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs">{t('lawyers.case_sheet.finance.recovered_items')}</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 gap-1 text-xs" 
                  onClick={handleAddRecoveredItem}
                >
                  <Plus className="w-3 h-3" /> {t('lawyers.case_sheet.finance.add_item')}
                </Button>
              </div>
              
              {(formData.recoveredItems || []).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">{t('lost.net')}</p>
              ) : (
                <div className="space-y-2">
                  {(formData.recoveredItems || []).map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-center bg-background p-2 rounded border border-border">
                      <Input
                        value={item.type}
                        onChange={(e) => handleRecoveredItemChange(index, "type", e.target.value)}
                        placeholder={t('lawyers.case_sheet.finance.item_type')}
                        className="w-1/4 h-8 text-sm"
                      />
                      <MoneyInput
                        value={item.amount}
                        onValueChange={(v) => handleRecoveredItemChange(index, "amount", v)}
                        className="w-1/4 h-8 text-sm"
                      />
                      <Select 
                        value={item.currency} 
                        onValueChange={(v) => handleRecoveredItemChange(index, "currency", v)}
                      >
                        <SelectTrigger className="w-20 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive" 
                        onClick={() => handleRemoveRecoveredItem(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="space-y-1">
                    <Label className="text-xs">{t('lawyers.case_sheet.finance.enforcement_fee')}</Label>
                    <MoneyInput
                        value={formData.enforcementFee || 0}
                        onValueChange={(v) => handleChange("enforcementFee", v)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">{t('lawyers.case_sheet.finance.execution_costs')}</Label>
                    <MoneyInput
                        value={formData.executionCosts || 0}
                        onValueChange={(v) => handleChange("executionCosts", v)}
                    />
                </div>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>{t('lawyers.case_sheet.finance.net_client')}:</span>
                <span className="text-green-600">
                    {new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(totalRecovered - formData.enforcementFee! - formData.executionCosts!)} {formData.recoveredAmount?.currency}
                </span>
            </div>
        </div>
      </div>

      {/* 3. Расходы на дело */}
      <div className="p-4 bg-muted/20 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-sm">{t('lawyers.case_sheet.finance.expenses_block')}</h3>
        </div>
        <div className="space-y-3">
          {/* Таблица расходов */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">{t('lawyers.case_sheet.finance.expenses_detail')}</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-6 gap-1 text-xs" 
                onClick={handleAddExpenseItem}
              >
                <Plus className="w-3 h-3" /> {t('lawyers.case_sheet.finance.add_item')}
              </Button>
            </div>
            
            {(formData.expenses || []).length === 0 ? (
              <p className="text-xs text-muted-foreground italic">{t('lost.net')}</p>
            ) : (
              <div className="space-y-2">
                {(formData.expenses || []).map((item, index) => (
                  <div key={item.id} className="flex gap-2 items-center bg-background p-2 rounded border border-border">
                    <Input
                      value={item.type}
                      onChange={(e) => handleExpenseItemChange(index, "type", e.target.value)}
                      placeholder={t('lawyers.case_sheet.finance.item_type')}
                      className="w-1/5 h-8 text-sm"
                    />
                    <EntityCombobox
                      value={item.performer}
                      onChange={(v) => handleExpenseItemChange(index, "performer", String(v ?? ''))}
                      options={contractors.map(c => ({ id: c.name, label: c.name } as ComboboxOption))}
                      placeholder={t('lawyers.case_sheet.finance.item_performer')}
                      onCreate={onCreateContractor}
                      className="w-1/5"
                    />
                    <MoneyInput
                      value={item.amount}
                      onValueChange={(v) => handleExpenseItemChange(index, "amount", v)}
                      className="w-1/5 h-8 text-sm"
                    />
                    <Select 
                      value={item.currency} 
                      onValueChange={(v) => handleExpenseItemChange(index, "currency", v)}
                    >
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive" 
                      onClick={() => handleRemoveExpenseItem(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="space-y-1">
                  <Label className="text-xs">{t('lawyers.case_sheet.finance.transport')}</Label>
                  <MoneyInput
                      value={formData.transportExpenses || 0}
                      onValueChange={(v) => handleChange("transportExpenses", v)}
                  />
              </div>
              <div className="space-y-1">
                  <Label className="text-xs">{t('lawyers.case_sheet.finance.translation')}</Label>
                  <MoneyInput
                      value={formData.translationExpenses || 0}
                      onValueChange={(v) => handleChange("translationExpenses", v)}
                  />
              </div>
              <div className="space-y-1">
                  <Label className="text-xs">{t('lawyers.case_sheet.finance.other')}</Label>
                  <MoneyInput
                      value={formData.otherExpenses || 0}
                      onValueChange={(v) => handleChange("otherExpenses", v)}
                  />
              </div>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>{t('lawyers.case_sheet.finance.total_expenses')}:</span>
              <span>{new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(totalExpenses)} RUB</span>
          </div>
        </div>
      </div>

      {/* ИТОГ */}
      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">{t('lawyers.case_sheet.finance.net_client')} (ИТОГ):</h3>
          <span className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(netResult)} {formData.claimAmount?.currency}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('lawyers.case_sheet.finance.total_claim')} - {t('lawyers.case_sheet.finance.total_expenses')}
        </p>
      </div>

      <div className="space-y-2 pt-2">
        <Label className="text-sm font-medium">{t('lawyers.case_sheet.finance.lawyer_fee')}</Label>
        <MoneyInput
            className="font-semibold text-lg"
            value={formData.price || 0}
            onValueChange={(v) => handleChange("price", v)}
        />
      </div>
    </div>
  );
}

import React from "react";
import { useTranslation } from "@/lib/i18n";
import { ResizableSheet } from "@/components/shared";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { BankAccount } from "../../../types/contractor.types";
import { Currency } from "@/hooks/useCurrencies";

interface BankFormSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bankForm: Partial<BankAccount>;
  setBankForm: (form: Partial<BankAccount>) => void;
  onSave: () => void;
  editingBankId: string | null;
  currencies: Currency[];
}

export const BankFormSheet = ({
  isOpen,
  onOpenChange,
  bankForm,
  setBankForm,
  onSave,
  editingBankId,
  currencies,
}: BankFormSheetProps) => {
  const { t } = useTranslation();

  return (
    <ResizableSheet 
      open={isOpen} 
      onOpenChange={onOpenChange}
      moduleKey="contractors_bank"
      defaultWidth="sm"
      title={editingBankId ? t('common.edit') : t('contractor_sheet.action.add_bank')}
      description={t('contractor_sheet.action.add_bank_desc')}
      onSave={onSave}
    >
      <div className="grid gap-6 py-6">
          <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">{t('contractor_sheet.field.bik')}</Label>
              <Input value={bankForm.bik || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankForm({...bankForm, bik: e.target.value})} maxLength={9} className="h-11 font-mono" placeholder="044525225" />
          </div>
          <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">{t('contractor_sheet.field.bank_name')}</Label>
              <Input value={bankForm.bankName || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankForm({...bankForm, bankName: e.target.value})} className="h-11" />
          </div>
          <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">{t('contractor_sheet.field.account_number')}</Label>
              <Input value={bankForm.accountNumber || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankForm({...bankForm, accountNumber: e.target.value})} maxLength={30} className="h-11 font-mono" placeholder="40702810..." />
          </div>
          <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">{t('contractor_sheet.field.corr_account')}</Label>
              <Input value={bankForm.correspondentAccount || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankForm({...bankForm, correspondentAccount: e.target.value})} maxLength={20} className="h-11 font-mono" placeholder="30101810..." />
          </div>
          <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">SWIFT</Label>
              <Input value={bankForm.swift || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankForm({...bankForm, swift: e.target.value})} maxLength={20} className="h-11 font-mono" placeholder="SWIFT CODE" />
          </div>
          <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">{t('contractor_sheet.field.currency')}</Label>
              <Select value={bankForm.currency || "RUB"} onValueChange={(v: string) => setBankForm({...bankForm, currency: v})}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[120]">{currencies.map(c => <SelectItem key={c.id} value={c.id}>{c.id} — {c.name}</SelectItem>)}</SelectContent>
              </Select>
          </div>
      </div>
    </ResizableSheet>
  );
};

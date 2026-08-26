import React from "react";
import { 
  CreditCard, 
  Plus, 
  Landmark, 
  Pencil, 
  Trash2 
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Contractor, BankAccount } from "../../../types/contractor.types";

interface BankAccountsSectionProps {
  formData: Partial<Contractor>;
  onAdd: () => void;
  onEdit: (account: BankAccount) => void;
  onRemove: (id: string) => void;
}

export const BankAccountsSection = ({
  formData,
  onAdd,
  onEdit,
  onRemove,
}: BankAccountsSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-1 pt-4">
       <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
            <CreditCard className="w-3.5 h-3.5" />
            {t('contractor_sheet.section.banks')}
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1 font-bold uppercase tracking-tight" onClick={onAdd}>
            <Plus className="w-3 h-3" />
            {t('common.add')}
          </Button>
       </div>
       
       <div className="grid gap-2 px-1">
          {formData.bankAccounts?.map((account) => (
            <div key={account.id} className="group border rounded-xl p-3 relative bg-card/50 flex gap-4 items-center hover:border-primary/50 transition-all">
                <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Landmark className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm truncate">{account.bankName}</span>
                        {account.isPrimary && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-green-500/10 text-green-600 border-green-500/20">{t('generated.osnovnoy')}</Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                        <span>{t('contractor_sheet.field.bik')} {account.bik}</span>
                        <span className="opacity-50">•</span>
                        <span>{account.accountNumber}</span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1 ml-auto font-sans">{account.currency}</Badge>
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full" onClick={() => onEdit(account)}>
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full" onClick={() => onRemove(account.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
          ))}
          {(!formData.bankAccounts || formData.bankAccounts.length === 0) && (
            <Button
              variant="outline"
              className="w-full border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center gap-2 h-12 rounded-xl transition-colors bg-white font-normal"
              onClick={onAdd}
            >
              <Plus className="w-4 h-4" />
              <span>{t('contractor_sheet.placeholder.no_banks')}</span>
            </Button>
          )}
       </div>
    </div>
  );
};

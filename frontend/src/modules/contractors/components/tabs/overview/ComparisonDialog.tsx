import React from "react";
import { 
  RefreshCw, 
  ArrowRight, 
  Check, 
  AlertTriangle 
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Contractor } from "../../../types/contractor.types";
import { LegalFormItem } from "@/modules/settings/types/settings.types";

interface ComparisonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<Contractor>;
  comparisonData: Partial<Contractor> | null;
  onApply: () => void;
  legalFormsList: LegalFormItem[];
}

export const ComparisonDialog = ({
  isOpen,
  onOpenChange,
  formData,
  comparisonData,
  onApply,
  legalFormsList,
}: ComparisonDialogProps) => {
  const { t } = useTranslation();

  const comparisonFields = [
    { key: 'name', label: t('contractor_sheet.field.name') },
    { key: 'fullName', label: t('contractor_sheet.field.full_name') },
    { key: 'inn', label: t('contractor_sheet.field.inn') },
    { key: 'kpp', label: t('contractor_sheet.field.kpp') },
    { key: 'ogrn', label: t('contractor_sheet.field.ogrn') },
    { key: 'legalAddress', label: t('contractor_sheet.field.legal_address') },
    { key: 'director', label: t('contractor_sheet.field.director') },
    { key: 'directorPosition', label: t('contractor_sheet.field.position') },
    { key: 'okved', label: t('contractor_sheet.field.okved') },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 z-[120]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            {t('contractor_sheet.action.comparison.title')}
          </DialogTitle>
          <DialogDescription>
            {t('contractor_sheet.action.comparison.description')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-2">
          <div className="space-y-1">
            {comparisonFields.map((field) => {
              const oldValue = (formData as Record<string, unknown>)[field.key] || "—";
              const newValue = (comparisonData as Record<string, unknown>)?.[field.key] || "—";
              const isDifferent = String(oldValue).trim() !== String(newValue).trim() && newValue !== "—";

              return (
                <div 
                  key={field.key} 
                  className={cn(
                    "grid grid-cols-11 gap-2 items-center py-3 border-b border-border/50 last:border-0",
                    isDifferent && "bg-emerald-50/30 -mx-2 px-2 rounded-md"
                  )}
                >
                  <div className="col-span-3 text-[10px] font-bold text-muted-foreground uppercase">
                    {field.label}
                  </div>
                  <div className="col-span-3 text-xs text-muted-foreground line-clamp-2">
                    {String(oldValue)}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {isDifferent ? (
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className={cn(
                      "col-span-4 text-xs font-semibold line-clamp-2",
                      isDifferent ? "text-emerald-700" : "text-foreground"
                  )}>
                    {String(newValue)}
                  </div>
                </div>
              );
            })}
          </div>
          
          {comparisonData?.legalForm && String(formData.legalForm) !== String(comparisonData.legalForm) && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 items-start">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                      <span className="font-bold mr-1">{t('common.warning')}:</span> {t('contractor_sheet.action.comparison.warning_legal_form')} 
                      <span className="font-bold ml-1">
                          {legalFormsList.find(f => f.id === comparisonData.legalForm)?.name || comparisonData.legalForm}
                      </span>.
                  </div>
              </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 border-t bg-muted/20">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onApply} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {t('contractor_sheet.action.comparison.apply_action')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { User, Building2, Trophy } from "lucide-react";
import { EntityCombobox } from "@/components/shared/EntityCombobox";
import type { ComboboxOption } from "@/components/shared/EntityCombobox";
import { Contractor } from "@/modules/contractors";
import { StatusItem } from "@/lib/settings-data";
import { useOutcomes } from "@/components/ui/status-system";

interface CaseBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (updates: Partial<{
    client: string;
    status: string;
    lawyerId: string;
    lawyerName: string;
    plaintiff: string;
    defendant: string;
    outcome: string;
  }>) => void;
  lawyers: Array<{ id: string; name: string }>;
  contractors: Contractor[];
  caseStatuses: StatusItem[];
}

export function CaseBulkEditDialog({
  open,
  onOpenChange,
  onConfirm,
  lawyers,
  contractors,
  caseStatuses,
}: CaseBulkEditDialogProps) {
  const { t } = useTranslation();
  const { outcomes } = useOutcomes();

  const [editFields, setEditFields] = useState({
    client: '' as string | null,
    status: '' as string | null,
    lawyerId: '' as string | null,
    lawyerName: '' as string | null,
    plaintiff: '' as string | null,
    defendant: '' as string | null,
    outcome: '' as string | null,
  });

  const handleConfirm = () => {
    const updates: Partial<{
      client: string;
      status: string;
      lawyerId: string;
      lawyerName: string;
      plaintiff: string;
      defendant: string;
      outcome: string;
    }> = {};

    if (editFields.client) updates.client = editFields.client;
    if (editFields.status) updates.status = editFields.status;
    if (editFields.lawyerId) {
      updates.lawyerId = editFields.lawyerId;
      const lawyer = lawyers.find(l => l.id === editFields.lawyerId);
      if (lawyer) updates.lawyerName = lawyer.name;
    }
    if (editFields.plaintiff) updates.plaintiff = editFields.plaintiff;
    if (editFields.defendant) updates.defendant = editFields.defendant;
    if (editFields.outcome) updates.outcome = editFields.outcome;

    onConfirm(updates);
    setEditFields({
      client: null,
      status: null,
      lawyerId: null,
      lawyerName: null,
      plaintiff: null,
      defendant: null,
      outcome: null,
    });
  };

  const handleCancel = () => {
    setEditFields({
      client: null,
      status: null,
      lawyerId: null,
      lawyerName: null,
      plaintiff: null,
      defendant: null,
      outcome: null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('lawyers.bulk_edit.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Клиент */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {t('lawyers.case_sheet.field.client')}
            </Label>
            <EntityCombobox
              value={editFields.client || ''}
              onChange={(v) => setEditFields(prev => ({ ...prev, client: (v || null) as string | null }))}
              options={contractors.map(c => ({ id: c.name, label: c.name } as ComboboxOption))}
              placeholder={t('lawyers.case_sheet.field.client')}
            />
          </div>

          {/* Статус */}
          <div className="space-y-2">
            <Label>{t('common.status')}</Label>
            <Select
              value={editFields.status || ''}
              onValueChange={(v) => setEditFields(prev => ({ ...prev, status: (v || null) as string | null }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('lawyers.bulk_edit.select_status')} />
              </SelectTrigger>
              <SelectContent>
                {caseStatuses.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Юрист */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('lawyers.table.lawyer')}
            </Label>
            <Select
              value={editFields.lawyerId || ''}
              onValueChange={(v) => {
                const lawyer = lawyers.find(l => l.id === v);
                setEditFields(prev => ({
                  ...prev,
                  lawyerId: (v || null) as string | null,
                  lawyerName: lawyer?.name || null,
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('lawyers.bulk_edit.select_lawyer')} />
              </SelectTrigger>
              <SelectContent>
                {lawyers.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Истец */}
          <div className="space-y-2">
            <Label>{t('lawyers.case_sheet.field.plaintiff')}</Label>
            <EntityCombobox
              value={editFields.plaintiff || ''}
              onChange={(v) => setEditFields(prev => ({ ...prev, plaintiff: (v || null) as string | null }))}
              options={contractors.map(c => ({ id: c.name, label: c.name } as ComboboxOption))}
              placeholder={t('generated.vyberite_isttsa')}
            />
          </div>

          {/* Ответчик */}
          <div className="space-y-2">
            <Label>{t('lawyers.case_sheet.field.defendant')}</Label>
            <EntityCombobox
              value={editFields.defendant || ''}
              onChange={(v) => setEditFields(prev => ({ ...prev, defendant: (v || null) as string | null }))}
              options={contractors.map(c => ({ id: c.name, label: c.name } as ComboboxOption))}
              placeholder={t('generated.vyberite_otvetchika')}
            />
          </div>

          {/* Результат */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              {t('lawyers.case_sheet.field.outcome')}
            </Label>
            <Select
              value={editFields.outcome || ''}
              onValueChange={(v) => setEditFields(prev => ({ ...prev, outcome: (v || null) as string | null }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('lawyers.bulk_edit.select_outcome')} />
              </SelectTrigger>
              <SelectContent>
                {outcomes.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

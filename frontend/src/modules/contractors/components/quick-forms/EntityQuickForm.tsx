import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserSelect } from "@/components/shared/UserSelect";
import { useTranslation } from "@/lib/i18n";

interface EntityQuickFormProps {
  type: 'task' | 'claim' | 'project';
  contractorName: string;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  statuses: Array<{ id: string; name: string }>;
  priority: string;
  setPriority: (v: string) => void;
  priorities: Array<{ id: string; name: string }>;
  assignee: string;
  setAssignee: (v: string) => void;
  typeValue: string;
  setTypeValue: (v: string) => void;
  caseTypes: Array<{ id: string; name: string }>;
  projectTypes: Array<{ id: string; name: string }>;
}

export function EntityQuickForm({
  type,
  contractorName,
  title,
  setTitle,
  description,
  setDescription,
  status,
  setStatus,
  statuses,
  priority,
  setPriority,
  priorities,
  assignee,
  setAssignee,
  typeValue,
  setTypeValue,
  caseTypes,
  projectTypes,
}: EntityQuickFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 px-1">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-muted-foreground tracking-tight">{t('generated.nazvanie')}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={contractorName}
          className="text-lg font-medium"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-muted-foreground tracking-tight">{t('generated.opisanie')}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statuses.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground tracking-tight">{t('common.status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('contractor_sheet.placeholder.select_status')} />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {priorities.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground tracking-tight">{t('common.priority')}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder={t('contractor_sheet.placeholder.select_priority')} />
              </SelectTrigger>
              <SelectContent>
                {priorities.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-muted-foreground tracking-tight">{t('common.assignee')}</Label>
        <UserSelect 
          value={assignee} 
          onValueChange={setAssignee} 
        />
      </div>

      {type === 'claim' && caseTypes.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground tracking-tight">{t('contractor_sheet.field.case_type')}</Label>
          <Select value={typeValue} onValueChange={setTypeValue}>
            <SelectTrigger>
              <SelectValue placeholder={t('contractor_sheet.placeholder.select_type')} />
            </SelectTrigger>
            <SelectContent>
              {caseTypes.map(ct => (
                <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === 'project' && projectTypes.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground tracking-tight">{t('contractor_sheet.field.project_type')}</Label>
          <Select value={typeValue} onValueChange={setTypeValue}>
            <SelectTrigger>
              <SelectValue placeholder={t('contractor_sheet.placeholder.select_type')} />
            </SelectTrigger>
            <SelectContent>
              {projectTypes.map(pt => (
                <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

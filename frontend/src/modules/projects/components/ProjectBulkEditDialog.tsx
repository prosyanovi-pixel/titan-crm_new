import { useState, useEffect } from "react";
import { ResizableSheet } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { Project } from "../types";
import { useSettings } from "@/hooks/use-settings";

interface ProjectBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: keyof Project, value: unknown) => void;
  count: number;
}

interface ReferenceOption {
  id: string;
  name: string;
}

interface ProjectReferences {
  statuses: ReferenceOption[];
  priorities: ReferenceOption[];
  managers: ReferenceOption[];
  projectStatuses?: ReferenceOption[];
}

export function ProjectBulkEditDialog({ open, onOpenChange, onSave, count }: ProjectBulkEditDialogProps) {
  const { t } = useTranslation();
  const settings = useSettings();
  const [field, setField] = useState<string>("status");
  const [value, setValue] = useState<string>("");
  
  const statuses = settings.projectStatuses || [];
  const priorities = settings.priorities || [];
  const managers = (settings.managers || []) as { id: string, name: string }[];

  const handleSave = () => {
    if (field && value) {
      onSave(field as keyof Project, value);
      onOpenChange(false);
      setValue("");
    }
  };

  return (
    <ResizableSheet 
      open={open} 
      onOpenChange={onOpenChange}
      moduleKey="project-bulk-edit"
      defaultWidth="sm"
      title={`${t('projects.bulk_edit.title')} (${count})`}
      description={t('common.bulk_edit.description')}
      onSave={handleSave}
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label>{t('projects.bulk_edit.field')}</Label>
          <Select value={field} onValueChange={setField}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">{t('common.status')}</SelectItem>
              <SelectItem value="priority">{t('common.priority')}</SelectItem>
              <SelectItem value="manager">{t('common.manager')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t('projects.bulk_edit.value')}</Label>
          {field === "status" && (
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {field === "priority" && (
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {field === "manager" && (
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </ResizableSheet>
  );
}

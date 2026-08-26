// frontend/src/modules/projects/components/ProjectsFilterContent.tsx
import { useTranslation } from "@/lib/i18n";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/use-settings";
import type { ReferenceData } from "../hooks/useProjectsPage.types";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ProjectsFilterContentProps {
  references: ReferenceData;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  managerFilter: string;
  onManagerChange: (v: string) => void;
  hideArchived: boolean;
  onHideArchivedChange: (v: boolean) => void;
  isTreeView: boolean;
  onTreeViewChange: (v: boolean) => void;
}

export function ProjectsFilterContent({
  references,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  managerFilter,
  onManagerChange,
  hideArchived,
  onHideArchivedChange,
  isTreeView,
  onTreeViewChange,
}: ProjectsFilterContentProps) {
  const { t } = useTranslation();
  const { getStatusesByModule, getPrioritiesByModule } = useSettings();

  const statuses = references.projectStatuses.length
    ? references.projectStatuses
    : getStatusesByModule("projects");

  const priorities = references.priorities.length
    ? references.priorities
    : getPrioritiesByModule("projects");

  return (
    <div className="p-2 space-y-4">
      <div className="flex flex-col gap-3 px-2 py-1">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="hide-archived" 
            checked={hideArchived} 
            onCheckedChange={(checked) => onHideArchivedChange(checked as boolean)}
          />
          <Label htmlFor="hide-archived" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
            {t('projects.filters.hide_archived')}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="is-tree-view" 
            checked={isTreeView} 
            onCheckedChange={(checked) => onTreeViewChange(checked as boolean)}
          />
          <Label htmlFor="is-tree-view" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
            {t('projects.filters.tree_view')}
          </Label>
        </div>
      </div>

      <DropdownMenuSeparator />
      <DropdownMenuLabel>{t("projects.filters.status_label")}</DropdownMenuLabel>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("projects.filters.all")}</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DropdownMenuSeparator />
      <DropdownMenuLabel>{t("projects.filters.priority_label")}</DropdownMenuLabel>
      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("projects.filters.all")}</SelectItem>
          {priorities.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DropdownMenuSeparator />
      <DropdownMenuLabel>{t("projects.filters.manager_label")}</DropdownMenuLabel>
      <Select value={managerFilter} onValueChange={onManagerChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("projects.filters.all")}</SelectItem>
          {references.managers.map((user) => (
            <SelectItem key={user.id} value={user.name}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

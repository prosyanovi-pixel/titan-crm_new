import React from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TaskReferences } from "../hooks/useTasksPage";

interface TasksFilterContentProps {
  references: TaskReferences;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  assigneeFilter: string;
  onAssigneeChange: (v: string) => void;
  hideArchived: boolean;
  onHideArchivedChange: (v: boolean) => void;
}

export function TasksFilterContent({
  references,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  assigneeFilter,
  onAssigneeChange,
  hideArchived,
  onHideArchivedChange,
}: TasksFilterContentProps) {
  const { t } = useTranslation();

  return (
    <div className="p-2 space-y-4">
      <div className="flex items-center space-x-2 px-2 py-1">
        <Checkbox 
          id="hide-archived-tasks" 
          checked={hideArchived} 
          onCheckedChange={(checked) => onHideArchivedChange(checked as boolean)}
        />
        <Label htmlFor="hide-archived-tasks" className="text-sm font-medium leading-none cursor-pointer">
          {t('tasks.filters.hide_archived')}
        </Label>
      </div>

      <DropdownMenuSeparator />
      <DropdownMenuLabel>{t("tasks.filters.status_label")}</DropdownMenuLabel>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("tasks.filters.all")}</SelectItem>
          {references.taskStatuses.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DropdownMenuSeparator />
      <DropdownMenuLabel>{t("tasks.filters.priority_label")}</DropdownMenuLabel>
      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("tasks.filters.all")}</SelectItem>
          {references.priorities.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DropdownMenuSeparator />
      <DropdownMenuLabel>{t("tasks.filters.assignee_label")}</DropdownMenuLabel>
      <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("tasks.filters.all")}</SelectItem>
          {/* Note: In useTasksPage, users are fetched separately. We might need to pass them here or get them from references if they were there. */}
          {/* For now, let's assume we pass them as part of references or separate prop. */}
        </SelectContent>
      </Select>
    </div>
  );
}

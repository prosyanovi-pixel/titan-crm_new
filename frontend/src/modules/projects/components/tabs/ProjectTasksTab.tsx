
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/hooks/use-settings";
import { ProjectTask } from "../../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/shared/SortableTableHead";
import { useDataTable } from "@/hooks/useDataTable";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectTasksTabProps {
  tasks: ProjectTask[];
  onAddTask: () => void;
  onEditTask: (task: ProjectTask) => void;
  onToggleStatus?: (task: ProjectTask) => void;
}

export function ProjectTasksTab({ tasks, onAddTask, onEditTask, onToggleStatus }: ProjectTasksTabProps) {
  const { t } = useTranslation();
  const { priorities } = useSettings();

  const table = useDataTable<ProjectTask>({
    initialData: tasks,
    initialColumns: {
      title: true,
      status: true,
      dueDate: true,
      assignee: true,
    },
    storageKey: "project-tasks-table",
  });

  const getStatusStyle = (status: ProjectTask["status"]) => {
    switch (status) {
      case "Done": return "bg-green-100 text-green-700";
      case "In Progress": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityInfo = (priorityId: string) => {
    const priority = priorities.find(p => p.id === priorityId && p.module === 'tasks');
    if (!priority) return { name: priorityId, color: 'default' };

    let color = 'default';
    if (priority.level === 3) color = 'high';
    else if (priority.level === 2) color = 'medium';
    else if (priority.level === 1) color = 'low';

    return { name: priority.name, color };
  };

  const handleCheckboxChange = (task: ProjectTask, checked: boolean) => {
    if (onToggleStatus) {
      onToggleStatus(task);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">{t('tasks.title')}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <Button size="sm" onClick={onAddTask} className="h-8 gap-2">
            <Plus className="w-4 h-4" />
            {t('tasks.new_task')}
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 border rounded-lg border-dashed bg-muted/20">
          <p className="text-sm text-muted-foreground">{t('tasks.empty_column')}</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <SortableTableHead
                  label={t('tasks.table.title')}
                  width={table.columnWidths?.title}
                  onResize={(w) => table.setColumnWidth('title', w)}
                  onSort={() => {}}
                  direction={null}
                />
                <SortableTableHead
                  label={t('common.status')}
                  width={table.columnWidths?.status}
                  onResize={(w) => table.setColumnWidth('status', w)}
                  onSort={() => {}}
                  direction={null}
                />
                <SortableTableHead
                  label={t('tasks.table.due_date')}
                  width={table.columnWidths?.dueDate}
                  onResize={(w) => table.setColumnWidth('dueDate', w)}
                  onSort={() => {}}
                  direction={null}
                />
                <SortableTableHead
                  label={t('tasks.table.assignee')}
                  width={table.columnWidths?.assignee}
                  onResize={(w) => table.setColumnWidth('assignee', w)}
                  onSort={() => {}}
                  direction={null}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onEditTask(task)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={task.status === "Done"}
                      onCheckedChange={(checked) => handleCheckboxChange(task, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium" style={{ width: table.columnWidths?.title }}>
                    <div className="flex flex-col">
                        <span className={task.status === "Done" ? "line-through text-muted-foreground" : ""}>{task.title}</span>
                        <span className="text-xs text-muted-foreground font-mono">{task.identifier}</span>
                    </div>
                  </TableCell>
                  <TableCell style={{ width: table.columnWidths?.status }}>
                    <Badge variant="secondary" className={getStatusStyle(task.status)}>
                      {t(`tasks.status.${task.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground" style={{ width: table.columnWidths?.dueDate }}>
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {task.dueDate}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm" style={{ width: table.columnWidths?.assignee }}>{task.assignee}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

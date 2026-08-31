// frontend/src/modules/tasks/components/TaskList.tsx
import React, { useState } from "react";
import { Task } from "../types";
import { TaskTableRow } from "./TaskTableRow";
import { DataTable } from "@/components/ui/data-table";
import { SortConfig } from "@/hooks/useDataTable";

/** Объект состояния таблицы, передаваемый из useTasksPage */
interface TaskTableState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedIds: Set<string | number>;
  toggleSelection: (id: string | number) => void;
  toggleAllSelection: (items: Task[]) => void;
  clearSelection: () => void;
  visibleColumns: Record<string, boolean>;
  toggleColumnVisibility: (column: string, checked: boolean) => void;
  columnOrder: string[];
  moveColumn: (key: string, direction: 'up' | 'down') => void;
  columnWidths: Record<string, number>;
  setColumnWidth: (key: string, width: number) => void;
  sortConfig: SortConfig<Task> | null;
  handleSort: (key: keyof Task) => void;
  rowsPerPage: string;
  setRowsPerPage: (v: string) => void;
  currentPage: number;
  setCurrentPage: (p: number) => void;
}

interface TaskListProps {
  tasks: Task[];
  selectedIds: Set<string | number>;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onEdit: (task: Task) => void;
  onAction: (action: string, itemId: string | number) => void;
  table: TaskTableState;
  totalCount: number;
}

export function TaskList({
  tasks,
  selectedIds,
  visibleColumns,
  columnOrder,
  onEdit,
  onAction,
  table,
  totalCount,
}: TaskListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const columnLabels: Record<string, string> = {
    id: "tasks.table.id",
    title: "tasks.table.title",
    status: "common.status",
    priority: "common.priority",
    assignee: "tasks.table.assignee",
    dueDate: "tasks.table.due_date",
  };

  return (
    <DataTable
      table={table}
      data={tasks}
      columnLabels={columnLabels}
      totalCount={totalCount}
      hideToolbar={true}
      hidePagination={false}
      virtualized={true}
      renderRow={(task) => (
        <TaskTableRow
          key={task.id}
          task={task}
          level={0}
          isExpanded={expandedIds.has(task.id)}
          isSelected={selectedIds.has(task.id)}
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          onToggleSelection={(id) => table.toggleSelection(id)}
          onEdit={onEdit}
          onAction={onAction}
          onExpandChange={toggleExpand}
        />
      )}
    />
  );
}

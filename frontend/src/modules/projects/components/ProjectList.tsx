// frontend/src/modules/projects/components/ProjectList.tsx
import React, { useMemo, useState } from "react";
import { Project } from "../types";
import { ProjectTableRow } from "./ProjectTableRow";
import { DataTable, DataTableState } from "@/components/ui/data-table";
import { QuickAction } from "@/lib/settings-data";

/**
 * Свойства компонента ProjectList
 */
interface ProjectListProps {
  projects: Project[];
  selectedIds: Set<number>;
  onToggleSelection: (id: number) => void;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onReorderColumn?: (fromKey: string, toKey: string) => void;
  onEdit: (project: Project) => void;
  onDelete?: (id: number) => void;
  onSort?: (column: string) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  quickActions: QuickAction[];
  onAction: (action: string, project: Project) => void;
  columnWidths?: Record<string, number>;
  onResizeColumn?: (column: string, width: number) => void;
  table: DataTableState<Project>;
  totalCount: number;
}

export function ProjectList({
  projects,
  selectedIds,
  onToggleSelection,
  visibleColumns,
  columnOrder,
  onReorderColumn,
  onEdit,
  onDelete,
  onSort,
  sortConfig,
  onAction,
  quickActions,
  columnWidths,
  onResizeColumn,
  table,
  totalCount,
}: ProjectListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // "Flatten" tree for display
  const flattenedData = useMemo(() => {
    const result: Array<{ project: Project; level: number }> = [];
    const addRecursive = (items: Project[], level: number) => {
      items.forEach(p => {
        result.push({ project: p, level });
        if (p.subProjects && p.subProjects.length > 0 && expandedIds.has(p.id)) {
          addRecursive(p.subProjects, level + 1);
        }
      });
    };
    addRecursive(projects, 0);
    return result;
  }, [projects, expandedIds]);

  const columnLabels: Record<string, string> = {
    name: 'projects.table.name',
    client: 'projects.table.client',
    manager: 'projects.table.manager',
    status: 'projects.table.status',
    stage: 'projects.table.stage',
    priority: 'projects.table.priority',
    tags: 'projects.table.tags',
    budget: 'projects.table.budget',
    deadline: 'projects.table.deadline',
  };

  return (
    <DataTable<any>
      table={table as any}
      data={flattenedData}
      columnLabels={columnLabels}
      totalCount={totalCount}
      virtualized={true}
      renderRow={(item, index) => (
        <ProjectTableRow
          key={item.project.id}
          project={item.project}
          level={item.level}
          isExpanded={expandedIds.has(item.project.id)}
          isSelected={selectedIds.has(item.project.id)}
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          onToggleSelection={onToggleSelection}
          onEdit={onEdit}
          onAction={onAction}
          onExpandChange={toggleExpand}
          quickActions={quickActions}
        />
      )}
    />
  );
}

// frontend/src/modules/lawyers/components/LawyersList.tsx
import React from "react";
import { Lawyer } from "../types";
import { LawyerTableRow } from "./LawyerTableRow";
import { DataTable, DataTableState } from "@/components/ui/data-table";
import { QuickAction } from "@/lib/settings-data";

interface LawyersListProps {
  lawyers: Lawyer[];
  visibleColumns?: Record<string, boolean>;
  columnOrder?: string[];
  onEdit: (lawyer: Lawyer) => void;
  onAction?: (action: string, id: string | number) => void;
  quickActions?: QuickAction[];
  table: DataTableState<Lawyer>;
  totalCount: number;
}

export function LawyersList({
  lawyers,
  visibleColumns: visibleColumnsProp,
  columnOrder: columnOrderProp,
  onEdit,
  onAction,
  quickActions,
  table,
  totalCount,
}: LawyersListProps) {
  // Берём значения из table (основной путь), с fallback на прямые пропсы
  const visibleColumns = table?.visibleColumns ?? visibleColumnsProp ?? {};
  const columnOrder = table?.columnOrder ?? columnOrderProp ?? [];

  const columnLabels = {
    name: "lawyers.table.name",
    specialization: "lawyers.table.specialization",
    rating: "lawyers.table.rating",
    caseload: "lawyers.table.caseload",
    status: "lawyers.table.status",
  };

  return (
    <DataTable
      table={table}
      data={lawyers}
      columnLabels={columnLabels}
      totalCount={totalCount}
      hideToolbar={true}
      virtualized={true}
      renderRow={(lawyer) => (
        <LawyerTableRow
          key={lawyer.id}
          lawyer={lawyer}
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          onEdit={onEdit}
          onAction={onAction}
          quickActions={quickActions}
        />
      )}
    />
  );
}


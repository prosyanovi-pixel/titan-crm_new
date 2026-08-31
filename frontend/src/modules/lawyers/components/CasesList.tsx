// frontend/src/modules/lawyers/components/CasesList.tsx
import React from "react";
import { LegalCase } from "../types";
import { CaseTableRow } from "./CaseTableRow";
import { DataTable, DataTableState } from "@/components/ui/data-table";

interface CasesListProps {
  cases: LegalCase[];
  selectedIds?: Set<string | number>;
  toggleSelection?: (id: string) => void;
  visibleColumns?: Record<string, boolean>;
  columnOrder?: string[];
  onEdit: (legalCase: LegalCase) => void;
  onAction: (action: string, itemId: string | number) => void;
  table: any;
  totalCount: number;
}

export function CasesList({
  cases,
  selectedIds: selectedIdsProp,
  toggleSelection: toggleSelectionProp,
  visibleColumns: visibleColumnsProp,
  columnOrder: columnOrderProp,
  onEdit,
  onAction,
  table,
  totalCount,
}: CasesListProps) {
  // Берём значения из table (основной путь), с fallback на прямые пропсы
  const selectedIds = table?.selectedIds ?? selectedIdsProp ?? new Set<string | number>();
  const toggleSelection = table?.toggleSelection ?? toggleSelectionProp ?? (() => {});
  const visibleColumns = table?.visibleColumns ?? visibleColumnsProp ?? {};
  const columnOrder = table?.columnOrder ?? columnOrderProp ?? [];

  const columnLabels = {
    title: "lawyers.table.case_name",
    plaintiff: "lawyers.table.plaintiff",
    defendant: "lawyers.table.defendant",
    client: "lawyers.table.client",
    lawyer: "lawyers.table.lawyer",
    status: "lawyers.table.status",
    outcome: "lawyers.table.outcome",
    claim_amount: "lawyers.table.claim_amount",
    expenses: "lawyers.table.expenses",
    total: "lawyers.table.total",
    deadline: "lawyers.table.deadline",
    price: "lawyers.table.price",
    sent_date: "lawyers.table.sent_date",
    response_due_date: "lawyers.table.response_due_date",
  };

  return (
    <DataTable
      table={table}
      data={cases}
      columnLabels={columnLabels}
      totalCount={totalCount}
      hideToolbar={true}
      virtualized={true}
      renderRow={(legalCase) => (
        <CaseTableRow
          key={legalCase.id}
          legalCase={legalCase}
          isSelected={selectedIds.has(legalCase.id)}
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          onToggleSelection={toggleSelection}
          onEdit={onEdit}
          onAction={onAction}
        />
      )}
    />
  );
}

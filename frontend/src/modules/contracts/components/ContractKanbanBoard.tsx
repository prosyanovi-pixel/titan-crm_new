import React, { useState } from "react";
import { Contract, ContractStatus, CONTRACT_STATUS } from "../types/contract.types";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge, BadgeVariant } from "@/components/ui/status-system";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { Calendar, DollarSign, Building2 } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { CSS } from "@dnd-kit/utilities";

// --- Card Component ---
interface ContractKanbanCardProps {
  contract: Contract;
  onEdit?: (contract: Contract) => void;
  isOverlay?: boolean;
}

export function ContractKanbanCard({ contract, onEdit, isOverlay = false }: ContractKanbanCardProps) {
  const { t } = useTranslation();
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contract.id.toString(),
    data: contract,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const getPaymentVariant = (status: string): BadgeVariant => {
    const map: Record<string, BadgeVariant> = {
      unpaid: 'soft',
      partially_paid: 'soft',
      paid: 'solid',
      overdue: 'soft',
    };
    return map[status] ?? 'soft';
  };

  const getPaymentColor = (status: string): string => {
    const map: Record<string, string> = {
      unpaid: '#94A3B8',
      partially_paid: '#F59E0B',
      paid: '#10B981',
      overdue: '#EF4444',
    };
    return map[status] ?? '#94A3B8';
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col gap-3 p-3 transition-all hover:border-primary/50 cursor-grab active:cursor-grabbing ${
        isOverlay ? "shadow-xl border-primary scale-105" : "shadow-sm"
      }`}
      {...attributes}
      {...listeners}
      onClick={() => onEdit?.(contract)}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-sm leading-tight line-clamp-2">
            {contract.name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {contract.contractNumber || t('contracts.form.hints.contract_number')}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{contract.contractorName || "—"}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-medium text-foreground">
          {formatCurrency(contract.amount, contract.currency)}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1 pt-3 border-t">
        <Badge
          id={contract.paymentStatus}
          name={t(`contracts.payment.${contract.paymentStatus}`)}
          color={getPaymentColor(contract.paymentStatus)}
          variant={getPaymentVariant(contract.paymentStatus)}
        />
        {contract.endDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(contract.endDate).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

// --- Column Component ---
interface DroppableColumnProps {
  column: {
    id: string;
    title: string;
    color: string;
    variant: BadgeVariant;
  };
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  t: (key: string) => string;
}

function DroppableColumn({ column, contracts, onEdit, t }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-80 shrink-0 flex flex-col h-full rounded-lg border transition-colors ${
        isOver ? "bg-primary/5 border-primary/50" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Badge
            id={column.id}
            name={column.title}
            color={column.color}
            variant={column.variant}
          />
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            {contracts.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg p-2 min-h-[500px] bg-muted/30">
        {contracts.map((contract) => (
          <ContractKanbanCard
            key={contract.id}
            contract={contract}
            onEdit={onEdit}
          />
        ))}
        {contracts.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground animate-in fade-in zoom-in duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border shadow-sm mb-3">
              <DollarSign className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">{t('general.no_data')}</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              В этой колонке пока пусто
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Board Component ---
interface ContractKanbanBoardProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onStatusChange: (contractId: string, newStatus: string) => void;
}

export function ContractKanbanBoard({ contracts, onEdit, onStatusChange }: ContractKanbanBoardProps) {
  const { t } = useTranslation();
  const [activeContract, setActiveContract] = useState<Contract | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const kanbanColumns = [
    { id: CONTRACT_STATUS.DRAFT, title: t("contracts.status.draft"), color: "#94A3B8", variant: "soft" as const },
    { id: CONTRACT_STATUS.PENDING_APPROVAL, title: t("contracts.status.pending_approval"), color: "#F59E0B", variant: "soft" as const },
    { id: CONTRACT_STATUS.APPROVED, title: t("contracts.status.approved"), color: "#10B981", variant: "soft" as const },
    { id: CONTRACT_STATUS.REJECTED, title: t("contracts.status.rejected"), color: "#EF4444", variant: "soft" as const },
    { id: CONTRACT_STATUS.ARCHIVED, title: t("contracts.status.archived"), color: "#64748B", variant: "soft" as const },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const contract = contracts.find((c) => c.id.toString() === active.id);
    if (contract) {
      setActiveContract(contract);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveContract(null);
    const { active, over } = event;

    if (!over) return;

    const contractId = active.id.toString();
    const newStatus = over.id.toString();
    const contract = contracts.find((c) => c.id.toString() === contractId);

    if (contract && contract.status !== newStatus) {
      onStatusChange(contractId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="h-full pb-4">
        <div className="flex h-full gap-4 p-1">
          {kanbanColumns.map((col) => (
            <DroppableColumn
              key={col.id}
              column={col}
              contracts={contracts.filter((c) => c.status === col.id)}
              onEdit={onEdit}
              t={t}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {createPortal(
        <DragOverlay>
          {activeContract ? (
            <div className="w-[320px]">
              <ContractKanbanCard
                contract={activeContract}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

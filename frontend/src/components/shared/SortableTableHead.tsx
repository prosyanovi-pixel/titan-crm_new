import { ReactNode } from "react";
import { TableHead } from "@/components/ui/table";
import { TableSortIcon } from "./TableSortIcon";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SortableTableHeadProps {
  label: ReactNode;
  onSort: () => void;
  direction?: 'asc' | 'desc' | null;
  className?: string;
  contentClassName?: string;
  iconClassName?: string;
  /** Ключ столбца для drag-to-reorder. Если не передан — drag отключён */
  columnKey?: string;
  /** true когда этот столбец сейчас перетаскивается */
  isDragging?: boolean;
  /** true когда перетаскиваемый столбец наведён на этот */
  isDragOver?: boolean;
  /** из useColumnDrag */
  onColumnMouseDown?: (key: string, onSort: () => void) => void;
  /** из useColumnDrag */
  onColumnMouseEnter?: (key: string) => void;
  /** Ширина столбца для ресайзинга */
  width?: number;
  /** Коллбек изменения ширины */
  onResize?: (width: number) => void;
}

export function SortableTableHead({
  label,
  onSort,
  direction = null,
  className,
  contentClassName,
  iconClassName,
  columnKey,
  isDragging,
  isDragOver,
  onColumnMouseDown,
  onColumnMouseEnter,
  width,
  onResize,
}: SortableTableHeadProps) {
  const dragEnabled = !!columnKey && !!onColumnMouseDown;

  return (
    <TableHead
      className={cn(
        "transition-colors select-none hover:bg-muted/50 overflow-hidden",
        dragEnabled ? "cursor-grab" : "cursor-pointer",
        isDragging && "opacity-40 cursor-grabbing bg-muted/30",
        isDragOver && "bg-primary/10 ring-1 ring-inset ring-primary",
        className,
      )}
      onMouseDown={dragEnabled ? (e) => {
        e.preventDefault();
        onColumnMouseDown!(columnKey!, onSort);
      } : undefined}
      onMouseEnter={dragEnabled ? () => onColumnMouseEnter?.(columnKey!) : undefined}
      onClick={!dragEnabled ? onSort : undefined}
      width={width}
      onResize={onResize}
    >
      <div className={cn("flex items-center gap-1 min-w-0 overflow-hidden", contentClassName)}>
        {dragEnabled && (
          <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0 -ml-1" />
        )}
        <span className="min-w-0 truncate leading-tight">{label}</span>
        <TableSortIcon direction={direction} className={iconClassName} />
      </div>
    </TableHead>
  );
}
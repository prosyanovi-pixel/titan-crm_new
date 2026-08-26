import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table 
        ref={ref} 
        className={cn("w-full caption-bottom", className)} 
        style={{ fontSize: 'var(--table-font-main)', ...props.style }}
        {...props} 
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />,
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  ),
);
TableFooter.displayName = "TableFooter";

export const TableVirtuosoRowContext = React.createContext<{
  ref: React.Ref<HTMLTableRowElement>;
  props: any;
} | null>(null);

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => {
    const virtuosoData = React.useContext(TableVirtuosoRowContext);
    const isVirtuosoRow = virtuosoData !== null;

    const combinedRef = React.useCallback(
      (node: HTMLTableRowElement) => {
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTableRowElement>).current = node;

        if (isVirtuosoRow && virtuosoData.ref) {
          if (typeof virtuosoData.ref === "function") virtuosoData.ref(node);
          else (virtuosoData.ref as React.MutableRefObject<HTMLTableRowElement>).current = node;
        }
      },
      [ref, isVirtuosoRow, virtuosoData?.ref]
    );

    const mergedProps = isVirtuosoRow ? { ...virtuosoData.props, ...props } : props;

    const tr = (
      <tr
        ref={combinedRef}
        className={cn(
          "border-b transition-all duration-200 bg-transparent",
          "hover:bg-muted/40",
          "data-[state=selected]:bg-primary/[0.03]",
          className
        )}
        style={{ height: 'var(--table-row-height)', ...mergedProps.style }}
        {...mergedProps}
      />
    );

    if (isVirtuosoRow) {
      // Shield nested tables from getting the same virtuoso context
      return (
        <TableVirtuosoRowContext.Provider value={null}>
          {tr}
        </TableVirtuosoRowContext.Provider>
      );
    }
    
    return tr;
  },
);
TableRow.displayName = "TableRow";

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  onResize?: (width: number) => void;
  width?: number;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, onResize, width, children, style, ...props }, ref) => {
    const startX = React.useRef(0);
    const startWidth = React.useRef(0);
    const [isResizing, setIsResizing] = React.useState(false);

    const onMouseDown = (e: React.MouseEvent) => {
      if (!onResize) return;
      e.preventDefault(); e.stopPropagation();
      startX.current = e.pageX;
      startWidth.current = width || (e.target as HTMLElement).parentElement?.getBoundingClientRect().width || 100;
      setIsResizing(true);
      const onMouseMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.pageX - startX.current;
        const newWidth = Math.max(50, startWidth.current + diff);
        onResize(newWidth);
      };
      const windowMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', windowMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', windowMouseUp);
    };

    const hasCheckbox = React.Children.toArray(children).some(
      (child) => React.isValidElement(child) && (child.type as any).displayName === 'Checkbox' || (child as any).name === 'TableHeaderCheckbox'
    ) || className?.includes('w-10');

    return (
      <th
        ref={ref}
        className={cn(
          "px-4 text-left align-middle font-bold text-muted-foreground relative group transition-all",
          hasCheckbox && "p-0 w-10 text-center",
          isResizing && "select-none",
          className,
        )}
        style={{ 
          ...style, 
          width: width ? `${width}px` : (hasCheckbox ? '40px' : undefined),
          minWidth: width ? `${width}px` : (hasCheckbox ? '40px' : undefined),
          maxWidth: width ? `${width}px` : (hasCheckbox ? '40px' : undefined),
          paddingTop: 'var(--table-padding)',
          paddingBottom: 'var(--table-padding)',
        }}
        {...props}
      >
        {children}
        {onResize && (
          <div
            onMouseDown={onMouseDown}
            className={cn(
              "absolute right-0 top-0 h-full w-4 cursor-col-resize z-20 group-hover:bg-primary/10 transition-colors",
              isResizing ? "bg-primary opacity-100" : "opacity-0"
            )}
            title="Изменить ширину"
          >
            <div className="absolute right-0 top-0 h-full w-px bg-primary opacity-0 group-hover:opacity-100" />
          </div>
        )}
      </th>
    );
  },
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, style, ...props }, ref) => {
    const hasCheckbox = className?.includes('w-10');
    const width = (style as React.CSSProperties)?.width;
    return (
      <td
        ref={ref}
        className={cn(
          "px-4 align-middle transition-all",
          hasCheckbox && "p-0 w-10 text-center",
          className
        )}
        style={{ 
          ...style,
          width: hasCheckbox ? '40px' : width,
          minWidth: hasCheckbox ? '40px' : width,
          maxWidth: hasCheckbox ? '40px' : width,
          paddingTop: 'var(--table-padding)',
          paddingBottom: 'var(--table-padding)',
        }}
        {...props}
      />
    );
  },
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };

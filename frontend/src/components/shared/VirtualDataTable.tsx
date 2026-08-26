import React, { forwardRef } from 'react';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface VirtualDataTableProps<T> {
  data: T[];
  columns: string[];
  columnLabels: Record<string, string>;
  renderRow: (item: T, index: number) => React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
  height?: string | number;
  enableMobileCards?: boolean;
}

const virtuosoComponents: TableComponents = {
  Table: ({ style, ...props }) => (
    <Table {...props} style={{ ...style, width: '100%' }} />
  ),
  TableHead: forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => <TableHeader {...props} ref={ref as React.Ref<HTMLTableSectionElement>} />),
  TableBody: forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => <TableBody {...props} ref={ref as React.Ref<HTMLTableSectionElement>} />),
  TableRow: (props) => <TableRow {...props} />,
};

export function VirtualDataTable<T>({
  data,
  columns,
  columnLabels,
  renderRow,
  headerContent,
  className,
  height = '600px',
  enableMobileCards = true,
}: VirtualDataTableProps<T>) {
  return (
    <div className={cn(
      "titan-card overflow-hidden", 
      enableMobileCards && "table-mobile-cards",
      className
    )} style={{ height }}>
      <TableVirtuoso
        data={data}
        components={virtuosoComponents}
        fixedHeaderContent={() => (
          headerContent || (
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((key) => (
                <TableHead key={key}>
                  {columnLabels[key] || key}
                </TableHead>
              ))}
            </TableRow>
          )
        )}
        itemContent={(index, item) => renderRow(item as T, index)}
      />
    </div>
  );
}

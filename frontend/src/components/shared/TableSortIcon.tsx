import { ArrowUpDown } from "lucide-react";

interface TableSortIconProps {
  direction?: 'asc' | 'desc' | null;
  className?: string;
}

export function TableSortIcon({ direction = null, className }: TableSortIconProps) {
  if (!direction) {
    return <ArrowUpDown className={className || "ml-2 h-3 w-3 opacity-30"} />;
  }

  return (
    <ArrowUpDown
      className={className || `ml-2 h-3 w-3 ${direction === 'asc' ? 'opacity-100' : 'opacity-100 rotate-180'}`}
    />
  );
}
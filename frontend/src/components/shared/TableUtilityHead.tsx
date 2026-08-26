import { ReactNode } from "react";
import { TableHead } from "@/components/ui/table";

interface TableUtilityHeadProps {
  className?: string;
  children?: ReactNode;
}

export function TableUtilityHead({ className, children }: TableUtilityHeadProps) {
  return <TableHead className={className}>{children}</TableHead>;
}
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Product } from "../types";
import { StatusBadge } from "@/components/ui/status-system";
import { useTranslation } from "@/lib/i18n";
import { Tag } from "@/components/ui/status-system/Tag";
import { QuickActionsMenu } from "@/components/ui/QuickActionsMenu";
import { Edit2, Trash2 } from "lucide-react";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";

interface ProductTableRowProps {
  product: Product;
  selectedIds: Set<number>;
  visibleColumns: Record<string, boolean>;
  columnOrder?: string[];
  onToggleSelection: (id: number) => void;
  onRowClick: (product: Product) => void;
  onQuickAction?: (action: string, id: number | string) => Promise<void>;
}

export function ProductTableRow({
  product,
  selectedIds,
  visibleColumns,
  columnOrder = ['name', 'category', 'sku_internal', 'type', 'purchase_price', 'status'],
  onToggleSelection,
  onRowClick,
  onQuickAction,
}: ProductTableRowProps) {
  const { t } = useTranslation();
  const { settings } = useModuleSettings('products');
  const types = (settings?.types || []) as {id: string, name: string}[];

  const allActions = [
    { action: 'edit', name: t('common.edit'), icon: Edit2 },
    { action: 'delete', name: t('common.delete'), icon: Trash2, destructive: true },
  ];

  return (
    <TableRow
      className={`hover:bg-muted/50 cursor-pointer ${selectedIds.has(product.id) ? "bg-muted" : ""}`}
      onClick={() => onRowClick(product)}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selectedIds.has(product.id)}
          onCheckedChange={() => onToggleSelection(product.id)}
        />
      </TableCell>
      {columnOrder.filter(key => visibleColumns[key]).map(key => {
        switch (key) {
          case 'name': return (
            <TableCell key="name">
              <span className="font-medium text-foreground">{product.name}</span>
            </TableCell>
          );
          case 'category': return (
            <TableCell key="category" className="text-muted-foreground">
              {product.categoryName || "-"}
            </TableCell>
          );
          case 'sku_internal': return (
            <TableCell key="sku_internal" className="text-muted-foreground">
              {product.skuInternal || "-"}
            </TableCell>
          );
          case 'type': {
            const typeObj = types.find(t => t.id === product.type);
            const typeName = typeObj ? typeObj.name : product.type;
            return (
              <TableCell key="type">
                {product.type ? <Tag name={typeName} variant="soft" /> : <span className="text-muted-foreground">—</span>}
              </TableCell>
            );
          }
          case 'purchase_price': return (
            <TableCell key="purchase_price" className="text-muted-foreground">
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: product.currency || 'RUB' }).format(Number(product.purchasePrice) || 0)}
            </TableCell>
          );
          case 'status': return (
            <TableCell key="status">
              <StatusBadge
                statusId={product.status || 'active'}
                module="products"
                icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />}
              />
            </TableCell>
          );
          case 'tags': return (
            <TableCell key="tags">
              <div className="flex flex-wrap gap-1">
                {(product.tags || []).slice(0, 2).map((tag, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                    {tag}
                  </span>
                ))}
                {(product.tags || []).length > 2 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                    +{(product.tags || []).length - 2}
                  </span>
                )}
                {!(product.tags || []).length && <span className="text-muted-foreground">—</span>}
              </div>
            </TableCell>
          );
          default: return null;
        }
      })}
      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
        <QuickActionsMenu
          itemId={product.id}
          itemName={product.name}
          options={allActions}
          onAction={async (actionType, itemId) => {
            if (onQuickAction) {
              await onQuickAction(actionType, itemId);
            }
          }}
        />
      </TableCell>
    </TableRow>
  );
}

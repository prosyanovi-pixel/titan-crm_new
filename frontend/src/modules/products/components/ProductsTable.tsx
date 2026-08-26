import React from "react";
import { Product, ProductCategory } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-system";
import { Tag } from "@/components/ui/status-system/Tag";
import { useTranslation } from "@/lib/i18n";
import { QuickActionsMenu, QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";
import { useSettings } from "@/hooks/use-settings";
import { EmptyState } from "@/components/shared/EmptyState";
import { PackageOpen } from "lucide-react";

interface ProductsTableProps {
  products: Product[];
  categories: ProductCategory[];
  isLoading: boolean;
  onQuickAction?: (action: string, id: number) => Promise<void>;
  showQuickActions?: boolean;
  showTags?: boolean;
  selectedIds?: Set<number>;
  onToggleSelection?: (id: number) => void;
  onToggleAll?: () => void;
}

export function ProductsTable({
  products,
  categories,
  isLoading,
  onQuickAction,
  showQuickActions = true,
  showTags = true,
  selectedIds = new Set(),
  onToggleSelection,
  onToggleAll,
}: ProductsTableProps) {
  const { t } = useTranslation();
  const { getQuickActionsByModule, getTagsByModule } = useSettings();

  const actions = getQuickActionsByModule('products');
  const availableTags = getTagsByModule('products');

  const baseOptions: QuickActionMenuOption[] = [
    ...actions.map(a => ({
      label: a.name,
      action: a.action,
      icon: a.icon,
      isQuickAction: true,
    })),
    { label: t('common.edit'), action: 'edit', icon: 'Pencil', isQuickAction: false },
    { label: t('common.delete'), action: 'delete', icon: 'Trash2', isQuickAction: false, variant: 'destructive' as const },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
      </div>
    );
  }


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={products.length > 0 && selectedIds.size === products.length}
              onCheckedChange={onToggleAll}
            />
          </TableHead>
          <TableHead>{t('products.table.headers.sku_internal')}</TableHead>
          <TableHead>{t('products.table.headers.sku_external')}</TableHead>
          <TableHead>{t('products.table.headers.name')}</TableHead>
          <TableHead>{t('products.table.headers.category')}</TableHead>
          <TableHead>{t('products.table.headers.purchase_price')}</TableHead>
          <TableHead>{t('products.table.headers.status')}</TableHead>
          <TableHead>{t('products.table.headers.tags')}</TableHead>
          <TableHead className="w-[60px] text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="h-24 p-0">
              <EmptyState 
                icon={PackageOpen}
                title={t('products.table.empty_title')}
                description={t('products.table.empty_message')}
                className="border-0"
              />
            </TableCell>
          </TableRow>
        ) : (
          products.map((product) => (
          <TableRow key={product.id} data-state={selectedIds.has(product.id) ? "selected" : undefined}>
            <TableCell className="w-10">
              <Checkbox
                checked={selectedIds.has(product.id)}
                onCheckedChange={() => onToggleSelection?.(product.id)}
              />
            </TableCell>
            <TableCell className="font-medium text-muted-foreground">{product.skuInternal || "-"}</TableCell>
            <TableCell className="font-medium">{product.skuExternal || "-"}</TableCell>
            <TableCell>{product.name}</TableCell>
            <TableCell>{product.categoryName || "-"}</TableCell>
            <TableCell>
              {Number(product.purchasePrice).toLocaleString("ru-RU", {
                style: "currency",
                currency: product.currency || "RUB",
              })}
            </TableCell>
            <TableCell>
              {product.status ? (
                <StatusBadge statusId={product.status} module="products" />
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-1.5 flex-wrap">
                {showTags && product.tags && product.tags.length > 0 ? (
                  product.tags.slice(0, 3).map((tagId) => {
                    const tagConfig = availableTags.find(t => String(t.id) === String(tagId) || t.name === tagId);
                    return (
                      <Tag
                        key={String(tagId)}
                        tagId={String(tagId)}
                        name={tagConfig?.name || String(tagId)}
                        color={tagConfig?.color}
                        size="sm"
                      />
                    );
                  })
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
                {showTags && product.tags && product.tags.length > 3 && (
                  <Tag name={`+${product.tags.length - 3}`} variant="outline" size="sm" />
                )}
              </div>
            </TableCell>
            <TableCell className="text-right w-[60px]" onClick={(e) => e.stopPropagation()}>
              {showQuickActions && baseOptions.length > 0 && (
                <QuickActionsMenu
                  itemId={product.id}
                  options={baseOptions}
                  onAction={(action) => onQuickAction?.(action, product.id)}
                />
              )}
            </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

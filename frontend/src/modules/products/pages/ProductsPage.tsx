import React, { useState } from "react";
import { usePageSettings } from "@/context/LayoutContext";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SortableTabsList } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus, PanelLeftClose, PanelLeft } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/shared/skeletons";
import { ProductTableRow } from "../components/ProductTableRow";
import { ProductFormSheet } from "../components/ProductFormSheet";
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useDeleteProductBulk,
} from "../hooks";
import { CategoryTree } from "@/components/shared/CategoryTree";
import { CategoryDialog } from "@/components/shared/CategoryDialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ProductsToolbar } from '../components/ProductsToolbar';
import { useProductsPage } from '../hooks/useProductsPage';
import { Product, ProductCategory } from '../types';
import { ProductBulkEditDialog } from '../components/ProductBulkEditDialog';


export function ProductsPage() {
  const { t } = useTranslation();
  
  const {
    products,
    categories,
    loading,
    totalCount,
    refetch,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedCategoryId,
    setSelectedCategoryId,
    tableState,
    tabsConfig,
    activeTab,
    setActiveTab,
    moveTab,
    reorderTab,
    settings,
    types,
  } = useProductsPage();
  
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const deleteProductsMutation = useDeleteProductBulk();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [addingCategoryParentId, setAddingCategoryParentId] = useState<number | null>(null);
  const { confirm } = useConfirm();

  const handleAddCategory = (parentId: number | null) => {
    setEditingCategory(null);
    setAddingCategoryParentId(parentId);
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setAddingCategoryParentId(null);
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async (data: any) => {
    if (editingCategory) {
      await updateCategoryMutation.mutateAsync({ id: editingCategory.id, data });
    } else {
      await createCategoryMutation.mutateAsync(data);
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Array.from(tableState.selectedIds).map(id => Number(id));
    if (selectedIds.length === 0) return;
    
    if (await confirm({
      title: t('products.delete_bulk_confirm_title'),
      description: t('products.delete_bulk_confirm_desc', { count: selectedIds.length })
    })) {
      await deleteProductsMutation.mutateAsync(selectedIds);
      tableState.clearSelection();
    }
  };

  usePageSettings({
    title: t('products.title'),
    subtitle: t('products.subtitle'),
    breadcrumbs: [{ label: t('products.breadcrumb') }],
    actions: (
      <Button className="gap-2 h-9" onClick={() => {
        setSelectedProduct(null);
        setIsFormOpen(true);
      }}>
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">{t('products.add_button')}</span>
      </Button>
    )
  });

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row gap-6 h-full items-stretch">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-full md:w-64' : 'w-full md:w-12'} shrink-0 h-full`}>
          <Card className="h-full border-0 shadow-none bg-background rounded-none border-r flex flex-col">
            <div className={`p-2 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} border-b`}>
              {isSidebarOpen && <span className="font-medium text-sm text-muted-foreground ml-2">{t('products.categories')}</span>}
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="h-8 w-8">
                {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>
            </div>
            {isSidebarOpen && (
              <CardContent className="p-0 flex-1 overflow-auto">
                <CategoryTree
                  data={categories as any}
                  selectedId={selectedCategoryId}
                  onSelect={setSelectedCategoryId}
                  onAddCategory={handleAddCategory}
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={async (id: any) => {
                    if (await confirm({ title: t('products.delete_category_title'), description: t('products.delete_category_desc') })) {
                      deleteCategoryMutation.mutate(id);
                    }
                  }}
                />
              </CardContent>
            )}
          </Card>
        </div>

        <div className="flex-1 min-w-0 h-full pl-0 md:pl-0">
          <Card className="h-full flex flex-col border-0 shadow-none bg-background">
            <CardContent className="p-0 flex-1 flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="flex flex-nowrap justify-between items-center gap-4 overflow-x-auto overflow-y-hidden w-full mb-4 pb-1">
                  <SortableTabsList
                    tabsConfig={tabsConfig}
                    onReorder={reorderTab}
                    t={t}
                    className="h-10 sm:h-11 gap-1 p-1 bg-muted/50 rounded-xl flex-shrink-0 flex-nowrap w-max"
                    triggerClassName="flex-none gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium px-3 sm:px-4 whitespace-nowrap"
                  />

                  <ProductsToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedCount={tableState.selectedIds.size}
                    onCancelSelection={() => tableState.setSelectedIds(new Set())}
                    onBulkDelete={handleBulkDelete}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    statuses={(settings as { statuses?: Array<{id: string, name: string}> }).statuses || []}
                    tabsConfig={tabsConfig}
                    onMoveTab={moveTab}
                    onToggleTab={setActiveTab}
                    visibleColumns={tableState.visibleColumns}
                    onToggleColumn={tableState.toggleColumnVisibility}
                    columnOrder={tableState.columnOrder}
                    onMoveColumn={tableState.moveColumn}
                    bulkActions={
                      <Button variant="outline" size="sm" onClick={() => setIsBulkEditDialogOpen(true)} className="h-8">
                        {t('common.bulk_edit')}
                      </Button>
                    }
                    className="w-max flex-nowrap bg-transparent border-0 shadow-none p-0 flex-shrink-0"
                  />
                </div>

                <TabsContent value={activeTab} className="mt-0 flex-1 min-h-0">
                  {loading ? (
                  <TableSkeleton showToolbar={false} rowCount={10} columnCount={6} />
                ) : (
                  <DataTable
                    table={tableState}
                    data={products}
                    columnLabels={{
                      name: t('products.column_labels.name'),
                      category: t('products.column_labels.category'),
                      sku_internal: t('products.column_labels.sku_internal'),
                      type: t('products.column_labels.type'),
                      purchase_price: t('products.column_labels.purchase_price'),
                      status: t('products.column_labels.status'),
                    }}
                    totalCount={totalCount}
                    virtualized={true}
                    hideToolbar={true}
                    renderRow={(product: Product) => (
                      <ProductTableRow
                        key={product.id}
                        product={product}
                        selectedIds={new Set([...tableState.selectedIds].filter(id => typeof id === 'number') as number[])}
                        visibleColumns={tableState.visibleColumns}
                        columnOrder={tableState.columnOrder}
                        onToggleSelection={(id) => tableState.toggleSelection(id)}
                        onRowClick={() => {
                          setSelectedProduct(product);
                          setIsFormOpen(true);
                        }}
                        onQuickAction={async (action, id) => {
                          if (action === 'edit') {
                            setSelectedProduct(product);
                            setIsFormOpen(true);
                          } else if (action === 'delete') {
                            if (await confirm({
                              title: t('products.delete_confirm_title'),
                              description: t('products.delete_confirm_desc')
                            })) {
                              await deleteProductsMutation.mutateAsync([Number(id)]);
                              tableState.clearSelection();
                            }
                          }
                        }}
                      />
                    )}
                  />
                )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <ProductFormSheet
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedProduct(null);
        }}
        categories={categories}
        product={selectedProduct}
      />

      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        category={editingCategory}
        parentId={addingCategoryParentId}
        onSave={handleSaveCategory}
      />
      
      <ProductBulkEditDialog
        open={isBulkEditDialogOpen}
        onOpenChange={setIsBulkEditDialogOpen}
        count={tableState.selectedIds.size}
        selectedIds={Array.from(tableState.selectedIds).map(id => Number(id))}
        onSuccess={() => tableState.clearSelection()}
      />
    </div>
  );
}

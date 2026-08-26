import React, { useState } from "react";
import { usePageSettings } from "@/context/LayoutContext";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { ServicesTable } from "../components/ServicesTable";
import { ServiceFormSheet } from "../components/ServiceFormSheet";
import { useSaveServiceCategory, useDeleteServiceCategory, useDeleteServiceBulk } from "../hooks";
import { CategoryTree } from "@/components/shared/CategoryTree";
import { CategoryDialog } from "@/components/shared/CategoryDialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ServicesToolbar } from '../components/ServicesToolbar';
import { useServicesPage } from '../hooks/useServicesPage';
import { Service, ServiceCategory } from '../types';
import { type CategoryNode } from '@/components/shared/CategoryTree';

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
import { ServiceTableRow } from "../components/ServiceTableRow";
import { ServiceBulkEditDialog } from "../components/ServiceBulkEditDialog";

export function ServicesPage() {
  const { t } = useTranslation();
  
  const {
    services,
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
    tabs
  } = useServicesPage();

  const statuses = (settings?.statuses || []) as Array<{id: string, name: string}>;

  // Convert ServiceCategory to CategoryNode for CategoryTree
  const convertToCategoryNode = (cat: ServiceCategory): CategoryNode => ({
    id: cat.id,
    name: cat.name,
    parent_id: cat.parent_id,
    children: cat.children?.map(convertToCategoryNode) || [],
  });

  const categoryNodes = categories.map(convertToCategoryNode);
  
  const saveCategoryMutation = useSaveServiceCategory();
  const deleteCategoryMutation = useDeleteServiceCategory();
  const deleteServicesMutation = useDeleteServiceBulk();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [addingCategoryParentId, setAddingCategoryParentId] = useState<number | null>(null);
  const { confirm } = useConfirm();

  const handleAddCategory = (parentId: number | null) => {
    setEditingCategory(null);
    setAddingCategoryParentId(parentId);
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category);
    setAddingCategoryParentId(null);
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async (data: Partial<ServiceCategory>) => {
    if (editingCategory) {
      await saveCategoryMutation.mutateAsync({ ...data, id: editingCategory.id });
    } else {
      await saveCategoryMutation.mutateAsync({ ...data, parent_id: addingCategoryParentId });
    }
  };

  const handleToggleSelection = (id: number | string) => {
    tableState.toggleSelection(id);
  };

  const handleBulkDelete = async () => {
    alert(t('common.coming_soon'));
  };

  usePageSettings({
    title: t('services.title'),
    subtitle: t('services.subtitle'),
    breadcrumbs: [{ label: t('services.breadcrumb') }],
    actions: (
      <Button className="gap-2 h-9" onClick={() => {
        setSelectedService(null);
        setIsFormOpen(true);
      }}>
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">{t('services.add_button')}</span>
      </Button>
    )
  });

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row gap-6 h-full items-stretch">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-full md:w-64' : 'w-full md:w-12'} shrink-0 h-full`}>
          <Card className="h-full border-0 shadow-none bg-background rounded-none border-r flex flex-col">
            <div className={`p-2 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} border-b`}>
              {isSidebarOpen && <span className="font-medium text-sm text-muted-foreground ml-2">{t('services.categories')}</span>}
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="h-8 w-8">
                {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>
            </div>
            {isSidebarOpen && (
              <CardContent className="p-0 flex-1 overflow-auto">
                <CategoryTree
                  data={categoryNodes}
                  selectedId={selectedCategoryId}
                  onSelect={setSelectedCategoryId}
                  onAddCategory={handleAddCategory}
                  onEditCategory={(category) => {
                    const findCategory = (cats: ServiceCategory[], id: number): ServiceCategory | null => {
                      for (const cat of cats) {
                        if (cat.id === id) return cat;
                        if (cat.children) {
                          const found = findCategory(cat.children, id);
                          if (found) return found;
                        }
                      }
                      return null;
                    };
                    const serviceCat = findCategory(categories, category.id);
                    if (serviceCat) handleEditCategory(serviceCat);
                  }}
                  onDeleteCategory={async (category) => {
                    if (await confirm({ title: t('services.delete_category_title'), description: t('services.delete_category_desc') })) {
                      deleteCategoryMutation.mutate(category.id);
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

                  <ServicesToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedCount={tableState.selectedIds.size}
                    onCancelSelection={() => tableState.setSelectedIds(new Set())}
                    onBulkDelete={handleBulkDelete}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    statuses={statuses}
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
                    data={services}
                    columnLabels={{
                      name: t('services.table.headers.name'),
                      category: t('services.table.headers.category'),
                      type: t('services.table.headers.type'),
                      base_cost: t('services.table.headers.base_cost'),
                      status: t('services.table.headers.status'),
                    }}
                    totalCount={totalCount}
                    virtualized={true}
                    hideToolbar={true}
                    renderRow={(service: Service) => (
                      <ServiceTableRow
                        key={service.id}
                        service={service}
                        selectedIds={new Set([...tableState.selectedIds].filter((id): id is number => typeof id === 'number'))}
                        visibleColumns={tableState.visibleColumns}
                        columnOrder={tableState.columnOrder}
                        onToggleSelection={(id) => tableState.toggleSelection(id)}
                        onRowClick={() => {
                          setSelectedService(service);
                          setIsFormOpen(true);
                        }}
                        onQuickAction={async (action, id) => {
                          if (action === 'edit') {
                            setSelectedService(service);
                            setIsFormOpen(true);
                          } else if (action === 'delete') {
                            if (await confirm({
                              title: t('services.delete_confirm_title'),
                              description: t('services.delete_confirm_desc')
                            })) {
                              await deleteServicesMutation.mutateAsync([Number(id)]);
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

      <ServiceFormSheet
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedService(null);
        }}
        categories={categories}
        service={selectedService}
        selectedCategoryId={selectedCategoryId}
      />

      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        category={editingCategory}
        parentId={addingCategoryParentId}
        onSave={handleSaveCategory}
      />
      
      <ServiceBulkEditDialog
        open={isBulkEditDialogOpen}
        onOpenChange={setIsBulkEditDialogOpen}
        count={tableState.selectedIds.size}
        selectedIds={Array.from(tableState.selectedIds).map(id => Number(id))}
        onSuccess={() => tableState.clearSelection()}
      />
    </div>
  );
}

import { useState } from "react";
import { usePageSettings } from "@/context/LayoutContext";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ResizableSheet, 
  DiscardChangesDialog, 
  DataTableToolbar, 
  BulkEditDialog, 
  BulkActionButton
} from "@/components/shared";
import { useBulkActions } from "@/modules/registry/hooks/useBulkActions";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Calendar } from "lucide-react";
import { marketingApi } from "../api";
import { MarketingCampaign } from "../types";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/useDataTable";
import { QuickActionsMenu } from "@/components/ui/QuickActionsMenu";

import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/modules/settings/api";
import { useMarketingCampaigns } from "../hooks/useMarketingCampaigns";
import { CampaignStats } from "../components/CampaignStats";
import { CampaignForm } from "../components/CampaignForm";
import { useSettings } from "@/hooks/use-settings";
import { useModuleActions } from "@/modules/registry/hooks/useModuleActions";

export default function MarketingPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const settings = useSettings();
  const { getQuickActionsByModule } = settings;
  const marketingActions = useModuleActions("marketing");

  // Load reference data
  const statuses = settings.marketingStatuses || [];
  const types = (settings.marketingTypes || []) as Array<{ id: string; name: string; color?: string; order?: number }>;

  // Edit / Create States
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<MarketingCampaign> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Initialize DataTable hook
  const table = useDataTable<MarketingCampaign>({
    initialData: [],
    initialColumns: {
      name: true,
      status: true,
      type: true,
      budget: true,
      actualCost: true,
      dates: true,
    },
    storageKey: "marketing-table",
    defaultRowsPerPage: "20",
  });

  const {
    searchQuery,
    selectedIds,
    toggleSelection,
    clearSelection,
    visibleColumns,
    columnOrder,
    rowsPerPage,
    currentPage,
  } = table;

  // Use Custom Hook for Marketing Campaigns
  const { 
    campaigns, 
    totalCount, 
    isFetching, 
    createCampaign, 
    updateCampaign, 
    deleteCampaign, 
    bulkDeleteCampaigns, 
    bulkUpdateCampaigns 
  } = useMarketingCampaigns({
    search: searchQuery,
    status: statusFilter,
    type: typeFilter,
    page: currentPage,
    limit: rowsPerPage,
  });

  // Actions
  const handleOpenCreate = () => {
    setEditingCampaign({
      name: "",
      description: "",
      status: (statuses.length > 0 ? statuses[0].id : "draft") as MarketingCampaign["status"],
      type: (types.length > 0 ? types[0].id : "email") as MarketingCampaign["type"],
      budget: 0,
      actualCost: 0,
      startDate: "",
      endDate: "",
      targetAudience: "",
    });
    setHasUnsavedChanges(false);
    setSheetOpen(true);
  };

  const handleOpenEdit = async (campaign: MarketingCampaign) => {
    try {
      const res = await marketingApi.getById(campaign.id);
      const fullCampaign = res.data || res;
      setEditingCampaign({
        ...fullCampaign,
        startDate: fullCampaign.startDate ? fullCampaign.startDate.split("T")[0] : "",
        endDate: fullCampaign.endDate ? fullCampaign.endDate.split("T")[0] : "",
      });
      setHasUnsavedChanges(false);
      setSheetOpen(true);
    } catch (error) {
      console.error("Failed to load campaign details:", error);
      toast.error(t("marketing.toast.error_details"));
    }
  };

  const handleFieldChange = (field: keyof MarketingCampaign, value: any) => {
    setEditingCampaign(prev => prev ? { ...prev, [field]: value } : prev);
    setHasUnsavedChanges(true);
  };

  const handleDelete = async (campaign: MarketingCampaign) => {
    const ok = await confirm({
      title: t("common.confirm_deletion"),
      description: t("marketing.confirm.delete_description", { name: campaign.name }),
      variant: "destructive",
    });
    if (!ok) return;

    try {
      await deleteCampaign(campaign.id);
      toast.success(t("general.toast.success.record_deleted"), {
        action: {
          label: t('common.actions.undo'),
          onClick: () => {
            fetch(`/api/trash/marketing_campaigns/${campaign.id}/restore`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'x-user-id': localStorage.getItem('user_id') || ''
              }
            }).then(() => {
              // Note: The useMarketingCampaigns hook will need to be invalidated
              // To properly invalidate, we should ideally use the queryClient or expose an invalidate method
              // For now, we rely on the query caching to re-fetch on window focus or we can trigger a hard reload
              window.location.reload();
              toast.success(t('common.messages.restored'));
            }).catch(() => {
              toast.error(t('common.errors.general'));
            });
          }
        }
      });
    } catch (error) {
      console.error(error);
      toast.error(t("general.toast.error.delete"));
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!editingCampaign || !editingCampaign.name || !editingCampaign.type) {
      toast.error(t("common.fill_required"));
      return;
    }

    try {
      if (editingCampaign.id) {
        await updateCampaign({ id: editingCampaign.id, data: editingCampaign });
        toast.success(t("general.toast.success.record_updated"));
      } else {
        await createCampaign(editingCampaign);
        toast.success(t("general.toast.success.record_added"));
      }
      setSheetOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(t("general.toast.error.save"));
    }
  };

  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: t("common.confirm_deletion"),
      description: t("marketing.confirm.delete_selected_campaigns", { count: selectedIds.size }),
      variant: "destructive",
    });

    if (ok) {
      try {
        const ids = Array.from(selectedIds).map(String);
        await bulkDeleteCampaigns(ids);
        toast.success(t("general.toast.success.records_deleted"));
        clearSelection();
      } catch (error) {
        console.error(error);
        toast.error(t("general.toast.error.delete"));
      }
    }
  };

  const handleBulkEditConfirm = async (field: string, value: string) => {
    try {
      const ids = Array.from(selectedIds).map(String);
      await bulkUpdateCampaigns({ ids, field, value });
      toast.success(t("general.toast.success.records_updated"));
      clearSelection();
      setBulkEditOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(t("general.toast.error.save"));
    }
  };

  // Header Actions
  const actions = (
    <Button className="gap-2 h-9" onClick={handleOpenCreate}>
      <Plus className="w-4 h-4" />
      <span>{t("marketing.campaigns.add")}</span>
    </Button>
  );

  usePageSettings({
    title: t("marketing.module.title"),
    subtitle: t("marketing.module.subtitle"),
    breadcrumbs: [{ label: t("marketing.module.title") }],
    actions,
  });

  const bulkActionsList = useBulkActions("marketing");
  const hasBulkDelete = bulkActionsList.some(a => a.id === "bulk_delete");
  const hasBulkEdit = bulkActionsList.some(a => a.id === "bulk_edit");

  // Color mappings
  const getStatusBadge = (status: string) => {
    const statusData = statuses.find((s: any) => s.id === status);
    const color = statusData?.color || '#6B7280';
    return (
      <Badge 
        className={`font-medium border-0 text-white`}
        style={{ backgroundColor: color }}
      >
        {statusData?.name || status}
      </Badge>
    );
  };

  const getTypeLabel = (typeId: string) => {
    const typeData = types.find((t: any) => t.id === typeId);
    return typeData?.name || typeId;
  };

  const columnLabels = {
    name: "marketing.campaigns.name",
    status: "marketing.campaigns.status",
    type: "marketing.campaigns.type",
    budget: "marketing.campaigns.budget",
    actualCost: "marketing.campaigns.actual_cost",
    dates: "marketing.campaigns.dates",
  };

  const systemActions = marketingActions.map((a: any) => ({
    label: a.labelKey.includes('.') ? t(a.labelKey) : a.labelKey,
    action: a.id,
    icon: a.icon as any,
    isQuickAction: a.defaultOrder < 50,
    variant: a.id === 'delete' ? 'destructive' : undefined,
  }));

  const customQuickActions = getQuickActionsByModule('marketing').map((a: any) => ({
    label: a.name,
    action: a.action,
    icon: a.icon,
    isQuickAction: true,
  }));

  const allActions = [...customQuickActions, ...systemActions];

  const handleRowQuickAction = async (action: string, campaign: MarketingCampaign) => {
    if (action === "edit") {
      handleOpenEdit(campaign);
    } else if (action === "delete") {
      await handleDelete(campaign);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards extracted to component */}
      <CampaignStats campaigns={campaigns} />

      {/* Toolbar & Data Table */}
      <div className="flex flex-col gap-4">
        <DataTableToolbar
          searchQuery={table.searchQuery}
          onSearchChange={table.setSearchQuery}
          selectedCount={table.selectedIds.size}
          onCancelSelection={table.clearSelection}
          onBulkDelete={hasBulkDelete ? handleBulkDelete : undefined}
          bulkActions={
            hasBulkEdit ? (
              <BulkActionButton onClick={() => setBulkEditOpen(true)}>
                <span className="hidden sm:inline">{t("marketing.bulk_edit.button")}</span>
              </BulkActionButton>
            ) : null
          }
          tabsConfig={table.tabsConfig}
          onMoveTab={table.moveTab}
          onToggleTab={table.toggleTabVisibility}
          visibleColumns={table.visibleColumns}
          onToggleColumn={table.toggleColumnVisibility}
          columnLabels={columnLabels}
          columnOrder={table.columnOrder}
          onMoveColumn={table.moveColumn}
        />

        <DataTable
          table={table}
          data={campaigns}
          columnLabels={columnLabels}
          totalCount={totalCount}
          isLoading={isFetching}
          virtualized={true}
          hideToolbar={true}
          filters={
          <div className="p-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("marketing.campaigns.status")}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder={t("marketing.campaigns.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("marketing.campaigns.all_statuses")}</SelectItem>
                  {statuses.map((status: any) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("marketing.campaigns.campaign_type")}</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder={t("marketing.campaigns.campaign_type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("marketing.campaigns.all_types")}</SelectItem>
                  {types.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        renderRow={(campaign) => {
          const isSelected = selectedIds.has(campaign.id);
          return (
            <TableRow
              key={campaign.id}
              className={`hover:bg-muted/50 cursor-pointer ${isSelected ? "bg-muted" : ""}`}
              onClick={() => handleOpenEdit(campaign)}
            >
              <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(campaign.id)}
                />
              </TableCell>

              {columnOrder.filter((key) => visibleColumns[key]).map((key) => {
                switch (key) {
                  case "name":
                    return (
                      <TableCell key="name">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate">{campaign.name}</span>
                          {campaign.description && (
                            <span className="text-[10px] text-muted-foreground truncate">{campaign.description}</span>
                          )}
                        </div>
                      </TableCell>
                    );
                  case "status":
                    return (
                      <TableCell key="status">
                        {getStatusBadge(campaign.status)}
                      </TableCell>
                    );
                  case "type":
                    return (
                      <TableCell key="type" className="text-sm text-muted-foreground">
                        {getTypeLabel(campaign.type)}
                      </TableCell>
                    );
                  case "budget":
                    return (
                      <TableCell key="budget" className="font-semibold">
                        {campaign.budget ? `${Number(campaign.budget).toLocaleString()} ₽` : "0 ₽"}
                      </TableCell>
                    );
                  case "actualCost":
                    return (
                      <TableCell key="actualCost" className="font-semibold text-rose-500">
                        {campaign.actualCost ? `${Number(campaign.actualCost).toLocaleString()} ₽` : "0 ₽"}
                      </TableCell>
                    );
                  case "dates":
                    return (
                      <TableCell key="dates" className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString("ru-RU") : "—"}
                            {" - "}
                            {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("ru-RU") : "—"}
                          </span>
                        </div>
                      </TableCell>
                    );
                  default:
                    return null;
                }
              })}

              <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
                <QuickActionsMenu
                  itemId={campaign.id}
                  itemName={campaign.name}
                  options={allActions}
                  onAction={async (actionType) => await handleRowQuickAction(actionType, campaign)}
                />
              </TableCell>
            </TableRow>
          );
        }}
      />
      </div>

      {/* Sheet Form */}
      <ResizableSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        moduleKey="marketing_campaigns"
        defaultWidth="md"
        title={editingCampaign?.id ? t("marketing.campaigns.edit_campaign") : t("marketing.campaigns.create_campaign")}
        description={t("marketing.campaigns.form_description")}
        onSave={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        onShowDiscardDialog={() => setShowDiscardDialog(true)}
      >
        {editingCampaign && (
          <CampaignForm
            campaign={editingCampaign}
            onChange={handleFieldChange}
            onSubmit={handleSave}
            statuses={statuses}
            types={types}
          />
        )}
      </ResizableSheet>
      
      {/* Discard Changes Confirmation Dialog */}
      <DiscardChangesDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        onContinue={() => setShowDiscardDialog(false)}
        onSave={() => { setShowDiscardDialog(false); }}
        onDiscard={() => {
          setShowDiscardDialog(false);
          setHasUnsavedChanges(false);
          setSheetOpen(false);
        }}
      />

      <BulkEditDialog
        moduleId="marketing"
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        count={table.selectedIds.size}
        onConfirm={handleBulkEditConfirm}
        referenceData={{
          statuses,
          types
        }}
        fields={[
          {
            id: "status",
            label: t("marketing.campaigns.status"),
            type: "select",
            dataSource: "statuses",
            order: 1,
            enabled: true,
          },
          {
            id: "type",
            label: t("marketing.campaigns.campaign_type"),
            type: "select",
            dataSource: "types",
            order: 2,
            enabled: true,
          }
        ]}
      />
    </div>
  );
}

import React from "react";
import { usePageSettings } from "@/context/LayoutContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import {
  Search, Upload, FolderPlus, LayoutGrid, List as ListIcon,
  Star, Clock, Trash2, File, Folder, Download, Share2, Zap,
  Home, RotateCcw, AlertTriangle
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { DraggableItem, DroppableFolder } from "../components/dnd";
import { FileCard, DocumentStats, FilePreview, VersionHistoryDialog, GlobalDropzone } from "../components";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SortableTableHead, TableFooterPagination, TableHeaderCheckbox, TableUtilityHead } from "@/components/shared";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Label } from "@/components/ui/label";
import { cn, formatBytes } from "@/lib/utils";
import { History } from "lucide-react";
import { useDocumentsPage } from "../hooks/useDocumentsPage";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";

export default function Documents() {
  const { t } = useTranslation();
  const { settings, isLoading: isSettingsLoading } = useModuleSettings("documents");
  const showStats = settings.features?.enableStatistics !== false;
  const showFolders = settings.features?.enableFolders !== false;
  const showStarred = settings.features?.enableStarred !== false;

  const {
    currentFolderName,
    filteredAndSortedFiles,
    paginatedFiles,
    handleFileClick,
    handleToggleStar,
    handleToggleTemplate,
    handleNavigateToRoot,
    handleCreateFolder,
    handleUploadFiles,
    handleDeleteFiles,
    handleRestoreFiles,
    handleClearTrash,
    handleBulkMoveFiles,
    handleBulkRenameFiles,
    openBulkMoveDialog,
    openBulkRenameDialog,
    handleDownloadFile,
    handleShareFile,
    getSortDirection,
    handleSort,
    table,
    setIsUploadOpen,
    setFilter,
    filter,
    currentFolderId,
    viewMode,
    setViewMode,
    isCreateFolderOpen,
    setIsCreateFolderOpen,
    newFolderName,
    setNewFolderName,
    selectedFiles,
    setSelectedFiles,
    isBulkMoveOpen,
    setIsBulkMoveOpen,
    isBulkRenameOpen,
    setIsBulkRenameOpen,
    bulkMoveParentId,
    setBulkMoveParentId,
    bulkRenameBaseName,
    setBulkRenameBaseName,
    folderOptions,
    isUploadOpen,
    stats,
    breadcrumbs,
    handleBreadcrumbClick,
    handleDragEnd,
    previewFile,
    setPreviewFile,
    versionFile,
    setVersionFile,
  } = useDocumentsPage();

  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Начинаем тащить только если сдвинули на 5 пикселей (чтобы не мешать клику)
      },
    })
  );

  const activeFile = activeId ? paginatedFiles.find(f => f.id === activeId) : null;

  const selectedCount = table.selectedIds.size;
  const selectedIds = Array.from(table.selectedIds).map((id) => String(id));

  usePageSettings({
    title: currentFolderName || t("documents.title"),
    breadcrumbs: [{ label: t("documents.title") }]
  });

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-card border rounded-lg overflow-hidden sticky top-0">
            <div className="p-4 border-b">
              <Button className="w-full gap-2 bg-primary text-primary-foreground" onClick={() => setIsUploadOpen(true)}>
                <Upload className="w-4 h-4" />
                {t("documents.upload")}
              </Button>
            </div>
            <nav className="p-2 space-y-1">
              <Button variant={filter === "all" ? "secondary" : "ghost"} className="w-full justify-start gap-3"
                onClick={() => { setFilter("all"); }}>
                <File className="w-4 h-4" />{t("documents.categories.all")}
              </Button>
              <Button variant={filter === "recent" ? "secondary" : "ghost"} className="w-full justify-start gap-3"
                onClick={() => setFilter("recent")}>
                <Clock className="w-4 h-4" />{t("documents.categories.recent")}
              </Button>
              {showStarred && (
                <Button variant={filter === "starred" ? "secondary" : "ghost"} className="w-full justify-start gap-3"
                  onClick={() => setFilter("starred")}>
                  <Star className="w-4 h-4" />{t("documents.categories.starred")}
                </Button>
              )}
              <Button variant={filter === "templates" ? "secondary" : "ghost"} className="w-full justify-start gap-3"
                onClick={() => setFilter("templates")}>
                <Zap className={`w-4 h-4 ${filter === "templates" ? "text-amber-500" : ""}`} />
                {t("documents.categories.templates")}
              </Button>
              <Button variant={filter === "trash" ? "secondary" : "ghost"} className="w-full justify-start gap-3"
                onClick={() => setFilter("trash")}>
                <Trash2 className="w-4 h-4" />{t("documents.categories.trash")}
              </Button>
            </nav>
            {!isSettingsLoading && showStats && stats && (
              <DocumentStats stats={stats} />
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <DroppableFolder id="root" disabled={filter === "trash"}>
                      <BreadcrumbLink
                        className="cursor-pointer flex items-center justify-center h-8 w-8 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                        onClick={() => handleBreadcrumbClick(null)}
                      >
                        <Home className="w-4 h-4" />
                      </BreadcrumbLink>
                    </DroppableFolder>
                  </BreadcrumbItem>
                  {breadcrumbs.length > 0 && <BreadcrumbSeparator className="mx-0" />}
                  {breadcrumbs.map((bc, index) => (
                    <React.Fragment key={bc.id}>
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="max-w-[150px] truncate font-medium" title={bc.name}>
                            {bc.name}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            className="cursor-pointer max-w-[150px] truncate hover:text-foreground transition-colors"
                            onClick={() => handleBreadcrumbClick(bc.id)}
                            title={bc.name}
                          >
                            {bc.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className="mx-0" />}
                    </React.Fragment>
                  ))}
                  {filter === "trash" && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{t("documents.categories.trash")}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                  {filter === "templates" && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{t("documents.categories.templates")}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("documents.search_placeholder")}
                  value={table.searchQuery}
                  onChange={(e) => table.setSearchQuery(e.target.value)}
                  className="pl-9 h-8 w-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="flex items-center border rounded-md p-0.5 flex-shrink-0">
                <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 text-primary hover:text-primary hover:bg-primary/5" onClick={() => setIsUploadOpen(true)}>
                  <Upload className="w-4 h-4" />
                  <span className="hidden md:inline">{t("documents.upload")}</span>
                </Button>
                <div className="w-px h-4 bg-border mx-1 hidden md:block" />
                <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8"
                  onClick={() => setViewMode("grid")}>
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8"
                  onClick={() => setViewMode("list")}>
                  <ListIcon className="w-4 h-4" />
                </Button>
              </div>
              {showFolders && (
                <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                  onClick={() => setIsCreateFolderOpen(true)}>
                  <FolderPlus className="w-4 h-4" />
                </Button>
              )}
              {filter === "trash" && (
                <Button variant="destructive" size="sm" className="h-8 gap-2 flex-shrink-0"
                  onClick={handleClearTrash}>
                  <Trash2 className="w-4 h-4" />
                  {t("documents.trash.clear")}
                </Button>
              )}
            </div>
          </div>

          {selectedCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <span className="text-sm font-medium text-primary">
                {t("documents.bulk.selected")}: {selectedCount}
              </span>
              <Button variant="outline" size="sm" onClick={openBulkRenameDialog} className="h-8 gap-2">
                {t("documents.bulk.rename")}
              </Button>
              <Button variant="outline" size="sm" onClick={openBulkMoveDialog} className="h-8 gap-2">
                {t("documents.bulk.move")}
              </Button>
              {filter === "trash" && (
                <Button variant="outline" size="sm" onClick={() => handleRestoreFiles(selectedIds)} className="h-8 gap-2 text-green-600 hover:text-green-700">
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t("common.restore") || "Восстановить"}
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => handleDeleteFiles(selectedIds)} className="h-8 gap-2">
                <Trash2 className="w-3.5 h-3.5" />
                {t("documents.bulk.delete")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => table.clearSelection()} className="h-8">
                {t("common.cancel")}
              </Button>
            </div>
          )}

          {/* File Area */}
          <div className="flex-1 bg-card border rounded-lg overflow-hidden flex flex-col">
            <DndContext
              sensors={sensors}
              onDragStart={(e) => setActiveId(String(e.active.id))}
              onDragEnd={(e) => {
                setActiveId(null);
                handleDragEnd(e);
              }}
              onDragCancel={() => setActiveId(null)}
            >
              <ScrollArea className="flex-1">
                <div className="p-6">
                  {filteredAndSortedFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <div className="p-4 bg-muted/20 rounded-full mb-4">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="mb-4">{t("documents.empty")}</p>
                      <Button onClick={() => setIsUploadOpen(true)} variant="outline" className="gap-2">
                        <Upload className="w-4 h-4" />
                        {t("documents.upload")}
                      </Button>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {paginatedFiles.map((file) => (
                        <div className="relative group" key={file.id}>
                          {file.type === "folder" ? (
                            <DroppableFolder id={file.id} disabled={filter === "trash"}>
                              <DraggableItem id={file.id} disabled={filter === "trash"}>
                                <FileCard
                                  file={file}
                                  onClick={handleFileClick}
                                  onToggleStar={handleToggleStar}
                                  onRestore={(id) => handleRestoreFiles([id])}
                                  selected={table.selectedIds.has(file.id)}
                                  onToggleSelection={(id) => table.toggleSelection(id)}
                                  isTrash={filter === "trash"}
                                />
                              </DraggableItem>
                            </DroppableFolder>
                          ) : (
                            <DraggableItem id={file.id} disabled={filter === "trash"}>
                              <FileCard
                                file={file}
                                onClick={handleFileClick}
                                onToggleStar={handleToggleStar}
                                onRestore={(id) => handleRestoreFiles([id])}
                                selected={table.selectedIds.has(file.id)}
                                onToggleSelection={(id) => table.toggleSelection(id)}
                                isTrash={filter === "trash"}
                              />
                            </DraggableItem>
                          )}

                          {/* Quick Actions (Floating) - Hide while dragging */}
                          {!activeId && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded shadow-md z-10">
                              <div className="flex flex-col p-1">
                                {filter === "trash" ? (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50"
                                    onClick={() => handleRestoreFiles([file.id])}>
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"
                                      onClick={() => handleToggleStar(file.id)}>
                                      <Star className={`w-4 h-4 ${file.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                                    </Button>
                                    {file.type !== "folder" && (
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => setVersionFile(file)} title={t("documents.versions.title") || "История версий"}>
                                        <History className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8"
                                      onClick={() => handleToggleTemplate(file.id)}>
                                      <Zap className={`w-4 h-4 ${file.isTemplate ? "fill-amber-400 text-amber-500" : ""}`} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"
                                      onClick={() => handleDownloadFile(file)}>
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"
                                      onClick={() => handleShareFile(file)}>
                                      <Share2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteFiles([file.id])}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-auto">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-10 px-0">
                              <div className="flex items-center justify-center h-10">
                                <TableHeaderCheckbox
                                  isCurrentPageSelected={paginatedFiles.length > 0 && paginatedFiles.every((file) => table.selectedIds.has(file.id))}
                                  isSomeSelected={paginatedFiles.some((file) => table.selectedIds.has(file.id)) && !paginatedFiles.every((file) => table.selectedIds.has(file.id))}
                                  onToggleCurrentPage={() => table.toggleAllSelection(paginatedFiles)}
                                  className="w-10 h-10 min-h-0"
                                />
                              </div>
                            </TableHead><SortableTableHead label={t("common.name")} onSort={() => handleSort("name")}
                              direction={getSortDirection("name")} className="w-[40%]"
                              contentClassName="flex items-center gap-2 h-10 py-0" iconClassName="h-4 w-4"
                              width={table.columnWidths?.name} onResize={(w) => table.setColumnWidth("name", w)}
                            /><SortableTableHead label={t("common.type")} onSort={() => handleSort("type")}
                              direction={getSortDirection("type")} contentClassName="flex items-center gap-2 h-10 py-0"
                              iconClassName="h-4 w-4"
                              width={table.columnWidths?.type} onResize={(w) => table.setColumnWidth("type", w)}
                            /><SortableTableHead label={t("common.size")} onSort={() => handleSort("size")}
                              direction={getSortDirection("size")} contentClassName="flex items-center gap-2 h-10 py-0"
                              iconClassName="h-4 w-4"
                              width={table.columnWidths?.size} onResize={(w) => table.setColumnWidth("size", w)}
                            /><SortableTableHead label={t("common.date")} onSort={() => handleSort("date")}
                              direction={getSortDirection("date")} contentClassName="flex items-center gap-2 h-10 py-0"
                              iconClassName="h-4 w-4"
                              width={table.columnWidths?.date} onResize={(w) => table.setColumnWidth("date", w)}
                            /><TableUtilityHead className="w-10 h-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedFiles.map((file) => (
                            <TableRow key={file.id} className="group cursor-pointer" onClick={() => handleFileClick(file)}>
                              <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                                <Checkbox checked={table.selectedIds.has(file.id)} onCheckedChange={() => table.toggleSelection(file.id)} aria-label={file.name} />
                              </TableCell>{file.type === "folder" ? (
                                <TableCell className="p-0">
                                  <DroppableFolder id={file.id} disabled={filter === "trash"}>
                                    <DraggableItem id={file.id} disabled={filter === "trash"}>
                                      <div className="flex items-center gap-2 px-4 py-2 font-medium">
                                        <Folder className="w-4 h-4 text-yellow-400 fill-yellow-400/20 flex-shrink-0" />
                                        <span className="truncate">{file.name}</span>
                                      </div>
                                    </DraggableItem>
                                  </DroppableFolder>
                                </TableCell>
                              ) : (
                                <TableCell className="font-medium p-0">
                                  <DraggableItem id={file.id} disabled={filter === "trash"}>
                                    <div className="flex items-center gap-2 px-4 py-2">
                                      <div className="relative">
                                        <File className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        {file.isMissing && (
                                          <div className="absolute -top-1 -right-1 bg-background rounded-full" title={t("documents.toast.file_missing_warning")}>
                                            <AlertTriangle className="w-2.5 h-2.5 text-destructive fill-destructive/10" />
                                          </div>
                                        )}
                                      </div>
                                      <span className={cn("truncate", file.isMissing && "text-muted-foreground")}>{file.name}</span>
                                    </div>
                                  </DraggableItem>
                                </TableCell>
                              )}<TableCell className="whitespace-nowrap text-muted-foreground" style={{ width: table.columnWidths?.type }}>
                                {t(`documents.types.${file.type}`) || file.type}
                              </TableCell><TableCell className="whitespace-nowrap text-muted-foreground" style={{ width: table.columnWidths?.size }}>
                                {file.type === 'folder' ? "—" : (file.size ? formatBytes(Number(file.size)) : "—")}
                              </TableCell><TableCell className="whitespace-nowrap text-muted-foreground" style={{ width: table.columnWidths?.date }}>
                                {file.date}
                              </TableCell><TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  {filter === "trash" ? (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => handleRestoreFiles([file.id])} title={t("common.restore") || "Восстановить"}>
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </Button>
                                  ) : (
                                    <>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-yellow-500"
                                        onClick={() => handleToggleStar(file.id)}>
                                        <Star className={`w-3.5 h-3.5 ${file.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                                      </Button>
                                      {file.type !== "folder" && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                          onClick={() => setVersionFile(file)} title={t("documents.versions.title") || "История версий"}>
                                          <History className="w-3.5 h-3.5" />
                                        </Button>
                                      )}
                                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-amber-500"
                                        onClick={() => handleToggleTemplate(file.id)}>
                                        <Zap className={`w-3.5 h-3.5 ${file.isTemplate ? "fill-amber-400 text-amber-500" : ""}`} />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8"
                                        onClick={() => handleDownloadFile(file)}>
                                        <Download className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8"
                                        onClick={() => handleShareFile(file)}>
                                        <Share2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </>
                                  )}
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteFiles([file.id])}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>

                      </Table>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <DragOverlay dropAnimation={null}>
                {activeFile ? (
                  <div className="opacity-80 scale-95 pointer-events-none">
                    <FileCard
                      file={activeFile}
                      onClick={() => { }}
                      onToggleStar={() => { }}
                      selected={table.selectedIds.has(activeFile.id)}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            <TableFooterPagination
              shownCount={paginatedFiles.length}
              totalCount={filteredAndSortedFiles.length}
              rowsPerPage={table.rowsPerPage}
              onRowsPerPageChange={table.setRowsPerPage}
              currentPage={table.currentPage}
              onPageChange={table.setCurrentPage}
              className="border-t p-4 flex items-center justify-between"
            />
          </div>
        </div>
      </div>

      <GlobalDropzone onDrop={(files) => {
        setSelectedFiles(files);
        setIsUploadOpen(true);
      }} />

      <FilePreview
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownloadFile}
      />

      <VersionHistoryDialog
        file={versionFile}
        isOpen={!!versionFile}
        onClose={() => setVersionFile(null)}
      />

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("documents.dialog.create_folder_title")}</DialogTitle>
            <DialogDescription>{t("documents.dialog.create_folder_description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">{t("documents.dialog.folder_name")}</Label>
              <Input id="folderName" value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t("documents.dialog.folder_name_placeholder")}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateFolder(); } }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateFolder}>{t("common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Files Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("documents.dialog.upload_files_title")}</DialogTitle>
            <DialogDescription>{t("documents.dialog.upload_files_description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="files">{t("documents.dialog.select_files")}</Label>
              <Input id="files" type="file" multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="cursor-pointer"
              />
              {selectedFiles && selectedFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("documents.dialog.selected_files_count", { count: selectedFiles.length })}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUploadFiles}>{t("documents.upload")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Move Dialog */}
      <Dialog open={isBulkMoveOpen} onOpenChange={setIsBulkMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("documents.bulk.move_title")}</DialogTitle>
            <DialogDescription>{t("documents.bulk.move_description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkMoveFolder">{t("documents.bulk.move_target")}</Label>
              <Select value={bulkMoveParentId} onValueChange={setBulkMoveParentId}>
                <SelectTrigger id="bulkMoveFolder">
                  <SelectValue placeholder={t("documents.bulk.move_target_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">{t("documents.bulk.root_folder")}</SelectItem>
                  {folderOptions
                    .filter((folder) => !table.selectedIds.has(folder.id))
                    .map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkMoveOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleBulkMoveFiles}>{t("documents.bulk.move")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Rename Dialog */}
      <Dialog open={isBulkRenameOpen} onOpenChange={setIsBulkRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("documents.bulk.rename_title")}</DialogTitle>
            <DialogDescription>{t("documents.bulk.rename_description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkRenameName">{t("documents.bulk.rename_label")}</Label>
              <Input
                id="bulkRenameName"
                value={bulkRenameBaseName}
                onChange={(e) => setBulkRenameBaseName(e.target.value)}
                placeholder={t("documents.bulk.rename_placeholder")}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBulkRenameFiles(); } }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("documents.bulk.rename_hint")}: {selectedCount}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkRenameOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleBulkRenameFiles}>{t("documents.bulk.rename")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

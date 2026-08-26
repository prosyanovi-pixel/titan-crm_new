// frontend/src/modules/settings/components/system/BackupTab.tsx
/**
 * BackupTab - компонент управления резервными копиями базы данных.
 * Логика и типы вынесены в useBackupTab (hooks/).
 * Диалог создания вынесен в BackupCreateDialog.
 */
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import {
  Database, Download, Trash2, Clock, HardDrive, Archive, RotateCcw,
  FileArchive, Loader2, CheckCircle2, AlertCircle, Plus, RefreshCw,
} from "lucide-react";
import { useBackupTab } from "../../hooks/useBackupTab";
import { BackupCreateDialog } from "./BackupCreateDialog";
import { TableFooterPagination } from "@/components/shared/TableFooterPagination";
import { parseRowsPerPage } from "@/lib/utils";

export function BackupTab() {
  const { t } = useTranslation();
  const {
    backups, loading, status,
    createDialogOpen, setCreateDialogOpen,
    restoreDialogOpen, setRestoreDialogOpen,
    deleteDialogOpen, setDeleteDialogOpen,
    selectedBackup, setSelectedBackup,
    backupName, setBackupName,
    backupType, setBackupType,
    loadBackups, formatSize, formatDate,
    handleCreateBackup, handleRestoreBackup, handleDeleteBackup, handleDownloadBackup,
  } = useBackupTab();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');

  const perPage = useMemo(() => parseRowsPerPage(rowsPerPage), [rowsPerPage]);
  const paginatedBackups = useMemo(
    () => backups.slice((currentPage - 1) * perPage, currentPage * perPage),
    [backups, currentPage, perPage]
  );

  return (
    <div className="space-y-4">

      {/* Status Banner */}
      {status.inProgress && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div className="flex-1">
                <div className="font-medium text-blue-900 dark:text-blue-100">
                  {status.type === "create" ? t("settings.backup.creating_backup") : t("settings.backup.restore_database")}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">{status.message}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header + Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t("settings.backup.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("settings.backup.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadBackups} disabled={loading || status.inProgress}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {t("settings.backup.refresh")}
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)} disabled={status.inProgress}>
            <Plus className="w-4 h-4 mr-2" />
            {t("settings.backup.create")}
          </Button>
        </div>
      </div>

      {/* Backups List */}
      <div className="grid gap-3">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : backups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileArchive className="w-12 h-12 text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">{t("settings.backup.empty_title")}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t("settings.backup.empty_description")}</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("settings.backup.create")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedBackups.map((backup) => (
            <Card key={backup.file} className="transition-colors hover:bg-accent/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Archive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-medium truncate">{backup.name}</CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatSize(backup.size)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(backup.created)}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  {backup.type === "full" && (
                    <Badge variant="secondary" className="text-xs ml-2">
                      {t("settings.backup.type_full")}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { setSelectedBackup(backup); setRestoreDialogOpen(true); }}
                    disabled={status.inProgress}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    {t("settings.backup.restore")}
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => handleDownloadBackup(backup)}
                    disabled={status.inProgress}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {t("settings.backup.download")}
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { setSelectedBackup(backup); setDeleteDialogOpen(true); }}
                    disabled={status.inProgress}
                    className="ml-auto text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    {t("settings.backup.delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
            <TableFooterPagination
              shownCount={paginatedBackups.length}
              totalCount={backups.length}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(v) => { setRowsPerPage(v); setCurrentPage(1); }}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              className="flex items-center justify-between p-3 border-t border-border rounded-b-lg bg-background"
            />
          </>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              {t("settings.backup.info_standard_title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              {[1, 2, 3].map((i) => (
                <li key={i}>• {t(`settings.backup.info_standard_item${i}`)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              {t("settings.backup.info_full_title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              {[1, 2, 3].map((i) => (
                <li key={i}>• {t(`settings.backup.info_full_item${i}`)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Warning */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                {t("settings.backup.warning_title")}
              </p>
              <ul className="text-amber-700 dark:text-amber-300 space-y-1">
                {[1, 2, 3].map((i) => (
                  <li key={i}>• {t(`settings.backup.warning_item${i}`)}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <BackupCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        backupType={backupType}
        setBackupType={setBackupType}
        backupName={backupName}
        setBackupName={setBackupName}
        onCreate={handleCreateBackup}
      />

      {/* Restore Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.backup.dialog_restore_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.backup.dialog_restore_description1")}{" "}
              <strong className="text-foreground">{selectedBackup?.name}</strong>.
              <br /><br />
              {t("settings.backup.dialog_restore_description2")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("settings.backup.dialog_cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreBackup} className="bg-destructive hover:bg-destructive/90">
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("settings.backup.dialog_restore_button")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.backup.dialog_delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.backup.dialog_delete_description")}{" "}
              <strong className="text-foreground">{selectedBackup?.name}</strong>{" "}
              {t("settings.backup.dialog_delete_warning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("settings.backup.dialog_cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBackup} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" />
              {t("settings.backup.dialog_delete_button")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

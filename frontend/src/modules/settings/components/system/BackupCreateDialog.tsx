// frontend/src/modules/settings/components/system/BackupCreateDialog.tsx
import React from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupType: "standard" | "full";
  setBackupType: (type: "standard" | "full") => void;
  backupName: string;
  setBackupName: (name: string) => void;
  onCreate: () => void;
}

export function BackupCreateDialog({
  open, onOpenChange,
  backupType, setBackupType,
  backupName, setBackupName,
  onCreate,
}: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settings.backup.dialog_create_title")}</DialogTitle>
          <DialogDescription>{t("settings.backup.dialog_create_description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("settings.backup.dialog_type_label")}</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["standard", "full"] as const).map((type) => (
                <Card
                  key={type}
                  className={`cursor-pointer transition-colors ${
                    backupType === type ? "border-primary bg-primary/5" : "hover:bg-accent"
                  }`}
                  onClick={() => setBackupType(type)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      {t(`settings.backup.dialog_type_${type}`)}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t(`settings.backup.dialog_type_${type}_desc`)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backup-name">{t("settings.backup.dialog_name_label")}</Label>
            <Input
              id="backup-name"
              placeholder="backup-2026-03-04"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("settings.backup.dialog_name_hint")}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("settings.backup.dialog_cancel")}
          </Button>
          <Button onClick={onCreate}>
            <Archive className="w-4 h-4 mr-2" />
            {t("settings.backup.dialog_create_button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

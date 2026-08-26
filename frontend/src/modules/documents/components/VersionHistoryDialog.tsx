import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, History, User, Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import { FileItem } from "../types";

interface VersionHistoryDialogProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

interface DocumentVersion {
  id: string;
  version_number: number;
  size: string;
  created_at: string;
  creator_name: string;
  note?: string;
}

export const VersionHistoryDialog: React.FC<VersionHistoryDialogProps> = ({
  file,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [versions, setVersions] = React.useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && file) {
      const fetchVersions = async () => {
        setIsLoading(true);
        try {
          const data = await api.get(`/documents/${file.id}/versions`);
          setVersions(data);
        } catch (error) {
          console.error("Failed to fetch versions", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchVersions();
    }
  }, [isOpen, file]);

  const handleDownloadVersion = async (version: DocumentVersion) => {
    try {
      const blob = await api.get(`/documents/version/${version.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${file?.name} (v${version.version_number})`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download version", error);
    }
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            {t("documents.versions.title")}: {file.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : versions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("documents.versions.empty")}
            </p>
          ) : (
            <div className="space-y-4">
              {versions.map((v) => (
                <div 
                  key={v.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    v.version_number === versions[0].version_number ? "bg-primary/5 border-primary/20" : "bg-card"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">v{v.version_number}</span>
                      {v.version_number === versions[0].version_number && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full uppercase font-bold">
                          {t("documents.versions.current")}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{formatBytes(Number(v.size))}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(v.created_at).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {v.creator_name || "Система"}
                      </div>
                    </div>
                    {v.note && <p className="text-xs italic mt-1">"{v.note}"</p>}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDownloadVersion(v)}
                    title={t("common.download")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

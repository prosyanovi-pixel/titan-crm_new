import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Fullscreen, ExternalLink } from "lucide-react";
import { FileItem } from "../types";
import { useTranslation } from "@/lib/i18n";
import { getAuthToken } from "@/lib/api";

interface FilePreviewProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
}) => {
  const { t } = useTranslation();
  if (!file) return null;

  const isImage = ["image", "jpg", "jpeg", "png", "gif", "webp"].some(ext => 
    file.name.toLowerCase().endsWith(ext) || file.type === "image"
  );
  const isPdf = file.name.toLowerCase().endsWith("pdf") || file.type === "pdf";

  // Constructed URL for viewing/streaming
  const token = getAuthToken();
  const previewUrl = `/api/documents/download/${file.id}${token ? `?token=${token}` : ""}`;

  const renderContent = () => {
    if (isImage) {
      return (
        <div className="flex items-center justify-center min-h-[300px] bg-black/5 rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt={file.name}
            className="max-w-full max-h-[70vh] object-contain shadow-sm"
            loading="lazy"
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-[70vh] rounded-lg overflow-hidden border bg-muted">
          <embed
            src={`${previewUrl}#toolbar=0&navpanes=0`}
            type="application/pdf"
            width="100%"
            height="100%"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground mb-4">{t("documents.preview.not_supported")}</p>
        <Button onClick={() => onDownload(file)} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          {t("common.download")}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b bg-card flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col overflow-hidden mr-4">
            <DialogTitle className="text-base font-medium truncate">
              {file.name}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {file.size} • {new Date(file.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0 pr-8">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onDownload(file)}
              title={t("common.download")}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => window.open(previewUrl, "_blank")}
              title={t("common.open_new_tab")}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-4 bg-background">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React from "react";
import { Upload, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface GlobalDropzoneProps {
  onDrop: (files: FileList) => void;
}

export const GlobalDropzone: React.FC<GlobalDropzoneProps> = ({ onDrop }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounter = React.useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  React.useEffect(() => {
    const windowEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };
    
    // Мы не можем легко отследить уход мыши из окна, 
    // поэтому полагаемся на внутренние события контейнера
    
    window.addEventListener("dragenter", windowEnter as any);
    return () => window.removeEventListener("dragenter", windowEnter as any);
  }, []);

  if (!isDragging) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/20 backdrop-blur-sm border-4 border-dashed border-primary m-4 rounded-xl transition-all duration-300 pointer-events-auto"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4 bg-background p-10 rounded-2xl shadow-2xl border scale-110">
        <div className="p-6 bg-primary/10 rounded-full animate-bounce">
          <Upload className="w-12 h-12 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold">{t("documents.dialog.upload_files_title")}</h3>
          <p className="text-muted-foreground">{t("documents.dialog.upload_files_description")}</p>
        </div>
        <Button variant="ghost" size="sm" className="absolute top-4 right-4" onClick={() => setIsDragging(false)}>
            <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Вспомогательный импорт кнопки для Dropzone
import { Button } from "@/components/ui/button";

import React from 'react';
import { File, Download, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FileCardProps {
  file: {
    id: string;
    name: string;
    size: string;
    date: string;
    type: string;
  };
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onDownload, onDelete, onShare }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <File className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{file.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{file.size} • {file.date}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onDownload(file.id)}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onShare(file.id)}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(file.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
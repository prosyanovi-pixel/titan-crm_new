import React, { useState, useEffect, useRef } from "react";
import { LegalCase, CaseDocument, DocumentComment, CaseNoteAttachment } from "../../types";
import { FileText, Download, Trash2, MessageSquare, Link, StickyNote, Send, File as FileIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileUploader } from "@/components/ui/FileUploader";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface CaseDocumentsTabProps {
  documents: LegalCase["documents"];
  notes?: LegalCase["notes"];
  onChange?: (documents: CaseDocument[]) => void;
  onNotesChange?: (notes: LegalCase["notes"]) => void;
  caseId?: string;
  instanceId?: string;
  onUploadSuccess?: (upload: any) => void;
}

export function CaseDocumentsTab({ documents, notes, onChange, onNotesChange, caseId, instanceId, onUploadSuccess }: CaseDocumentsTabProps) {
  const { t } = useTranslation();
  const [localDocs, setLocalDocs] = useState<CaseDocument[]>(documents || []);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<{ noteId: string; attachmentId: string } | null>(null);
  const [showDeleteAttachmentDialog, setShowDeleteAttachmentDialog] = useState(false);
  
  // Counter for generating unique IDs without impure functions
  const idCounter = useRef(0);

   
  const [prevDocuments, setPrevDocuments] = useState(documents);

  // Sync documents prop via derived state
  if (documents !== prevDocuments) {
    setPrevDocuments(documents);
    setLocalDocs(documents || []);
  }

  const updateDocuments = (newDocs: CaseDocument[]) => {
    setLocalDocs(newDocs);
    if (onChange) {
      onChange(newDocs);
    }
  };

  // Extract attachments from notes
  const allAttachments: Array<CaseNoteAttachment & { noteId: string; noteAuthor: string; noteDate: string }> = [];
  notes?.forEach(note => {
    note.attachments?.forEach(attachment => {
      allAttachments.push({
        ...attachment,
        noteId: note.id,
        noteAuthor: note.author,
        noteDate: note.date
      });
    });
  });

  const handleUploadSuccess = (upload: { response?: any; name?: string; size?: number }) => {
    const response = upload.response;
    if (!response?.id) return;

    const doc: CaseDocument = {
      id: response.id,
      name: response.name || upload.name || 'Document',
      type: response.type || 'other',
      date: response.date || new Date().toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      size: response.size || formatFileSize(upload.size || 0),
      author: response.author || userName,
      authorId: userId,
      url: response.url,
      comments: [],
    };

    const exists = localDocs.some(existing => existing.id === doc.id);
    if (!exists) {
      updateDocuments([...localDocs, doc]);
    }

    onUploadSuccess?.(upload);
  };

  const handleDeleteClick = (docId: string) => {
    setDocumentToDelete(docId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    try {
      if (!documentToDelete.startsWith('pending_')) {
        await api.delete(`/legal-cases/documents/${documentToDelete}`);
      }
      const newDocs = localDocs.filter(d => d.id !== documentToDelete);
      updateDocuments(newDocs);
      toast.success(t('general.toast.success.file_deleted'));
    } catch (error) {
      console.error('Delete error:', error);
      const newDocs = localDocs.filter(d => d.id !== documentToDelete);
      updateDocuments(newDocs);
      toast.error(t('general.toast.error.file_delete'));
    } finally {
      setDocumentToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteAttachment = (noteId: string, attachmentId: string) => {
    setAttachmentToDelete({ noteId, attachmentId });
    setShowDeleteAttachmentDialog(true);
  };

  const confirmDeleteAttachment = () => {
    if (!attachmentToDelete || !onNotesChange) return;
    const updatedNotes = (notes || []).map(note =>
      note.id === attachmentToDelete.noteId
        ? { ...note, attachments: (note.attachments || []).filter(a => a.id !== attachmentToDelete.attachmentId) }
        : note
    );
    onNotesChange(updatedNotes);
    setAttachmentToDelete(null);
    setShowDeleteAttachmentDialog(false);
  };

  const formatFileSize = (size: number | string): string => {
    if (typeof size === 'string') return size;
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return Math.round(size / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleAddComment = (docId: string, text: string) => {
    if (!text.trim()) return;
     
    const commentId = `comment_${++idCounter.current}`;
    const newComment: DocumentComment = {
      id: commentId,
      author: t('lawyers.messages.you'),
      text: text,
      date: t('lawyers.messages.now')
    };
    const newDocs = localDocs.map(d =>
      d.id === docId ? { ...d, comments: [...(d.comments || []), newComment] } : d
    );
    updateDocuments(newDocs);
  };

  // Get upload URL with user headers
  const userId = localStorage.getItem('titan_user_id') || '';
  const userName = localStorage.getItem('titan_user_name') || 'User';

  return (
    <div className="space-y-4">
      {/* File Uploader */}
      <div className="flex justify-end">
        <FileUploader
          uploadUrl="/legal-cases/documents"
          headers={{
            'x-user-id': userId,
            'x-user-name': encodeURIComponent(userName),
          }}
          formDataFields={{
            case_id: caseId || '',
            instance_id: instanceId || '',
            type: 'other',
          }}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.zip,.rar"
          maxSize={50 * 1024 * 1024}
          buttonText={t('lawyers.case_sheet.upload_doc')}
          showUploadList={false}
          showCancelButton={true}
          onSuccess={handleUploadSuccess}
        />
      </div>

      {/* Documents List */}
      {localDocs.length === 0 && allAttachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed rounded-lg">
          <FileIcon className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm mb-4">{t('generated.net_dokumentov')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {localDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{doc.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {doc.date} • {formatFileSize(doc.size)} • {doc.author}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {doc.comments && doc.comments.length > 0 && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="flex flex-col h-[300px]">
                        <div className="p-3 border-b font-medium text-sm bg-muted/20">
                          {t('common.comments')}
                        </div>
                        <ScrollArea className="flex-1 p-3">
                          <div className="space-y-3">
                            {doc.comments?.map(comment => (
                              <div key={comment.id} className="flex gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[9px]">
                                    {comment.author.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold">{comment.author}</span>
                                    <span className="text-[10px] text-muted-foreground">{comment.date}</span>
                                  </div>
                                  <p className="text-xs text-foreground mt-0.5">{comment.text}</p>
                                </div>
                              </div>
                            ))}
                            {(!doc.comments || doc.comments.length === 0) && (
                              <p className="text-center text-xs text-muted-foreground py-4">
                                {t('generated.net_kommentariev')}
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                        <div className="p-3 border-t mt-auto">
                          <CommentInput onSubmit={(text) => handleAddComment(doc.id, text)} />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {doc.url && (doc.url.startsWith('http://') || doc.url.startsWith('https://')) ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-500 hover:text-blue-700"
                      onClick={() => window.open(doc.url, '_blank')}
                      title={t('lawyers.documents.open_external')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => doc.url && window.open(doc.url, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteClick(doc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Documents from Notes */}
          {allAttachments.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-600" />
                {t('lawyers.documents.attachments_from_notes', { count: allAttachments.length })}
              </h3>
              <div className="space-y-2">
                {allAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 border rounded-md bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600">
                        <Link className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{attachment.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {attachment.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{t('lawyers.documents.added_at', { date: attachment.addedAt })}</span>
                          <span>•</span>
                          <span>{t('lawyers.documents.in_note_date', { date: attachment.noteDate })}</span>
                          <span>•</span>
                          <span>{t('lawyers.documents.author', { author: attachment.noteAuthor })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2"
                        onClick={() => window.open(attachment.url, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-xs">{t('lawyers.documents.open')}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteAttachment(attachment.noteId, attachment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lawyers.documents.delete_dialog_title')}</DialogTitle>
            <DialogDescription>
              {t('lawyers.documents.delete_dialog_desc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('lawyers.documents.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDocument}>
              {t('lawyers.documents.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Attachment Dialog */}
      <Dialog open={showDeleteAttachmentDialog} onOpenChange={setShowDeleteAttachmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lawyers.documents.delete_attachment_title')}</DialogTitle>
            <DialogDescription>
              {t('lawyers.documents.delete_attachment_desc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAttachmentDialog(false)}>
              {t('lawyers.documents.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAttachment}>
              {t('lawyers.documents.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommentInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        className="h-8 text-xs"
        placeholder={t('generated.napisat')}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button size="icon" className="h-8 w-8 shrink-0">
        <Send className="w-3 h-3" />
      </Button>
    </form>
  );
}

import { LegalCase, CaseNote, CaseNoteAttachment } from "../../types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Lock, Edit2, FileText, MessageSquare } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useState, useEffect } from "react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { CommentInput } from "@/components/ui/CommentInput";
import { NoteAttachment } from "@/components/ui/NoteAttachmentUploader";
import { NoteItem, Note } from "@/components/ui/NoteItem";
import { DiscardChangesDialog } from "@/components/shared";

interface CaseNotesTabProps {
  notes: LegalCase["notes"];
  handleChange: (field: keyof LegalCase, value: unknown) => void;
  onDiscardChanges?: () => void;
  instanceId?: string;
}

export function CaseNotesTab({ notes, handleChange, onDiscardChanges, instanceId }: CaseNotesTabProps) {
  const { t } = useTranslation();
  const [localNotes, setLocalNotes] = useState<LegalCase["notes"]>(notes || []);
  const [newNote, setNewNote] = useState("");
  const [prevNotes, setPrevNotes] = useState(notes);
  if (notes !== prevNotes) {
    setPrevNotes(notes);
    setLocalNotes(notes || []);
  }

    const updateNotes = (nextNotes: LegalCase["notes"]) => {
      setLocalNotes(nextNotes || []);
      handleChange("notes", nextNotes || []);
    };

  const [isInternal, setIsInternal] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<CaseNoteAttachment[]>([]);

  // Обработчик открытия загрузчика файлов
  React.useEffect(() => {
    const handleOpenAttachmentDialog = () => {
      // Находим компонент NoteAttachmentUploader и открываем диалог
      const button = document.querySelector(`button[title="${t('lawyers.notes.add_file')}"]`);
      if (button) {
        // Открываем input для выбора файла
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.zip,.rar';
        input.onchange = (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            // Загружаем файл на сервер
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name);
            formData.append('type', 'other');
            
            api.post('/legal-cases/documents', formData, {
              headers: {}
            }).then(res => {
              const caseAttachment: CaseNoteAttachment = {
                id: res.id,
                name: res.name,
                url: res.url,
                type: res.type,
                addedAt: res.date || new Date().toLocaleDateString('ru-RU'),
              };
              setPendingAttachments(prev => [...prev, caseAttachment]);
              toast.success(t('lawyers.notes.file_uploaded'));
            }).catch(() => {
              toast.error(t('lawyers.notes.file_upload_error'));
            });
          }
        };
        input.click();
      }
    };

    window.addEventListener('openAttachmentUploader', handleOpenAttachmentDialog);
    return () => window.removeEventListener('openAttachmentUploader', handleOpenAttachmentDialog);
  }, [t]);
  
  // Edit mode state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editIsInternal, setEditIsInternal] = useState(false);
  const [editAttachments, setEditAttachments] = useState<CaseNoteAttachment[]>([]);

  // Delete confirmation dialog
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<{ noteId: string; attachmentId: string } | null>(null);
  const [showDeleteAttachmentDialog, setShowDeleteAttachmentDialog] = useState(false);

  // Get current user info
  const currentUserId = localStorage.getItem('titan_user_id') || '';
  const currentUserRole = localStorage.getItem('titan_user_role') || '';
  const currentUserName = localStorage.getItem('titan_user_name') || '';
  const isAdmin = currentUserRole === 'admin';

  // Filter notes based on permissions
  const visibleNotes = (localNotes || []).filter(note => {
    if (isAdmin) return true;
    if (note.isInternal) {
      return note.authorId === currentUserId || note.author === currentUserName;
    }
    return true;
  });

  const handleAddNote = () => {
    if (!newNote.trim() && pendingAttachments.length === 0) {
      toast.error(t('lawyers.notes.empty_note_error'));
      return;
    }

    if (pendingAttachments.length > 0 && !newNote.trim()) {
      const confirmed = confirm(t('lawyers.notes.no_text_confirm'));
      if (!confirmed) return;
    }

    const now = new Date();
    const authorName = currentUserName || currentUserId || 'User';
    const authorId = currentUserId;

    const initials = authorName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Generate unique ID using timestamp + random suffix (same pattern as backend)
    const uniqueSuffix = Math.random().toString(36).substring(2, 11);
    
    const newNoteObj = {
      id: `note_${Date.now()}-${uniqueSuffix}`,
      author: authorName,
      authorId,
      initials,
      date: now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      text: newNote,
      isInternal,
      instanceId,
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined
    } as CaseNote;

    updateNotes([...(localNotes || []), newNoteObj]);
    setNewNote("");
    setIsInternal(false);
    setPendingAttachments([]);
  };

  const handleAddAttachment = (attachment: NoteAttachment) => {
    // Convert UI NoteAttachment to CaseNoteAttachment
    const caseAttachment: CaseNoteAttachment = {
      id: attachment.id,
      name: attachment.name,
      url: attachment.url,
      type: attachment.type,
      addedAt: attachment.addedAt,
    };
    setPendingAttachments(prev => [...prev, caseAttachment]);
  };

  const handleRemovePendingAttachment = (attachmentId: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    const previousNotes = localNotes || [];
    const noteForDelete = previousNotes.find(note => note.id === noteToDelete);

    console.log('[DELETE NOTE]', {
      noteToDeleteId: noteToDelete,
      noteToDeleteIdType: typeof noteToDelete,
      allNoteIds: previousNotes.map(n => ({ id: n.id, idType: typeof n.id })),
      beforeFilterCount: previousNotes.length
    });
    
    const filteredNotes = previousNotes.filter(note => {
      const shouldKeep = note.id !== noteToDelete;
      if (!shouldKeep) {
        console.log('[DELETE NOTE] Removing note:', { id: note.id, text: note.text?.substring(0, 50) });
      }
      return shouldKeep;
    });
    
    console.log('[DELETE NOTE] After filter count:', filteredNotes.length);
    
    // Optimistic UI update first.
    updateNotes(filteredNotes);

    try {
      const attachmentIds = (noteForDelete?.attachments || [])
        .map(att => att.id)
        .filter(Boolean)
        .filter(id => !id.startsWith('attach_'));

      if (attachmentIds.length > 0) {
        await Promise.all(
          attachmentIds.map((id) => api.delete(`/legal-cases/documents/${id}`))
        );
      }

      toast.success(t('general.toast.success.note_deleted'));
    } catch (error) {
      // Rollback if backend deletion failed.
      updateNotes(previousNotes);
      console.error('[DELETE NOTE] Rollback after API error:', error);
      toast.error(t('general.toast.error.note_delete'));
    } finally {
      setNoteToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleStartEdit = (note: CaseNote) => {
    setEditingNoteId(note.id);
    setEditText(note.text);
    setEditIsInternal(note.isInternal);
    setEditAttachments(note.attachments || []);
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editText.trim()) {
      toast.error(t('lawyers.notes.empty_note_error'));
      return;
    }

    const updatedNotes = (localNotes || []).map(note =>
      note.id === noteId
        ? { 
            ...note, 
            text: editText, 
            isInternal: editIsInternal, 
            attachments: editAttachments.length > 0 ? editAttachments : [] // Всегда массив, никогда undefined
          }
        : note
    );
      updateNotes(updatedNotes);
    setEditingNoteId(null);
    setEditText("");
    setEditIsInternal(false);
    setEditAttachments([]);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditText("");
    setEditIsInternal(false);
    setEditAttachments([]);
  };

  const handleToggleNotePrivacy = (noteId: string) => {
    const note = localNotes?.find(n => n.id === noteId);
    if (note) {
      const updatedNote = { ...note, isInternal: !note.isInternal };
      updateNotes((localNotes || []).map(n => n.id === noteId ? updatedNote : n));
    }
  };

  const handleRemoveAttachment = (noteId: string, attachmentId: string) => {
    setAttachmentToDelete({ noteId, attachmentId });
    setShowDeleteAttachmentDialog(true);
  };

  const confirmDeleteAttachment = async () => {
    if (!attachmentToDelete) return;
    const previousNotes = localNotes || [];
    const updatedNotes = previousNotes.map(note =>
      note.id === attachmentToDelete.noteId
        ? { ...note, attachments: (note.attachments || []).filter(a => a.id !== attachmentToDelete.attachmentId) }
        : note
    );

    // Optimistic UI update first.
    updateNotes(updatedNotes);

    try {
      if (!attachmentToDelete.attachmentId.startsWith('attach_')) {
        await api.delete(`/legal-cases/documents/${attachmentToDelete.attachmentId}`);
      }

      toast.success(t('general.toast.success.file_deleted'));
    } catch (error) {
      // Rollback if backend deletion failed.
      updateNotes(previousNotes);
      console.error('[DELETE ATTACHMENT] Rollback after API error:', error);
      toast.error(t('general.toast.error.file_delete'));
    } finally {
      setAttachmentToDelete(null);
      setShowDeleteAttachmentDialog(false);
    }
  };

  // Convert NoteAttachment to CaseNoteAttachment
  const convertToCaseNoteAttachment = (att: NoteAttachment): CaseNoteAttachment => ({
    id: att.id,
    name: att.name,
    url: att.url,
    type: att.type,
    addedAt: att.addedAt,
  });

  return (
    <div className="flex flex-col h-[500px]" data-notes-tab>
      {/* Список заметок */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {(!visibleNotes || visibleNotes.length === 0) && (
          <div className="text-center py-10 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t('generated.net_zametok')}</p>
          </div>
        )}

        {visibleNotes.map((note) => {
          const isEditing = editingNoteId === note.id;

          if (isEditing) {
            return (
              <div key={note.id} className={cn(
                'space-y-2',
                editIsInternal && 'bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50'
              )}>
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[100px] text-sm"
                  autoFocus
                />

                {editAttachments.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      {t('lawyers.notes.attached_documents')}
                    </div>
                    {editAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 text-xs p-2 bg-muted/50 rounded-md"
                      >
                        <span className="flex-1 truncate" title={attachment.name}>
                          {attachment.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-background rounded shrink-0">
                          {attachment.type}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => setEditAttachments(prev => prev.filter(a => a.id !== attachment.id))}
                        >
                          <span className="sr-only">{t('lawyers.notes.action.delete')}</span>
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    onClick={() => {
                      const uniqueSuffix = Math.random().toString(36).substring(2, 11);
                      setEditAttachments(prev => [...prev, {
                        id: `attach_${Date.now()}-${uniqueSuffix}`,
                        name: t('lawyers.notes.new_file'),
                        url: '',
                        type: 'other',
                        addedAt: new Date().toLocaleDateString('ru-RU'),
                      }]);
                    }}
                  >
                    {t('lawyers.notes.add_file')}
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7"
                      onClick={handleCancelEdit}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      size="sm"
                      className="h-7"
                      onClick={() => handleSaveEdit(note.id)}
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <NoteItem
              key={note.id}
              note={note as Note}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              currentUserRole={currentUserRole}
              onEdit={handleStartEdit}
              onDelete={handleDeleteNote}
              onTogglePrivacy={handleToggleNotePrivacy}
              onRemoveAttachment={handleRemoveAttachment}
            />
          );
        })}
      </div>

      {/* Ввод новой заметки */}
      <div className="mt-auto border-t pt-4">
        <div className="relative">
          <Textarea
            placeholder={t('lawyers.case_sheet.add_note')}
            className="min-h-[100px] resize-none"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          
          {/* Вложения новой заметки - отображаем внутри поля */}
          {pendingAttachments.length > 0 && (
            <div className="mt-2 space-y-1 border-t pt-2">
              <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                {t('lawyers.notes.attached_documents')}
              </div>
              {pendingAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 text-xs p-2 bg-muted/50 rounded-md"
                >
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  <span className="flex-1 truncate" title={attachment.name}>
                    {attachment.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-background rounded shrink-0">
                    {attachment.type}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleRemovePendingAttachment(attachment.id)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => {
                // Open attachment dialog
                const event = new CustomEvent('openAttachmentUploader');
                window.dispatchEvent(event);
              }}
              title={t('lawyers.notes.add_file')}
            >
              {t('lawyers.notes.add_file')}
            </Button>
            <Button
              size="sm"
              variant={isInternal ? "default" : "ghost"}
              className={cn(
                "h-8",
                isInternal ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "text-muted-foreground"
              )}
              onClick={() => setIsInternal(!isInternal)}
              title={isInternal ? t('lawyers.notes.action.make_public') : t('lawyers.notes.action.make_private')}
            >
              {isInternal ? <Lock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {isInternal ? t('lawyers.notes.privacy.private') : t('lawyers.notes.privacy.public')}
            </Button>
            <Button
              size="sm"
              className="h-8 gap-2"
              disabled={!newNote.trim() && pendingAttachments.length === 0}
              onClick={handleAddNote}
            >
              {t('generated.otpravit')}
            </Button>
          </div>
        </div>
      </div>

      {/* Диалог подтверждения удаления */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lawyers.notes.delete_dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('lawyers.notes.delete_dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteNote}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteAttachmentDialog} onOpenChange={setShowDeleteAttachmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lawyers.notes.delete_attachment_dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('lawyers.notes.delete_attachment_dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAttachmentDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAttachment}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useContractVersions, useRevertVersion, useDeleteContractVersion, useCreateContractVersion, useContractFiles, useUploadContractFiles, useCreateContractTemplate } from '../hooks';
import type { ContractVersion } from '../types/contract.types';
import { TemplateWordEditor } from '@/modules/templates/components/TemplateWordEditor';
import { SendForApprovalDialog } from './SendForApprovalDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/formatters';
import { Loader2, Plus, FileText, Upload, Clock, CheckCircle, XCircle, PanelLeftClose, PanelLeftOpen, Trash2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface VersionHistoryProps {
  contractId: string;
}

export function VersionHistory({ contractId }: VersionHistoryProps) {
  const { t } = useTranslation();
  const { data: versions, isLoading } = useContractVersions(contractId);
  const revertMutation = useRevertVersion(contractId);
  const deleteMutation = useDeleteContractVersion(contractId);

  const createMutation = useCreateContractVersion(contractId);
  const createTemplateMutation = useCreateContractTemplate();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isRevertOpen, setIsRevertOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionContent, setNewVersionContent] = useState('');
  const [newVersionChanges, setNewVersionChanges] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string>('none');
  const { data: files } = useContractFiles(contractId);
  const uploadMutation = useUploadContractFiles(contractId);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const handleSaveAsTemplate = async () => {
    try {
      await createTemplateMutation.mutateAsync({
        name: templateName || `Шаблон на базе ${contractId}`,
        content: newVersionContent,
        category: 'Общие'
      });
      setIsTemplateDialogOpen(false);
      setTemplateName('');
    } catch (e) {
      // handled
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const uploadedFiles = await uploadMutation.mutateAsync(Array.from(e.target.files));
        if (uploadedFiles && uploadedFiles.length > 0) {
          setSelectedFileId(uploadedFiles[0].id);
        }
      } catch (err) {
        // Error handled by hook
      }
    }
  };

  const handleCreateVersion = async () => {
    try {
      await createMutation.mutateAsync({
        name: newVersionName || `Версия ${versions ? versions.length + 1 : 1}`,
        content: newVersionContent,
        changes: newVersionChanges ? { reason: newVersionChanges } : undefined,
        fileId: selectedFileId === 'none' ? undefined : selectedFileId
      });
      setIsCreating(false);
      setNewVersionName('');
      setNewVersionContent('');
      setNewVersionChanges('');
      setSelectedFileId('none');
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleRevert = async (versionId: string) => {
    try {
      await revertMutation.mutateAsync(versionId);
      setIsRevertOpen(false);
    } catch (e) {
      // error handled by hook
    }
  };

  const handleDelete = async (versionId: string) => {
    try {
      await deleteMutation.mutateAsync(versionId);
      setIsDeleteOpen(false);
      setSelectedVersionId(null);
    } catch (e) {
      // error handled by hook
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">{t('general.loading')}</div>;
  }

  const selectedVersion = versions?.find(v => v.id === selectedVersionId);
  const showMobileList = !selectedVersionId && !isCreating;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1"/> Согласован</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Отклонен</Badge>;
      case 'pending_approval':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"><Clock className="w-3 h-3 mr-1"/> На согласовании</Badge>;
      default:
        return <Badge variant="outline">Черновик</Badge>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[800px] border rounded-lg overflow-hidden bg-background">
      {/* Left Sidebar - List */}
      <div className={`w-full md:w-[280px] border-r flex flex-col transition-all duration-300 ${!showMobileList ? 'hidden md:flex' : 'flex'} ${!isSidebarOpen ? 'md:!hidden' : ''} shrink-0`}>
        <div className="p-4 border-b flex justify-between items-center bg-muted/30 shrink-0">
          <h3 className="font-semibold text-lg">{t('contracts.tabs.versions')}</h3>
          <Button size="sm" onClick={() => {
            setIsCreating(true);
            setSelectedVersionId(null);
            if (versions && versions.length > 0) {
              const maxVersion = versions.reduce((prev, current) => (prev.versionNumber > current.versionNumber) ? prev : current);
              setNewVersionContent(maxVersion?.content || '');
            } else {
              setNewVersionContent('');
            }
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Создать
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-muted/10">
          {(!versions || versions.length === 0) ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Нет версий. Создайте первую версию.
            </div>
          ) : (
            versions.map((version) => (
              <button
                key={version.id}
                onClick={() => { setSelectedVersionId(version.id); setIsCreating(false); }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedVersionId === version.id && !isCreating ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-background hover:bg-muted/50 border-border/50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium truncate">{version.name || `Версия ${version.versionNumber}`}</span>
                  {getStatusBadge(version.status)}
                </div>
                <div className="text-xs text-muted-foreground flex flex-col gap-1 mt-2">
                  <div className="flex justify-between">
                    <span>{version.createdByName || version.createdBy}</span>
                    <span>{formatDate(version.createdAt)}</span>
                  </div>
                  {version.fileId && (
                    <div className="flex items-center text-primary/70 mt-1">
                      <FileText className="w-3 h-3 mr-1" />
                      <span className="truncate">{version.fileName || 'Файл прикреплен'}</span>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className={`flex-1 flex flex-col ${showMobileList ? 'hidden md:flex' : 'flex'}`}>
        {!isCreating && !selectedVersion && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
            <FileText className="w-12 h-12 opacity-20" />
            <p>Выберите версию для просмотра или создайте новую</p>
          </div>
        )}

        {isCreating && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-muted/30 shrink-0 flex items-center">
              <Button variant="ghost" size="sm" className="md:hidden mr-2" onClick={() => setIsCreating(false)}>
                Назад
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex mr-2" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </Button>
              <h3 className="font-semibold">{t('contracts.versions.dialogs.create')}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version-name">{t('contracts.versions.table.name')}</Label>
                  <Input 
                    id="version-name" 
                    value={newVersionName} 
                    onChange={(e) => setNewVersionName(e.target.value)}
                    placeholder={`Версия ${versions ? versions.length + 1 : 1}`} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Привязать файл</Label>
                  <div className="flex gap-2">
                    <Select value={selectedFileId} onValueChange={setSelectedFileId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Выберите файл (опционально)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без файла</SelectItem>
                        {files?.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.originalName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                      {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 h-[500px]">
                <Label>Содержимое версии</Label>
                <div className="border rounded-md h-full overflow-hidden">
                  <TemplateWordEditor content={newVersionContent} onChange={setNewVersionContent} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version-changes">{t('contracts.versions.table.changes')}</Label>
                <Textarea 
                  id="version-changes" 
                  value={newVersionChanges} 
                  onChange={(e) => setNewVersionChanges(e.target.value)}
                  placeholder={t('contracts.versions.placeholder.changes')} 
                />
              </div>
            </div>

            <div className="p-4 border-t bg-muted/10 shrink-0 flex justify-between gap-2">
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" type="button" disabled={createTemplateMutation.isPending || !newVersionContent}>
                    {createTemplateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Сохранить как шаблон
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Сохранить как шаблон</DialogTitle>
                    <DialogDescription>Введите название для нового шаблона.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Название шаблона</Label>
                      <Input 
                        value={templateName} 
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder={`Шаблон на базе договора`} 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleSaveAsTemplate} disabled={createTemplateMutation.isPending}>
                      Сохранить
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  {t('general.cancel')}
                </Button>
                <Button onClick={handleCreateVersion} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('general.save')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedVersion && !isCreating && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-muted/30 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="md:hidden mr-1" onClick={() => setSelectedVersionId(null)}>
                  Назад
                </Button>
                <Button variant="ghost" size="icon" className="hidden md:flex mr-1" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                  {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                </Button>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {selectedVersion.name || `Версия ${selectedVersion.versionNumber}`}
                    {getStatusBadge(selectedVersion.status)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    От {formatDate(selectedVersion.createdAt)} • {selectedVersion.createdByName || selectedVersion.createdBy}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedVersion.fileId && (
                  <Button variant="outline" size="sm" onClick={() => window.open(`/api/files/download/${selectedVersion.fileId}`, '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    Скачать
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsCreating(true);
                    setNewVersionContent(selectedVersion.content || '');
                    setNewVersionName('');
                    setSelectedFileId(selectedVersion.fileId || 'none');
                    setNewVersionChanges('');
                  }}
                >
                  Редактировать
                </Button>
                
                <Dialog open={isRevertOpen} onOpenChange={setIsRevertOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Восстановить</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Восстановить версию</DialogTitle>
                      <DialogDescription>Вы уверены, что хотите восстановить эту версию? Это создаст новую версию на основе выбранной.</DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsRevertOpen(false)}>
                        {t('general.cancel')}
                      </Button>
                      <Button onClick={() => handleRevert(selectedVersion.id)} disabled={revertMutation.isPending}>
                        {revertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Подтвердить
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Удалить версию</DialogTitle>
                      <DialogDescription>Вы уверены, что хотите удалить эту версию? Действие необратимо.</DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                        {t('general.cancel')}
                      </Button>
                      <Button variant="destructive" onClick={() => handleDelete(selectedVersion.id)} disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Удалить
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <SendForApprovalDialog 
                  contractId={contractId} 
                  versionId={selectedVersion.id} 
                  trigger={<Button size="sm">На согласование</Button>}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
              {selectedVersion.changes && typeof selectedVersion.changes === 'object' && 'reason' in selectedVersion.changes && (
                <div className="mb-6 p-4 bg-background border rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium mb-1">Изменения:</h4>
                  <p className="text-sm text-muted-foreground">{String(selectedVersion.changes.reason)}</p>
                </div>
              )}
              
              <div className="bg-background rounded-lg border shadow-sm p-8 min-h-[500px]">
                {selectedVersion.content ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} className="prose dark:prose-invert max-w-none text-sm" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p>{selectedVersion.fileId ? 'Текст отсутствует (прикреплен файл)' : 'Содержимое пусто'}</p>
                    {selectedVersion.fileId && (
                      <Button variant="outline" className="mt-4" onClick={() => window.open(`/api/files/download/${selectedVersion.fileId}`, '_blank')}>
                        Скачать прикрепленный файл
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

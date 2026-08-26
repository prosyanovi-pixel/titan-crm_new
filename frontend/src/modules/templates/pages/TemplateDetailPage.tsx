import React, { useState, useEffect } from 'react';
import { Template } from '../types';
import { useTranslation } from '@/lib/i18n';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTemplates, useUpdateTemplate, useDeleteTemplate } from '../hooks/useTemplates';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, FileText, Download, Trash2, PanelRightClose, PanelRightOpen, RefreshCw, Play } from 'lucide-react';
import mammoth from 'mammoth';
import { TemplateVariablesList } from '../components/TemplateVariablesList';
import { TemplateWordEditor } from '../components/TemplateWordEditor';
import { ManageNumeratorsDialog } from '../components/ManageNumeratorsDialog';
import { templatesApi } from '../api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import { api } from '@/lib/api';

export default function TemplateDetailPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.pathname.split('/').pop() || null;
  
  const { data: templates = [], isLoading, error } = useTemplates();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();
  
  const template = templates.find((t: Template) => String(t.id) === String(id));
  
  const { hasPermission, isAdmin } = usePermission();
  const canWrite = hasPermission(PERMISSIONS.templates.write);
  const canDelete = hasPermission(PERMISSIONS.templates.delete);
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('titan_user_id') : null;
  const canEditTemplate = template && canWrite && (isAdmin() || template.createdBy === currentUserId);
  const canDeleteTemplate = template && canDelete && (isAdmin() || template.createdBy === currentUserId);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    moduleId: 'contracts',
    templateTypeId: 1, 
    numeratorId: 'none',
    file: null as File | null,
    firstPageHeaderOnly: false,
    documentSettings: {
      pageSize: 'A4',
      orientation: 'portrait'
    },
    isShared: true,
    accessRules: [] as { access_code: string; permission: string }[]
  });

  const [numerators, setNumerators] = useState<{id: number, name: string, mask: string}[]>([]);
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  const [roles, setRoles] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    templatesApi.getNumerators().then(setNumerators).catch(console.error);
    api.get('/administration/users').then(data => setUsers(data || [])).catch(console.error);
    api.get('/administration/roles').then(data => setRoles(data || [])).catch(console.error);
  }, []);

  const [htmlContent, setHtmlContent] = useState('');
  const [headerHtmlContent, setHeaderHtmlContent] = useState('');
  const [footerHtmlContent, setFooterHtmlContent] = useState('');
  const [editorTab, setEditorTab] = useState<'content' | 'header' | 'footer'>('content');
  const [isVariablesOpen, setIsVariablesOpen] = useState(true);
  const [isParsingDocx, setIsParsingDocx] = useState(false);

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEntityId, setTestEntityId] = useState('');
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);

  const [prevTemplateId, setPrevTemplateId] = useState<string | number | null>(null);

  if (template && template.id !== prevTemplateId) {
    setPrevTemplateId(template.id);
    setFormData({
      name: template.name,
      description: template.description || '',
      moduleId: template.moduleId || 'contracts',
      templateTypeId: template.templateTypeId || 1,
      numeratorId: template.numeratorId ? template.numeratorId.toString() : 'none',
      file: null,
      firstPageHeaderOnly: template.firstPageHeaderOnly || false,
      documentSettings: {
        pageSize: template.documentSettings?.pageSize || 'A4',
        orientation: template.documentSettings?.orientation || 'portrait'
      },
      isShared: template.isShared !== undefined ? template.isShared : true,
      accessRules: template.accessRules || []
    });
    if (template.htmlContent) {
      setHtmlContent(template.htmlContent);
    }
    if (template.headerHtmlContent) {
      setHeaderHtmlContent(template.headerHtmlContent);
    }
    if (template.footerHtmlContent) {
      setFooterHtmlContent(template.footerHtmlContent);
    }
  }

  useEffect(() => {
    if (template && !template.htmlContent && template.filePath) {
      const parseDocx = async () => {
        setIsParsingDocx(true);
        try {
          const blob = await templatesApi.downloadTemplate(template.id);
          const arrayBuffer = await blob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setHtmlContent(result.value);
        } catch (err) {
          console.error('Mammoth parsing error:', err);
        } finally {
          setIsParsingDocx(false);
        }
      };
      parseDocx();
    }
  }, [template?.id, template?.htmlContent, template?.filePath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template || error) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="outline" onClick={() => navigate('/templates')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('general.back')}
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{t('templates.errors.not_found')}</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('moduleId', formData.moduleId);
    submitData.append('templateTypeId', formData.templateTypeId.toString());
    
    if (formData.numeratorId !== 'none') {
      submitData.append('numeratorId', formData.numeratorId);
    } else {
      submitData.append('numeratorId', ''); // send empty to clear
    }
    
    if (htmlContent) {
      submitData.append('isHtml', 'true');
      submitData.append('htmlContent', htmlContent);
      if (headerHtmlContent) submitData.append('headerHtmlContent', headerHtmlContent);
      if (footerHtmlContent) submitData.append('footerHtmlContent', footerHtmlContent);
      submitData.append('firstPageHeaderOnly', formData.firstPageHeaderOnly.toString());
      submitData.append('documentSettings', JSON.stringify(formData.documentSettings));
    }
    
    if (formData.file) {
      submitData.append('file', formData.file);
    }

    submitData.append('isShared', formData.isShared.toString());

    if (formData.isShared && formData.accessRules.length > 0) {
      submitData.append('accessRules', JSON.stringify(formData.accessRules));
    }

    try {
      await updateMutation.mutateAsync({
        id: template.id,
        data: submitData
      });
      toast.success(t('common.saved_successfully'));
      navigate('/templates');
    } catch (error) {
      toast.error(t('common.error_saving'));
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await templatesApi.downloadTemplate(template.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('common.downloaded'));
    } catch (err) {
      console.error('Failed to download template:', err);
      toast.error(t('common.error_saving'));
    }
  };

  const handleTestGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEntityId.trim()) return;
    setIsGeneratingTest(true);
    try {
      const blob = await templatesApi.generateDocument(template.id, testEntityId.trim(), false);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test_${template.name}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('templates.testSuccess'));
      setIsTestModalOpen(false);
    } catch (err) {
      console.error('Failed to generate test doc:', err);
      toast.error(t('templates.testError'));
    } finally {
      setIsGeneratingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/templates')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
          </div>
        </div>
        
        <div className="flex gap-2">
          {canDeleteTemplate && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('general.delete')}</DialogTitle>
                <DialogDescription>
                  {t('common.confirmDelete')}
                </DialogDescription>
              </DialogHeader>
              <Button
                onClick={() => {
                  deleteMutation.mutate(template.id, {
                    onSuccess: () => {
                      toast.success(t('common.deleted_successfully'));
                      navigate('/templates');
                    },
                    onError: () => {
                      toast.error(t('common.error_deleting'));
                    }
                  });
                }}
                disabled={deleteMutation.isPending}
                variant="destructive"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('general.confirm')}
              </Button>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      <div className="bg-card text-card-foreground border rounded-lg p-6 max-w-[1400px] mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.name')}</label>
            <Input 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.description')}</label>
            <Textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('templates.module')}</label>
            <Select 
              value={formData.moduleId} 
              onValueChange={(val) => setFormData({ ...formData, moduleId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contracts">{t('templates.moduleNames.contracts')}</SelectItem>
                <SelectItem value="projects">{t('templates.moduleNames.projects')}</SelectItem>
                <SelectItem value="cases">{t('templates.moduleNames.legal_cases')}</SelectItem>
                <SelectItem value="mail">{t('templates.moduleNames.mail')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 mt-6">
            <label className="text-sm font-medium">Сценарий использования (Мастер документов)</label>
            <Select 
              disabled={!canEditTemplate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите действие" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Просто скачать файл</SelectItem>
                <SelectItem value="create_mail">Создать письмо с вложением</SelectItem>
                <SelectItem value="create_claim">Создать судебную претензию</SelectItem>
                <SelectItem value="create_contract">Создать карточку договора</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Определяет, что произойдет после генерации документа из карточки модуля.
            </p>
          </div>

          <div className="space-y-2 mt-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Нумератор (необязательно)</label>
              <ManageNumeratorsDialog 
                numerators={numerators} 
                onNumeratorsChange={setNumerators} 
              />
            </div>
            <Select 
              value={formData.numeratorId} 
              onValueChange={(val) => setFormData({ ...formData, numeratorId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите нумератор" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без автонумерации</SelectItem>
                {numerators.map(n => (
                  <SelectItem key={n.id} value={n.id.toString()}>{n.name} (Маска: {n.mask})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 border rounded-md p-4">
            <h3 className="font-semibold text-lg">{t('templates.accessRights')}</h3>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="isShared" 
                  checked={!formData.isShared} 
                  onChange={() => canEditTemplate && setFormData({...formData, isShared: false, accessRules: []})} 
                  disabled={!canEditTemplate}
                  className="w-4 h-4 text-primary disabled:opacity-50"
                />
                <span className="text-sm font-medium">{t('templates.accessPrivate')}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="isShared" 
                  checked={formData.isShared} 
                  onChange={() => canEditTemplate && setFormData({...formData, isShared: true})}
                  disabled={!canEditTemplate}
                  className="w-4 h-4 text-primary disabled:opacity-50"
                />
                <span className="text-sm font-medium">{t('templates.accessShared')}</span>
              </label>
            </div>
            
            {formData.isShared && (
              <div className="space-y-6 pt-4 border-t mt-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">{t('templates.accessAllOrSelect')}</label>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id="accessAll" 
                      checked={formData.accessRules.length === 0}
                      disabled={!canEditTemplate}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({...formData, accessRules: []});
                        } else {
                          // Add at least one rule so it's not "all"
                          if (roles.length > 0) {
                            setFormData({...formData, accessRules: [{ access_code: `R_${roles[0].id}`, permission: 'view' }]});
                          }
                        }
                      }}
                    />
                    <label htmlFor="accessAll" className={`text-sm ${canEditTemplate ? 'cursor-pointer' : 'opacity-50'}`}>Всем пользователям</label>
                  </div>
                </div>

                {formData.accessRules.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-md">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Роли с доступом:</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {roles.map(role => {
                          const accessCode = `R_${role.id}`;
                          const isChecked = formData.accessRules.some(r => r.access_code === accessCode);
                          return (
                            <div key={role.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`role_${role.id}`} 
                                checked={isChecked}
                                disabled={!canEditTemplate}
                                onCheckedChange={(checked) => {
                                  let newRules = [...formData.accessRules];
                                  if (checked) {
                                    newRules.push({ access_code: accessCode, permission: 'view' });
                                  } else {
                                    newRules = newRules.filter(r => r.access_code !== accessCode);
                                  }
                                  setFormData({...formData, accessRules: newRules});
                                }}
                              />
                              <label htmlFor={`role_${role.id}`} className={`text-sm ${canEditTemplate ? 'cursor-pointer' : 'opacity-50'}`}>{role.name}</label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Сотрудники с доступом:</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {users.map(user => {
                          const accessCode = `U_${user.id}`;
                          const isChecked = formData.accessRules.some(r => r.access_code === accessCode);
                          return (
                            <div key={user.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`user_${user.id}`} 
                                checked={isChecked}
                                disabled={!canEditTemplate}
                                onCheckedChange={(checked) => {
                                  let newRules = [...formData.accessRules];
                                  if (checked) {
                                    newRules.push({ access_code: accessCode, permission: 'view' });
                                  } else {
                                    newRules = newRules.filter(r => r.access_code !== accessCode);
                                  }
                                  setFormData({...formData, accessRules: newRules});
                                }}
                              />
                              <label htmlFor={`user_${user.id}`} className={`text-sm ${canEditTemplate ? 'cursor-pointer' : 'opacity-50'}`}>{user.name}</label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mt-6">
            <div className={`${isVariablesOpen ? 'xl:col-span-3' : 'xl:col-span-4'} space-y-4 transition-all duration-300`}>
              <label className="text-sm font-medium">
                {t('templates.fileReplace')}
              </label>
              
              {template.filePath && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md mb-2">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {template.filePath.split(/[/\\]/).pop() || template.filePath}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsTestModalOpen(true)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {t('templates.testGenerate')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleDownload}
                      title={t('common.download')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('common.download')}
                    </Button>
                  </div>
                </div>
              )}
              
              <Input 
                type="file" 
                accept=".docx" 
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
              />
              <p className="text-xs text-amber-600 mb-1">
                {t('templates.fileReplaceHint')}
              </p>

              <div className="pt-4 pb-12">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant={editorTab === 'content' ? 'default' : 'outline'} onClick={() => setEditorTab('content')}>
                        Основной текст
                      </Button>
                      <Button type="button" size="sm" variant={editorTab === 'header' ? 'default' : 'outline'} onClick={() => setEditorTab('header')}>
                        Шапка (Колонтитул)
                      </Button>
                      <Button type="button" size="sm" variant={editorTab === 'footer' ? 'default' : 'outline'} onClick={() => setEditorTab('footer')}>
                        Подвал (Нижний колонтитул)
                      </Button>
                    </div>
                    {isParsingDocx && (
                      <span className="text-xs text-muted-foreground flex items-center">
                        <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                        Извлечение текста из .docx...
                      </span>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsVariablesOpen(!isVariablesOpen)}
                    className="h-8"
                  >
                    {isVariablesOpen ? <PanelRightClose className="h-4 w-4 mr-2" /> : <PanelRightOpen className="h-4 w-4 mr-2" />}
                    {isVariablesOpen ? t('templates.hideVariables') : t('templates.showVariables')}
                  </Button>
                </div>

                {editorTab === 'header' && (
                  <div className="flex items-center space-x-2 mb-4 mt-4 bg-muted/30 p-2 rounded-md border border-border/50">
                    <Checkbox 
                      id="firstPageHeaderOnly" 
                      checked={formData.firstPageHeaderOnly}
                      onCheckedChange={(checked) => setFormData({ ...formData, firstPageHeaderOnly: !!checked })}
                    />
                    <label
                      htmlFor="firstPageHeaderOnly"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                    >
                      Особый колонтитул для первой страницы (остальные страницы без шапки)
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-4 mt-4 bg-muted/30 p-2 rounded-md border border-border/50">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Размер:</label>
                    <Select 
                      value={formData.documentSettings.pageSize} 
                      onValueChange={(val) => setFormData({ ...formData, documentSettings: { ...formData.documentSettings, pageSize: val } })}
                      disabled={!canEditTemplate}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="Размер" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A5">A5</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Ориентация:</label>
                    <Select 
                      value={formData.documentSettings.orientation} 
                      onValueChange={(val) => setFormData({ ...formData, documentSettings: { ...formData.documentSettings, orientation: val } })}
                      disabled={!canEditTemplate}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Ориентация" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Книжная</SelectItem>
                        <SelectItem value="landscape">Альбомная</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="w-full border rounded mt-4 min-h-[400px]">
                  {editorTab === 'content' && (
                    <TemplateWordEditor 
                      content={htmlContent} 
                      onChange={setHtmlContent}
                    />
                  )}
                  {editorTab === 'header' && (
                    <TemplateWordEditor 
                      content={headerHtmlContent} 
                      onChange={setHeaderHtmlContent}
                    />
                  )}
                  {editorTab === 'footer' && (
                    <TemplateWordEditor 
                      content={footerHtmlContent} 
                      onChange={setFooterHtmlContent}
                    />
                  )}
                </div>
              </div>
            </div>
            
            {isVariablesOpen && (
              <div className="xl:col-span-1">
                <TemplateVariablesList 
                  moduleId={formData.moduleId} 
                  onSelect={(variable) => {
                    if (editorTab === 'content') setHtmlContent(prev => prev + variable);
                    if (editorTab === 'header') setHeaderHtmlContent(prev => prev + variable);
                    if (editorTab === 'footer') setFooterHtmlContent(prev => prev + variable);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => navigate('/templates')}>
              {canEditTemplate ? t('common.cancel') : t('common.close')}
            </Button>
            {canEditTemplate && (
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            )}
          </div>
        </form>
      </div>

      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('templates.testGenerate')}</DialogTitle>
            <DialogDescription>
              {t('templates.testGenerateHelp')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTestGenerate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Сущности</label>
              <Input 
                value={testEntityId} 
                onChange={e => setTestEntityId(e.target.value)} 
                placeholder="ID..." 
                required 
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsTestModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={!testEntityId || isGeneratingTest}>
                {isGeneratingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.generate')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

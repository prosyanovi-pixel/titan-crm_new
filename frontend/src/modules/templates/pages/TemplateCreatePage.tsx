import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { useCreateTemplate } from '../hooks/useTemplates';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { TemplateVariablesList } from '../components/TemplateVariablesList';
import { TemplateWordEditor } from '../components/TemplateWordEditor';
import { ManageNumeratorsDialog } from '../components/ManageNumeratorsDialog';
import { templatesApi } from '../api';
import { Checkbox } from '@/components/ui/checkbox';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import { api } from '@/lib/api';

export default function TemplateCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateTemplate();
  const { hasPermission, isLoading: permissionsLoading } = usePermission();
  const canWrite = hasPermission(PERMISSIONS.templates.write);
  
  useEffect(() => {
    if (!permissionsLoading && !canWrite) {
      toast.error(t('templates.errors.accessDenied'));
      navigate('/templates');
    }
  }, [canWrite, permissionsLoading, navigate, t]);
  
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
    targetAction: 'none',
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

  const [creationMode, setCreationMode] = useState<'file' | 'editor'>('file');
  const [htmlContent, setHtmlContent] = useState('');
  const [headerHtmlContent, setHeaderHtmlContent] = useState('');
  const [footerHtmlContent, setFooterHtmlContent] = useState('');
  const [editorTab, setEditorTab] = useState<'content' | 'header' | 'footer'>('content');
  const [isVariablesOpen, setIsVariablesOpen] = useState(true);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('moduleId', formData.moduleId);
    submitData.append('templateTypeId', formData.templateTypeId.toString());
    
    if (formData.numeratorId !== 'none') {
      submitData.append('numeratorId', formData.numeratorId);
    }
    
    if (creationMode === 'editor' && htmlContent) {
      submitData.append('isHtml', 'true');
      submitData.append('htmlContent', htmlContent);
      if (headerHtmlContent) submitData.append('headerHtmlContent', headerHtmlContent);
      if (footerHtmlContent) submitData.append('footerHtmlContent', footerHtmlContent);
      submitData.append('firstPageHeaderOnly', formData.firstPageHeaderOnly.toString());
      submitData.append('documentSettings', JSON.stringify(formData.documentSettings));
    } else if (formData.file) {
      submitData.append('file', formData.file);
    }
    
    submitData.append('isShared', formData.isShared.toString());
    submitData.append('targetAction', formData.targetAction);
    
    if (formData.isShared && formData.accessRules.length > 0) {
      submitData.append('accessRules', JSON.stringify(formData.accessRules));
    }

    try {
      await createMutation.mutateAsync(submitData);
      toast.success(t('common.saved_successfully'));
      navigate('/templates');
    } catch (error) {
      toast.error(t('common.error_saving'));
    }
  };

  if (permissionsLoading) return null;
  if (!canWrite) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/templates')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{t('templates.uploadTitle')}</h1>
      </div>

      <div className="bg-card text-card-foreground border rounded-lg p-6 max-w-[1400px] mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.name')}</label>
            <Input 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('templates.namePlaceholder')}
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Сценарий использования (Мастер документов)</label>
            <Select 
              value={formData.targetAction} 
              onValueChange={(val) => setFormData({ ...formData, targetAction: val })}
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

          <div className="space-y-2">
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
                  onChange={() => setFormData({...formData, isShared: false, accessRules: []})} 
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm font-medium">{t('templates.accessPrivate')}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="isShared" 
                  checked={formData.isShared} 
                  onChange={() => setFormData({...formData, isShared: true})}
                  className="w-4 h-4 text-primary"
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
                    <label htmlFor="accessAll" className="text-sm cursor-pointer">Всем пользователям</label>
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
                              <label htmlFor={`role_${role.id}`} className="text-sm cursor-pointer">{role.name}</label>
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
                              <label htmlFor={`user_${user.id}`} className="text-sm cursor-pointer">{user.name}</label>
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

          <Tabs value={creationMode} onValueChange={(v) => setCreationMode(v as 'file' | 'editor')}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="file">{t('templates.uploadFile')}</TabsTrigger>
              <TabsTrigger value="editor">{t('templates.createEditor')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">{t('templates.file')}</label>
                  <Input 
                    type="file" 
                    accept=".docx" 
                    required={creationMode === 'file'} 
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('templates.fileHelp')}
                  </p>
                </div>
                <div className="md:col-span-1">
                  <TemplateVariablesList moduleId={formData.moduleId} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="editor" className="mt-4">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className={`${isVariablesOpen ? 'xl:col-span-3' : 'xl:col-span-4'} space-y-2 pb-12 transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-2">
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
                    <div className="flex items-center space-x-2 mb-4 bg-muted/30 p-2 rounded-md border border-border/50">
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

                  <div className="flex items-center gap-4 mb-4 bg-muted/30 p-2 rounded-md border border-border/50">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Размер:</label>
                      <Select 
                        value={formData.documentSettings.pageSize} 
                        onValueChange={(val) => setFormData({ ...formData, documentSettings: { ...formData.documentSettings, pageSize: val } })}
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

                  <div className="w-full border rounded min-h-[400px]">
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
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => navigate('/templates')}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

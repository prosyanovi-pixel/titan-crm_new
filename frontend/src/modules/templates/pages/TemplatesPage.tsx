import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useMemo } from "react";
import { usePageSettings } from '@/context/LayoutContext';
import { useTemplates, useDeleteTemplate, useCopyTemplate } from '../hooks/useTemplates';
import { DataTable } from '@/components/ui/data-table';
import { useDataTable } from '@/hooks/useDataTable';
import { Template } from '../types';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { QuickActionsMenu } from '@/components/ui/QuickActionsMenu';
import { templatesApi } from '../api';
import TemplateCreatePage from './TemplateCreatePage';
import TemplateDetailPage from './TemplateDetailPage';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useSettings } from "@/hooks/use-settings";
import { useModuleActions } from "@/modules/registry/hooks/useModuleActions";
import { QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";

const TemplatesListView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useTemplates();
  const deleteMutation = useDeleteTemplate();
  const copyMutation = useCopyTemplate();
  const { confirm } = useConfirm();
  const { hasPermission, isAdmin } = usePermission();
  
  const canWrite = hasPermission(PERMISSIONS.templates.write);
  const canDelete = hasPermission(PERMISSIONS.templates.delete);
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('titan_user_id') : null;
  const { getQuickActionsByModule } = useSettings();
  const templateActions = useModuleActions("templates");
  
  const handleOpenEdit = (template: Template) => {
    if (canWrite && (isAdmin() || template.createdBy === currentUserId)) {
      navigate(`/templates/${template.id}`);
    } else {
      // Just download or show a toast that they can't edit
      // For now we do nothing if they can't edit.
    }
  };

  const handleCreate = () => {
    navigate('/templates/new');
  };

  const actions = canWrite ? (
    <Button className="gap-2 h-9" onClick={handleCreate}>
      <Plus className="w-4 h-4" />
      <span>{t('templates.upload')}</span>
    </Button>
  ) : null;

  usePageSettings({
    title: t('templates.title'),
    breadcrumbs: [{ label: t('templates.title') }],
    subtitle: t('templates.subtitle'),
    actions,
  });

  const table = useDataTable<Template>({
    initialData: templates,
    initialColumns: {
      name: true,
      moduleName: true,
      templateTypeName: true,
      authorName: true,
      updatedAt: true,
      isActive: true,
    },
    storageKey: 'templates-table',
    defaultRowsPerPage: "15",
  });

  const columnLabels = {
    name: t('common.name'),
    moduleName: t('templates.module'),
    templateTypeName: t('templates.type'),
    authorName: t('common.author'),
    updatedAt: t('common.updated_at'),
    isActive: t('common.status'),
  };

  const handleRowQuickAction = async (actionType: string, template: Template) => {
    if (actionType === 'edit') {
      handleOpenEdit(template);
    } else if (actionType === 'download') {
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
      } catch (error) {
        console.error('Failed to download template:', error);
      }
    } else if (actionType === 'delete') {
      const isConfirmed = await confirm({
        description: t('common.confirmDelete')
      });
      if (isConfirmed) {
        deleteMutation.mutate(template.id);
      }
    } else if (actionType === 'copy') {
      try {
        await copyMutation.mutateAsync(template.id);
      } catch (error) {
        console.error('Failed to copy template:', error);
      }
    }
  };

  const customQuickActions: QuickActionMenuOption[] = getQuickActionsByModule('templates').map((a: any) => ({
    label: a.name,
    action: a.action,
    icon: a.icon,
    isQuickAction: true,
  }));

  const {
    visibleColumns,
    columnOrder,
    selectedIds,
    toggleSelection,
  } = table;

  if (isLoading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <DataTable
        table={table}
        data={templates}
        columnLabels={columnLabels}
        totalCount={templates.length}
        isLoading={isLoading}
        virtualized={true}
        emptyTitle={t("templates.empty.title")}
        emptyDescription={t("templates.empty.description")}
        emptyAction={{
          label: t("templates.buttons.add"),
          onClick: handleCreate
        }}
        renderRow={(template) => {
          const isSelected = selectedIds.has(template.id);
          return (
            <TableRow
              key={template.id}
              className={`hover:bg-muted/50 cursor-pointer ${isSelected ? "bg-muted" : ""}`}
              onClick={() => handleOpenEdit(template)}
            >
              <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(template.id)}
                />
              </TableCell>

              {columnOrder.filter((key) => visibleColumns[key]).map((key) => {
                switch (key) {
                  case 'name':
                    return (
                      <TableCell key="name">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-md text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground truncate">{template.name}</span>
                            {template.description && (
                              <span className="text-[10px] text-muted-foreground truncate">{template.description}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    );
                  case 'moduleName':
                    return (
                      <TableCell key="moduleName">
                        <span className="text-xs bg-secondary px-2 py-1 rounded-full text-secondary-foreground">
                          {template.moduleName || template.moduleId}
                        </span>
                      </TableCell>
                    );
                  case 'createdAt':
                  case 'updatedAt':
                    return (
                      <TableCell key="updatedAt" className="text-sm text-muted-foreground">
                        {new Date(template.updatedAt || template.createdAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                    );
                  case 'templateTypeName':
                    return (
                      <TableCell key="templateTypeName" className="text-sm">
                        {template.templateTypeName}
                      </TableCell>
                    );
                  case 'authorName':
                    return (
                      <TableCell key="authorName" className="text-sm">
                        {template.authorName || t('common.system')}
                      </TableCell>
                    );
                  case 'isActive':
                    return (
                      <TableCell key="isActive">
                        <span className={`text-xs px-2 py-1 rounded-full ${template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {template.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </TableCell>
                    );
                  default:
                    return null;
                }
              })}

              <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
                <QuickActionsMenu
                  itemId={template.id}
                  itemName={template.name}
                  options={[
                    ...customQuickActions,
                    ...templateActions
                      .filter((a: any) => {
                        if (a.id === 'edit') return canWrite && (isAdmin() || template.createdBy === currentUserId);
                        if (a.id === 'copy') return canWrite;
                        if (a.id === 'delete') return canDelete && (isAdmin() || template.createdBy === currentUserId);
                        return true;
                      })
                      .map((a: any) => ({
                        label: a.labelKey.includes('.') ? t(a.labelKey) : a.labelKey,
                        action: a.id,
                        icon: a.icon as any,
                        isQuickAction: a.defaultOrder < 50,
                        variant: (a.id === 'delete' ? 'destructive' : undefined) as "default" | "destructive" | undefined,
                      })),
                  ]}
                  onAction={(actionType) => handleRowQuickAction(actionType, template)}
                />
              </TableCell>
            </TableRow>
          );
        }}
      />
    </div>
  );
};

export const TemplatesPage = () => {
  return (
    <Routes>
      <Route index element={<TemplatesListView />} />
      <Route path="new" element={<TemplateCreatePage />} />
      <Route path=":id" element={<TemplateDetailPage />} />
    </Routes>
  );
};

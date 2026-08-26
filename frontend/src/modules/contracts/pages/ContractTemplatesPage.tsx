/**
 * Contract Templates Page
 * Manage contract templates using standard components
 */

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useContractTemplates, useCreateContractTemplate, useDeleteContractTemplate } from '../hooks';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ContractTemplateSheet } from '../components';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useDataTable } from '@/hooks/useDataTable';
import { DataTable } from '@/components/ui/data-table';
import { ContractTemplate } from '../types/contract.types';

// TemplateFormValues matching the schema in ContractTemplateSheet
type TemplateFormValues = {
  name: string;
  description: string;
  content: string;
  category: string;
};

interface ContractTemplatesPageProps {
  onOpenCreate?: (open: boolean) => void;
  isCreateOpen?: boolean;
  /** External search query from parent toolbar — overrides internal if provided */
  externalSearch?: string;
}

export default function ContractTemplatesPage({ onOpenCreate, isCreateOpen, externalSearch }: ContractTemplatesPageProps = {}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const createMutation = useCreateContractTemplate();
  const deleteMutation = useDeleteContractTemplate();
  const [localDialogOpen, setLocalDialogOpen] = useState(false);
  // Use external control if provided, otherwise local state
  const isDialogOpen = isCreateOpen !== undefined ? isCreateOpen : localDialogOpen;
  const setIsDialogOpen = onOpenCreate !== undefined ? onOpenCreate : setLocalDialogOpen;

  const table = useDataTable<ContractTemplate>({
    initialData: [],
    initialColumns: {
      name: true,
      category: true,
      status: true,
      createdAt: true,
    },
    storageKey: 'contract-templates-table',
  });

  const {
    searchQuery,
    selectedIds,
    currentPage,
    rowsPerPage,
    visibleColumns,
    columnOrder,
    toggleSelection,
    toggleAllSelection,
  } = table;

  const limit = rowsPerPage === 'all' ? 100000 : parseInt(rowsPerPage, 10);

  const { data, isLoading, refetch } = useContractTemplates({
    page: currentPage,
    limit,
    // Use external search (from parent toolbar) if provided, otherwise internal
    search: (externalSearch !== undefined ? externalSearch : searchQuery) || undefined,
  });

  const onSubmit = (values: TemplateFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setIsDialogOpen(false);
        refetch?.();
      },
    });
  };

  const handleDeleteTemplate = async (id: string) => {
    const isConfirmed = await confirm({
      title: t('general.delete'),
      description: t('contracts.templates.delete'),
      confirmText: t('general.confirm'),
      cancelText: t('general.cancel'),
      variant: 'destructive',
    });

    if (isConfirmed) {
      deleteMutation.mutate(id, {
        onSuccess: () => refetch?.(),
      });
    }
  };

  const columnLabels: Record<string, string> = {
    name: 'general.name',
    category: 'contracts.templates.category',
    status: 'general.status',
    createdAt: 'general.created',
  };

  const renderRow = (template: ContractTemplate) => {
    return (
      <TableRow key={template.id} className="hover:bg-muted/50">
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(template.id)}
            onCheckedChange={() => toggleSelection(template.id)}
          />
        </TableCell>
        {columnOrder.filter((key: string) => visibleColumns[key]).map((key: string) => {
          switch (key) {
            case 'name':
              return <TableCell key="name" className="font-medium">{template.name}</TableCell>;
            case 'category':
              return <TableCell key="category">{template.category || t('common.no_data')}</TableCell>;
            case 'status':
              return (
                <TableCell key="status">
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? t('general.active') : t('general.inactive')}
                  </Badge>
                </TableCell>
              );
            case 'createdAt':
              return <TableCell key="createdAt">{formatDate(template.createdAt)}</TableCell>;
            default:
              return null;
          }
        })}
        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
          <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(template.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Create Template Drawer */}
      <ContractTemplateSheet
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={onSubmit}
        isPending={createMutation.isPending}
      />

      <DataTable
        table={{
          ...table,
          toggleAllSelection: () => {
            if (data?.templates) {
              toggleAllSelection(data.templates);
            }
          },
        }}
        data={data?.templates || []}
        columnLabels={columnLabels}
        totalCount={data?.pagination?.total || 0}
        renderRow={renderRow}
        isLoading={isLoading}
        hideToolbar={true}
        virtualized={true}
      />
    </div>
  );
}


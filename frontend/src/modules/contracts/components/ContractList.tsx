/**
 * Contract List Component
 * Displays contracts in a table with pagination.
 * Toolbar is managed externally in ContractsPage — DataTable rendered without its built-in toolbar.
 */

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { useContracts, useDeleteContract } from '../hooks';
import { CONTRACT_STATUS, Contract, ContractStatus, ContractListFilters } from '../types/contract.types';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { QuickActionsMenu, QuickActionMenuOption } from '@/components/ui/QuickActionsMenu';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/formatters';
import { DataTable } from '@/components/ui/data-table';
import { Badge as StatusSystemBadge, UniversalTagList } from '@/components/ui/status-system';
import { AlertTriangle } from 'lucide-react';
import type { DataTableState } from '@/components/ui/data-table';
import { ContractKanbanBoard } from './ContractKanbanBoard';

interface ContractListProps {
  onSelectContract?: (contractId: string) => void;
  onEditContract?: (contract: Contract) => void;
  table: DataTableState<Contract>;
  /** Status filter lifted up from ContractsPage toolbar */
  statusFilter?: string;
  advancedFilters?: Omit<ContractListFilters, 'page' | 'limit' | 'search' | 'status' | 'sortBy' | 'sortOrder'>;
  viewMode?: 'list' | 'kanban';
}

const isExpiringSoon = (endDate: string) => {
  if (!endDate) return false;
  const end = new Date(endDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  // Only show for future dates within 30 days
  return end <= thirtyDaysFromNow && end >= now;
};

const getStatusVariant = (status: string): BadgeProps['variant'] => {
  const map: Record<string, BadgeProps['variant']> = {
    draft: 'secondary',
    pending_approval: 'secondary', // warning not supported
    approved: 'default', // success not supported
    rejected: 'destructive',
    archived: 'outline',
  };
  return map[status] ?? 'secondary';
};

const getPaymentVariant = (status: string): BadgeProps['variant'] => {
  const map: Record<string, BadgeProps['variant']> = {
    unpaid: 'secondary',
    partially_paid: 'secondary', // warning not supported
    paid: 'default', // success not supported
    overdue: 'destructive',
  };
  return map[status] ?? 'secondary';
};

const formatAmount = (amount?: number | null, currency?: string) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency || 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const columnLabels: Record<string, string> = {
  contractNumber: 'contracts.table.contract_number',
  name: 'contracts.table.name',
  startDate: 'contracts.table.start_date',
  endDate: 'contracts.table.end_date',
  status: 'contracts.table.status',
  contractorName: 'contracts.table.contractor',
  type: 'contracts.table.type',
  amount: 'contracts.table.amount',
  paymentStatus: 'contracts.table.payment_status',
  tags: 'contracts.form.fields.tags',
  assignedTo: 'contracts.table.assigned_to',
  createdAt: 'contracts.table.created_at',
};

export function ContractList({ onSelectContract, onEditContract, table, statusFilter = 'all', advancedFilters = {}, viewMode = 'list' }: ContractListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const deleteMutation = useDeleteContract();

  const {
    searchQuery,
    selectedIds,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    sortConfig,
    visibleColumns,
    columnOrder,
    toggleSelection,
    toggleAllSelection,
  } = table;

  const isKanban = viewMode === 'kanban';
  const limit = isKanban ? 1000 : (rowsPerPage === 'all' ? 100000 : parseInt(rowsPerPage, 10));

  const { data, isLoading, error } = useContracts({
    page: currentPage,
    limit,
    search: searchQuery || undefined,
    status: statusFilter === 'all' ? undefined : (statusFilter as ContractStatus),
    sortBy: sortConfig?.key
      ? (sortConfig.key === 'createdAt' ? 'created_at'
        : sortConfig.key === 'assignedTo' ? 'assigned_to'
        : (sortConfig.key as unknown as ContractListFilters['sortBy']))
      : undefined,
    sortOrder: sortConfig?.direction ? (sortConfig.direction.toUpperCase() as 'ASC' | 'DESC') : undefined,
    ...advancedFilters,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{t('general.error')}</p>
      </div>
    );
  }

  const renderRow = (contract: Contract) => {
    const handleOpen = () => {
      if (onSelectContract) {
        onSelectContract(contract.id);
      } else {
        navigate(`./${contract.id}`);
      }
    };

    const handleQuickAction = async (action: string) => {
      if (action === 'view') {
        handleOpen();
      } else if (action === 'edit') {
        if (onEditContract) {
          onEditContract(contract);
        } else {
          navigate(`./${contract.id}?edit=true`);
        }
      } else if (action === 'delete') {
        const isConfirmed = await confirm({
          title: t('general.delete'),
          description: t('contracts.form.delete'),
          confirmText: t('general.confirm'),
          cancelText: t('general.cancel'),
          variant: 'destructive',
        });
        if (isConfirmed) {
          deleteMutation.mutate(contract.id);
        }
      }
    };

    const actions: QuickActionMenuOption[] = [
      { label: t('general.view'), action: 'view', icon: 'Eye', isQuickAction: false },
      { label: t('general.edit'), action: 'edit', icon: 'Pencil', isQuickAction: false },
      { label: t('general.delete'), action: 'delete', icon: 'Trash2', isQuickAction: false, variant: 'destructive' },
    ];

    return (
      <TableRow
        key={contract.id}
        className="hover:bg-muted/50 cursor-pointer"
        onClick={handleOpen}
      >
        {/* Checkbox */}
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(contract.id)}
            onCheckedChange={() => toggleSelection(contract.id)}
          />
        </TableCell>

        {/* Dynamic columns */}
        {columnOrder.filter((key: string) => visibleColumns[key]).map((key: string) => {
          switch (key) {
            case 'contractNumber':
              return (
                <TableCell key="contractNumber" className="font-mono text-xs max-w-[150px] truncate">
                  {contract.contractNumber || t('common.no_data')}
                </TableCell>
              );
            case 'name':
              return (
                <TableCell key="name" className="font-medium max-w-[200px] truncate">
                  {contract.name}
                </TableCell>
              );
            case 'status':
              return (
                <TableCell key="status">
                  <StatusSystemBadge id={contract.status} type="status" module="contracts" />
                </TableCell>
              );
            case 'contractorName':
              return (
                <TableCell key="contractorName" className="max-w-[150px] truncate">
                  {contract.contractorName || t('common.no_data')}
                </TableCell>
              );
            case 'type':
              return (
                <TableCell key="type">
                  {contract.type ? t(`contracts.types.${contract.type}`) : t('common.no_data')}
                </TableCell>
              );
            case 'amount':
              return (
                <TableCell key="amount" className="text-right tabular-nums">
                  {formatAmount(contract.amount, contract.currency)}
                </TableCell>
              );
            case 'paymentStatus':
              return (
                <TableCell key="paymentStatus">
                  <StatusSystemBadge id={contract.paymentStatus} type="status" module="contracts_payment" />
                </TableCell>
              );
            case 'tags': {
              const normalizedTags = (contract.tags || []) as Array<string | { id: string; name: string }>;
              return (
                <TableCell key="tags" onClick={(e) => e.stopPropagation()} className="max-w-[260px] overflow-hidden">
                  <div className="flex flex-wrap gap-1 max-w-full overflow-hidden">
                    <UniversalTagList
                      tags={normalizedTags.map((t) => (typeof t === 'string' ? { id: t } : t))}
                      module="contracts"
                      size="xs"
                      limit={3}
                    />
                  </div>
                </TableCell>
              );
            }
            case 'assignedTo':
              return (
                <TableCell key="assignedTo" className="max-w-[150px] truncate">
                  {contract.assignedToName || contract.assignedTo || t('common.no_data')}
                </TableCell>
              );
            case 'createdAt':
              return (
                <TableCell key="createdAt">
                  {formatDate(contract.createdAt)}
                </TableCell>
              );
            case 'startDate':
              return (
                <TableCell key="startDate">
                  {contract.startDate ? formatDate(contract.startDate) : t('common.no_data')}
                </TableCell>
              );
            case 'endDate': {
              const expiring = contract.endDate ? isExpiringSoon(contract.endDate) : false;
              return (
                <TableCell key="endDate">
                  <div className="flex items-center gap-2">
                    {contract.endDate ? formatDate(contract.endDate) : t('common.no_data')}
                    {expiring && (
                                              <div title={t('contracts.messages.expiring_soon')}>                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      </div>
                    )}
                  </div>
                </TableCell>
              );
            }
            default:
              return null;
          }
        })}

        {/* Actions */}
        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
          <QuickActionsMenu
            itemId={contract.id}
            itemName={contract.name}
            options={actions}
            onAction={async (actionType) => await handleQuickAction(actionType)}
          />
        </TableCell>
      </TableRow>
    );
  };

  const handleStatusChange = (contractId: string, newStatus: string) => {
    // We could use an update mutation here
    // For now, we will navigate to edit or just show a message.
    // Actually, we can just let `ContractsPage` or `ContractList` use `useUpdateContract` but it requires full contract body.
    // Let's use `useUpdateContractStatus` if it exists? We have `useBulkUpdateContractStatus`.
  };

  if (isKanban) {
    return (
      <div className="h-[calc(100vh-220px)] mt-2">
        <ContractKanbanBoard 
          contracts={data?.contracts || []} 
          onEdit={(contract) => {
            if (onEditContract) onEditContract(contract);
            else navigate(`/contracts/${contract.id}`);
          }}
          onStatusChange={handleStatusChange}
        />
      </div>
    );
  }

  return (
          <DataTable
            table={{
              ...table,
              toggleAllSelection: () => {
                if (data?.contracts) {
                  toggleAllSelection(data.contracts);
                }
              },
            }}
            data={data?.contracts || []}
            columnLabels={columnLabels}
            totalCount={data?.pagination?.total || 0}
            renderRow={renderRow}
            isLoading={isLoading}
            hideToolbar={true}
            virtualized={true}
          />  );
}

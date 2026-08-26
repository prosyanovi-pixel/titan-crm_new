import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CONTRACT_STATUS } from '../types/contract.types';
import { useBulkDeleteContracts, useBulkUpdateContractStatus } from '../hooks/useContracts';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface ContractBulkActionsProps {
  selectedContractIds: Set<string | number>;
  onClearSelection: () => void;
}

export function ContractBulkActions({ selectedContractIds, onClearSelection }: ContractBulkActionsProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const bulkDeleteMutation = useBulkDeleteContracts();
  const bulkUpdateStatusMutation = useBulkUpdateContractStatus();

  const [newStatus, setNewStatus] = React.useState<string | null>(null);

  const handleBulkDelete = async () => {
    const isConfirmed = await confirm({
      title: t('contracts.bulk_actions.delete_confirm_title', { count: selectedContractIds.size }),
      description: t('contracts.bulk_actions.delete_confirm_description'),
      confirmText: t('general.confirm'),
      cancelText: t('general.cancel'),
      variant: 'destructive',
    });

    if (isConfirmed) {
      bulkDeleteMutation.mutate(Array.from(selectedContractIds) as string[], {
        onSuccess: () => {
          onClearSelection();
        },
      });
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!newStatus) return;

    const isConfirmed = await confirm({
      title: t('contracts.bulk_actions.status_confirm_title', { count: selectedContractIds.size, status: t(`contracts.status.${newStatus}`) }),
      description: t('contracts.bulk_actions.status_confirm_description'),
      confirmText: t('general.confirm'),
      cancelText: t('general.cancel'),
    });

    if (isConfirmed) {
      bulkUpdateStatusMutation.mutate(
        { contractIds: Array.from(selectedContractIds) as string[], newStatus },
        {
          onSuccess: () => {
            onClearSelection();
            setNewStatus(null);
          },
        }
      );
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Bulk Status Update */}
      <Select value={newStatus || ''} onValueChange={setNewStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('contracts.bulk_actions.change_status')} />
        </SelectTrigger>
        <SelectContent>
          {Object.values(CONTRACT_STATUS).map((status) => (
            <SelectItem key={status} value={status}>
              {t(`contracts.status.${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleBulkStatusUpdate} disabled={!newStatus || selectedContractIds.size === 0}>
        {t('contracts.bulk_actions.apply_status')}
      </Button>

      {/* Bulk Delete */}
      <Button variant="destructive" onClick={handleBulkDelete} disabled={selectedContractIds.size === 0}>
        <Trash2 className="mr-2 h-4 w-4" />
        {t('contracts.bulk_actions.delete_selected')}
      </Button>
    </div>
  );
}

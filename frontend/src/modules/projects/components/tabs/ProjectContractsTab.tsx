import React, { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useContracts } from '@/modules/contracts/hooks/useContracts';
import { useContractors } from '@/modules/contractors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { ContractSheet } from '@/modules/contracts';
import { Loader2, Plus, Link as LinkIcon } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { Project } from '@/modules/projects/types/project.types';
import { LinkContractDialog } from './LinkContractDialog';

import { Contract } from '@/modules/contracts/types/contract.types';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useUpdateContract } from '@/modules/contracts/hooks/useContracts';
import { Unlink } from 'lucide-react';

interface ProjectContractsTabProps {
  project: Project;
}

const formatCurrency = (amount: number | null | undefined, currency: string = 'RUB') => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

function ContractRow({ contract }: { contract: Contract }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const updateMutation = useUpdateContract(contract.id);

  const handleUnlink = async () => {
    const isConfirmed = await confirm({
      title: t('projects.contracts.unlink_title'),
      description: t('projects.contracts.unlink_confirm', { contract: contract.name }),
      confirmText: t('common.yes'),
      cancelText: t('common.no'),
      variant: 'destructive',
    });

    if (isConfirmed) {
      updateMutation.mutate({ projectId: null } as any);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Link to={`/contracts/${contract.id}`} className="font-medium text-primary hover:underline">
          {contract.name}
        </Link>
      </TableCell>
      <TableCell>{t(`contracts.status.${contract.status}`)}</TableCell>
      <TableCell className="text-right">{formatCurrency(contract.amount, contract.currency)}</TableCell>
      <TableCell>{formatDate(contract.createdAt)}</TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleUnlink}
          disabled={updateMutation.isPending}
          title={t('projects.contracts.unlink')}
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Unlink className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function ProjectContractsTab({ project }: ProjectContractsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: contractsData, isLoading, error } = useContracts({ projectId: project.id });
  const { data: contractorsData } = useContractors({ limit: 1000 });

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = React.useState(false);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const matchedContractorId = useMemo(() => {
    if (!project.client || !contractorsData?.data) return undefined;
    const clientNameLower = project.client.trim().toLowerCase();
    const matched = contractorsData.data.find(c => c.name.trim().toLowerCase() === clientNameLower);
    return matched?.id;
  }, [project.client, contractorsData?.data]);

  const handleCreateContract = () => {
    setSheetOpen(true);
  };

  const handleLinkContract = () => {
    setLinkDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">{t('general.error_loading_data')}</div>;
  }

  const contracts = contractsData?.contracts || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleLinkContract} className="gap-2">
          <LinkIcon className="h-4 w-4" />
          {t('projects.contracts.link')}
        </Button>
        <Button onClick={handleCreateContract} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('contracts.toolbar.create')}
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('contracts.table.name')}</TableHead>
              <TableHead>{t('contracts.table.status')}</TableHead>
              <TableHead className="text-right">{t('contracts.table.amount')}</TableHead>
              <TableHead>{t('contracts.table.created_at')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length > 0 ? (
              contracts.map((contract) => (
                <ContractRow key={contract.id} contract={contract} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t('projects.contracts.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <ContractSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        defaultProjectId={project.id}
        defaultContractorId={matchedContractorId}
      />

      <LinkContractDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        projectId={project.id}
      />
    </div>
  );
}

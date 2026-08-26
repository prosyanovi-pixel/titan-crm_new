import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useContracts, useUpdateContract } from '@/modules/contracts/hooks/useContracts';
import { Contract } from '@/modules/contracts/types/contract.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Link as LinkIcon, Check } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface LinkContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

export function LinkContractDialog({ open, onOpenChange, projectId }: LinkContractDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data: contractsData, isLoading } = useContracts({ search, limit: 50 });
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  const updateMutation = useUpdateContract(selectedContract?.id || '');
  const { confirm } = useConfirm();

  const handleLink = async () => {
    if (!selectedContract) return;

    if (selectedContract.projectId && selectedContract.projectId !== projectId) {
      const isConfirmed = await confirm({
        title: t('projects.contracts.link_warning_title'),
        description: t('projects.contracts.link_warning_description', { project: selectedContract.projectName || t('common.unknown') }),
        confirmText: t('common.yes'),
        cancelText: t('common.no'),
        variant: 'destructive',
      });

      if (!isConfirmed) return;
    }

    updateMutation.mutate(
      { projectId } as any,
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedContract(null);
          setSearch('');
        },
      }
    );
  };

  const contracts = contractsData?.contracts?.filter(c => c.projectId !== projectId) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('projects.contracts.link_existing')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('contracts.toolbar.search')}
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[300px] border rounded-md p-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="flex justify-center items-center h-full text-muted-foreground">
                {search ? t('common.no_results') : t('projects.contracts.type_to_search')}
              </div>
            ) : (
              <div className="space-y-2">
                {contracts.map(contract => (
                  <div
                    key={contract.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors flex justify-between items-start ${
                      selectedContract?.id === contract.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedContract(contract)}
                  >
                    <div>
                      <div className="font-medium">{contract.name}</div>
                      {contract.contractNumber && (
                        <div className="text-sm text-muted-foreground">№ {contract.contractNumber}</div>
                      )}
                      {contract.projectName && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Привязан к: {contract.projectName}
                        </Badge>
                      )}
                    </div>
                    {selectedContract?.id === contract.id && (
                      <Check className="h-5 w-5 text-primary mt-1 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleLink} disabled={!selectedContract || updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <LinkIcon className="mr-2 h-4 w-4" />
            {t('common.link')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

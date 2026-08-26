import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useSendForApproval } from '../hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntityCombobox } from '@/components/shared/EntityCombobox';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  contractId: string;
  versionId?: string;
  trigger?: React.ReactNode;
}

export function SendForApprovalDialog({ contractId, versionId, trigger }: Props) {
  const { t } = useTranslation();
  const sendMutation = useSendForApproval(contractId);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<string | null>(null);
  const [deadlineDays, setDeadlineDays] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    if (isOpen && users.length === 0) {
      api.get('/users').then(response => {
        const usersData = Array.isArray(response) ? response : (response?.data || []);
        setUsers(usersData);
      }).catch(console.error);
    }
  }, [isOpen, users.length]);

  const userOptions = users.map(u => ({
    id: u.id,
    label: u.name || t('general.unnamed')
  }));

  const handleSendForApproval = async () => {
    if (!selectedApprover) return;
    
    let finalDeadlineDate = undefined;
    if (deadlineDate) {
      finalDeadlineDate = new Date(deadlineDate).toISOString();
    } else if (deadlineDays) {
      const days = parseInt(deadlineDays, 10);
      if (!isNaN(days) && days > 0) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        finalDeadlineDate = date.toISOString();
      }
    }

    try {
      await sendMutation.mutateAsync({
        approvers: [selectedApprover],
        deadlineDate: finalDeadlineDate,
        versionId
      });
      setIsOpen(false);
      setSelectedApprover(null);
      setDeadlineDays('');
      setDeadlineDate('');
    } catch (e) {
      // handled by hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{t('contracts.approvals.actions.send')}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('contracts.approvals.dialogs.send')}</DialogTitle>
          <DialogDescription>
            {t('contracts.approvals.dialogs.send_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <EntityCombobox
            value={selectedApprover ?? undefined}
            onChange={(val) => setSelectedApprover(val ? String(val) : null)}
            options={userOptions}
            placeholder={t('contracts.sheet.placeholder.assigned_to')}
          />
          
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Срок согласования (опционально)</p>
            <div className="flex items-center gap-4">
              <Input 
                type="number" 
                placeholder="Дней" 
                value={deadlineDays} 
                onChange={(e) => { setDeadlineDays(e.target.value); setDeadlineDate(''); }}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">или дата:</span>
              <Input 
                type="date" 
                value={deadlineDate} 
                onChange={(e) => { setDeadlineDate(e.target.value); setDeadlineDays(''); }}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('general.cancel')}
          </Button>
          <Button 
            onClick={handleSendForApproval} 
            disabled={!selectedApprover || sendMutation.isPending}
          >
            {sendMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('general.send')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

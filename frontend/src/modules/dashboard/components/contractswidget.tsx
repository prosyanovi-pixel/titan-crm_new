import React from 'react';
import { useContractMetrics } from '@/modules/contracts/hooks/useContractMetrics';
import { Card } from '@/components/ui/card';

export const ContractsWidget: React.FC = () => {
  const { data, isLoading } = useContractMetrics();

  if (isLoading) return <Card>Загрузка...</Card>;
  if (!data) return <Card>Нет данных</Card>;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Ожидают согласования</div>
        <div className="text-2xl font-bold">{data.pendingApprovalsCount}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Истекают в ближайшие 30 дней</div>
        <div className="text-2xl font-bold">{data.expiringSoonCount}</div>
      </Card>
    </div>
  );
};

export default ContractsWidget;

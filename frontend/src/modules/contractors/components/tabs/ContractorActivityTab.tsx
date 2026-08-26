import React from 'react';
import ActivityList from '@/components/shared/ActivityList';

interface ContractorActivityTabProps {
  contractorId: number;
}

export function ContractorActivityTab({ contractorId }: ContractorActivityTabProps) {
  return (
    <ActivityList
      queryKey={[ 'contractor-activity', contractorId ]}
      fetchPath={`/contractors/${contractorId}/activity`}
      deletePath={(id: number) => `/contractors/${contractorId}/activity/${id}`}
      emptyMessage={'contractors.activity.empty'}
    />
  );
}

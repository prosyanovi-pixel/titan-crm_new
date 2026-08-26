import React from 'react';
import { FileText, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/ui';

interface DocumentStatsProps {
  stats: {
    total: number;
    pending: number;
    completed: number;
    recentActivity: number;
  };
}

export const DocumentStats: React.FC<DocumentStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard 
        title="Total Documents" 
        value={stats.total} 
        icon={FileText} 
        iconColor="text-blue-500 bg-blue-50 dark:bg-blue-950" 
      />
      <StatsCard 
        title="Pending Review" 
        value={stats.pending} 
        icon={Clock} 
        iconColor="text-yellow-500 bg-yellow-50 dark:bg-yellow-950" 
      />
      <StatsCard 
        title="Completed" 
        value={stats.completed} 
        icon={CheckCircle} 
        iconColor="text-green-500 bg-green-50 dark:bg-green-950" 
      />
      <StatsCard 
        title="Recent Activity" 
        value={stats.recentActivity} 
        icon={TrendingUp} 
        iconColor="text-purple-500 bg-purple-50 dark:bg-purple-950" 
      />
    </div>
  );
};
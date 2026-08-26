import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card border border-border/20 rounded-2xl p-6 h-[140px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
              <div className="w-11 h-11 rounded-xl bg-muted" />
            </div>
            <div className="h-3 bg-muted rounded w-32" />
          </div>
        ))}
      </div>
      
      {/* Analytics Skeleton */}
      <div className="bg-card border border-border/20 rounded-2xl p-6 h-[400px]">
        <div className="flex justify-between items-center mb-8">
          <div className="h-5 bg-muted rounded w-48" />
          <div className="h-5 bg-muted rounded w-8" />
        </div>
        <div className="h-[280px] bg-muted/20 rounded-xl border border-dashed border-border/50" />
      </div>
    </div>
  );
}

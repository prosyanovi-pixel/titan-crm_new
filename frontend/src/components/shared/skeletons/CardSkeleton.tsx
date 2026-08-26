import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 1, className = "" }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4 ${className}`}>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
        </div>
      ))}
    </>
  );
}

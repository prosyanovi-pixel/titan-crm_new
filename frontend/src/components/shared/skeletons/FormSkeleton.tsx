import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface FormSkeletonProps {
  fieldsCount?: number;
  showSubmit?: boolean;
}

export function FormSkeleton({ fieldsCount = 4, showSubmit = true }: FormSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {Array.from({ length: fieldsCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      {showSubmit && (
        <div className="flex justify-end space-x-2 pt-4">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      )}
    </div>
  );
}

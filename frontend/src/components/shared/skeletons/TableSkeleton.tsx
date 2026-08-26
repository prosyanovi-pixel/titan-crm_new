import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rowCount?: number;
  columnCount?: number;
  showToolbar?: boolean;
}

export function TableSkeleton({
  rowCount = 10,
  columnCount = 5,
  showToolbar = true,
}: TableSkeletonProps) {
  return (
    <div className="space-y-4 w-full">
      {/* Toolbar / Filters Skeleton */}
      {showToolbar && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-8 w-[100px]" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-[80px]" />
            <Skeleton className="h-8 w-[120px]" />
          </div>
        </div>
      )}

      {/* Table Structure */}
      <div className="rounded-md border">
        {/* Table Header */}
        <div className="border-b bg-muted/50 p-4">
          <div className="flex justify-between space-x-4">
            {Array.from({ length: columnCount }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full max-w-[150px]" />
            ))}
          </div>
        </div>
        {/* Table Body */}
        <div className="divide-y">
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <div key={rowIndex} className="p-4 flex justify-between space-x-4 items-center">
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className={`h-4 w-full ${colIndex === 0 ? "max-w-[200px]" : "max-w-[100px]"}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-4 w-[200px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-[80px]" />
          <Skeleton className="h-8 w-[80px]" />
        </div>
      </div>
    </div>
  );
}

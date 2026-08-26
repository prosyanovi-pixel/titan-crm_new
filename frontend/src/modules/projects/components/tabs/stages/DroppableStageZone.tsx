import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableStageZoneProps {
  stageId: number;
  children: React.ReactNode;
  /** Whether a task is currently being dragged over this zone */
  className?: string;
}

/**
 * A droppable zone wrapping a stage's task list.
 * Highlights with a blue ring when a dragged task hovers over it.
 */
export function DroppableStageZone({ stageId, children, className }: DroppableStageZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stageId}`,
    data: { stageId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg transition-all duration-200 min-h-[40px]',
        isOver && 'ring-2 ring-primary/50 bg-primary/5',
        className,
      )}
    >
      {children}
    </div>
  );
}

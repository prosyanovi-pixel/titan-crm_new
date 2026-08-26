import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface DroppableFolderProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const DroppableFolder: React.FC<DroppableFolderProps> = ({ id, children, disabled }) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`rounded-lg transition-all ${isOver && !disabled ? "ring-2 ring-primary bg-primary/5" : ""}`}
    >
      {children}
    </div>
  );
};

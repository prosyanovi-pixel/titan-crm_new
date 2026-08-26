
import React, { useState } from "react";
import { Task } from "../types";
import { useTranslation } from "@/lib/i18n";

/** Тип функции перевода, возвращаемой хуком useTranslation */
type TFunction = ReturnType<typeof useTranslation>['t'];
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { PriorityBadge } from "@/components/ui/status-system";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Calendar } from "lucide-react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragStartEvent,
  useDroppable,
  useDraggable
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
}

// Draggable Task Card Component
function DraggableTaskCard({ task, onEdit, isOverlay }: { task: Task; onEdit: (task: Task) => void; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : undefined,
    zIndex: isDragging ? 50 : undefined,
    ...(isOverlay ? {
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      cursor: "grabbing",
      transform: "scale(1.02)",
      opacity: 1,
    } : {})
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-background border-l-4 border-l-primary/50 hover:border-l-primary ${isOverlay ? 'border-primary' : ''}`}
      onClick={() => onEdit(task)}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
            <PriorityBadge priorityId={task.priority} className="text-[10px] px-1 py-0" />
            <span className="text-[10px] font-mono text-muted-foreground">{task.identifier}</span>
        </div>
        <p className={`text-sm font-medium leading-tight mb-3 ${task.status === "Done" ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
        </p>
        <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                    <AvatarImage src={task.assigneeAvatar || ''} alt={task.assignee} />
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {task.assigneeInitials}
                    </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                    {task.assignee}
                </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {task.dueDate}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Пропсы компонента DroppableColumn для канбан-доски */
interface DroppableColumnProps {
  /** Конфигурация колонки (идентификатор, заголовок, CSS-класс цвета) */
  column: { id: Task['status']; title: string; color: string };
  /** Список всех задач (фильтруется внутри по column.id) */
  tasks: Task[];
  /** Обработчик открытия редактирования задачи */
  onEdit: (task: Task) => void;
  /** Функция перевода */
  t: TFunction;
}

// Droppable Column Component
function DroppableColumn({ column, tasks, onEdit, t }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`w-80 shrink-0 rounded-lg flex flex-col h-full border transition-colors ${column.color} ${isOver ? 'border-primary/50' : 'border-border/50'}`}
    >
      <div className="p-3 pb-2 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          {column.title}
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1.5 text-[10px] font-medium text-muted-foreground border">
            {tasks.filter((t: Task) => t.status === column.id).length}
          </span>
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {tasks
          .filter((task: Task) => task.status === column.id)
          .map((task: Task) => (
            <DraggableTaskCard 
              key={task.id} 
              task={task} 
              onEdit={onEdit} 
            />
          ))
        }
        {tasks.filter((task: Task) => task.status === column.id).length === 0 && (
          <div className="flex h-24 flex-col items-center justify-center text-center opacity-50 border-2 border-dashed border-muted-foreground/20 rounded-lg m-1">
            <p className="text-xs text-muted-foreground">{t('tasks.empty_column')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskBoard({ 
  tasks, 
  onEdit, 
  onStatusChange
}: TaskBoardProps) {
  const { t } = useTranslation();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const kanbanColumns: { id: Task['status'], title: string, color: string }[] = [
    { id: "To Do", title: t('tasks.columns.todo'), color: "bg-slate-50 dark:bg-slate-800" },
    { id: "In Progress", title: t('tasks.columns.in_progress'), color: "bg-blue-50/50 dark:bg-blue-950/20" },
    { id: "Done", title: t('tasks.columns.done'), color: "bg-green-50/50 dark:bg-green-950/20" },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.id !== over.id) {
      if (onStatusChange) {
        onStatusChange(active.id as string, over.id as Task['status']);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea className="h-full w-full whitespace-nowrap rounded-md">
        <div className="flex space-x-4 h-full pb-4">
          {kanbanColumns.map((column) => (
            <DroppableColumn 
              key={column.id}
              column={column}
              tasks={tasks}
              onEdit={onEdit}
              t={t}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {createPortal(
        <DragOverlay>
          {activeTask ? (
            <DraggableTaskCard 
              task={activeTask} 
              onEdit={onEdit}
              isOverlay
            />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

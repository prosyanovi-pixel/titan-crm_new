import React, { Fragment, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortableTableHead } from '@/components/shared/SortableTableHead';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  MoreVertical, Edit, Trash2, CheckCircle2,
  ChevronDown, ChevronRight, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatMoney } from '../utils';
import { getContrastColor } from '@/lib/color';
import type { ProjectStage, ProjectStageWithTasks, ProjectTask } from '../../../types';
import { ProjectStageInlineCreator } from './ProjectStageInlineCreator';
import { ProjectTaskInlineCreator } from './ProjectTaskInlineCreator';
import { DraggableTaskRow } from './DraggableTaskRow';
import { DroppableStageZone } from './DroppableStageZone';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';

interface ProjectStagesTableProps {
  stages: ProjectStage[];
  expandedStageIds: Set<number>;
  toggleStageExpand: (id: number) => void;
  handleOpenAddTask: (stageId: number, stageName: string) => void;
  handleOpenEditTask: (task: ProjectTask) => void;
  handleDeleteTask: (task: ProjectTask) => void;
  handleMoveUp: (stage: ProjectStage) => void;
  handleMoveDown: (stage: ProjectStage) => void;
  handleOpenEdit: (stage: ProjectStage) => void;
  handleComplete: (stage: ProjectStage) => void;
  handleDelete: (stage: ProjectStage) => void;
  columnWidths?: Record<string, number>;
  onColumnResize?: (key: string, width: number) => void;
  onAddClick?: () => void;
  /** Called when user drags a task to a different stage */
  onTaskMove?: (taskId: string, newStageId: number) => Promise<void>;
}

export const ProjectStagesTable = ({
  stages,
  expandedStageIds,
  toggleStageExpand,
  handleOpenAddTask,
  handleOpenEditTask,
  handleDeleteTask,
  handleMoveUp,
  handleMoveDown,
  handleOpenEdit,
  handleComplete,
  handleDelete,
  columnWidths,
  onColumnResize,
  onAddClick,
  onTaskMove,
}: ProjectStagesTableProps) => {
  const { t } = useTranslation();

  // DnD state: which task is currently being dragged
  const [activeDragTask, setActiveDragTask] = useState<{ task: ProjectTask; stageId: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Require 8px movement before drag starts
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { task: ProjectTask; stageId: number } | undefined;
    if (data) setActiveDragTask(data);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over || !onTaskMove) return;

    const dragData = active.data.current as { task: ProjectTask; stageId: number } | undefined;
    const dropData = over.data.current as { stageId: number } | undefined;
    if (!dragData || !dropData) return;

    const { task, stageId: fromStageId } = dragData;
    const { stageId: toStageId } = dropData;

    // No-op if dropped on same stage
    if (fromStageId === toStageId) return;

    await onTaskMove(String(task.id), toStageId);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <SortableTableHead
              label={t('projects.stages.table.name')}
              width={columnWidths?.name}
              onResize={(w) => onColumnResize?.('name', w)}
              className="min-w-[250px]"
              onSort={() => {}}
              direction={null}
            />
            <SortableTableHead
              label={t('projects.stages.table.dates')}
              width={columnWidths?.dates}
              onResize={(w) => onColumnResize?.('dates', w)}
              className="w-[180px]"
              onSort={() => {}}
              direction={null}
            />
            <SortableTableHead
              label={t('projects.stages.table.progress')}
              width={columnWidths?.progress}
              onResize={(w) => onColumnResize?.('progress', w)}
              className="w-[140px]"
              onSort={() => {}}
              direction={null}
            />
            <SortableTableHead
              label={t('projects.stages.table.budget')}
              width={columnWidths?.budget}
              onResize={(w) => onColumnResize?.('budget', w)}
              className="w-[140px]"
              onSort={() => {}}
              direction={null}
            />
            <SortableTableHead
              label={t('projects.stages.table.status')}
              width={columnWidths?.status}
              onResize={(w) => onColumnResize?.('status', w)}
              className="w-[120px]"
              onSort={() => {}}
              direction={null}
            />
            <TableHead className="w-[80px] text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                {t('projects.stages.empty')}
              </TableCell>
            </TableRow>
          ) : (
            stages.filter((stage): stage is ProjectStage => stage && stage.id !== undefined).map((stage, index) => {
              const isExpanded = expandedStageIds.has(stage.id);
              const tasks = ((stage as ProjectStageWithTasks).tasks || []) as ProjectTask[];
              
              return (
                <Fragment key={stage.id}>
                  <TableRow 
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      stage.isCompleted && 'bg-muted/30'
                    )}
                    onClick={() => toggleStageExpand(stage.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => toggleStageExpand(stage.id)}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </TableCell>
                    
                    <TableCell className="font-medium py-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="text-sm font-bold transition-colors"
                          style={{ 
                            color: stage.color?.startsWith('#') ? stage.color : undefined
                          }}
                        >
                          {stage.name}
                        </div>
                        {stage.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{stage.description}</p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <div className="text-sm">
                        <div>{formatDate(stage.startDate)}</div>
                        <div className="text-muted-foreground">→ {formatDate(stage.endDate)}</div>
                        {stage.plannedStartDate && stage.plannedEndDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {t('projects.stages.planned')}: {formatDate(stage.plannedStartDate)} — {formatDate(stage.plannedEndDate)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <div className="space-y-1">
                        <Progress value={stage.progress} className="h-2" />
                        <span className="text-xs text-muted-foreground">{stage.progress}%</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <div className="text-sm">
                        {stage.budget !== undefined && stage.budget > 0 && (
                          <>
                            <div>{formatMoney(stage.budget)}</div>
                            {stage.budgetUsed !== undefined && stage.budgetUsed > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {t('projects.stages.used')}: {formatMoney(stage.budgetUsed)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <div className="flex gap-1">
                        {stage.isCompleted ? (
                          <Badge variant="default" className="bg-green-600">
                            {t('projects.stages.status.completed')}
                          </Badge>
                        ) : stage.progress > 0 ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {t('projects.stages.status.in_progress')}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {t('projects.stages.status.pending')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <div className="flex items-center justify-end gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleMoveUp(stage)} disabled={index === 0}>
                              {t('projects.stages.actions.move_up')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMoveDown(stage)} disabled={index === stages.length - 1}>
                              {t('projects.stages.actions.move_down')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenEdit(stage)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            {!stage.isCompleted && (
                              <DropdownMenuItem onClick={() => handleComplete(stage)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {t('projects.stages.actions.complete')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(stage)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4 border-t space-y-4">
                          <DroppableStageZone stageId={stage.id}>
                            {tasks.length > 0 ? (
                              <div className="space-y-2">
                                {tasks.filter((task: ProjectTask) => task && task.id).map((task: ProjectTask) => (
                                  <DraggableTaskRow
                                    key={task.id}
                                    task={task}
                                    stageId={stage.id}
                                    onEdit={handleOpenEditTask}
                                    onDelete={handleDeleteTask}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-3 italic">
                                {t('projects.stages.tasks.add_first')}
                              </p>
                            )}
                          </DroppableStageZone>

                          <div className="max-w-[600px] mx-auto mt-2">
                            <ProjectTaskInlineCreator 
                              onClick={() => handleOpenAddTask(stage.id, stage.name)}
                              placeholder={tasks.length === 0 ? t('projects.stages.tasks.add_first') : t('projects.stages.tasks.add')}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })
          )}
          
          {onAddClick && (
            <TableRow className="hover:bg-transparent border-none">
              <TableCell colSpan={7} className="p-0">
                <ProjectStageInlineCreator onClick={onAddClick} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>

    {/* Drag Overlay — renders the "ghost" card attached to the cursor */}
    {typeof document !== 'undefined' && createPortal(
      <DragOverlay dropAnimation={null}>
        {activeDragTask ? (
          <DraggableTaskRow
            task={activeDragTask.task}
            stageId={activeDragTask.stageId}
            onEdit={() => {}}
            onDelete={() => {}}
            isOverlay
          />
        ) : null}
      </DragOverlay>,
      document.body,
    )}
    </DndContext>
  );
};

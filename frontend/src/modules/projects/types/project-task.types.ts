export type ProjectTaskPriority = "High" | "Medium" | "Low";
export type ProjectTaskStatus = "To Do" | "In Progress" | "Done";

export interface ProjectSubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectTask {
  id: string;
  title: string;
  project: string;
  assignee: string;
  assigneeInitials: string;
  priority: ProjectTaskPriority;
  status: ProjectTaskStatus;
  dueDate: string;
  identifier: string;
  description?: string;
  subTasks?: ProjectSubTask[];
  projectId?: number;
  stageId?: number;
}

export interface OpenProjectTaskSheetRequest {
  task: ProjectTask | null;
  initialProject?: string;
  references?: unknown;
  onSaved: (task: ProjectTask) => void;
  onDeleted?: (id: string) => void;
}

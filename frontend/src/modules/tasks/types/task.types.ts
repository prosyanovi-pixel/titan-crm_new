export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "To Do" | "In Progress" | "Done" | "archived";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskProjectRef {
  id: string | number;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  assignee: string;
  assigneeInitials: string;
  assigneeAvatar?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  identifier: string;
  description?: string;
  subTasks?: SubTask[];
  projectId?: number;
  stageId?: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  project?: string;
  assignee?: string;
  searchQuery?: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

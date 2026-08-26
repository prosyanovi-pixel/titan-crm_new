import { Task, TaskFilters } from "./task.types";

export interface GetTasksResponse {
  data: Task[];
}

export interface GetTaskResponse {
  data: Task;
}

export interface CreateTaskRequest {
  title: string;
  project: string;
  assignee?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  description?: string;
}

export interface UpdateTaskRequest {
  id: string;
  title?: string;
  project?: string;
  assignee?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  description?: string;
  subTasks?: Task["subTasks"];
}

export interface DeleteTaskResponse {
  success: boolean;
}

import { Project, ProjectFilters } from "./project.types";

export interface GetProjectsResponse {
  data: Project[];
}

export interface GetProjectResponse {
  data: Project;
}

export interface CreateProjectRequest {
  name: string;
  client: string;
  manager: string;
  status?: string;
  stage?: string;
  priority?: string;
  budget?: number;
  deadline?: string;
  taxRegimeId?: number | null;
}

export interface UpdateProjectRequest {
  id: number;
  name?: string;
  client?: string;
  manager?: string;
  status?: string;
  stage?: string;
  priority?: string;
  budget?: number;
  budgetUsed?: number;
  deadline?: string;
  taxRegimeId?: number | null;
}

export interface DeleteProjectResponse {
  success: boolean;
}

export interface DashboardConfig {
  visible: Record<string, boolean>;
  settings: Record<string, { size: string; view: string; compact: boolean }>;
  order: string[];
}

export interface Project {
  id: number;
  name: string;
  status: string;
  priority: string;
  deadline: string;
  budget: number;
  manager: string;
  client?: string;
  budgetUsed?: number;
}

export interface Task {
  id: number;
  title: string;
  project: string;
  status: string;
  priority: string;
  dueDate: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletion: number;
}

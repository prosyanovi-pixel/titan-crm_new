/**
 * Shared types for cross-module usage
 * These types prevent circular dependencies between modules
 */

/**
 * Task reference for use in other modules
 */
export interface TaskReference {
  id: string | number;
  title: string;
  project?: string;
  assignee?: string;
  status?: string;
  dueDate?: string;
  description?: string;
}

/**
 * Legal case reference for use in other modules
 */
export interface LegalCaseReference {
  id: string | number;
  title: string;
  type?: 'claim' | 'court';
  status?: string;
  deadline?: string;
}

/**
 * Project reference for use in other modules
 */
export interface ProjectReference {
  id: string | number;
  name: string;
  manager?: string;
  status?: string;
  deadline?: string;
}

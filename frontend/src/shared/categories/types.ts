/**
 * Shared category types used across multiple modules
 */

export interface BaseCategory {
  id: number;
  name: string;
  parent_id: number | null;
  description: string | null;
  children?: BaseCategory[];
  created_at?: string;
  updated_at?: string;
}

export interface CategoryNode {
  id: number;
  name: string;
  parent_id: number | null;
  children: CategoryNode[];
  [key: string]: any;
}

export interface CategoryTreeProps {
  id: number;
  name: string;
  parent_id: number | null;
  children?: CategoryTreeProps[];
}

// DTO types for category operations
export interface CreateCategoryDto {
  name: string;
  parentId?: number;
  description?: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  id: number;
}

// For API responses
export interface CategoryListResponse {
  data: BaseCategory[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

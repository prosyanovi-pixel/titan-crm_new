export interface Template {
  id: number;
  name: string;
  description: string;
  moduleId: string;
  moduleName: string;
  templateTypeId: number;
  templateTypeCode: string;
  templateTypeName: string;
  filePath: string;
  htmlContent?: string;
  headerHtmlContent?: string;
  footerHtmlContent?: string;
  firstPageHeaderOnly?: boolean;
  numeratorId: number | null;
  region: string;
  isActive: boolean;
  isShared: boolean;
  targetAction?: string;
  documentSettings?: {
    pageSize?: string;
    orientation?: string;
  };
  accessRules?: {
    id: number;
    template_id: number;
    access_code: string;
    permission: string;
  }[];
  createdBy: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  moduleId: string;
  templateTypeId: number;
  filePath?: string;
  isShared?: boolean;
  targetAction?: string;
  numeratorId?: number | null;
}

export interface TemplateVariable {
  id: string;
  moduleId: string;
  name: string;
  key: string;
  dbPath: string;
  description?: string;
  createdAt: string;
}

export type CreateVariablePayload = Omit<TemplateVariable, 'id' | 'createdAt'>;

export interface Numerator {
  id: number;
  name: string;
  mask: string;
  createdAt?: string;
  updatedAt?: string;
}

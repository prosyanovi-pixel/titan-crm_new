import { api } from '@/lib/api';

// Условие шага workflow: может быть одиночным правилом или группой правил (AND/OR)
export interface StepCondition {
  type: 'rule' | 'group';
  logical_op?: 'AND' | 'OR';
  conditions?: StepCondition[]; // Для групп
  field?: string;               // Для правил
  operator?: string;            // Для правил
  value?: string;               // Для правил
}

export interface WorkflowStep {
  id?: string;
  workflow_id?: string;
  step_order: number;
  module: string;
  action: string;
  action_config: Record<string, any>;
  condition?: StepCondition | null;
  delay_seconds: number;
  on_fail: 'stop' | 'retry' | 'skip';
}

export interface Workflow {
  id?: string;
  name: string;
  description: string;
  trigger_type: 'schedule' | 'event' | 'webhook';
  trigger_config: Record<string, any>;
  status: 'draft' | 'active' | 'paused';
  steps?: WorkflowStep[];
  created_at?: string;
  updated_at?: string;
}

export interface RegistryAction {
  name: string;
  label: string;
  module: string;
  inputSchema: Record<string, any>;
  outputSchema?: {
    properties: Record<string, { type: string, label: string }>;
  };
}

// NOTE: api.ts already prepends /api, so paths here start with /workflows (not /api/workflows)
// api.get() returns the parsed JSON directly, not { data }

export const fetchWorkflows = async (): Promise<Workflow[]> => {
  const result = await api.get('/workflows');
  return result ?? [];
};

export const fetchWorkflowById = async (id: string): Promise<Workflow> => {
  const result = await api.get(`/workflows/${id}`);
  return result;
};

export const createWorkflow = async (workflowData: Partial<Workflow>): Promise<Workflow> => {
  const result = await api.post('/workflows', workflowData);
  return result;
};

export const updateWorkflow = async (id: string, workflowData: Partial<Workflow>): Promise<Workflow> => {
  const result = await api.put(`/workflows/${id}`, workflowData);
  return result;
};

export const deleteWorkflow = async (id: string): Promise<void> => {
  await api.delete(`/workflows/${id}`);
};

export const fetchRegistryActions = async (): Promise<RegistryAction[]> => {
  const result = await api.get('/workflows/registry/actions');
  return result ?? [];
};

export const runWorkflow = async (id: string, dryRun: boolean = false): Promise<{ message: string }> => {
  const result = await api.post(`/workflows/${id}/run`, { dryRun });
  return result;
};

export const validateWorkflow = async (id: string): Promise<{ valid: boolean; errors: string[] }> => {
  const result = await api.post(`/workflows/${id}/validate`, {});
  return result;
};

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'dry_run' | 'paused' | 'waiting_approval';
  trigger_event_payload: any;
  context: any;
  executionLogs?: Array<{ time: string, msg: string, level?: string }>;
  summary?: WorkflowExecutionSummary;
  started_at: string;
  finished_at?: string;
  logs?: any[];
}

export interface WorkflowExecutionSummaryCase {
  caseId: string;
  caseNumber?: string | null;
  title?: string | null;
  status?: string | null;
  instanceId?: string | null;
  instanceNumber?: string | null;
  instanceType?: string | null;
  actions: string[];
  notes: string[];
  documents: string[];
}

export interface WorkflowExecutionSummaryDocument {
  documentId?: string | null;
  documentName?: string | null;
  url?: string | null;
  success: boolean;
  external: boolean;
}

export interface WorkflowExecutionSummary {
  totalSteps: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  updatedCases: WorkflowExecutionSummaryCase[];
  documents: WorkflowExecutionSummaryDocument[];
  processing: {
    status: string;
    progress: number;
    needsRetry: boolean;
    summary: string;
  } | null;
}

export const fetchExecutionHistory = async (workflowId: string): Promise<WorkflowExecution[]> => {
  const result = await api.get(`/workflows/${workflowId}/history`);
  return result ?? [];
};

export const fetchExecutionDetails = async (workflowId: string, execId: string): Promise<WorkflowExecution> => {
  const result = await api.get(`/workflows/${workflowId}/history/${execId}`);
  return result;
};

export const deleteExecutionHistory = async (workflowId: string): Promise<void> => {
  await api.delete(`/workflows/${workflowId}/history`);
};

export const deleteExecution = async (workflowId: string, execId: string): Promise<void> => {
  await api.delete(`/workflows/${workflowId}/history/${execId}`);
};

export const retryExecution = async (workflowId: string, execId: string): Promise<{ message: string }> => {
  const result = await api.post(`/workflows/${workflowId}/history/${execId}/retry`, {});
  return result;
};

export const approveExecution = async (workflowId: string, execId: string, approved: boolean, comment?: string): Promise<{ message: string }> => {
  const result = await api.post(`/workflows/${workflowId}/history/${execId}/approve`, { approved, comment });
  return result;
};

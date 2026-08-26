export interface EnrichFieldDiff {
  label: string;
  current: string | null;
  fetched: string | null;
  changed: boolean;
}

export interface EnrichResult {
  contractorId: number;
  name: string;
  inn: string;
  source?: string;
  diff?: Record<string, EnrichFieldDiff>;
  raw?: Record<string, unknown>;
  changedCount?: number;
  error?: string;
}

export type SelectionMap = Record<number, Set<string>>;

export const ENRICH_JOB_KEY = 'enrichment_job_id';

export type JobStatus = 'idle' | 'pending' | 'running' | 'done' | 'error' | 'paused';

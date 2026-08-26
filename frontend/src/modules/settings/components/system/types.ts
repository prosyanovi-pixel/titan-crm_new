export interface HealthCheck {
  status: 'ok' | 'error' | 'degraded';
  checks: {
    database?: {
      status: string;
      serverTime?: string;
      version?: string;
      responseMs?: number;
      connections?: { total: number; active: number; idle: number };
      error?: string;
    };
    memory?: {
      total: string; free: string; used: string; usedPct: number;
      process: { heapUsed: string; heapTotal: string; rss: string };
    };
    uptime?: {
      process: number; system: number;
      processHuman: string; systemHuman: string;
    };
    environment?: {
      nodeVersion: string; platform: string; cpus: number;
      hostname: string; nodeEnv: string;
    };
    backups?: { count: number; totalSize: string; lastBackupAt: string | null };
    logs?: { fileCount: number; totalSize: string };
  };
  generatedAt: string;
}

export interface DbTable {
  tableName: string;
  rowCount: string;
  totalSize: string;
  tableSize: string;
  lastVacuum: string | null;
  lastAutovacuum: string | null;
  lastAnalyze: string | null;
  lastAutoanalyze: string | null;
}

export interface LogFile {
  name: string;
  size: number;
  sizeHuman: string;
  modifiedAt: string;
}

export interface SystemLog {
  id: number;
  level: string;
  source: string;
  message: string;
  details: unknown;
  createdAt: string;
}

export interface EnvInfo {
  env: Record<string, string>;
  packageVersion: string;
  scripts: string[];
  dependencies: { name: string; version: string }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isBlocked: boolean;
  blockedAt: string | null;
  blockedBy: string | null;
  blockReason: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  initials: string | null;
  avatar?: string | null;
  positionName: string | null;
  departmentName: string | null;
}

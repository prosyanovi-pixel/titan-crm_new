/**
 * Компонент выбора типа отчёта (Шаг 1 конструктора)
 */

import {
  FileText, TrendingUp, BarChart2, AlertCircle,
  FolderKanban, Users, Scale, Calculator, PieChart, Layers,
  UserCheck, Clock, FileSignature, Gavel, Settings2, ChevronDown, ChevronRight,
  Megaphone
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { REPORT_TYPES_META } from '../../config/reportTypes';
import type { ReportType, ReportModule } from '../../types/reports.types';

const ICON_MAP: Record<string, React.ElementType> = {
  FileText, TrendingUp, BarChart2, AlertCircle, FolderKanban, Users, Scale,
  Calculator, PieChart, Layers, UserCheck, Clock, FileSignature, Gavel, Settings2,
  Megaphone
};

const MODULE_LABELS: Record<ReportModule, string> = {
  finance: 'reports.module_finance',
  projects: 'reports.module_projects',
  tasks: 'reports.module_tasks',
  contractors: 'reports.module_contractors',
  lawyers: 'reports.module_lawyers',
  marketing: 'reports.module_marketing',
  custom: 'reports.module_custom'
};

const MODULES: ReportModule[] = [
  'finance',
  'projects',
  'tasks',
  'contractors',
  'lawyers',
  'marketing',
  'custom'
];

interface ReportTypeSelectorProps {
  value:    ReportType | undefined;
  onChange: (type: ReportType) => void;
}

/**
 * Карточки типов отчётов сгруппированные по модулям
 */
export function ReportTypeSelector({ value, onChange }: ReportTypeSelectorProps) {
  const { t } = useTranslation();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    finance: true,
    projects: true,
    marketing: true
  });

  const uniqueReportsByModule = (mod: ReportModule) => {
    const seen = new Set<string>();
    return REPORT_TYPES_META.filter(meta => meta.module === mod && !seen.has(meta.type) && seen.add(meta.type));
  };

  const toggleModule = (mod: string) => {
    setExpandedModules(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  return (
    <div className="space-y-4">
      {MODULES.map((mod) => {
        const reports = uniqueReportsByModule(mod);
        if (reports.length === 0) return null;

        const isExpanded = expandedModules[mod];

        return (
          <div key={mod} className="space-y-1.5">
            <button
              onClick={() => toggleModule(mod)}
              className="flex items-center gap-2 w-full text-left px-1 py-1.5 group"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                {t(MODULE_LABELS[mod])}
              </span>
            </button>

            {isExpanded && (
              <div className="space-y-2 ml-1">
                {reports.map((meta) => {
                  const Icon = ICON_MAP[meta.icon] ?? FileText;
                  const isSelected = value === meta.type;

                  return (
                    <button
                      key={meta.type}
                      type="button"
                      onClick={() => onChange(meta.type)}
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border/50 hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 p-2 rounded-md ${
                        isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-medium leading-tight ${isSelected ? 'text-primary' : ''}`}>
                          {t(meta.label)}
                        </div>
                        {isSelected && (
                          <div className="text-xs text-muted-foreground mt-1.5 leading-normal">
                            {t(meta.description)}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


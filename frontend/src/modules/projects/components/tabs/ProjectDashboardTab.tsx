import React, { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Project } from "../../types/project.types";
import { useSettings } from "@/hooks/use-settings";
import { 
  Briefcase, 
  Wallet, 
  CalendarCheck, 
  ListChecks,
  User,
  Activity,
  FileText,
  Clock,
  TrendingUp,
  Check,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { MiniAreaChart } from "@/components/shared/charts";

import { useProjectExpensesChart } from "../../hooks/useProjectQueries";

interface ProjectDashboardTabProps {
  project: Project;
  onNavigate?: (tab: string) => void;
  onUpdateField?: (field: keyof Project, value: unknown) => void;
}

export function ProjectDashboardTab({ project, onNavigate, onUpdateField }: ProjectDashboardTabProps) {
  const { t } = useTranslation();
  const settings = useSettings();
  
  const { data: chartData = [], isLoading: isChartLoading } = useProjectExpensesChart(project.id);

  const statuses = settings.getStatusesByModule('projects');
  const statusName = statuses.find(s => s.id === project.status)?.name || project.status;

  const initials = project.name
    ? project.name.substring(0, 2).toUpperCase()
    : "PR";

  // Use real data or fallback to empty array
  const displayChartData = chartData.length > 0 ? chartData : [
    { name: t('common.calendar.weekdays.mon'), value: 0 },
    { name: t('common.calendar.weekdays.tue'), value: 0 },
    { name: t('common.calendar.weekdays.wed'), value: 0 },
    { name: t('common.calendar.weekdays.thu'), value: 0 },
    { name: t('common.calendar.weekdays.fri'), value: 0 },
    { name: t('common.calendar.weekdays.sat'), value: 0 },
    { name: t('common.calendar.weekdays.sun'), value: 0 },
  ];

  return (
    <div className="space-y-6 pb-10 fade-in-up">
      {/* 1. Header / Summary Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <Avatar className="w-20 h-20 border-2 border-primary/20 shadow-sm rounded-xl">
            <AvatarImage src="" alt={project.name} />
            <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold rounded-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold truncate text-foreground">{project.name}</h2>
              {statusName && (
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold whitespace-nowrap">
                  {statusName}
                </span>
              )}
            </div>
            {project.client && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Клиент: {project.client}
              </p>
            )}
            <div className="flex flex-wrap gap-4 pt-2">
              {project.deadline && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary/70" />
                  Дедлайн: {new Date(project.deadline).toLocaleDateString()}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Activity className="w-4 h-4 text-primary/70" />
                Этап: {project.stage}
              </div>
            </div>
          </div>
        </div>

        {/* Responsible Manager */}
        <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col justify-center">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {t("projects.manager")}
          </h3>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={project.managerAvatar || ''} alt={project.manager} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{project.manager || t('projects.sheet.dashboard.not_assigned')}</p>
              <p className="text-xs text-muted-foreground truncate">{t('projects.sheet.dashboard.responsible')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          icon={<Wallet className="w-5 h-5" />} 
          label={t('projects.sheet.dashboard.budget')} 
          value={`₽ ${(project.budget || 0).toLocaleString()}`} 
          color="text-emerald-500" 
          bg="bg-emerald-500/10"
        />
        <MetricCard 
          icon={<Activity className="w-5 h-5" />} 
          label={t('projects.sheet.dashboard.used')} 
          value={`₽ ${(project.budgetUsed || 0).toLocaleString()}`} 
          color="text-blue-500" 
          bg="bg-blue-500/10"
        />
        <MetricCard 
          icon={<CalendarCheck className="w-5 h-5" />} 
          label={t('projects.sheet.dashboard.tasks')} 
          value={`${project.completedTasks || 0} / ${project.tasksCount || 0}`} 
          onClick={() => onNavigate && onNavigate("general")}
          color="text-amber-500" 
          bg="bg-amber-500/10"
        />
        <MetricCard 
          icon={<ListChecks className="w-5 h-5" />} 
          label={t('projects.sheet.dashboard.stages')} 
          value="0" 
          onClick={() => onNavigate && onNavigate("stages")}
          color="text-purple-500" 
          bg="bg-purple-500/10"
        />
      </div>

      {/* 3. Charts & Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="md:col-span-2 bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Динамика расходов
            </h3>
            <button 
              onClick={() => onNavigate && onNavigate("expenses")}
              className="text-xs text-primary hover:underline"
            >
              Смотреть финансы
            </button>
          </div>
          <div className="flex-1 mt-2">
            {isChartLoading ? (
              <div className="h-[180px] w-full flex items-center justify-center">
                <span className="text-sm text-muted-foreground animate-pulse">{t('common.loading')}...</span>
              </div>
            ) : (
              <MiniAreaChart 
                data={displayChartData} 
                color="#10b981" 
                height={180}
                valuePrefix="₽ "
              />
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Описание
            </h3>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <textarea
              className="flex-1 w-full min-h-[160px] rounded-xl border border-input bg-muted/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-primary outline-none resize-none transition-colors"
              value={project.description || ""}
              onChange={(e) => onUpdateField && onUpdateField("description", e.target.value)}
              placeholder={t('projects.sheet.dashboard.notes_placeholder')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, trend, color, bg, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
  bg: string;
  onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={`bg-card rounded-2xl border border-border/40 p-5 shadow-sm flex flex-col gap-3 transition-all duration-300 hover:shadow-md ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg} ${color}`}>
          {icon}
        </div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
      </div>
      <div className="flex items-end justify-between">
        <h4 className="text-2xl font-bold text-foreground">{value}</h4>
        {trend && <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">{trend}</span>}
      </div>
    </div>
  );
}

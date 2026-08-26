import React from "react";
import { useTranslation } from "@/lib/i18n";
import { Contractor } from "../../types/contractor.types";
import { useSettings } from "@/hooks/use-settings";
import { 
  Briefcase, 
  Wallet, 
  CalendarCheck, 
  Network,
  Mail,
  Phone,
  User,
  Activity,
  FileText
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { MiniAreaChart } from "@/components/shared/charts";

import { useContractorActivityChart } from "../../hooks/useContractorQueries";

interface ContractorDashboardTabProps {
  contractor: Contractor;
  onNavigate?: (tab: string) => void;
  onUpdateField?: (field: keyof Contractor, value: unknown) => void;
}

export function ContractorDashboardTab({ contractor, onNavigate, onUpdateField }: ContractorDashboardTabProps) {
  const { t } = useTranslation();
  const settings = useSettings();

  const { data: chartData = [], isLoading: isChartLoading } = useContractorActivityChart(contractor.id);

  const statuses = settings.getStatusesByModule('contractors');
  const statusName = statuses.find(s => s.id === contractor.status)?.name || contractor.status;

  const initials = contractor.name
    ? contractor.name.substring(0, 2).toUpperCase()
    : "CO";

  // Use real data or fallback to empty array
  const displayActivityData = chartData.length > 0 ? chartData : [
    { name: 'Янв', value: 0 },
    { name: 'Фев', value: 0 },
    { name: 'Мар', value: 0 },
    { name: 'Апр', value: 0 },
    { name: 'Май', value: 0 },
    { name: 'Июн', value: 0 },
    { name: 'Июл', value: 0 },
  ];

  return (
    <div className="space-y-6 pb-10 fade-in-up">
      {/* 1. Header / Summary Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <Avatar className="w-20 h-20 border-2 border-primary/20 shadow-sm">
            <AvatarImage src="" alt={contractor.name} />
            <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold truncate text-foreground">{contractor.name}</h2>
              {statusName && (
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold whitespace-nowrap">
                  {statusName}
                </span>
              )}
            </div>
            {contractor.inn && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                ИНН: {contractor.inn}
              </p>
            )}
            <div className="flex flex-wrap gap-4 pt-2">
              {contractor.phone && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary/70" />
                  {contractor.phone}
                </div>
              )}
              {contractor.email && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary/70" />
                  {contractor.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Responsible Manager & Quick Contacts */}
        <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col justify-center">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {t("contractor_sheet.field.manager")}
          </h3>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{contractor.manager || "Не назначен"}</p>
              <p className="text-xs text-muted-foreground truncate">Ответственный</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          icon={<Wallet className="w-5 h-5" />} 
          label="Оборот (Mock)" 
          value="₽ 1.2M" 
          trend="+15%" 
          color="text-emerald-500" 
          bg="bg-emerald-500/10"
        />
        <MetricCard 
          icon={<Briefcase className="w-5 h-5" />} 
          label="Сделки (Mock)" 
          value="4" 
          onClick={() => onNavigate && onNavigate("deals")}
          color="text-blue-500" 
          bg="bg-blue-500/10"
        />
        <MetricCard 
          icon={<CalendarCheck className="w-5 h-5" />} 
          label="Активные задачи" 
          value="2" 
          onClick={() => onNavigate && onNavigate("activity")}
          color="text-amber-500" 
          bg="bg-amber-500/10"
        />
        <MetricCard 
          icon={<Network className="w-5 h-5" />} 
          label="Проекты" 
          value="1" 
          color="text-purple-500" 
          bg="bg-purple-500/10"
        />
      </div>

      {/* 3. Charts & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="md:col-span-2 bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Активность взаимодействия
            </h3>
            <button 
              onClick={() => onNavigate && onNavigate("activity")}
              className="text-xs text-primary hover:underline"
            >
              Смотреть детали
            </button>
          </div>
          <div className="flex-1 mt-2">
            {isChartLoading ? (
              <div className="h-[180px] w-full flex items-center justify-center">
                <span className="text-sm text-muted-foreground animate-pulse">Загрузка...</span>
              </div>
            ) : (
              <MiniAreaChart 
                data={displayActivityData} 
                color="#3b82f6" 
                height={180}
                valueFormatter={(val) => `${val} событий`}
              />
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Заметки
            </h3>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <textarea
              className="flex-1 w-full min-h-[160px] rounded-xl border border-input bg-muted/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-primary outline-none resize-none transition-colors"
              value={contractor.notes || ""}
              onChange={(e) => onUpdateField && onUpdateField("notes", e.target.value)}
              placeholder="Дополнительные заметки..."
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

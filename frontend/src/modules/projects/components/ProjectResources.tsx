
import { Project } from "../types";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Employee {
    id: number;
    full_name: string;
    fullName?: string;
    position_name?: string;
    positionName?: string;
    department_name?: string;
    departmentName?: string;
    employment_status?: string;
    employmentStatus?: string;
    // связанный аккаунт (может отсутствовать)
    user_name?: string;
    userName?: string;
    user_avatar?: string;
    userAvatar?: string;
}

interface ProjectResourcesProps {
  projects: Project[];
}

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();

const MAX_PROJECTS = 5; // максимум для шкалы загрузки (100%)

export function ProjectResources({ projects }: ProjectResourcesProps) {
  const { t } = useTranslation();
  const { data: employees = [] } = useQuery({
    queryKey: ['projects-employees-active'],
    queryFn: async () => {
      const data = await api.get('/employees?status=active');
      return data as Employee[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {employees.map(emp => {
          const name      = emp.fullName     ?? emp.full_name     ?? '';
          const position  = emp.positionName ?? emp.position_name ?? '';
          const dept      = emp.departmentName ?? emp.department_name ?? '';
          const subtitle  = position || dept || '—';

          // Подходят проекты, где менеджером указано имя сотрудника
          const empProjects = projects.filter(p => p.manager === name);
          const load = empProjects.length;
          const loadPct = Math.min(Math.round((load / MAX_PROJECTS) * 100), 100);

          return (
              <Card key={emp.id}>
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <Avatar className="h-12 w-12">
                          <AvatarImage src={emp.userAvatar ?? emp.user_avatar ?? ''} alt={name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(name)}
                          </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                          <CardTitle className="text-base truncate">{name}</CardTitle>
                          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                          {dept && position && (
                              <Badge variant="outline" className="text-xs mt-1">{dept}</Badge>
                          )}
                      </div>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4">
                          <div>
                              <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">{t('projects.resources.load')}</span>
                                  <span className={`font-medium ${load > 3 ? 'text-destructive' : ''}`}>{loadPct}%</span>
                              </div>
                              <Progress
                                  value={loadPct}
                                  className={load > 3 ? '[&>div]:bg-destructive' : ''}
                              />
                          </div>
                          <div className="text-sm">
                              <p className="text-muted-foreground mb-2">{t('projects.resources.assigned_projects')}: {load}</p>
                              <ul className="space-y-1">
                                  {empProjects.map(p => (
                                      <li key={p.id} className="truncate flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                                          {p.name}
                                      </li>
                                  ))}
                                  {load === 0 && (
                                      <li className="text-muted-foreground italic text-xs">
                                          {t('projects.resources.no_projects')}
                                      </li>
                                  )}
                              </ul>
                          </div>
                      </div>
                  </CardContent>
              </Card>
          );
      })}
      {employees.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
              {t('projects.resources.no_employees')}
          </div>
      )}
    </div>
  );
}


import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSelect } from "@/components/shared";
import { EntityCombobox } from "@/components/shared/EntityCombobox";
import type { ComboboxOption } from "@/components/shared/EntityCombobox";
import { useTranslation } from "@/lib/i18n";
import { Project } from "../../types";
import { ProjectSelect } from "../ProjectSelect";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Contractor } from "@/modules/contractors";
import { DatePicker } from "@/components/ui/date-picker";
import type { ReferenceData } from "../../hooks/useProjectsPage.types";
import { useSettings } from "@/hooks/use-settings";
import { FinanceBlock, useProjectFinanceSummary } from "@/modules/finance";
import { TagInput } from "@/components/ui/status-system";
import { SmartMetadataGrid } from "@/components/shared";
import { AiInsightPanel } from "@/components/ai/AiInsightPanel";
import { useState } from "react";
import { FolderKanban, Calendar, DollarSign, Calculator } from "lucide-react";

/**
 * Свойства компонента ProjectGeneralTab
 */
interface ProjectGeneralTabProps {
  /** Данные формы проекта */
  formData: Partial<Project>;
  /** Обработчик изменений полей формы */
  handleChange: (field: keyof Project, value: unknown) => void;
  /** Список контрагентов */
  contractors: Contractor[];
  /** Функция быстрого создания контрагента */
  onCreateContractor: (name: string) => Promise<string>;
  /** Справочные данные (статусы, приоритеты и т.д.) */
  references?: ReferenceData;
  /** Все проекты для выбора родительского */
  allProjects?: Project[];
  /** ID текущего проекта (для исключения из списка родительских) */
  currentProjectId?: number;
}

/**
 * ProjectGeneralTab — вкладка общей информации о проекте
 * 
 * Содержит основные поля проекта:
 * - Название и родительский проект
 * - Статус и приоритет
 * - Клиент и менеджер
 * - Дедлайн и бюджет
 * - Режим налогообложения
 * - Финансовая сводка (если проект существует)
 * 
 * @param props - Свойства компонента
 * @returns React-компонент вкладки общей информации
 * 
 * @example
 * ```tsx
 * <ProjectGeneralTab
 *   formData={projectData}
 *   handleChange={handleInputChange}
 *   contractors={contractors}
 *   onCreateContractor={handleCreateContractor}
 * />
 * ```
 */
export function ProjectGeneralTab({ 
    formData, 
    handleChange, 
    contractors, 
    onCreateContractor, 
    references,
    allProjects = [],
    currentProjectId
}: ProjectGeneralTabProps) {
  const { t } = useTranslation();
    const { getStatusesByModule, getPrioritiesByModule, priorities: allPriorities, getProjectStages } = useSettings();
  const { data: financeSummary, isLoading: isFinanceLoading } = useProjectFinanceSummary(formData.id || 0);

  // Get dynamic settings
  const statuses = getStatusesByModule('projects');
    const projectStages = getProjectStages();
  
  // Fallback for priorities if module-specific ones aren't defined
  const modulePriorities = getPrioritiesByModule('projects');
  const priorities = modulePriorities.length > 0 ? modulePriorities : allPriorities;

  // Находим все ID, которые нельзя выбирать как родителя (сам проект и его потомки)
  const forbiddenIds = useMemo(() => {
    if (!currentProjectId) return [];
    
    const ids = [currentProjectId];
    const findDescendants = (parentId: number) => {
        allProjects.forEach(p => {
            if (p.parentId === parentId) {
                ids.push(p.id);
                findDescendants(p.id);
            }
        });
    };
    
    findDescendants(currentProjectId);
    return ids;
  }, [currentProjectId, allProjects]);

  const [editingField, setEditingField] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
          <Label>{t('projects.table.name')}</Label>
          <Input 
              value={formData.name || ""} 
              onChange={(e) => handleChange("name", e.target.value)}
          />
      </div>

      <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
              <Label>{t('common.client')}</Label>
              <EntityCombobox
                value={formData.client || ''}
                onChange={(v) => handleChange('client', v ?? '')}
                options={contractors.map(c => ({ id: c.name, label: c.name } as ComboboxOption))}
                placeholder={t('lost.vyberite_klienta')}
                onCreate={onCreateContractor}
              />
          </div>
          <div className="space-y-2">
              <Label>{t('common.manager')}</Label>
              <UserSelect 
                  value={formData.manager || ""}
                  onValueChange={(v) => handleChange("manager", v)}
              />
          </div>
      </div>

      <div className="space-y-2">
          <Label>{t('common.tags')}</Label>
          <TagInput
              value={formData.tags || []}
              onChange={(tags) => handleChange("tags", tags)}
              placeholder={t('references.tags.name_placeholder')}
              module="projects"
          />
      </div>

      <div className="pt-4 border-t">
        <Label className="text-muted-foreground mb-4 block uppercase text-[10px] font-bold tracking-wider">
          Дополнительная информация
        </Label>
        <SmartMetadataGrid items={[
          {
            id: "parentId",
            value: editingField === "parentId" ? "__editing__" : (formData.parentId ? allProjects.find(p => p.id === formData.parentId)?.name : null),
            label: t('projects.field.parent_project'),
            icon: <FolderKanban className="w-4 h-4 text-blue-500" />,
            isCritical: true,
            onClick: () => setEditingField("parentId"),
            onClickPlaceholder: () => setEditingField("parentId"),
            renderCustomBadge: editingField === "parentId" ? () => (
              <div className="min-w-[250px]">
                <ProjectSelect
                  value={formData.parentId || null}
                  onValueChange={(v) => { handleChange('parentId', v); setEditingField(null); }}
                  projects={allProjects}
                  excludeIds={forbiddenIds}
                />
              </div>
            ) : undefined
          },
          {
            id: "deadline",
            value: editingField === "deadline" ? "__editing__" : (formData.deadline ? new Date(formData.deadline).toLocaleDateString() : null),
            label: t('projects.table.deadline'),
            icon: <Calendar className="w-4 h-4 text-purple-500" />,
            isCritical: true,
            onClick: () => setEditingField("deadline"),
            onClickPlaceholder: () => setEditingField("deadline"),
            renderCustomBadge: editingField === "deadline" ? () => (
              <div className="min-w-[200px]">
                <DatePicker
                  value={formData.deadline || ""}
                  onChange={(date) => { handleChange("deadline", date); setEditingField(null); }}
                  placeholder={t('lost.dd_mm_gggg')}
                />
              </div>
            ) : undefined
          },
          {
            id: "budget",
            value: editingField === "budget" ? "__editing__" : (formData.budget ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(formData.budget) : null),
            label: t('common.budget'),
            icon: <DollarSign className="w-4 h-4 text-emerald-500" />,
            isCritical: true,
            onClick: () => setEditingField("budget"),
            onClickPlaceholder: () => setEditingField("budget"),
            renderCustomBadge: editingField === "budget" ? () => (
              <div className="min-w-[200px]">
                <MoneyInput 
                  value={formData.budget || 0}
                  onValueChange={(v) => { handleChange("budget", v); setEditingField(null); }}
                />
              </div>
            ) : undefined
          },
          {
            id: "taxRegimeId",
            value: editingField === "taxRegimeId" ? "__editing__" : (formData.taxRegimeId ? references?.taxRegimes?.find(t => t.id === formData.taxRegimeId)?.name : null),
            label: t('projects.sheet.tax_regime_label'),
            icon: <Calculator className="w-4 h-4 text-amber-500" />,
            isCritical: true,
            onClick: () => setEditingField("taxRegimeId"),
            onClickPlaceholder: () => setEditingField("taxRegimeId"),
            renderCustomBadge: editingField === "taxRegimeId" ? () => (
              <div className="min-w-[250px]">
                <Select 
                  value={formData.taxRegimeId ? String(formData.taxRegimeId) : ""} 
                  onValueChange={(v) => { handleChange("taxRegimeId", v ? Number(v) : null); setEditingField(null); }}
                >
                  <SelectTrigger autoFocus>
                    <SelectValue placeholder={t('projects.sheet.tax_regime_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {references?.taxRegimes?.map(tr => (
                      <SelectItem key={tr.id} value={String(tr.id)}>{tr.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : undefined
          }
        ]} />
      </div>

      <div className="space-y-2">
          <Label>{t('common.description')}</Label>
          <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder={t('projects.placeholder.description')}
          />
      </div>

      {formData.id && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FinanceBlock 
            summary={financeSummary} 
            isLoading={isFinanceLoading}
          />
          <AiInsightPanel
            entityType="project"
            entityId={String(formData.id)}
            insightType="win_probability"
            description={t('projects.ai.win_probability_desc')}
          />
        </div>
      )}
    </div>
  );
}

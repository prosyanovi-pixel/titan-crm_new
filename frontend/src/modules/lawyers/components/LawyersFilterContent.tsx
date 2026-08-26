// frontend/src/modules/lawyers/components/LawyersFilterContent.tsx
import { useTranslation } from "@/lib/i18n";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Lawyer } from "../types";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface LawyersFilterContentProps {
  activeTab: string;
  // Cases filters
  statusFilter: string;
  onStatusChange: (v: string) => void;
  lawyerFilter: string;
  onLawyerChange: (v: string) => void;
  caseStatuses: { id: string; name: string }[];
  lawyers: Pick<Lawyer, "id" | "name">[];
  // Lawyers filters
  lawyerStatusFilter: string;
  onLawyerStatusChange: (v: string) => void;
  lawyerStatuses: { id: string; name: string }[];
  hideArchived: boolean;
  onHideArchivedChange: (v: boolean) => void;
}

export function LawyersFilterContent({
  activeTab,
  statusFilter,
  onStatusChange,
  lawyerFilter,
  onLawyerChange,
  caseStatuses,
  lawyers,
  lawyerStatusFilter,
  onLawyerStatusChange,
  lawyerStatuses,
  hideArchived,
  onHideArchivedChange,
}: LawyersFilterContentProps) {
  const { t } = useTranslation();

  const filterHeader = (
    <>
      <div className="flex items-center space-x-2 px-2 py-1">
        <Checkbox 
          id="hide-archived-lawyers" 
          checked={hideArchived} 
          onCheckedChange={(checked) => onHideArchivedChange(checked as boolean)}
        />
        <Label htmlFor="hide-archived-lawyers" className="text-sm font-medium leading-none cursor-pointer">
          {t('lawyers.filters.hide_archived')}
        </Label>
      </div>
      <DropdownMenuSeparator />
    </>
  );

  if (activeTab === "specialists") {
    return (
      <div className="p-2 space-y-4">
        {filterHeader}
        <DropdownMenuLabel>{t("common.status")}</DropdownMenuLabel>
        <Select value={lawyerStatusFilter} onValueChange={onLawyerStatusChange}>
          <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
            <SelectValue placeholder={t("generated.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("generated.vse")}</SelectItem>
            {lawyerStatuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-4">
      {filterHeader}
      <DropdownMenuLabel>{t("common.status")}</DropdownMenuLabel>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue placeholder={t("generated.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("generated.vse_statusy")}</SelectItem>
          {activeTab === "cases"
            ? caseStatuses
                .filter((s) => !s.id.includes("claim"))
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))
            : caseStatuses
                .filter((s) => s.id.includes("claim"))
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
        </SelectContent>
      </Select>

      <DropdownMenuSeparator />
      <DropdownMenuLabel>{t("lawyers.table.lawyer")}</DropdownMenuLabel>
      <Select value={lawyerFilter} onValueChange={onLawyerChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue placeholder={t("generated.yurist")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("generated.vse_yuristy")}</SelectItem>
          {lawyers.map((l) => (
            <SelectItem key={l.id} value={l.name}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

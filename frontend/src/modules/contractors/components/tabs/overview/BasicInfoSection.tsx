import React from "react";
import { Building2, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UserSelect } from "@/components/shared/UserSelect";
import { cn } from "@/lib/utils";
import { Contractor } from "../../../types/contractor.types";
import { StatusItem, RelationshipTypeItem } from "@/modules/settings/types/settings.types";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";

interface BasicInfoSectionProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  isPrivate: boolean;
  isCreating: boolean;
  editingField: string | null;
  toggleEdit: (field: string | null) => void;
  changedFields: Set<string>;
  handleLookup: () => void;
  isLookupLoading: boolean;
  statuses: StatusItem[];
  relationshipTypes: RelationshipTypeItem[];
}

export const BasicInfoSection = ({
  formData,
  handleChange,
  isPrivate,
  isCreating,
  editingField,
  toggleEdit,
  changedFields,
  handleLookup,
  isLookupLoading,
  statuses,
  relationshipTypes,
}: BasicInfoSectionProps) => {
  const { t } = useTranslation();
  const { settings } = useModuleSettings("contractors");
  const { settings: enrichmentSettings } = useModuleSettings("enrichment");
  const showEnrichment = settings.features?.enableEnrichment !== false || enrichmentSettings.features?.enableEnrichment !== false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
          <Building2 className="w-3.5 h-3.5" />
          {t('common.basic_info')}
        </div>
        
        {showEnrichment && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary rounded-full transition-all"
            title={t('contractor_sheet.action.refresh_from_sources')}
            onClick={handleLookup}
            disabled={isLookupLoading || !formData.id || String(formData.id).includes('.')}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLookupLoading && "animate-spin")} />
          </Button>
        )}
      </div>
      
      {isPrivate ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t("contractor.last_name")}
              </label>
              <Input
                value={formData.lastName || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("lastName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t("contractor.first_name")}
              </label>
              <Input
                value={formData.firstName || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("firstName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t("contractor.middle_name")}
              </label>
              <Input
                value={formData.middleName || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("middleName", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t("contractor.snils")}
              </label>
              <Input
                value={formData.snils || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("snils", e.target.value)}
                placeholder="000-000-000 00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t("contractor.citizenship")}
              </label>
              <Input
                value={formData.citizenship || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("citizenship", e.target.value)}
                placeholder={t('contractors.contractor_sheet.placeholder.rf')}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {t('contractor_sheet.field.name')}
          </label>
          <Input
            value={formData.name || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("name", e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {t('contractor_sheet.field.phone')}
          </label>
          <Input
            value={formData.phone || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("phone", e.target.value)}
            placeholder="+7 (___) ___-__-__"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {t('contractor_sheet.field.email')}
          </label>
          <Input
            value={formData.email || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("email", e.target.value)}
            placeholder="mail@example.com"
          />
        </div>
      </div>

      {isCreating && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t('contractor_sheet.field.status')}
            </label>
            <Select value={formData.status} onValueChange={(v: string) => { handleChange('status', v); toggleEdit(null); }}>
              <SelectTrigger className="w-full sm:min-w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[110]">
                {statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t('contractor_sheet.field.type')}
            </label>
            <Select value={formData.type} onValueChange={(v: string) => { handleChange('type', v); toggleEdit(null); }}>
              <SelectTrigger className="w-full sm:min-w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[110]">
                {relationshipTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t('contractor_sheet.field.manager')}
            </label>
            <UserSelect
              value={formData.manager || ""}
              onValueChange={(v: string) => { handleChange("manager", v); toggleEdit(null); }}
            />
          </div>
        </>
      )}
    </div>
  );
};

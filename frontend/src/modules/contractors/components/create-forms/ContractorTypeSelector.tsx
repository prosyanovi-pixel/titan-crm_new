import React from "react";
import { 
  User, 
  Building2, 
  Briefcase, 
  Globe, 
  Search, 
  ShieldCheck, 
  Loader2, 
  Info 
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ContractorType } from "../ContractorCreateSheet";

interface ContractorTypeOption {
  id: ContractorType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  requiresInn: boolean;
}

interface ContractorTypeSelectorProps {
  selectedType: ContractorType;
  onTypeSelect: (type: ContractorType) => void;
  inn: string;
  onInnChange: (inn: string) => void;
  onLookup: () => void;
  isLoading: boolean;
  error: string | null;
}

export function ContractorTypeSelector({
  selectedType,
  onTypeSelect,
  inn,
  onInnChange,
  onLookup,
  isLoading,
  error
}: ContractorTypeSelectorProps) {
  const { t } = useTranslation();

  const typeOptions: ContractorTypeOption[] = [
    {
      id: "private",
      label: t("contractor_type.private.label"),
      description: t("contractor_type.private.description"),
      icon: User,
      color: "bg-blue-500",
      requiresInn: true,
    },
    {
      id: "individual",
      label: t("contractor_type.individual.label"),
      description: t("contractor_type.individual.description"),
      icon: Briefcase,
      color: "bg-green-500",
      requiresInn: true,
    },
    {
      id: "legal",
      label: t("contractor_type.legal.label"),
      description: t("contractor_type.legal.description"),
      icon: Building2,
      color: "bg-purple-500",
      requiresInn: true,
    },
    {
      id: "foreign",
      label: t("contractor_type.foreign.label"),
      description: t("contractor_type.foreign.description"),
      icon: Globe,
      color: "bg-amber-500",
      requiresInn: false,
    },
  ];

  const selectedOption = typeOptions.find(opt => opt.id === selectedType);

  return (
    <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-6">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">
          {t("contractor_type.select_type")}
        </Label>
        <Select value={selectedType} onValueChange={(value) => onTypeSelect(value as ContractorType)}>
          <SelectTrigger className="bg-background shadow-sm border-border/50 h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[110]">
            {typeOptions
              .filter((option) => option.id !== undefined && option.id !== null && String(option.id) !== '')
              .map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={String(option.id)} value={String(option.id)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-1.5 rounded-md text-white", option.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-sm">{option.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{option.description}</span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {selectedOption?.requiresInn && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">
            {t("contractor_sheet.field.inn")}
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={selectedType === "legal" ? t("contractor_type.legal.inn_placeholder") : t("contractor_type.individual.inn_placeholder")}
                value={inn}
                onChange={(e) => onInnChange(e.target.value)}
                maxLength={selectedType === "legal" ? 10 : 12}
                className="h-12 pl-10 bg-background shadow-sm border-border/50 font-mono text-lg tracking-[0.2em]"
              />
              <Search className="absolute left-3.5 top-4 w-4 h-4 text-muted-foreground" />
            </div>
            {selectedType !== "private" && (
              <Button
                type="button"
                variant="secondary"
                className="h-12 px-6 gap-2 font-bold shadow-sm bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20"
                onClick={onLookup}
                disabled={isLoading || !inn.trim()}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {t("contractor_type.lookup")}
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground italic px-1">
            {selectedType === "private" ? t("contractor_type.error.enter_inn") : t("contractor_type.inn_hint")}
          </p>
        </div>
      )}
      
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-center gap-2 text-destructive text-xs font-medium">
          <Info className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

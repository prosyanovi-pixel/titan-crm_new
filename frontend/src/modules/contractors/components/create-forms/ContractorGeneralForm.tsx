import React from "react";
import { 
  Info, 
  Phone, 
  Mail, 
  MapPin, 
  UserCircle, 
  Plus, 
  Search, 
  Tag as TagIcon 
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserSelect } from "@/components/shared/UserSelect";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { EntityCombobox } from "@/components/shared/EntityCombobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Tag as TagComponent } from "@/components/ui/status-system/Tag";
import { cn } from "@/lib/utils";
import { Contractor } from "../../types/contractor.types";
import { isPrivateContractor, isBusinessContractor, isIndividualEntrepreneur } from "../../utils/contractor-utils";

interface ContractorGeneralFormProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  relationshipTypes: { id: string; name: string }[];
  availableTags: { id: string; name: string; color: string }[];
  availablePositions: { id: string; label: string }[];
  taxRegimesList: { id: number; name: string }[];
  tagSearch: string;
  setTagSearch: (v: string) => void;
  onAddCustomTag: () => void;
  nameInputRef: React.RefObject<HTMLInputElement>;
}

export function ContractorGeneralForm({
  formData,
  handleChange,
  relationshipTypes,
  availableTags,
  availablePositions,
  taxRegimesList,
  tagSearch,
  setTagSearch,
  onAddCustomTag,
  nameInputRef
}: ContractorGeneralFormProps) {
  const { t } = useTranslation();
  
  const isPrivate = isPrivateContractor(formData);
  const isBusiness = isBusinessContractor(formData);
  const isIndividual = isIndividualEntrepreneur(formData);

  const filteredTags = availableTags.filter(tag => 
    !formData.tags?.includes(tag.id) && 
    !formData.tags?.includes(tag.name) && 
    (tagSearch === "" || tag.name.toLowerCase().includes(tagSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
         <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
           <Info className="w-4 h-4" />
           {t("contractor_sheet.section.general")}
         </h3>
         <Badge 
           variant="outline" 
           className={cn(
             "h-6 px-3 text-[10px] font-black uppercase tracking-widest shadow-sm",
             formData.legalEntityType === 'legal' && "bg-purple-500/10 text-purple-600 border-purple-500/20",
             formData.legalEntityType === 'individual' && "bg-green-500/10 text-green-600 border-green-500/20",
             formData.legalEntityType === 'private' && "bg-blue-500/10 text-blue-600 border-blue-500/20",
             formData.legalEntityType === 'foreign' && "bg-amber-500/10 text-amber-600 border-amber-500/20"
           )}
         >
           {t(`contractor_sheet.legal_entity_type_options.${formData.legalEntityType || 'legal'}`)}
         </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
            {isPrivate ? t("contractor_sheet.field.private_name") : t("contractor_sheet.field.short_name")}
          </Label>
          <Input
            ref={nameInputRef}
            value={formData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={isPrivate ? t("contractor_sheet.placeholder.private_name_placeholder") : t("contractor_sheet.placeholder.company_name_placeholder")}
            className="h-11 font-semibold text-base"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
            {t("contractor_sheet.field.manager")}
          </Label>
          <UserSelect
            value={formData.manager || ""}
            onValueChange={(v) => handleChange("manager", v)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">{t("contractor_sheet.field.phone")}</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <MaskedInput
              value={formData.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+7 (000) 000-00-00"
              className="pl-9 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">{t("contractor_sheet.field.email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@example.com"
              className="pl-9 h-11"
            />
          </div>
        </div>

        {!isPrivate ? (
          <>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                {t("contractor_sheet.field.full_name")}
              </Label>
              <Input
                value={formData.fullName || ""}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder={t("contractor_sheet.field.full_name")}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                {t("contractor_sheet.field.type")}
              </Label>
              <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t("contractor_sheet.field.type")} />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  {relationshipTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                {t(isIndividual ? "contractor_sheet.field.ogrnip" : "contractor_sheet.field.ogrn")}
              </Label>
              <Input
                value={formData.ogrn || ""}
                onChange={(e) => handleChange("ogrn", e.target.value)}
                placeholder={isIndividual ? "315503800..." : "1155038002283"}
                className="font-mono"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                {t("contractor_sheet.field.legal_address")}
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  value={formData.legalAddress || ""}
                  onChange={(e) => handleChange("legalAddress", e.target.value)}
                  placeholder={t("contractor_sheet.placeholder.legal_address_placeholder")}
                  className="pl-9"
                />
              </div>
            </div>

            {isBusiness && !isIndividual && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                    {t("contractor_sheet.field.director")}
                  </Label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.director || ""}
                      onChange={(e) => handleChange("director", e.target.value)}
                      placeholder={t("contractor_sheet.field.director")}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                    {t("contractor_sheet.field.position")}
                  </Label>
                  <EntityCombobox
                    value={formData.directorPosition || ""}
                    onChange={(v) => handleChange('directorPosition', v ? String(v) : '')}
                    options={availablePositions}
                    placeholder={t("contractor_sheet.field.position")}
                    className="w-full h-11"
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                {t("contractor_sheet.field.type")}
              </Label>
              <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t("contractor_sheet.field.type")} />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  {relationshipTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                {t("contractor_sheet.field.gender")}
              </Label>
              <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t("contractor_sheet.field.gender")} />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  <SelectItem value="male">{t("contractor_sheet.gender.male")}</SelectItem>
                  <SelectItem value="female">{t("contractor_sheet.gender.female")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                {t("contractor_sheet.field.birthday")}
              </Label>
              <DatePicker
                value={formData.registrationDate || ""}
                onChange={(v) => handleChange("registrationDate", v)}
                placeholder={t("contractor_sheet.placeholder.date_format_placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                {t("contractor_sheet.field.address")}
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  value={formData.legalAddress || ""}
                  onChange={(e) => handleChange("legalAddress", e.target.value)}
                  placeholder={t("contractor_sheet.field.address")}
                  className="pl-9 h-11"
                />
              </div>
            </div>
          </>
        )}

        <div className={cn("grid grid-cols-1 gap-6 md:col-span-2", formData.legalEntityType !== "foreign" ? "md:grid-cols-3" : "md:grid-cols-1")}>
          <div className={cn("space-y-2", formData.legalEntityType !== "foreign" ? "md:col-span-2" : "md:col-span-1")}>
            <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
              {t("contractor_sheet.field.tags")}
            </Label>
            <div className="flex flex-wrap gap-2 p-3 min-h-[44px] bg-muted/20 rounded-xl border border-dashed transition-all hover:bg-muted/30">
              {formData.tags?.length ? (
                formData.tags.map((tag, index) => {
                  const tagConfig = availableTags.find(t => t.name === tag || t.id === tag);
                  return <TagComponent key={index} name={tagConfig?.name || tag} color={tagConfig?.color} 
                    onRemove={() => {
                      const nt = [...formData.tags!]; nt.splice(index, 1); handleChange("tags", nt);
                    }} 
                  />;
                })
              ) : <span className="text-[10px] text-muted-foreground italic self-center px-1">{t("contractor_sheet.placeholder.no_tags")}</span>}
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-3 rounded-full border-dashed text-[10px] gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all">
                    <TagIcon className="w-3.5 h-3.5" /> {t("common.add")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 shadow-xl border-primary/10" align="start" side="top">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                      <Input 
                        placeholder={t("contractor_sheet.placeholder.search_tag")} 
                        value={tagSearch} 
                        onChange={(e) => setTagSearch(e.target.value)} 
                        className="h-9 pl-8 text-xs bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                        onKeyDown={(e) => { if (e.key === 'Enter' && tagSearch.trim()) onAddCustomTag(); }}
                        autoFocus
                      />
                    </div>
                    <ScrollArea className="max-h-48 pr-2">
                        <div className="grid gap-1">
                            {filteredTags.map(tag => (
                                <Button key={tag.id} variant="ghost" size="sm" className="justify-start font-normal h-8 text-xs px-2 hover:bg-primary/5"
                                onClick={() => { handleChange("tags", [...(formData.tags || []), tag.id]); setTagSearch(""); }}
                                >
                                <div className="w-2 h-2 rounded-full mr-2.5 shadow-sm" style={{ backgroundColor: tag.color }} /> {tag.name}
                                </Button>
                            ))}
                            {tagSearch.trim() && !availableTags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                                <Button variant="secondary" size="sm" className="justify-start font-bold h-9 text-[10px] px-2 mt-1 bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10"
                                onClick={onAddCustomTag}
                                >
                                <Plus className="w-3 h-3 mr-2" /> {t("contractor_sheet.action.add_custom_tag", { tag: tagSearch })}
                                </Button>
                            )}
                        </div>
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {formData.legalEntityType !== "foreign" && (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">{t('finance.invoice.field.tax_regime')}</Label>
              <Select value={formData.taxRegimeId ? String(formData.taxRegimeId) : undefined} onValueChange={(v) => handleChange('taxRegimeId', parseInt(v))}>
                <SelectTrigger className="h-11 bg-background shadow-sm border-border/50"><SelectValue placeholder={t('finance.invoice.field.tax_regime')} /></SelectTrigger>
                <SelectContent className="z-[110]">
                  {(taxRegimesList || []).map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

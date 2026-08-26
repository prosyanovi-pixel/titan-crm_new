import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { MarketingCampaign } from "../types";

interface CampaignFormProps {
  campaign: Partial<MarketingCampaign>;
  onChange: (field: keyof MarketingCampaign, value: any) => void;
  onSubmit: (e?: React.FormEvent) => void;
  statuses: any[];
  types: any[];
}

export function CampaignForm({ campaign, onChange, onSubmit, statuses, types }: CampaignFormProps) {
  const { t } = useTranslation();

  return (
    <form id="marketing-form" onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("marketing.campaigns.campaign_name_label")}</Label>
        <Input
          id="name"
          value={campaign.name || ""}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder={t("marketing.campaigns.placeholder_name")}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t("marketing.campaigns.description")}</Label>
        <Textarea
          id="description"
          value={campaign.description || ""}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder={t("marketing.campaigns.placeholder_description")}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="status">{t("marketing.campaigns.status")}</Label>
          <Select
            value={campaign.status || (statuses.length > 0 ? statuses[0].id : "draft")}
            onValueChange={(val) => onChange("status", val)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder={t("marketing.campaigns.select_status")} />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status: any) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">{t("marketing.campaigns.type")}</Label>
          <Select
            value={campaign.type || (types.length > 0 ? types[0].id : "email")}
            onValueChange={(val) => onChange("type", val)}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder={t("marketing.campaigns.select_type")} />
            </SelectTrigger>
            <SelectContent>
              {types.map((type: any) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="budget">{t("marketing.campaigns.budget_rub")}</Label>
          <Input
            id="budget"
            type="number"
            value={campaign.budget || 0}
            onChange={(e) => onChange("budget", Number(e.target.value))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="actualCost">{t("marketing.campaigns.actual_cost_rub")}</Label>
          <div className="h-9 px-3 rounded-md border border-input bg-muted/50 flex items-center text-sm font-medium text-rose-600">
            {Number(campaign.actualCost || 0).toLocaleString()} ₽
            {campaign.payments && campaign.payments.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">({t("marketing.campaigns.payments_count", { count: campaign.payments.length })})</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">{t("marketing.campaigns.start_date")}</Label>
          <Input
            id="startDate"
            type="date"
            value={campaign.startDate || ""}
            onChange={(e) => onChange("startDate", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endDate">{t("marketing.campaigns.end_date")}</Label>
          <Input
            id="endDate"
            type="date"
            value={campaign.endDate || ""}
            onChange={(e) => onChange("endDate", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="targetAudience">{t("marketing.campaigns.target_audience")}</Label>
        <Input
          id="targetAudience"
          value={campaign.targetAudience || ""}
          onChange={(e) => onChange("targetAudience", e.target.value)}
          placeholder={t("marketing.campaigns.placeholder_target_audience")}
        />
      </div>
    </form>
  );
}

import React, { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LucideIcon } from "lucide-react";

export interface TimelineEventTypeOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  color?: string;
}

export interface TimelineEventFormData {
  type: string;
  date: string;
  title: string;
  description: string;
}

interface TimelineEventFormProps {
  onSave: (data: TimelineEventFormData) => void;
  onCancel: () => void;
  typeOptions: TimelineEventTypeOption[];
  defaultType?: string;
  submitLabel?: string;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  className?: string;
}

/**
 * Reusable form for creating timeline events or stages.
 * Inspired by Apple/Case Timeline UI.
 */
export function TimelineEventForm({
  onSave,
  onCancel,
  typeOptions,
  defaultType,
  submitLabel,
  titlePlaceholder,
  descriptionPlaceholder,
  className = "",
}: TimelineEventFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<TimelineEventFormData>({
    type: defaultType || (typeOptions.length > 0 ? typeOptions[0].value : ""),
    date: new Date().toISOString().split("T")[0],
    title: "",
    description: "",
  });

  const handleSave = () => {
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  return (
    <div className={`p-4 border rounded-lg bg-muted/30 space-y-3 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder={t("generated.tip_sobytiya")} />
          </SelectTrigger>
          <SelectContent>
            {typeOptions
              .filter((opt) => opt.value !== undefined && opt.value !== null && String(opt.value) !== '')
              .map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  <div className="flex items-center gap-2">
                    {opt.icon && <opt.icon className={`w-4 h-4 ${opt.color || ""}`} />}
                    <span>{opt.label}</span>
                  </div>
                </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="bg-background"
        />
      </div>
      <Input
        placeholder={titlePlaceholder || t("generated.nazvanie_sobytiya")}
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="bg-background"
      />
      <Textarea
        placeholder={descriptionPlaceholder || t("generated.opisanie_optsional_no")}
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={2}
        className="bg-background resize-none"
      />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t("generated.otmena")}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!formData.title.trim()}>
          {submitLabel || t("generated.dobavit")}
        </Button>
      </div>
    </div>
  );
}

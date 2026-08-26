// frontend/src/modules/calendar/components/CalendarParticipantNotify.tsx
import React from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell, Mail, Smartphone, MessageSquare, Info, CheckSquare } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { NotifyChannel } from "../types";

export function getChannelIcon(channel: NotifyChannel) {
  switch (channel) {
    case "email":    return <Mail className="w-3.5 h-3.5" />;
    case "sms":      return <Smartphone className="w-3.5 h-3.5" />;
    case "whatsapp": return <MessageSquare className="w-3.5 h-3.5" />;
    default:         return <Bell className="w-3.5 h-3.5" />;
  }
}

interface Props {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  channel: NotifyChannel;
  onChannelChange: (c: NotifyChannel) => void;
  target?: string;
  onTargetChange: (t: string) => void;
  availableTargets: { label: string; value: string }[];
  showTaskToggle?: boolean;
  taskChecked?: boolean;
  onTaskCheckedChange?: (v: boolean) => void;
  disabled?: boolean;
}

export function CalendarParticipantNotify({
  label, checked, onCheckedChange,
  channel, onChannelChange,
  target, onTargetChange,
  availableTargets,
  showTaskToggle, taskChecked, onTaskCheckedChange,
  disabled,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={`space-y-1.5 mt-2 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{t("calendar.notification_will_be_sent")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          {checked && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] gap-1 text-primary hover:bg-primary/5">
                  {getChannelIcon(channel)}
                  {channel.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {(["email", "sms", "whatsapp", "app"] as NotifyChannel[]).map((ch) => (
                  <DropdownMenuItem key={ch} onClick={() => onChannelChange(ch)} className="gap-2 text-xs">
                    {getChannelIcon(ch)}
                    {ch === "app" ? t("calendar.system_notification") : ch.charAt(0).toUpperCase() + ch.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Switch checked={checked} onCheckedChange={onCheckedChange} className="scale-75 origin-right" />
        </div>
      </div>

      {checked && channel !== "app" && (
        <div className="space-y-2">
          <Select value={target} onValueChange={(v) => {
            onTargetChange(v);
            if (showTaskToggle && (channel === "sms" || channel === "whatsapp") && onTaskCheckedChange) {
              onTaskCheckedChange(true);
            }
          }}>
            <SelectTrigger className="flex items-center justify-between rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 py-2 h-7 text-[10px] font-normal ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <SelectValue placeholder={t("calendar.select_contact")} />
            </SelectTrigger>
            <SelectContent>
              {availableTargets.length > 0 ? (
                availableTargets.map((tgt) => (
                  <SelectItem key={tgt.value} value={tgt.value} className="text-xs">
                    <div className="flex flex-col items-start">
                      <span>{tgt.label}</span>
                      <span className="text-[9px] opacity-60">{tgt.value}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-[10px] text-muted-foreground text-center">
                  {t("calendar.no_available_contacts")}
                </div>
              )}
            </SelectContent>
          </Select>

          {showTaskToggle && (channel === "sms" || channel === "whatsapp") && (
            <div className="flex items-center justify-between bg-primary/5 p-1.5 rounded border border-primary/10">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-medium text-primary uppercase">
                  {t("calendar.create_follow_up_task")}
                </span>
              </div>
              <Switch
                checked={taskChecked}
                onCheckedChange={onTaskCheckedChange}
                className="scale-[0.6] origin-right"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

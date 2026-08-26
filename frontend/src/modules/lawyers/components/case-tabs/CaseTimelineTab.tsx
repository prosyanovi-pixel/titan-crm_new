import { useTranslation } from '@/lib/i18n';
import { LegalCase, TimelineEvent } from "../../types";
import { FileText, Gavel, DollarSign, MessageCircle, Clock, Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimelineEventForm, TimelineEventTypeOption } from "@/components/shared";
import { useState } from "react";

interface CaseTimelineTabProps {
  events: LegalCase["events"];
  onChange?: (events: TimelineEvent[]) => void;
  readOnly?: boolean;
  instanceId?: string;
}

export function CaseTimelineTab({ events, onChange, readOnly = false, instanceId }: CaseTimelineTabProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);

  const eventsList = events || [];

  const typeOptions: TimelineEventTypeOption[] = [
    { value: "document", label: t('generated.dokument'), icon: FileText, color: "text-blue-500" },
    { value: "court", label: t('generated.sudebnoe_zasedanie'), icon: Gavel, color: "text-orange-500" },
    { value: "finance", label: t('generated.finansy'), icon: DollarSign, color: "text-green-500" },
    { value: "communication", label: t('generated.kommunikatsiya'), icon: MessageCircle, color: "text-purple-500" },
    { value: "quick_action", label: "Быстрое действие", icon: Zap, color: "text-amber-500" },
  ];

  const getIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    if (option && option.icon) {
      return <option.icon className={`w-4 h-4 ${option.color || "text-gray-500"}`} />;
    }
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const handleAddEvent = (data: any) => {
    if (!onChange) return;

    const event: TimelineEvent = {
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      date: data.date.split('-').reverse().join('.'), // Convert YYYY-MM-DD to DD.MM.YYYY for consistency if needed
      type: data.type as TimelineEvent["type"],
      title: data.title,
      description: data.description || "",
      author: t('lawyers.messages.current_user'),
      instanceId: instanceId
    };
    
    onChange([...eventsList, event]);
    setIsAdding(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!onChange) return;
    onChange(eventsList.filter(e => e.id !== eventId));
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            {t('lawyers.messages.add_event')}
          </Button>
        </div>
      )}

      {isAdding && !readOnly && (
        <TimelineEventForm 
          onSave={handleAddEvent}
          onCancel={() => setIsAdding(false)}
          typeOptions={typeOptions}
          defaultType="document"
          className="mb-4"
        />
      )}

      {eventsList.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{t('lawyers.messages.history_empty')}</p>
        </div>
      ) : (
        <div className="relative border-l border-border ml-3 space-y-6 py-2">
          {eventsList.map((event) => (
            <div key={event.id} className="relative pl-6 group">
              <div className="absolute -left-2.5 top-1 h-5 w-5 rounded-full border bg-background flex items-center justify-center">
                {getIcon(event.type)}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">{event.date}</span>
                  {!readOnly && onChange && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <span className="text-sm font-medium">{event.title}</span>
                {event.description && (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                    {event.description}
                  </p>
                )}
                <span className="text-[10px] text-muted-foreground/70">
                  Автор: {event.author}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

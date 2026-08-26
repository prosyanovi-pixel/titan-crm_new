import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";
import {
  X,
  Trash2,
  CheckCircle2,
  MapPin,
  AlignLeft,
  Users,
  Briefcase,
  FolderKanban,
  Clock,
  Calendar as CalendarIcon,
  Plus,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ResizableSheet } from "@/components/shared";
import { ContractorSheet } from "@/modules/contractors";
import { UserSelect } from "@/components/shared/UserSelect";
import { EntityCombobox } from "@/components/shared/EntityCombobox";
import { useSettings } from "@/hooks/use-settings";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface CalendarEventProps {
  event: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (event: any) => void;
  onDelete?: (id: string | number) => void;
  initialDate?: Date | null;
  initialContractorId?: string | null;
  initialAssignee?: string | null;
  initialProjectId?: string | null;
}

export function CalendarEvent({
  event,
  open,
  onOpenChange,
  onSave,
  onDelete,
  initialDate,
  initialContractorId,
  initialAssignee,
  initialProjectId,
}: CalendarEventProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { getStatusesByModule, getPrioritiesByModule } = useSettings();
  const { settings } = useModuleSettings("calendar");
  const { confirm, alert } = useConfirm();
  const navigate = useNavigate();

  // Fetch contractors for EntityCombobox
  const { data: contractors = [] } = useQuery({
    queryKey: ["contractors"],
    queryFn: async () => {
      const data = await api.get("/contractors?all=true");
      return Array.isArray(data) ? data.map((c: any) => ({ id: c.id, label: c.name, legalAddress: c.legalAddress })) : [];
    },
    enabled: open,
  });

  // Fetch projects for EntityCombobox
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const data = await api.get("/projects");
      return Array.isArray(data) ? data.map((p: any) => ({ id: p.id, label: p.name })) : [];
    },
    enabled: open,
  });
  
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    location: "",
    startDate: initialDate || new Date(),
    endDate: initialDate ? new Date(initialDate.getTime() + 3600000) : new Date(new Date().getTime() + 3600000),
    status: "pending",
    priority: "Medium",
    assignee: "",
    contractorId: null,
    projectId: null,
  });

  const [contractorSheetOpen, setContractorSheetOpen] = useState(false);
  const [pendingContractorName, setPendingContractorName] = useState("");

  const statuses = getStatusesByModule("calendar");
  const priorities = getPrioritiesByModule("calendar");

  // Helper to create a valid date from a possible invalid input
  const safeDate = (dateInput: any, fallback: Date): Date => {
    if (!dateInput) return fallback;
    const date = new Date(dateInput);
    return isValid(date) ? date : fallback;
  };

  // Helper to safely format a date, returning empty string if invalid
  const safeFormat = (date: Date | null | undefined, formatStr: string): string => {
    if (!date || !isValid(date)) return "";
    return format(date, formatStr);
  };

  useEffect(() => {
    if (!open) return;

    console.log('[CalendarEvent] useEffect triggered with:', { 
      event: event ? JSON.parse(JSON.stringify(event)) : null, 
      initialDate, 
      initialContractorId, 
      initialAssignee, 
      initialProjectId 
    });
    
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);
    
    // Определяем, редактируем ли мы существующее событие или создаем новое
    // Редактируем, только если есть event.id
    const isEditingExisting = !!(event && event.id);
    
    console.log('[CalendarEvent] isEditingExisting:', isEditingExisting, 'event.id:', event?.id);
    
    if (isEditingExisting) {
      // Редактирование существующего события из календаря
      console.log('[CalendarEvent] Editing existing event:', event.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        ...event,
        startDate: safeDate(event.startDate, now),
        endDate: safeDate(event.endDate, oneHourLater),
      });
    } else {
      // Создание нового события - используем initial* параметры и данные из event (если есть)
      const currentUserId = localStorage.getItem("titan_user_id");
      const newFormData = {
        title: event?.title || "",
        description: event?.description || "",
        location: event?.location || "",
        startDate: safeDate(event?.startDate || initialDate, now),
        endDate: safeDate(event?.endDate || (initialDate ? new Date(initialDate.getTime() + 3600000) : null), oneHourLater),
        status: event?.status || "pending",
        priority: event?.priority || "Medium",
        assignee: initialAssignee || event?.assignee || currentUserId || "2",
        contractorId: initialContractorId || event?.contractorId || null,
        projectId: initialProjectId || event?.projectId || null,
      };
      console.log('[CalendarEvent] Creating new event with:', newFormData);
       
      setFormData(newFormData);
    }
  }, [event, open, initialDate, initialContractorId, initialAssignee, initialProjectId]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Определяет, является ли событие projected (сгенерировано системой)
  const isProjectedEvent = (id: string): boolean => {
    return (
      id.startsWith("task-") ||
      id.startsWith("proj-") ||
      id.startsWith("case-") ||
      (id.startsWith("ev-") && !id.startsWith("evt-")) ||
      id.startsWith("birthday-") ||
      id.startsWith("contractor-anniversary-") ||
      id.startsWith("hire-anniversary-")
    );
  };

  // Возвращает название модуля-источника события на русском
  const getModuleName = (id: string): string => {
    if (id.startsWith("task-")) return "Задачи";
    if (id.startsWith("proj-")) return "Проекты";
    if (id.startsWith("case-") || (id.startsWith("ev-") && !id.startsWith("evt-"))) return "Юридические дела";
    if (id.startsWith("birthday-") || id.startsWith("contractor-anniversary-") || id.startsWith("hire-anniversary-"))
      return "Сотрудники";
    return "Календарь";
  };



  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast.error(t("calendar.error_title_required"));
      return;
    }

    // Проверяем, является ли событие projected (не хранится в БД календаря)
    const isProjected = event?.id && (
      event.id.startsWith("task-") ||
      event.id.startsWith("proj-") ||
      event.id.startsWith("case-") ||
      (event.id.startsWith("ev-") && !event.id.startsWith("evt-")) ||
      event.id.startsWith("birthday-") ||
      event.id.startsWith("contractor-anniversary-") ||
      event.id.startsWith("hire-anniversary-")
    );
    if (isProjected) {
      toast.info(t("general.toast.info.system_event_cannot_delete"));
      return;
    }

    try {
      if (event?.id) {
        await api.put(`/calendar/events/${event.id}`, formData);
        toast.success(t("calendar.event_updated"));
      } else {
        await api.post("/calendar/events", formData);
        toast.success(t("calendar.event_created"));
      }
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      onOpenChange(false);
      if (onSave) onSave(formData);
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    }
  };

  const handleDelete = async () => {
    if (!event?.id) return;

    const id = event.id;
    const isProjected = isProjectedEvent(id);

    if (isProjected) {
      const moduleName = getModuleName(id);
      
      await alert({
        title: t("common.attention"),
        description: `Это событие создано автоматически в модуле «${moduleName}». Его нельзя удалить напрямую из календаря.\n\nДля удаления или изменения этого события, пожалуйста, перейдите в соответствующую карточку в модуле «${moduleName}».`,
        variant: "default",
      });
      return;
    }

    // Реальное событие календаря
    const confirmed = await confirm({
      title: t("calendar.delete_event"),
      description: t("calendar.confirm_delete"),
      variant: "destructive",
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });

    if (!confirmed) return;

    try {
      if (onDelete) {
        onDelete(id);
      } else {
        await api.delete(`/calendar/events/${id}`);
        toast.success(t("calendar.event_deleted"));
        queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    }
  };

  const handleContractorCreate = async (name: string) => {
    setPendingContractorName(name);
    setContractorSheetOpen(true);
    // return dummy ID for now as the actual ID will be updated when sheet saves
    return 'pending'; 
  };

  const handleContractorSheetSave = (newContractor: any) => {
    handleChange("contractorId", newContractor.id);
    if (!formData.location?.trim() && newContractor.legalAddress) {
      handleChange("location", newContractor.legalAddress);
    }
    setContractorSheetOpen(false);
    toast.success(t("calendar.contractor_linked"));
  };

  const handleContractorChange = async (value: any) => {
    handleChange("contractorId", value);
    if (value && value !== 'pending') {
      try {
        const contractor = await api.get(`/contractors/${value}`);
        if (contractor && contractor.legalAddress && !formData.location?.trim()) {
          handleChange("location", contractor.legalAddress);
        }
      } catch (error) {
        console.error("Failed to fetch contractor address:", error);
      }
    }
  };

  const handleContractorSheetClose = (open: boolean) => {
    setContractorSheetOpen(open);
  };

  return (
    <>
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSave}
      onDelete={event ? handleDelete : undefined}
      title={event ? formData.title : t("calendar.new_event")}
      moduleKey="calendar-event-sheet"
      defaultWidth="md"
    >
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Input 
            placeholder={t("calendar.event_title_placeholder")} 
            value={formData.title} 
            onChange={(e) => handleChange("title", e.target.value)}
            className="text-xl font-bold border-none px-0 focus-visible:ring-0 placeholder:opacity-50"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">{t("calendar.start")}</Label>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <Input type="datetime-local" value={safeFormat(formData.startDate, "yyyy-MM-dd'T'HH:mm")} onChange={(e) => handleChange("startDate", new Date(e.target.value))} className="bg-transparent" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">{t("calendar.end")}</Label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Input type="datetime-local" value={safeFormat(formData.endDate, "yyyy-MM-dd'T'HH:mm")} onChange={(e) => handleChange("endDate", new Date(e.target.value))} className="bg-transparent" />
            </div>
          </div>
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">{t("common.status")}</Label>
            <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.length > 0 ? (
                  statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                ) : (
                  <SelectItem value="pending">{t("common.status_pending")}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">{t("common.priority")}</Label>
            <Select value={formData.priority} onValueChange={(v) => handleChange("priority", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.length > 0 ? (
                  priorities.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                ) : (
                  <SelectItem value="Medium">{t("common.priority_medium")}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assignee */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase">{t("common.assignee")}</Label>
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <UserSelect value={formData.assignee} onValueChange={(v) => handleChange("assignee", v)} />
            </div>
          </div>
        </div>

        {/* Contractor & Project */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">{t("common.contractor")}</Label>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <EntityCombobox 
                  value={formData.contractorId} 
                  onChange={handleContractorChange} 
                  options={contractors} 
                  onCreate={handleContractorCreate}
                  placeholder={t("calendar.select_contractor")}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">{t("common.project")}</Label>
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <EntityCombobox 
                  value={formData.projectId} 
                  onChange={(v) => handleChange("projectId", v)} 
                  options={projects} 
                  placeholder={t("calendar.select_project")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-4">
          <MapPin className="w-5 h-5 text-muted-foreground" />
          <Input placeholder={t("calendar.add_location")} value={formData.location || ""} onChange={(e) => handleChange("location", e.target.value)} className="bg-transparent" />
        </div>

        {/* Description */}
        <div className="flex items-start gap-4">
          <AlignLeft className="w-5 h-5 text-muted-foreground mt-2" />
          <Textarea 
            placeholder={t("calendar.add_description")} 
            value={formData.description || ""} 
            onChange={(e) => handleChange("description", e.target.value)} 
            className="min-h-[200px] resize-y bg-transparent" 
          />
        </div>
      </div>
    </ResizableSheet>

    {/* Contractor Creation Sheet */}
    <ContractorSheet
      contractor={null}
      open={contractorSheetOpen}
      onOpenChange={handleContractorSheetClose}
      onSave={handleContractorSheetSave}
      initialName={pendingContractorName}
    />
    </>
  );
}

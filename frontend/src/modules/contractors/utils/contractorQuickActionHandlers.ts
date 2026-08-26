import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import type { Contractor } from "../types/contractor.types";

type TranslationFn = (key: string, values?: Record<string, string | number>) => string;

interface CreateContractorQuickActionHandlersParams {
  contractor: Contractor;
  contractorId: number;
  navigate: NavigateFunction;
  t: TranslationFn;
  onCreateTask?: (contractorName: string, contractorId: number | string) => void;
  onCreateClaim?: (contractorName: string, contractorId: number | string) => void;
  onCreateProject?: (contractorName: string, contractorId: number | string) => void;
  onCreateEvent?: (contractorName: string, contractorId: number | string) => void;
  onCreateReminder?: (contractorName: string, contractorId: number | string) => void;
  onAddNote?: (contractorName: string, contractorId: number | string) => void;
}

function buildCalendarQuery(contractor: Contractor, contractorId: number, kind: "event" | "reminder", t: TranslationFn) {
  const currentUserId = localStorage.getItem("titan_user_id");
  const params = new URLSearchParams(
    kind === "event"
      ? {
          action: "create",
          contractorId: String(contractorId),
          name: t('contractors.quick_actions.event_name', { name: contractor.name }),
          description: t('contractors.quick_actions.event_description', { 
            name: contractor.name, 
            inn: contractor.inn || t('common.no_data'), 
            phone: contractor.phone || t('common.no_data') 
          }),
          location: contractor.legalAddress || "",
        }
      : {
          action: "create",
          type: "reminder",
          contractorId: String(contractorId),
          name: t('contractors.quick_actions.reminder_name', { name: contractor.name }),
          description: t('contractors.quick_actions.reminder_description', { 
            name: contractor.name, 
            phone: contractor.phone || t('common.no_data') 
          }),
        }
  );

  if (currentUserId) {
    params.set("assignee", currentUserId);
  }

  return `/calendar?${params.toString()}`;
}

function handlePhoneCall(contractor: Contractor, t: TranslationFn) {
  if (contractor.phone) {
    window.open(`tel:${contractor.phone}`, "_blank");
    toast.success(t("contractor_sheet.messages.call", { phone: contractor.phone }));
    return;
  }

  toast.error(t("contractors.errors.no_phone"));
}

/**
 * Создаёт объект с обработчиками быстрых действий для контрагента.
 * @param params - Параметры: контрагент, navigate, t() и колбэки действий
 * @returns Словарь action → обработчик (view, edit, send_email, make_call, и т.д.)
 */
export function createContractorQuickActionHandlers({
  contractor,
  contractorId,
  navigate,
  t,
  onCreateTask,
  onCreateClaim,
  onCreateProject,
  onCreateEvent,
  onCreateReminder,
  onAddNote,
}: CreateContractorQuickActionHandlersParams): Record<string, () => void> {
  return {
    view: () => navigate(`/contractors/${contractorId}`),
    edit: () => {},
    send_email: () => {
      toast.info(t("contractors.quick_actions.send_email").replace("{name}", contractor.name));
      navigate("/mail");
    },
    make_call: () => handlePhoneCall(contractor, t),
    call: () => handlePhoneCall(contractor, t),
    create_contract: () => {
      toast.success(t("contractors.quick_actions.create_contract").replace("{name}", contractor.name));
    },
    create_task: () => {
      if (onCreateTask) {
        onCreateTask(contractor.name, contractorId);
        return;
      }
      navigate(`/tasks?action=create&name=${contractor.name}`);
    },
    create_claim: () => {
      if (onCreateClaim) {
        onCreateClaim(contractor.name, contractorId);
        return;
      }
      toast.info(t("general.toast.info.action_completed").replace("{0}", "create_claim"));
    },
    create_project: () => {
      if (onCreateProject) {
        onCreateProject(contractor.name, contractorId);
        return;
      }
      navigate(`/projects?action=create&name=${contractor.name}`);
    },
    create_event: () => {
      if (onCreateEvent) {
        onCreateEvent(contractor.name, contractorId);
        return;
      }
      navigate(buildCalendarQuery(contractor, contractorId, "event", t));
    },
    create_reminder: () => {
      if (onCreateReminder) {
        onCreateReminder(contractor.name, contractorId);
        return;
      }
      navigate(buildCalendarQuery(contractor, contractorId, "reminder", t));
    },
    add_note: () => {
      if (onAddNote) {
        onAddNote(contractor.name, contractorId);
        return;
      }
      toast.info(t("contractors.quick_actions.add_note").replace("{name}", contractor.name));
    },
  };
}

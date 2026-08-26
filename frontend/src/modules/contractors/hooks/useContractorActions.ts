import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { Contractor } from "../types/contractor.types";
import { ConfirmOptions } from "@/components/ui/confirm-dialog";
import { createContractorQuickActionHandlers } from "../utils/contractorQuickActionHandlers";

/** Параметры хука useContractorActions */
interface UseContractorActionsProps {
  contractors: Contractor[];
  onCreateTask?: (contractorName: string, contractorId: number | string) => void;
  onCreateClaim?: (contractorName: string, contractorId: number | string) => void;
  onCreateProject?: (contractorName: string, contractorId: number | string) => void;
  onCreateEvent?: (contractorName: string, contractorId: number | string) => void;
  onCreateReminder?: (contractorName: string, contractorId: number | string) => void;
  onAddNote?: (contractorName: string, contractorId: number | string) => void;
  onUpdateContractor?: (contractor: Contractor) => Promise<void>;
  onDeleteContractor?: (id: number) => Promise<void>;
  confirm?: (options: string | ConfirmOptions) => Promise<boolean>;
}

/** Возвращаемое значение хука useContractorActions */
interface UseContractorActionsReturn {
  handleQuickAction: (action: string, id: number | string) => Promise<void>;
}

function resolveContractor(contractors: Contractor[], id: number | string) {
  const contractorId = String(id);
  return contractors.find((contractor) => String(contractor.id) === contractorId) ?? null;
}

/**
 * Хук для обработки быстрых действий над контрагентами (удаление, архивирование, звонок и т.д.).
 * @returns Объект с методом handleQuickAction для диспетчеризации действий
 */
export function useContractorActions({
  contractors,
  onCreateTask,
  onCreateClaim,
  onCreateProject,
  onCreateEvent,
  onCreateReminder,
  onAddNote,
  onUpdateContractor,
  onDeleteContractor,
  confirm,
}: UseContractorActionsProps): UseContractorActionsReturn {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleQuickAction = async (action: string, id: number | string) => {
    const contractor = resolveContractor(contractors, id);
    if (!contractor) return;

    const contractorId = contractor.id;
    const actionHandlers = createContractorQuickActionHandlers({
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
    });

    switch (action) {
      case 'delete':
        if (onDeleteContractor && confirm) {
          const ok = await confirm(t('common.confirm_deletion_text'));
          if (ok) await onDeleteContractor(Number(id));
        }
        break;
      case 'archive':
        if (onUpdateContractor && confirm) {
          const ok = await confirm({
            title: t('contractors.archive.title'),
            description: t('contractors.archive.description').replace('{name}', contractor.name),
          });
          if (ok) await onUpdateContractor({ ...contractor, status: 'archived' });
        }
        break;
      default:
        if (actionHandlers[action]) {
          actionHandlers[action]();
        } else {
          toast.info(t('general.toast.info.action_completed').replace('{0}', action));
        }
    }
  };

  return {
    handleQuickAction,
  };
}
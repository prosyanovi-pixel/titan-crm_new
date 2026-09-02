import { ProjectStageItem, StatusItem, PriorityItem } from "@/modules/settings/types";
import { TaxRegimeItem } from "@/context/SettingsContext.types";

export interface ReferenceData {
  projectStatuses: Partial<StatusItem>[];
  projectStages: ProjectStageItem[];
  priorities: Partial<PriorityItem>[];
  managers: { id: string; name: string }[];
  taxRegimes?: TaxRegimeItem[];
}

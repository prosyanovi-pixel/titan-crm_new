import { ProjectStageItem, StatusItem, PriorityItem } from "@/modules/settings/types";

export interface ReferenceData {
  projectStatuses: Partial<StatusItem>[];
  projectStages: ProjectStageItem[];
  priorities: Partial<PriorityItem>[];
  managers: { id: string; name: string }[];
  taxRegimes?: { id: number; name: string; code: string }[];
}

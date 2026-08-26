import {
  StatusItem,
  TagItem,
  PriorityItem,
  QuickAction,
  RelationshipTypeItem,
  UserSettings,
} from "./settings.types";

export interface GetStatusesResponse {
  data: StatusItem[];
}

export interface GetTagsResponse {
  data: TagItem[];
}

export interface GetPrioritiesResponse {
  data: PriorityItem[];
}

export interface GetQuickActionsResponse {
  data: QuickAction[];
}

export interface GetRelationshipTypesResponse {
  data: RelationshipTypeItem[];
}

export interface GetUserSettingsResponse {
  data: UserSettings;
}

export interface UpdateUserSettingsRequest {
  key: string;
  value: unknown;
}

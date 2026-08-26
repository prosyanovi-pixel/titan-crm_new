/**
 * Status System — Система управления статусами, тегами и приоритетами
 * 
 * Все настройки хранятся в базе данных и могут быть изменены через Settings.
 * Изменения применяются немедленно во всём приложении благодаря TanStack Query.
 * 
 * @example
 * ```tsx
 * // Использование компонентов
 * import { StatusBadge, Tag, PriorityBadge } from '@/components/ui/status-system';
 * 
 * <StatusBadge statusId="active" />
 * <Tag tagId="vip" />
 * <PriorityBadge priorityId="high" />
 * 
 * // Использование хуков
 * import { useStatuses, useTags, usePriorities } from '@/components/ui/status-system';
 * 
 * const { statuses, getStatusDisplay } = useStatuses();
 * const { tags, getTagDisplay } = useTags();
 * const { priorities, getPriorityDisplay } = usePriorities();
 * ```
 */

// Types
export type {
  Status,
  Tag as TagData,
  Priority,
  Outcome,
  DisplayConfig,
  StatusId,
  PriorityLevel,
  StatusCreateRequest,
  StatusUpdateRequest,
  TagCreateRequest,
  TagUpdateRequest,
  PriorityCreateRequest,
  PriorityUpdateRequest,
  OutcomeCreateRequest,
  OutcomeUpdateRequest,
  EntitiesResponse,
  UseStatusesResult,
  UseTagsResult,
  UsePrioritiesResult,
} from './types';

// API
export * from './status-system.api';

// Hooks
export {
  useStatuses,
  useCreateStatus,
  useUpdateStatus,
  useDeleteStatus,
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  usePriorities,
  useCreatePriority,
  useUpdatePriority,
  useDeletePriority,
  useOutcomes,
  useCreateOutcome,
  useUpdateOutcome,
  useDeleteOutcome,
} from './status-system.hooks';

// Components (legacy)
export {
  StatusBadge,
  StatusDot,
  StatusSelect,
} from './StatusBadge';

export {
  Tag,
  TagList,
  TagInput,
} from './Tag';

export {
  PriorityBadge,
  PrioritySelect,
  PriorityGroup,
} from './PriorityBadge';

export {
  OutcomeBadge,
  OutcomeDot,
  OutcomeSelect,
} from './OutcomeBadge';

// New unified badge system
export {
  Badge,
  StatusBadge as UniversalStatusBadge,
  PriorityBadge as UniversalPriorityBadge,
  TagBadge as UniversalTagBadge,
  OutcomeBadge as UniversalOutcomeBadge,
  TagList as UniversalTagList,
  type BadgeType,
  type BadgeVariant,
  type BadgeSize,
  type BadgeShape,
  type BadgeProps,
  type TagListProps,
} from './Badge';

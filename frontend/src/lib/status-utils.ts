// Unified status/priority/tag styling utilities
// Ensures consistent rendering across Dashboard, Tables, and Settings

export type StatusVariant = "active" | "pending" | "vip" | "paused" | "finished" | "default";

export interface StatusConfig {
  variant: StatusVariant;
  color?: string;
  name: string;
}

// Map status IDs to standard variants
const statusVariantMap: Record<string, StatusVariant> = {
  // English variants
  'active': 'active',
  'pending': 'pending',
  'paused': 'paused',
  'completed': 'finished',
  'done': 'finished',
  'finished': 'finished',
  'vip': 'vip',
  // Russian variants
  'в работе': 'active',
  'активен': 'active',
  'ожидание': 'pending',
  'завершена': 'finished',
  'завершено': 'finished',
  'пауза': 'paused',
};

// Get normalized status config from a status value
export function getStatusConfig(
  statusValue: string | undefined,
  settingsStatuses: Array<{ id: string; name: string; color?: string }> = []
): StatusConfig {
  if (!statusValue) {
    return { variant: 'default', name: 'Неизвестно' };
  }

  const normalizedValue = statusValue.toString().toLowerCase().trim();
  
  // First check if it's a known ID in settings
  const settingStatus = settingsStatuses.find(s => 
    s.id.toLowerCase() === normalizedValue || 
    s.name.toLowerCase() === normalizedValue
  );
  
  if (settingStatus) {
    const variant = statusVariantMap[settingStatus.id.toLowerCase()] || 
                   statusVariantMap[settingStatus.name.toLowerCase()] || 
                   'default';
    return {
      variant,
      color: settingStatus.color,
      name: settingStatus.name
    };
  }
  
  // Check direct variant mapping
  const variant = statusVariantMap[normalizedValue];
  if (variant) {
    return {
      variant,
      name: capitalizeFirst(statusValue)
    };
  }
  
  // Fallback
  return {
    variant: 'default',
    name: capitalizeFirst(statusValue)
  };
}

// Priority mapping
const priorityVariantMap: Record<string, StatusVariant> = {
  'high': 'paused',    // Red for high priority
  'высокий': 'paused',
  'medium': 'pending', // Yellow for medium
  'средний': 'pending',
  'low': 'default',    // Gray for low
  'низкий': 'default',
};

const priorityNameMap: Record<string, string> = {
  'high': 'Высокий',
  'высокий': 'Высокий',
  'medium': 'Средний',
  'средний': 'Средний',
  'low': 'Низкий',
  'низкий': 'Низкий',
};

export function getPriorityConfig(priorityValue: string | undefined): StatusConfig {
  if (!priorityValue) {
    return { variant: 'default', name: '—' };
  }
  
  const normalized = priorityValue.toString().toLowerCase().trim();
  const variant = priorityVariantMap[normalized] || 'default';
  const name = priorityNameMap[normalized] || capitalizeFirst(priorityValue);
  
  return { variant, name };
}

// Helper to capitalize first letter
function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Legacy compatibility functions
export function formatPriorityDisplay(prio: string | undefined): string {
  return getPriorityConfig(prio).name;
}

export function getPriorityVariant(prio: string | undefined): StatusVariant {
  return getPriorityConfig(prio).variant;
}

// Normalize project status to Russian display name
export function normalizeProjectStatus(status: string | undefined): string {
  const config = getStatusConfig(status);
  return config.name;
}

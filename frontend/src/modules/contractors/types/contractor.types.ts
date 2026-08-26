// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const ContractorStatusEnum = {
  ACTIVE: 'active',
  PENDING: 'pending',
  VIP: 'vip',
  PAUSED: 'paused',
  ARCHIVED: 'archived'
} as const;

export type ContractorStatus = typeof ContractorStatusEnum[keyof typeof ContractorStatusEnum];

export type LegalForm = "ooo" | "pao" | "ao" | "nano" | "zao" | "oao" | "ano" | "np" | "gup" | "mup" | "ip" | "self" | "private" | "foreign";
export type LegalEntityType = "individual" | "legal" | "private" | "foreign";

// ============================================================================
// DOMAIN MODELS
// ============================================================================

export interface BankAccount {
  id: string;
  bankName: string;
  bik: string;
  accountNumber: string;
  correspondentAccount: string;
  currency: string;
  isPrimary: boolean;
  swift?: string;
}

export interface ContactPerson {
  id: string;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
  personId?: number;
}

/**
 * Database representation of Contractor
 * Used for API responses and storage
 */
export interface Contractor {
  id: number;
  name: string;
  fullName?: string;
  created_at?: string;
  tags: string[];
  status: ContractorStatus;
  phone: string;
  manager: string;
  managerAvatar?: string | null;
  type?: string;
  legalForm?: LegalForm;
  legalEntityType?: LegalEntityType;
  currency?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  registrationDate?: string;
  birthDate?: string;
  director?: string;
  directorPosition?: string;
  legalAddress?: string;
  notes?: string;
  bankAccounts?: BankAccount[];
  contacts?: ContactPerson[];
  isEmployee?: boolean;
  email?: string;
  website?: string;
  okved?: string;
  okvedName?: string;
  authorizedCapital?: number | null;
  isActive?: boolean | null;
  orgStatus?: string;
  taxRegimeId?: number | null;
  groupId?: string | null;
  
  gender?: "male" | "female";
  passportSeries?: string;
  passportNumber?: string;
  passportIssuedBy?: string;
  passportIssuedDate?: string;
  passportUnitCode?: string;
  registrationAddress?: string;
  okpo?: string;
  okato?: string;

  // MDM specific fields
  personId?: number;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  snils?: string;
  citizenship?: string;
  documents?: any[];

  // UI/Transient fields (from backend enrichment)
  statusName?: string;
  typeName?: string;
}

/**
 * UI-specific contractor data
 * Extends Contractor with UI-only computed fields
 * Used in components for rendering
 */
export interface ContractorUI extends Contractor {
  statusName: string;
  typeName?: string;
  displayName: string;  // Computed: full name or name
}

/**
 * Reference data for contractors module
 */
export interface ReferenceData {
  projectStatuses: { id: string; name: string }[];
  priorities: { id: string; name: string }[];
  managers: { id: string; name: string }[];
  contractorTypes?: { id: string; name: string }[];
  legalForms?: { id: string; name: string; groupName?: string }[];
  currencies?: { id: string; name: string; symbol?: string }[];
  caseStatuses?: { id: string; name: string }[];
  caseTypes?: { id: string; name: string }[];
  // Справочники, возвращаемые бэкендом
  statuses?: { id: string; name: string; module?: string; color?: string }[];
  tags?: { id: string; name: string; color?: string; displayorder?: number }[];
  relationshipTypes?: { id: string; name: string; module?: string }[];
  taxRegimes?: { id: string | number; name: string }[];
  taskStatuses?: { id: string; name: string }[];
  marketingStatuses?: { id: string; name: string }[];
  marketingTypes?: { id: string; name: string }[];
}

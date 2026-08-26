import {
  Lawyer,
  LegalCase,
  MoneyAmount,
  TimelineEvent,
  CaseDocument,
  CaseNote,
  ThirdParty,
} from "./lawyer.types";

export interface GetLawyersResponse {
  data: Lawyer[];
}

export interface GetLawyerResponse {
  data: Lawyer;
}

export interface GetCasesResponse {
  data: LegalCase[];
}

export interface GetCaseResponse {
  data: LegalCase;
}

export interface CreateLawyerRequest {
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  status?: string;
  specializations?: string[];
  hourlyRate?: number;
  telegramId?: string;
  notes?: string;
}

export interface UpdateLawyerRequest {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
  specializations?: string[];
  hourlyRate?: number;
  telegramId?: string;
  notes?: string;
}

export interface CreateCaseRequest {
  type: "claim" | "court";
  title: string;
  lawyerId: string;
  plaintiff: string;
  defendant: string;
  status?: string;
  caseNumber?: string;
  creationDate?: string;
  deadline?: string;
  courtName?: string;
  courtAddress?: string;
  judge?: string;
  price?: number;
  description?: string;
  claimAmount?: MoneyAmount;
  stateDuty?: number;
  expertiseCost?: number;
  otherClaimCosts?: number;
  recoveredAmount?: MoneyAmount;
  enforcementFee?: number;
  executionCosts?: number;
  transportExpenses?: number;
  translationExpenses?: number;
  otherExpenses?: number;
  events?: TimelineEvent[];
  documents?: CaseDocument[];
  notes?: CaseNote[];
  thirdParties?: ThirdParty[];
}

export interface UpdateCaseRequest {
  id: string;
  type?: "claim" | "court";
  title?: string;
  lawyerId?: string;
  plaintiff?: string;
  defendant?: string;
  status?: string;
  caseNumber?: string;
  creationDate?: string;
  courtName?: string;
  courtAddress?: string;
  judge?: string;
  deadline?: string;
  price?: number;
  description?: string;
  claimAmount?: MoneyAmount;
  stateDuty?: number;
  expertiseCost?: number;
  otherClaimCosts?: number;
  recoveredAmount?: MoneyAmount;
  enforcementFee?: number;
  executionCosts?: number;
  transportExpenses?: number;
  translationExpenses?: number;
  otherExpenses?: number;
  events?: TimelineEvent[];
  documents?: CaseDocument[];
  notes?: CaseNote[];
  thirdParties?: ThirdParty[];
}

export interface DeleteLawyerResponse {
  success: boolean;
}

export interface DeleteCaseResponse {
  success: boolean;
}

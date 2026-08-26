import { api } from "@/lib/api";
import { Lawyer, LegalCase, Court, Judge } from "../types/lawyer.types";
import {
  CreateLawyerRequest,
  UpdateLawyerRequest,
  CreateCaseRequest,
  UpdateCaseRequest,
} from "../types/api.types";
import { ENDPOINTS } from "./endpoints";

// Helper function to normalize lawyer data from API
function normalizeLawyer(data: Record<string, unknown>): Lawyer {
  return {
    ...data,
    // Ensure specializations is always an array
    specializations: Array.isArray(data.specializations)
      ? data.specializations
      : data.specializations
      ? String(data.specializations).split(',').map((s: string) => s.trim()).filter(Boolean)
      : [],
  } as Lawyer;
}

// Helper function to normalize case data from API
function normalizeCase(data: Record<string, unknown>): LegalCase {
  const caseData = data as unknown as LegalCase;
  
  // Ensure arrays are always arrays
  const normalized = {
    ...caseData,
    events: Array.isArray(caseData.events) ? caseData.events : [],
    documents: Array.isArray(caseData.documents) ? caseData.documents : [],
    notes: Array.isArray(caseData.notes) ? caseData.notes : [],
    thirdParties: Array.isArray(caseData.thirdParties) ? caseData.thirdParties : [],
    recoveredItems: Array.isArray(caseData.recoveredItems) ? caseData.recoveredItems : [],
    expenses: Array.isArray(caseData.expenses) ? caseData.expenses : [],
  };
  
  // Ensure money amounts have proper structure
  if (normalized.claimAmount && typeof normalized.claimAmount === 'object') {
    normalized.claimAmount = {
      amount: Number(normalized.claimAmount.amount) || 0,
      currency: normalized.claimAmount.currency || 'RUB',
    };
  }
  
  if (normalized.recoveredAmount && typeof normalized.recoveredAmount === 'object') {
    normalized.recoveredAmount = {
      amount: Number(normalized.recoveredAmount.amount) || 0,
      currency: normalized.recoveredAmount.currency || 'RUB',
    };
  }
  
  // Normalize numeric fields
  normalized.price = Number(normalized.price) || 0;
  normalized.stateDuty = Number(normalized.stateDuty) || 0;
  normalized.expertiseCost = Number(normalized.expertiseCost) || 0;
  normalized.otherClaimCosts = Number(normalized.otherClaimCosts) || 0;
  normalized.enforcementFee = Number(normalized.enforcementFee) || 0;
  normalized.executionCosts = Number(normalized.executionCosts) || 0;
  normalized.transportExpenses = Number(normalized.transportExpenses) || 0;
  normalized.translationExpenses = Number(normalized.translationExpenses) || 0;
  normalized.otherExpenses = Number(normalized.otherExpenses) || 0;
  
  return normalized;
}

export class LawyerService {
  // Lawyers
  async getAllLawyers(): Promise<Lawyer[]> {
    const response = await api.get(ENDPOINTS.LAWYERS);
    return (response || []).map(normalizeLawyer);
  }

  async getLawyerById(id: string): Promise<Lawyer | null> {
    const response = await api.get(ENDPOINTS.LAWYER_BY_ID(id));
    return response ? normalizeLawyer(response) : null;
  }

  async createLawyer(data: CreateLawyerRequest): Promise<Lawyer> {
    const response = await api.post(ENDPOINTS.LAWYERS, data);
    return normalizeLawyer(response);
  }

  async updateLawyer(id: string, data: UpdateLawyerRequest): Promise<Lawyer> {
    const response = await api.put(ENDPOINTS.LAWYER_BY_ID(id), data);
    return normalizeLawyer(response);
  }

  async deleteLawyer(id: string): Promise<void> {
    await api.delete(ENDPOINTS.LAWYER_BY_ID(id));
  }

  // Cases
  async getAllCases(): Promise<LegalCase[]> {
    const response = await api.get(ENDPOINTS.CASES);
    return (response || []).map(normalizeCase);
  }

  async getCaseById(id: string): Promise<LegalCase | null> {
    try {
      const response = await api.get(ENDPOINTS.CASE_BY_ID(id));
      return response ? normalizeCase(response) : null;
    } catch (err) {
      console.error(`[LAWYER_SERVICE] Failed to get case by ID ${id}:`, err);
      return null;
    }
  }

  async createCase(data: CreateCaseRequest): Promise<LegalCase> {
    const response = await api.post(ENDPOINTS.CASES, data);
    return response;
  }

  async updateCase(id: string, data: UpdateCaseRequest): Promise<LegalCase> {
    const response = await api.put(ENDPOINTS.CASE_BY_ID(id), data);
    return response;
  }

  async deleteCase(id: string): Promise<void> {
    await api.delete(ENDPOINTS.CASE_BY_ID(id));
  }

  // References
  async getCourts(): Promise<Court[]> {
    try {
      const response = await api.get(ENDPOINTS.COURTS);
      return response || [];
    } catch (err) {
      console.error('[LAWYER_SERVICE] Failed to fetch courts:', err);
      return [];
    }
  }

  async getJudges(): Promise<Judge[]> {
    try {
      const response = await api.get(ENDPOINTS.JUDGES);
      return response || [];
    } catch (err) {
      console.error('[LAWYER_SERVICE] Failed to fetch judges:', err);
      return [];
    }
  }
}

export const lawyerService = new LawyerService();

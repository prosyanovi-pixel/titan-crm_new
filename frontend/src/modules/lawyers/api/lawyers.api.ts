import { api } from "@/lib/api";
import { ENDPOINTS } from "./endpoints";
import {
  CreateLawyerRequest,
  UpdateLawyerRequest,
  CreateCaseRequest,
  UpdateCaseRequest,
} from "../types/api.types";

export const lawyersApi = {
  // Lawyers
  getAllLawyers: () => api.get(ENDPOINTS.LAWYERS),
  getLawyerById: (id: string) => api.get(ENDPOINTS.LAWYER_BY_ID(id)),
  createLawyer: (data: CreateLawyerRequest) => api.post(ENDPOINTS.LAWYERS, data),
  updateLawyer: (id: string, data: UpdateLawyerRequest) => api.put(ENDPOINTS.LAWYER_BY_ID(id), data),
  deleteLawyer: (id: string) => api.delete(ENDPOINTS.LAWYER_BY_ID(id)),

  // Cases
  getAllCases: () => api.get(ENDPOINTS.CASES),
  getCaseById: (id: string) => api.get(ENDPOINTS.CASE_BY_ID(id)),
  createCase: (data: CreateCaseRequest) => api.post(ENDPOINTS.CASES, data),
  updateCase: (id: string, data: UpdateCaseRequest) => api.put(ENDPOINTS.CASE_BY_ID(id), data),
  deleteCase: (id: string) => api.delete(ENDPOINTS.CASE_BY_ID(id)),

  // References
  getCourts: () => api.get(ENDPOINTS.COURTS),
  getJudges: () => api.get(ENDPOINTS.JUDGES),
};

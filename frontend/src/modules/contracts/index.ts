/**
 * Contracts Module Barrel Exports
 * Public API for the contracts module
 */

// Types
export type {
  Contract,
  ContractTemplate,
  ContractVersion,
  ContractApproval,
  ContractFile,
  ContractCase,
  CreateContractRequest,
  UpdateContractRequest,
  GetContractsResponse,
  GetContractResponse,
  ContractStatus,
  ApprovalStatus,
} from './types/contract.types';

// API
export { contractService } from './api';

// Hooks
export {
  useContracts,
  useContract,
  useCreateContract,
  useUpdateContract,
  useDeleteContract,
  useContractTemplates,
  useCreateContractTemplate,
  useContractApprovals,
  useContractVersions,
  useRevertVersion,
  useContractFiles,
  useUploadContractFiles,
  useDeleteContractFile,
} from './hooks';

// Components
export {
  ContractSheet
} from './components/ContractSheet';

// Constants
export {
  CONTRACT_STATUS,
  APPROVAL_STATUS,
} from './types/contract.types';

// i18n
export { ru as contractsI18nRu } from './i18n/ru';

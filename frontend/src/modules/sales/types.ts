import { Project } from '../projects/types';

export interface SalesDeal extends Project {
  quotesCount: number;
  quotesSum: number;
  contractsCount: number;
  activeClaimsCount: number;
  margin?: number;
}

export type SalesStage = 'lead' | 'negotiation' | 'quote' | 'contract' | 'won' | 'lost';

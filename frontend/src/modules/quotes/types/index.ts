export interface QuoteItem {
  id?: number;
  quoteId?: number;
  itemType: 'product' | 'service' | 'custom';
  itemId?: number | null;
  name: string;
  quantity: number;
  price: number;
  discountPercent: number;
  total: number;
}

export interface Quote {
  id: number;
  number: string;
  date: string;
  validUntil?: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  contractorId?: number | null;
  contractorName?: string;
  projectId?: number | null;
  projectName?: string;
  addressedTo?: string | null;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  notes?: string | null;
  items?: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  parent_id: number | null;
  description: string;
  images: string[] | null;
  translations: Record<string, { name?: string; description?: string }> | null;
  children: ServiceCategory[];
}

export interface Service {
  id: number;
  name: string;
  description: string;
  images: string[] | null;
  translations: Record<string, {name?: string, description?: string}> | null;
  categoryId: number | null;
  type: string;
  baseCost: number;
  costType: string;
  taxContributionsRate: number;
  vatRate: number;
  isActive: boolean;
  status?: string;
  tags?: string[];
  categoryName?: string;
}

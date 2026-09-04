export interface ProductCategory {
  id: number;
  name: string;
  parent_id: number | null;
  description: string | null;
  children?: ProductCategory[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  skuInternal: string | null;
  skuExternal: string | null;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName?: string; // from join
  type?: string;
  unit: string;
  purchasePrice: number;
  currency: string;
  vatRate: number;
  dimensions: Record<string, number> | null;
  characteristics: { name: string; value: string; unit: string; section?: string }[] | null;
  images: string[] | null;
  translations: Record<string, {name?: string, description?: string}> | null;
  isActive: boolean;
  isComposite?: boolean;
  components?: { id?: number; componentId: number; quantity: number; writeOffFromWarehouse: boolean; isIncludedInPrice: boolean }[];
  status?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  skuInternal?: string;
  skuExternal?: string;
  name: string;
  description?: string;
  categoryId?: number;
  unit?: string;
  purchasePrice?: number;
  currency?: string;
  vatRate?: number;
  dimensions?: Record<string, number>;
  characteristics?: { name: string; value: string; unit: string; section?: string }[];
  images?: string[];
  translations?: Record<string, { name?: string; description?: string }>;
  isActive?: boolean;
  isComposite?: boolean;
  components?: { componentId: number; quantity: number; writeOffFromWarehouse: boolean; isIncludedInPrice: boolean }[];
  status?: string;
  type?: string;
  tags?: string[];
}

export interface CreateCategoryDto {
  name: string;
  parentId?: number;
  description?: string;
}

export interface CharacteristicTemplate {
  id: string;
  name: string;
  characteristics: {
    section?: string;
    name: string;
    value: string;
    unit: string;
  }[];
}

export interface PriceList {
  id: number;
  name: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceListItem {
  id: number;
  priceListId: number;
  itemType: 'product' | 'service';
  itemId: number;
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

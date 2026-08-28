import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { useProducts } from '../hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '@/modules/warehouse/api/warehouseApi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function ComponentBalanceIndicator({ componentId, requiredQuantity }: { componentId: number; requiredQuantity: number }) {
  const { data: balances, isLoading } = useQuery({
    queryKey: ['product_balances', componentId],
    queryFn: () => warehouseApi.getProductBalance(componentId),
    enabled: !!componentId && componentId > 0,
  });

  if (isLoading || !componentId) return <span className="text-muted-foreground text-xs">...</span>;

  const totalAvailable = (balances || []).reduce((acc: number, b: any) => {
    return acc + (Number(b.quantity) - Number(b.reservedQuantity));
  }, 0);

  const isShortage = totalAvailable < requiredQuantity;

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className={`text-xs ${isShortage ? 'text-destructive font-medium' : 'text-green-600'}`}>
        На складе: {totalAvailable}
      </span>
      {isShortage && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertCircle className="w-3 h-3 text-destructive" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Недостаточно товара на складе для сборки 1 комплекта.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

interface ProductBundlesTabProps {
  isComposite: boolean;
  setIsComposite: (val: boolean) => void;
  components: Array<{ componentId: number; quantity: number; writeOffFromWarehouse: boolean; isIncludedInPrice: boolean }>;
  setComponents: React.Dispatch<React.SetStateAction<Array<{ componentId: number; quantity: number; writeOffFromWarehouse: boolean; isIncludedInPrice: boolean }>>>;
  currentProductId?: number;
}

export function ProductBundlesTab({ isComposite, setIsComposite, components, setComponents, currentProductId }: ProductBundlesTabProps) {
  const { t } = useTranslation();
  const { data: allProducts } = useProducts();
  
  // Filter out the current product from available options to prevent self-reference
  const allProductsArray = Array.isArray(allProducts) ? allProducts : (allProducts?.data || []);
  const availableProducts = allProductsArray.filter((p: Product) => p.id !== currentProductId);

  const addComponent = () => {
    setComponents(prev => [
      ...prev,
      { componentId: 0, quantity: 1, writeOffFromWarehouse: true, isIncludedInPrice: true }
    ]);
  };

  const removeComponent = (index: number) => {
    setComponents(prev => prev.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: string, value: any) => {
    setComponents(prev => {
      const newComps = [...prev];
      newComps[index] = { ...newComps[index], [field]: value };
      return newComps;
    });
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="is-composite" 
          checked={isComposite} 
          onCheckedChange={(c) => setIsComposite(c === true)} 
        />
        <Label htmlFor="is-composite" className="text-base">
          {t('products.bundles.is_composite')} {/* Это составной товар (комплектация) */}
        </Label>
      </div>

      {isComposite && (
        <div className="space-y-4 animate-in fade-in-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">{t('products.bundles.components_title')} {/* Состав комплектации */}</h3>
              <p className="text-sm text-muted-foreground">
                {t('products.bundles.components_desc')} {/* Добавьте товары, которые входят в эту комплектацию. */}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addComponent}>
              <Plus className="w-4 h-4 mr-2" />
              {t('products.bundles.add_component')} {/* Добавить компонент */}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('products.bundles.component')} {/* Компонент */}</TableHead>
                  <TableHead className="w-[120px]">{t('products.bundles.quantity')} {/* Количество */}</TableHead>
                  <TableHead className="w-[150px] text-center">{t('products.bundles.write_off')} {/* Списывать со склада */}</TableHead>
                  <TableHead className="w-[150px] text-center">{t('products.bundles.in_price')} {/* Включено в цену */}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('products.bundles.no_components')} {/* В комплектации пока нет товаров. */}
                    </TableCell>
                  </TableRow>
                ) : (
                  components.map((comp, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select 
                          value={comp.componentId ? comp.componentId.toString() : undefined} 
                          onValueChange={v => updateComponent(index, 'componentId', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('products.bundles.select_product')} /* Выберите товар... */ />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProducts.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {comp.componentId > 0 && comp.writeOffFromWarehouse && (
                          <ComponentBalanceIndicator componentId={comp.componentId} requiredQuantity={comp.quantity} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1" 
                          value={comp.quantity} 
                          onChange={e => updateComponent(index, 'quantity', parseInt(e.target.value) || 1)} 
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={comp.writeOffFromWarehouse} 
                          onCheckedChange={c => updateComponent(index, 'writeOffFromWarehouse', c === true)} 
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={comp.isIncludedInPrice} 
                          onCheckedChange={c => updateComponent(index, 'isIncludedInPrice', c === true)} 
                        />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeComponent(index)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

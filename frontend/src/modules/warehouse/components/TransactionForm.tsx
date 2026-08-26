import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { warehouseApi } from '../api/warehouseApi';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

const transactionSchema = z.object({
  type: z.enum(['receipt', 'expense', 'reserve', 'unreserve', 'transfer', 'adjustment', 'write_off', 'return']),
  warehouseId: z.coerce.number().min(1, 'Required field'),
  productId: z.coerce.number().min(1, 'Required field'),
  quantity: z.coerce.number().min(0.001, 'Quantity must be greater than 0'),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TransactionForm = ({ onSuccess, onCancel }: TransactionFormProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: warehouses, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseApi.getWarehouses(),
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products'),
  });

  const productsList = Array.isArray(products) ? products : products?.data || [];

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'receipt',
      quantity: 1,
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: TransactionFormValues) => warehouseApi.createTransaction(data),
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('warehouse.form.errors.transaction_created'),
      });
      queryClient.invalidateQueries({ queryKey: ['warehouse_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse_balances'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error?.response?.data?.message || error.message || t('warehouse.form.errors.transaction_created_error'),
      });
    }
  });

  const onSubmit = (data: TransactionFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('warehouse.columns.transactions.type')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('warehouse.columns.transactions.type')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="receipt">{t('warehouse.transaction.receipt')}</SelectItem>
                  <SelectItem value="expense">{t('warehouse.transaction.shipment')}</SelectItem>
                  <SelectItem value="transfer">{t('warehouse.transaction.transfer')}</SelectItem>
                  <SelectItem value="adjustment">{t('warehouse.transaction.adjustment')}</SelectItem>
                  <SelectItem value="reserve">{t('warehouse.transaction.reserve')}</SelectItem>
                  <SelectItem value="unreserve">{t('warehouse.transaction.unreserve')}</SelectItem>
                  <SelectItem value="write_off">{t('common.write_off')}</SelectItem>
                  <SelectItem value="return">{t('common.return')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="warehouseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('warehouse.columns.warehouses.warehouse')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger disabled={isLoadingWarehouses}>
                    <SelectValue placeholder={t('warehouse.columns.warehouses.warehouse')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouses?.map(w => (
                    <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('warehouse.columns.transactions.productName')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger disabled={isLoadingProducts}>
                    <SelectValue placeholder={t('warehouse.columns.transactions.productName')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {productsList.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('warehouse.columns.transactions.quantity')}</FormLabel>
              <FormControl>
                <Input type="number" step="0.001" min="0.001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.description')}</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </div>

      </form>
    </Form>
  );
};

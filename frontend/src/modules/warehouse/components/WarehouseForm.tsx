import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from '@/lib/i18n';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Warehouse } from '../api/warehouseApi';
import { useCreateWarehouse, useUpdateWarehouse } from '../hooks';
import { Switch } from '@/components/ui/switch';
import { useModuleSettings } from '@/modules/settings/hooks/useModuleSettings';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  address: z.string().optional().nullable(),
  status: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

interface WarehouseFormProps {
  warehouse?: Warehouse | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  statuses?: Array<{id: string, name: string}>;
}

export const WarehouseForm = ({ warehouse, onSuccess, onCancel, statuses = [] }: WarehouseFormProps) => {
  const { t } = useTranslation();
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  
  const { settings } = useModuleSettings('warehouse');
  const types = (settings?.types || []) as {id: string, name: string}[];

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: warehouse?.name || '',
      type: warehouse?.type || 'main',
      address: warehouse?.address || '',
      status: warehouse?.status || (statuses.length > 0 ? statuses[0].id : 'active'),
      isActive: warehouse?.isActive ?? true,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (warehouse) {
        await updateMutation.mutateAsync({ id: warehouse.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('common.name')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('warehouse.columns.warehouses.type')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                    {types.length === 0 && (
                      <SelectItem value="main">{t('warehouse.types.main')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('warehouse.columns.warehouses.address')}</FormLabel>
              <FormControl>
                <Input placeholder={t('warehouse.columns.warehouses.address')} {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {statuses && statuses.length > 0 && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.status')}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t('common.active')}</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

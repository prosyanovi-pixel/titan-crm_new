import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from '@/lib/i18n';
import { useUpdatePriceList } from '../hooks';
import { PriceList } from '../types';
import { useCurrencies } from '@/hooks/useCurrencies';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Обязательное поле' }),
  currency: z.string().min(1, { message: 'Обязательное поле' }),
  isActive: z.boolean(),
  isDefault: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface PriceListEditDialogProps {
  priceList: PriceList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriceListEditDialog({ priceList, open, onOpenChange }: PriceListEditDialogProps) {
  const { t } = useTranslation();
  const updatePriceList = useUpdatePriceList();
  const { data: currencies = [] } = useCurrencies();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: priceList.name,
      currency: priceList.currency,
      isActive: priceList.isActive,
      isDefault: priceList.isDefault,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: priceList.name,
        currency: priceList.currency,
        isActive: priceList.isActive,
        isDefault: priceList.isDefault,
      });
    }
  }, [priceList, form, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      await updatePriceList.mutateAsync({
        id: priceList.id,
        data: values,
      });
      onOpenChange(false);
    } catch {
      // Error is handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('common.edit')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4 px-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('price_lists.name_placeholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.currency')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('price_lists.currency_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.id} ({c.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t('common.status')}</FormLabel>
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

                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t('price_lists.is_default')}</FormLabel>
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
              </div>

              <div className="flex justify-end pt-4 gap-2">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={!form.formState.isDirty || updatePriceList.isPending}
                >
                  {updatePriceList.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

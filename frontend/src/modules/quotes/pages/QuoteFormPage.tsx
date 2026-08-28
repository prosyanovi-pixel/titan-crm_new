import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { usePageSettings } from '@/context/LayoutContext';
import { useQuote, useCreateQuote, useUpdateQuote } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Trash2, Plus, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Since some standard imports might differ, I will use standard html inputs where complex custom selects aren't trivial without specific context

export function QuoteFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const quoteId = isNew ? null : Number(id);
  
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { data: quote, isLoading } = useQuote(quoteId);
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();

  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      number: `КП-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString().split('T')[0],
      validUntil: '',
      status: 'draft',
      contractorId: '',
      addressedTo: '',
      notes: '',
      items: [
        { itemType: 'custom', name: '', quantity: 1, price: 0, discountPercent: 0, total: 0 }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  useEffect(() => {
    if (quote && !isNew) {
      reset({
        ...quote,
        date: quote.date ? new Date(quote.date).toISOString().split('T')[0] : '',
        validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : '',
        contractorId: quote.contractorId?.toString() || '',
        items: quote.items?.length ? quote.items : []
      });
    }
  }, [quote, isNew, reset]);

  const watchItems = watch('items');
  const calculateTotal = () => {
    return watchItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  };

  const onSubmit = async (data: any) => {
    // Process data to match API expectations
    const payload = {
      ...data,
      totalAmount: calculateTotal(),
      contractorId: data.contractorId ? Number(data.contractorId) : null,
      items: data.items.map((i: any) => ({
        ...i,
        quantity: Number(i.quantity),
        price: Number(i.price),
        discountPercent: Number(i.discountPercent),
        total: Number(i.quantity) * Number(i.price) * (1 - Number(i.discountPercent) / 100)
      }))
    };

    if (isNew) {
      const res = await createQuote.mutateAsync(payload);
      navigate(`/quotes/${res.id}`);
    } else {
      await updateQuote.mutateAsync({ id: quoteId!, data: payload });
    }
  };

  usePageSettings({
    title: isNew ? t('quotes.create') : t('quotes.edit'),
    actions: (
      <div className="flex gap-2">
        {!isNew && (
          <Button variant="outline" className="gap-2" onClick={() => window.open(`/api/quotes/${quoteId}/pdf`, '_blank')}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('quotes.download_pdf')}</span>
          </Button>
        )}
        <Button onClick={handleSubmit(onSubmit)}>{t('common.save')}</Button>
      </div>
    )
  });

  if (isLoading && !isNew) return <div>{t('common.loading')}</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Общая информация</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>{t('quotes.number')}</Label>
            <Input {...register('number')} />
          </div>
          <div className="space-y-2">
            <Label>{t('quotes.date')}</Label>
            <Input type="date" {...register('date')} />
          </div>
          <div className="space-y-2">
            <Label>{t('quotes.valid_until')}</Label>
            <Input type="date" {...register('validUntil')} />
          </div>
          <div className="space-y-2">
            <Label>{t('quotes.status')}</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('quotes.statuses.draft')}</SelectItem>
                    <SelectItem value="sent">{t('quotes.statuses.sent')}</SelectItem>
                    <SelectItem value="accepted">{t('quotes.statuses.accepted')}</SelectItem>
                    <SelectItem value="rejected">{t('quotes.statuses.rejected')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('quotes.addressed_to')}</Label>
            <Input {...register('addressedTo')} />
          </div>
          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label>{t('quotes.notes')}</Label>
            <Textarea {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('quotes.items')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип</TableHead>
                  <TableHead>Наименование</TableHead>
                  <TableHead className="w-[120px]">Кол-во</TableHead>
                  <TableHead className="w-[150px]">Цена</TableHead>
                  <TableHead className="w-[120px]">Скидка %</TableHead>
                  <TableHead className="w-[150px]">Сумма</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const qty = watch(`items.${index}.quantity`) || 0;
                  const price = watch(`items.${index}.price`) || 0;
                  const discount = watch(`items.${index}.discountPercent`) || 0;
                  const total = (qty * price * (1 - discount / 100)).toFixed(2);
                  
                  // Update total in form state if we wanted to, but we calculate on submit
                  
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          control={control}
                          name={`items.${index}.itemType`}
                          render={({ field: selectField }) => (
                            <Select value={selectField.value} onValueChange={selectField.onChange}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">{t('quotes.types.custom')}</SelectItem>
                                <SelectItem value="product">{t('quotes.types.product')}</SelectItem>
                                <SelectItem value="service">{t('quotes.types.service')}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Input {...register(`items.${index}.name`)} placeholder="Название..." />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="1" step="0.01" {...register(`items.${index}.quantity`)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" {...register(`items.${index}.price`)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" max="100" step="1" {...register(`items.${index}.discountPercent`)} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium px-2 py-2">{total} ₽</div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" className="gap-2" onClick={() => append({ itemType: 'custom', name: '', quantity: 1, price: 0, discountPercent: 0, total: 0 })}>
              <Plus className="w-4 h-4" />
              {t('quotes.add_item')}
            </Button>
            <div className="text-xl font-bold">
              Итого: {calculateTotal().toLocaleString()} ₽
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

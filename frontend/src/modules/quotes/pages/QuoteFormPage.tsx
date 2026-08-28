import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { usePageSettings } from '@/context/LayoutContext';
import { useQuote, useCreateQuote, useUpdateQuote } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Trash2, Plus, Download, Calculator, TrendingUp, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';

export function QuoteFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const quoteId = isNew ? null : Number(id);
  
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = usePermission();
  const canSeeFinance = isAdmin || hasPermission(PERMISSIONS.finance.read);
  
  const { data: quote, isLoading } = useQuote(quoteId);
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();

  const handleConvertToContract = () => {
    if (!quote) return;
    navigate('/contracts/new', { state: { quote } });
  };

  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors-all'],
    queryFn: async () => {
      const res = await api.get("/contractors?all=true");
      return res as any[];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-all'],
    queryFn: async () => {
      const res = await api.get("/users");
      return res as any[];
    },
  });

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
        { 
          itemType: 'custom', 
          name: '', 
          quantity: 1, 
          price: 0, 
          discountPercent: 0, 
          total: 0,
          executorType: 'none',
          executorId: '',
          unitCost: 0
        }
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
        items: quote.items?.length ? quote.items.map((i: any) => ({
          ...i,
          executorType: i.executorType || 'none',
          executorId: i.executorId ? String(i.executorId) : '',
          unitCost: i.unitCost || 0
        })) : []
      });
    }
  }, [quote, isNew, reset]);

  const watchItems = watch('items');
  
  const calculateMetrics = () => {
    let totalRevenue = 0;
    let totalCost = 0;

    watchItems.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const discount = Number(item.discountPercent) || 0;
      const unitCost = Number(item.unitCost) || 0;
      
      const itemRevenue = (qty * price) * (1 - discount / 100);
      const itemCost = qty * unitCost;

      totalRevenue += itemRevenue;
      totalCost += itemCost;
    });

    const totalMargin = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, totalMargin, marginPercent };
  };

  const metrics = calculateMetrics();

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
      totalAmount: metrics.totalRevenue,
      totalCost: metrics.totalCost,
      totalMargin: metrics.totalMargin,
      contractorId: data.contractorId ? Number(data.contractorId) : null,
      items: data.items.map((i: any) => {
        const qty = Number(i.quantity);
        const price = Number(i.price);
        const discount = Number(i.discountPercent);
        const unitCost = Number(i.unitCost);
        return {
          ...i,
          quantity: qty,
          price: price,
          discountPercent: discount,
          unitCost: unitCost,
          executorId: i.executorId && i.executorType !== 'none' ? Number(i.executorId) : null,
          total: qty * price * (1 - discount / 100),
          totalCost: qty * unitCost,
          totalMargin: (qty * price * (1 - discount / 100)) - (qty * unitCost)
        };
      })
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
          <>
            <Button variant="secondary" className="gap-2" onClick={handleConvertToContract}>
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t('quotes.convert_to_contract')} {/* Создать договор */}</span>
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => window.open(`/api/quotes/${quoteId}/pdf`, '_blank')}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('quotes.download_pdf')}</span>
            </Button>
          </>
        )}
        <Button onClick={handleSubmit(onSubmit)}>{t('common.save')}</Button>
      </div>
    )
  });

  if (isLoading && !isNew) return <div>{t('common.loading')}</div>;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <Card>
        <CardHeader>
          <CardTitle>{t('quotes.general_info')} {/* Общая информация */}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Label>{t('quotes.client')} {/* Клиент */}</Label>
            <Controller
              control={control}
              name="contractorId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder={t('quotes.select_client')} /></SelectTrigger>
                  <SelectContent>
                    {contractors.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('quotes.addressed_to')}</Label>
            <Input {...register('addressedTo')} />
          </div>
          <div className="space-y-2 col-span-1 md:col-span-3">
            <Label>{t('quotes.notes')}</Label>
            <Textarea {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('quotes.items')}</CardTitle>
            <CardDescription>{t('quotes.items_description')} {/* Добавьте позиции и укажите исполнителей для расчета себестоимости и маржи. */}</CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">{t('quotes.total_revenue')} {/* Сумма КП */}</div>
              <div className="text-xl font-bold text-primary">{metrics.totalRevenue.toLocaleString()} ₽</div>
            </div>
            {canSeeFinance && (
              <>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{t('quotes.total_cost')} {/* Себестоимость */}</div>
                  <div className="text-xl font-bold text-destructive">{metrics.totalCost.toLocaleString()} ₽</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{t('quotes.total_margin')} {/* Маржинальность */}</div>
                  <div className="text-xl font-bold text-emerald-600 flex items-center gap-1">
                    {metrics.totalMargin.toLocaleString()} ₽
                    <Badge variant={metrics.marginPercent > 30 ? 'default' : metrics.marginPercent > 0 ? 'secondary' : 'destructive'} className="ml-1 text-xs">
                      {metrics.marginPercent.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[150px]">{t('quotes.item_type')}</TableHead>
                  <TableHead className="min-w-[200px]">{t('quotes.item_name')}</TableHead>
                  <TableHead className="w-[100px]">{t('quotes.quantity_short')}</TableHead>
                  <TableHead className="w-[120px]">{t('quotes.price')}</TableHead>
                  <TableHead className="w-[100px]">{t('quotes.discount_short')}</TableHead>
                  <TableHead className="w-[120px] font-semibold text-primary">{t('quotes.total')}</TableHead>
                  <TableHead className="w-[150px] bg-destructive/5">{t('quotes.executor_type')} {/* Исполнитель */}</TableHead>
                  <TableHead className="w-[200px] bg-destructive/5">{t('quotes.executor')} {/* Кто выполняет */}</TableHead>
                  {canSeeFinance && (
                    <>
                      <TableHead className="w-[120px] bg-destructive/5">{t('quotes.unit_cost')} {/* Себест. (ед) */}</TableHead>
                      <TableHead className="w-[120px] font-semibold text-emerald-600">{t('quotes.margin')} {/* Маржа */}</TableHead>
                    </>
                  )}
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const qty = watch(`items.${index}.quantity`) || 0;
                  const price = watch(`items.${index}.price`) || 0;
                  const discount = watch(`items.${index}.discountPercent`) || 0;
                  const unitCost = watch(`items.${index}.unitCost`) || 0;
                  const executorType = watch(`items.${index}.executorType`);
                  
                  const total = (qty * price * (1 - discount / 100));
                  const totalCost = qty * unitCost;
                  const margin = total - totalCost;
                  const marginPct = total > 0 ? (margin / total) * 100 : 0;
                  
                  return (
                    <TableRow key={field.id} className="hover:bg-muted/20">
                      <TableCell className="p-2">
                        <Controller
                          control={control}
                          name={`items.${index}.itemType`}
                          render={({ field: selectField }) => (
                            <Select value={selectField.value} onValueChange={selectField.onChange}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">{t('quotes.types.custom')}</SelectItem>
                                <SelectItem value="product">{t('quotes.types.product')}</SelectItem>
                                <SelectItem value="service">{t('quotes.types.service')}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input className="h-9" {...register(`items.${index}.name`)} placeholder={t('quotes.item_name_placeholder')} />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input className="h-9" type="number" min="1" step="0.01" {...register(`items.${index}.quantity`)} />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input className="h-9" type="number" step="0.01" {...register(`items.${index}.price`)} />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input className="h-9" type="number" min="0" max="100" step="1" {...register(`items.${index}.discountPercent`)} />
                      </TableCell>
                      <TableCell className="p-2 bg-primary/5">
                        <div className="font-semibold">{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </TableCell>
                      
                      {/* Executor & P&L Block */}
                      <TableCell className="p-2 bg-destructive/5 border-l">
                        <Controller
                          control={control}
                          name={`items.${index}.executorType`}
                          render={({ field: selectField }) => (
                            <Select 
                              value={selectField.value} 
                              onValueChange={(val) => {
                                selectField.onChange(val);
                                // Сбрасываем выбранного исполнителя при смене типа
                                setValue(`items.${index}.executorId`, '');
                              }}
                            >
                              <SelectTrigger className="h-9"><SelectValue placeholder={t('common.none')} /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">{t('quotes.executors.none')} {/* Нет */}</SelectItem>
                                <SelectItem value="internal">{t('quotes.executors.internal')} {/* Внутренний */}</SelectItem>
                                <SelectItem value="external">{t('quotes.executors.external')} {/* Внешний (Подрядчик) */}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>
                      <TableCell className="p-2 bg-destructive/5">
                        <Controller
                          control={control}
                          name={`items.${index}.executorId`}
                          render={({ field: selectField }) => (
                            <Select 
                              value={selectField.value} 
                              onValueChange={selectField.onChange}
                              disabled={executorType === 'none'}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder={
                                  executorType === 'none' ? '-' : 
                                  executorType === 'internal' ? t('quotes.select_user') /* Выберите сотрудника */ : 
                                  t('quotes.select_contractor') /* Выберите подрядчика */
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {executorType === 'internal' && users.map(u => (
                                  <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                ))}
                                {executorType === 'external' && contractors.map(c => (
                                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>
                      {canSeeFinance && (
                        <>
                          <TableCell className="p-2 bg-destructive/5">
                            <Input 
                              className="h-9 text-destructive" 
                              type="number" 
                              step="0.01" 
                              disabled={executorType === 'none'}
                              {...register(`items.${index}.unitCost`)} 
                            />
                          </TableCell>
                          <TableCell className="p-2 bg-emerald-50 border-x">
                            <div className="flex flex-col">
                              <span className="font-semibold text-emerald-600">{margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <span className={`text-[10px] ${marginPct < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {marginPct.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                        </>
                      )}
                      <TableCell className="p-2 text-center">
                        <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive h-8 w-8 hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-start items-center mt-4">
            <Button variant="outline" className="gap-2" onClick={() => append({ 
              itemType: 'custom', 
              name: '', 
              quantity: 1, 
              price: 0, 
              discountPercent: 0, 
              total: 0,
              executorType: 'none',
              executorId: '',
              unitCost: 0
            })}>
              <Plus className="w-4 h-4" />
              {t('quotes.add_item')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Contract Form Component
 * Create/Edit form with validation using React Hook Form + Zod.
 * Contractor field uses EntityCombobox with search + inline create via ContractorSheet.
 */

import React, { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '@/lib/i18n';
import { useCreateContract, useUpdateContract, useContractTemplates } from '../hooks';
import { useContractors } from '@/modules/contractors';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import { api } from '@/lib/api';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntityCombobox } from '@/components/shared/EntityCombobox';
import type { ComboboxOption } from '@/components/shared/EntityCombobox';
import { ContractorSheet } from '@/modules/contractors';
import type { Contractor } from '@/modules/contractors';
import { Loader2 } from 'lucide-react';
import type { Contract, CreateContractRequest, UpdateContractRequest, ContractStatus } from '../types/contract.types';
import { useTags, useCreateTag } from '@/components/ui/status-system';
import { TagMultiSelect } from '@/components/shared/TagMultiSelect';
import { useSystemNumbering } from '@/hooks/useSystemNumbering'; // Import the new hook
import { useCurrencies } from '@/hooks/useCurrencies';

// Validation schema
const contractFormSchema = z.object({
  name: z.string().min(1, 'contracts.form.fields.name.required'),
  contractNumber: z.string().optional().default(''),
  description: z.string().optional().default(''),
  assignedTo: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
  contractorId: z.coerce.number().optional().nullable(),
  projectId: z.coerce.number().optional().nullable(), // Added projectId
  type: z.string().optional().default('service'),
  amount: z.string().optional().nullable(),
  currency: z.string().optional().default('RUB'),
  paymentStatus: z.string().optional().default('unpaid'),
  status: z.string().optional().default('draft'),
  tags: z.array(z.string()).optional().default([]),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

interface ContractFormProps {
  contract?: Contract;
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultProjectId?: number;
  defaultContractorId?: number;
}

export function ContractForm({ contract, onSuccess, onCancel, defaultProjectId, defaultContractorId }: ContractFormProps) {
  const { t } = useTranslation();
  const { data: currencies = [] } = useCurrencies();
  const createMutation = useCreateContract();
  const updateMutation = useUpdateContract(contract?.id || '');
  const { data: templatesData } = useContractTemplates({ limit: 100, isActive: true });
  const { data: contractorsData, refetch: fetchContractors } = useContractors();
  const contractors = contractorsData?.data || [];
  const { projects } = useProjects();

  const { tags } = useTags({ module: 'contracts' });
  const createTagMutation = useCreateTag();

  const {
    config: numberingConfig,
    isLoading: numberingIsLoading,
    generateNextNumber,
    incrementNextNumber,
  } = useSystemNumbering('contracts'); // Use the new hook

  const handleCreateTag = async (name: string): Promise<string> => {
    const newTag = await createTagMutation.mutateAsync({
      name,
      module: 'contracts',
      color: '#3b82f6',
    });
    return newTag.id;
  };

  // Contractor sheet state — promise-resolver pattern (same as CaseSheet)
  const contractorResolverRef = useRef<{ resolve: (id: number) => void; reject: () => void } | null>(null);
  const [isContractorSheetOpen, setIsContractorSheetOpen] = useState(false);
  const [pendingContractorName, setPendingContractorName] = useState('');

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      name: contract?.name || '',
      contractNumber: contract?.contractNumber || '',
      description: contract?.description || '',
      assignedTo: contract?.assignedTo || '',
      templateId: contract?.templateId || '',
      contractorId: contract?.contractorId || defaultContractorId || null,
      projectId: contract?.projectId || defaultProjectId || null, // Added projectId
      type: contract?.type || 'service',
      amount: contract?.amount ? String(contract.amount) : '',
      currency: contract?.currency || 'RUB',
      paymentStatus: contract?.paymentStatus || 'unpaid',
      status: contract?.status || 'draft',
      tags: (contract?.tags || []).filter(Boolean),
      startDate: contract?.startDate || null,
      endDate: contract?.endDate || null,
    },
  });

  const isEditing = !!contract;

  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api.get('/users').then(response => {
      const usersData = Array.isArray(response) ? response : (response?.data || []);
      setUsers(usersData);
    }).catch(console.error);
  }, []);

  // Auto-generate contract number for new contracts if empty
  useEffect(() => {
    if (!isEditing && !numberingIsLoading && numberingConfig && !form.getValues('contractNumber')) {
      const generatedNumber = generateNextNumber();
      if (generatedNumber) {
        form.setValue('contractNumber', generatedNumber);
      }
    }
  }, [isEditing, numberingIsLoading, numberingConfig, generateNextNumber, form]);

  const isLoadingForm = createMutation.isPending || updateMutation.isPending || numberingIsLoading; // Combine loading states

  React.useEffect(() => {
    form.reset({
      name: contract?.name || '',
      contractNumber: contract?.contractNumber || '',
      description: contract?.description || '',
      assignedTo: contract?.assignedTo || null,
      templateId: contract?.templateId || null,
      contractorId: contract?.contractorId ?? null,
      type: contract?.type || 'service',
      amount: contract?.amount ? String(contract.amount) : '',
      currency: contract?.currency || 'RUB',
      paymentStatus: contract?.paymentStatus || 'unpaid',
      status: contract?.status || 'draft',
      tags: (contract?.tags || []).filter(Boolean),
      startDate: contract?.startDate || null,
      endDate: contract?.endDate || null,
    });
  }, [contract, form]);

  /** Promise-based inline contractor creation — opens ContractorSheet */
  const handleCreateContractor = (name: string): Promise<number> =>
    new Promise((resolve, reject) => {
      contractorResolverRef.current = { resolve, reject };
      setPendingContractorName(name);
      setIsContractorSheetOpen(true);
    });

  const handleContractorCreated = (newContractor: Contractor) => {
    fetchContractors();
    if (contractorResolverRef.current) {
      contractorResolverRef.current.resolve(newContractor.id);
      contractorResolverRef.current = null;
    }
    setIsContractorSheetOpen(false);
  };

  const onSubmit = async (values: ContractFormValues) => {
    const data: CreateContractRequest = {
      name: values.name,
      contractNumber: values.contractNumber,
      description: values.description,
      assignedTo: values.assignedTo || null,
      templateId: values.templateId || null,
      contractorId: values.contractorId ?? null,
      projectId: values.projectId ?? null,
      type: values.type,
      amount: values.amount ? parseFloat(values.amount) : null,
      currency: values.currency,
      paymentStatus: values.paymentStatus,
      status: values.status as ContractStatus,
      tags: values.tags,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    };

    if (isEditing) {
      updateMutation.mutate(data as UpdateContractRequest, {
        onSuccess: () => onSuccess?.(),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          // If contract number was auto-generated (i.e., it matched the current generated number)
          // then increment the next number in settings.
          if (form.getValues('contractNumber') === generateNextNumber()) { // Check current form value against what would be generated
            incrementNextNumber();
          }
          form.reset();
          onSuccess?.();
        },
      });
    }
  };

  const contractorOptions: ComboboxOption[] = (contractors ?? []).map((c) => ({
    id: c.id,
    label: c.name,
  }));

  const projectOptions: ComboboxOption[] = (projects ?? []).map((p) => ({
    id: p.id,
    label: p.name,
  }));

  const userOptions: ComboboxOption[] = users.map((u) => ({
    id: String(u.id), 
    label: u.name,
  }));

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full relative">
          <div className="space-y-8 pb-10 flex-1">
            {/* Section 1: General Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider border-b pb-2">Общая информация</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.sheet.field.name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('contracts.sheet.placeholder.name')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contract Number */}
                <FormField
                  control={form.control}
                  name="contractNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.form.fields.contract_number') || 'Номер договора'}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('contracts.form.placeholders.contract_number') || 'Автоматически при сохранении'}
                          {...field}
                          disabled={isLoadingForm}
                        />
                      </FormControl>
                      {!isEditing && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t('contracts.form.hints.contract_number') || 'Оставьте пустым для автогенерации по шаблону'}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contractor */}
                <FormField
                  control={form.control}
                  name="contractorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.form.fields.contractor')}</FormLabel>
                      <FormControl>
                        <EntityCombobox
                          value={field.value ?? undefined}
                          onChange={(id) => field.onChange(id ?? null)}
                          options={contractorOptions}
                          placeholder={t('contracts.sheet.placeholder.contractor') || 'Выберите контрагента'}
                          onCreate={async (name) => {
                            const newId = await handleCreateContractor(name);
                            return newId;
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project */}
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.form.fields.project')}</FormLabel>
                      <FormControl>
                        <EntityCombobox
                          value={field.value ?? undefined}
                          onChange={(id) => field.onChange(id ?? null)}
                          options={projectOptions}
                          placeholder={t('contracts.sheet.placeholder.project') || 'Выберите проект'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Template Selection */}
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem className={isEditing ? 'hidden' : ''}>
                      <FormLabel>{t('contracts.form.fields.template') || 'Шаблон договора'}</FormLabel>
                      <Select 
                        value={field.value ?? undefined} 
                        onValueChange={field.onChange}
                        disabled={isEditing && !!contract?.templateId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('contracts.form.placeholders.template') || 'Выберите шаблон'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t('contracts.templates.no_templates')}</SelectItem>
                          {(templatesData?.templates ?? []).map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Assigned To */}
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.sheet.field.assigned_to')}</FormLabel>
                      <FormControl>
                        <EntityCombobox
                          value={field.value ?? undefined}
                          onChange={(val) => field.onChange(val ?? null)}
                          options={userOptions}
                          placeholder={t('contracts.sheet.placeholder.assigned_to') || 'Выберите исполнителя'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contracts.form.fields.tags') || 'Теги'}</FormLabel>
                    <FormControl>
                      <TagMultiSelect
                        value={field.value || []}
                        onChange={field.onChange}
                        options={tags.map(t => ({ id: t.id, name: t.name, color: t.color }))}
                        placeholder={t('contracts.form.placeholders.tags') || 'Выберите или создайте теги'}
                        onCreate={handleCreateTag}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 2: Financials & Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider border-b pb-2">Финансы и Статус</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.form.fields.type')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="service">{t('contracts.types.service')}</SelectItem>
                          <SelectItem value="lease">{t('contracts.types.lease')}</SelectItem>
                          <SelectItem value="sale">{t('contracts.types.sale')}</SelectItem>
                          <SelectItem value="supply">{t('contracts.types.supply')}</SelectItem>
                          <SelectItem value="other">{t('contracts.types.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.form.fields.amount')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t('contracts.form.placeholders.amount')}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Currency */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.form.fields.currency')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.id} ({c.symbol || c.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>{t('contracts.table.status')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">{t('contracts.status.draft')}</SelectItem>
                          <SelectItem value="pending_approval">{t('contracts.status.pending_approval')}</SelectItem>
                          <SelectItem value="approved">{t('contracts.status.approved')}</SelectItem>
                          <SelectItem value="rejected">{t('contracts.status.rejected')}</SelectItem>
                          <SelectItem value="archived">{t('contracts.status.archived')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Payment Status */}
                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>{t('contracts.form.fields.payment_status')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unpaid">{t('contracts.payment.unpaid')}</SelectItem>
                          <SelectItem value="partially_paid">{t('contracts.payment.partially_paid')}</SelectItem>
                          <SelectItem value="paid">{t('contracts.payment.paid')}</SelectItem>
                          <SelectItem value="overdue">{t('contracts.payment.overdue')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>{t('contracts.form.fields.start_date') || 'Дата начала'}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>{t('contracts.form.fields.end_date') || 'Дата окончания'}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 3: Description */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider border-b pb-2">Дополнительно</h3>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contracts.sheet.field.description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('contracts.sheet.placeholder.description')}
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Sticky Glassmorphic Footer */}
          <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex justify-end gap-2 -mx-2 sm:-mx-6 z-20">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('common.cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isLoadingForm}>
              {isLoadingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? t('contracts.sheet.action.save') : t('contracts.actions.create')}
            </Button>
          </div>
        </form>
      </Form>

      {/* Contractor Sheet — stacked on top for inline creation */}
      <ContractorSheet
        contractor={null}
        initialName={pendingContractorName}
        open={isContractorSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            contractorResolverRef.current?.reject();
            contractorResolverRef.current = null;
            setIsContractorSheetOpen(false);
          }
        }}
        onSave={handleContractorCreated}
      />
    </>
  );
}

// frontend/src/modules/finance/components/InvoiceFormContent.tsx
import { UseFormReturn } from "react-hook-form";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { EntityCombobox } from "@/components/shared/EntityCombobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Building2, Info, User, Briefcase } from "lucide-react";
import type { InvoiceFormValues } from "./invoiceFormSchema";
import { useTasks } from "@/modules/tasks";
import { SmartMetadataGrid, MetadataItem } from "@/components/shared";
import { useLawyers } from "@/modules/lawyers";

interface Opt { id: number; name: string; taxRegimeId?: number; legalForm?: string }
interface CurrencyOpt { id: string }
interface StatusOpt { id: string; name: string }

interface InvoiceFormContentProps {
  form: UseFormReturn<InvoiceFormValues>;
  watchedCurrency: string;
  contractors: Opt[];
  projects: Opt[];
  contracts?: Opt[];
  currencies: CurrencyOpt[];
  statuses?: StatusOpt[];
  existingStatus?: string;
  onStatusChange?: (status: string) => void;
  onContractorCreate: (name: string) => Promise<number>;
  vatRateOptions?: number[];
}

export function InvoiceFormContent({
  form,
  watchedCurrency,
  contractors,
  projects,
  contracts = [],
  currencies,
  statuses = [],
  existingStatus,
  onStatusChange,
  onContractorCreate,
  vatRateOptions = [0, 5, 7, 10, 20, 22],
}: InvoiceFormContentProps) {
  const { t } = useTranslation();
  const { lawyers = [] } = useLawyers();
  const { tasks = [] } = useTasks();

  const watchedAmount = form.watch("amount");
  const watchedVatRate = form.watch("vatRate");
  const watchedContractId = form.watch("contractId");
  const watchedLawyerId = form.watch("lawyerId");
  const watchedTaskId = form.watch("taskId");
  const watchedProjectId = form.watch("projectId");
  const watchedIsTaxable = form.watch("isTaxable");
  const watchedContractorId = form.watch("contractorId");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contractorInfo, setContractorInfo] = useState<any>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  // Автоматический расчет суммы НДС
  useEffect(() => {
    if (watchedIsTaxable && watchedAmount && watchedVatRate !== undefined) {
      const amount = Number(watchedAmount);
      const rate = Number(watchedVatRate);
      const vatAmount = (amount * rate) / 100;
      form.setValue("vatAmount", Number(vatAmount.toFixed(2)));
    } else {
      form.setValue("vatAmount", 0);
    }
  }, [watchedAmount, watchedVatRate, watchedIsTaxable, form]);

  // Автоподбор НДС при выборе контрагента
  useEffect(() => {
    const applyContractorTax = async () => {
      if (!watchedContractorId) {
        setContractorInfo(null);
        return;
      }
      
      const contractor = contractors.find(c => c.id === watchedContractorId);
      if (!contractor) return;

      try {
        const taxInfo = await api.get(`/contractors/${watchedContractorId}/taxes`);
        setContractorInfo(taxInfo);
        
        if (form.formState.dirtyFields.vatRate || form.formState.dirtyFields.isTaxable) return;

        if (taxInfo?.taxRegime) {
          const requiresNds = !!taxInfo.taxRegime.requiresNds;
          form.setValue("isTaxable", requiresNds);
          
          const vatTax = taxInfo.activeTaxes?.find((t: Record<string, unknown>) => t.type === 'НДС');
          if (vatTax) {
            form.setValue("vatRate", vatTax.rate);
          } else {
            form.setValue("vatRate", requiresNds ? 20 : 0);
          }
        }
      } catch (e) {
        const isIndividual = contractor.legalForm === 'private' || contractor.legalForm === 'self';
        form.setValue("isTaxable", !isIndividual);
        form.setValue("vatRate", isIndividual ? 0 : 20);
      }
    };

    applyContractorTax();
  }, [watchedContractorId, contractors, form]);

  return (
    <Form {...form}>
      <form id="invoice-form" onSubmit={form.handleSubmit(() => {})} className="space-y-5">

        {/* Identifier */}
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                {t("finance.invoice.field.identifier")} *
                {existingStatus && (
                  <span className="text-xs text-muted-foreground font-normal">
                    (изменение номера не рекомендуется)
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("generated.schet_na_predostavlennye_uslugi")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contractor */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="contractorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("finance.invoice.field.contractor")} *</FormLabel>
                <FormControl>
                  <EntityCombobox
                    value={field.value || undefined}
                    onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                    options={(contractors ?? []).map((c) => ({
                      id: c.id,
                      label: c.name,
                    }))}
                    placeholder={t("finance.invoice.placeholder.select_contractor")}
                    onCreate={onContractorCreate}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {contractorInfo?.taxRegime && (
            <div className="flex flex-wrap gap-2 items-center p-2 rounded-lg bg-muted/30 border border-dashed border-border/60">
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Налоговый режим:</span>
              <Badge variant="secondary" className="text-[10px] h-5 py-0">
                {contractorInfo.taxRegime.name}
              </Badge>
              {contractorInfo.taxRegime.requiresNds && (
                <Badge variant="outline" className="text-[10px] h-5 py-0 border-blue-200 text-blue-700 bg-blue-50">
                  НДС {contractorInfo.taxRegime.defaultVatRate}%
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Sparse Relations via SmartMetadataGrid */}
        <div className="pt-2 pb-2">
          <SmartMetadataGrid items={useMemo(() => [
            {
              id: "projectId",
              value: editingField === "projectId" ? "__editing__" : (watchedProjectId ? projects.find(p => String(p.id) === String(watchedProjectId))?.name : null),
              label: t("finance.invoice.field.project"),
              icon: <Briefcase className="w-4 h-4 text-blue-500" />,
              isCritical: true,
              onClick: () => setEditingField("projectId"),
              onClickPlaceholder: () => setEditingField("projectId"),
              renderCustomBadge: editingField === "projectId" ? () => (
                <div className="min-w-[250px]">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <EntityCombobox
                            value={field.value || undefined}
                            onChange={(v) => { field.onChange(v ? Number(v) : undefined); setEditingField(null); }}
                            options={(projects ?? []).map((p) => ({ id: p.id, label: p.name }))}
                            placeholder={t("finance.invoice.placeholder.select_project")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ) : undefined
            },
            {
              id: "contractId",
              value: editingField === "contractId" ? "__editing__" : (watchedContractId ? contracts.find(c => String(c.id) === String(watchedContractId))?.name : null),
              label: t("finance.invoice.field.contract"),
              icon: <Info className="w-4 h-4 text-purple-500" />,
              isCritical: true,
              onClick: () => setEditingField("contractId"),
              onClickPlaceholder: () => setEditingField("contractId"),
              renderCustomBadge: editingField === "contractId" ? () => (
                <div className="min-w-[250px]">
                  <FormField
                    control={form.control}
                    name="contractId"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <EntityCombobox
                            value={field.value || undefined}
                            onChange={(v) => { field.onChange(v ? Number(v) : undefined); setEditingField(null); }}
                            options={(contracts ?? []).map((c) => ({ id: c.id, label: c.name }))}
                            placeholder={t("finance.invoice.placeholder.select_contract")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ) : undefined
            },
            {
              id: "lawyerId",
              value: editingField === "lawyerId" ? "__editing__" : (watchedLawyerId ? lawyers.find(l => String(l.id) === String(watchedLawyerId))?.name : null),
              label: t("finance.invoice.field.lawyer"),
              icon: <User className="w-4 h-4 text-emerald-500" />,
              isCritical: true,
              onClick: () => setEditingField("lawyerId"),
              onClickPlaceholder: () => setEditingField("lawyerId"),
              renderCustomBadge: editingField === "lawyerId" ? () => (
                <div className="min-w-[250px]">
                  <FormField
                    control={form.control}
                    name="lawyerId"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <EntityCombobox
                            value={field.value || undefined}
                            onChange={(v) => { field.onChange(v ? Number(v) : undefined); setEditingField(null); }}
                            options={(lawyers ?? []).map((l) => ({ id: l.id, label: l.name }))}
                            placeholder={t("finance.invoice.placeholder.select_lawyer")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ) : undefined
            },
            {
              id: "taskId",
              value: editingField === "taskId" ? "__editing__" : (watchedTaskId ? tasks.find(t => String(t.id) === String(watchedTaskId))?.title : null),
              label: t("finance.invoice.field.task"),
              icon: <Info className="w-4 h-4 text-amber-500" />,
              isCritical: true,
              onClick: () => setEditingField("taskId"),
              onClickPlaceholder: () => setEditingField("taskId"),
              renderCustomBadge: editingField === "taskId" ? () => (
                <div className="min-w-[250px]">
                  <FormField
                    control={form.control}
                    name="taskId"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <EntityCombobox
                            value={field.value || undefined}
                            onChange={(v) => { field.onChange(v ? Number(v) : undefined); setEditingField(null); }}
                            options={(tasks ?? []).map((t) => ({ id: t.id, label: t.title }))}
                            placeholder={t("finance.invoice.placeholder.select_task")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ) : undefined
            }
          ], [editingField, watchedProjectId, projects, watchedContractId, contracts, watchedLawyerId, lawyers, watchedTaskId, tasks, form.control, t])} />
        </div>

        {/* Amount + Currency */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("finance.invoice.field.amount")} *</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onValueChange={field.onChange}
                      currency={watchedCurrency}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("finance.invoice.field.currency")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="RUB" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("finance.invoice.field.issue_date")} *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("finance.invoice.field.due_date")} *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("finance.invoice.field.description")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("finance.invoice.field.description")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* VAT Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="isTaxable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("finance.invoice.field.is_taxable")}</FormLabel>
                  <Select value={field.value ? 'yes' : 'no'} onValueChange={(v) => field.onChange(v === 'yes')}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes">{t('common.yes')}</SelectItem>
                      <SelectItem value="no">{t('common.no')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchedIsTaxable && (
              <FormField
                control={form.control}
                name="vatRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("finance.invoice.field.vat_rate")}</FormLabel>
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vatRateOptions.map(rate => (
                          <SelectItem key={rate} value={String(rate)}>{rate === 0 ? 'Без НДС' : `${rate}%`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {watchedIsTaxable && (
             <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 flex justify-between items-center">
                <span className="text-sm font-medium text-primary">{t('finance.invoice.field.vat_amount')}</span>
                <span className="text-lg font-bold text-primary">
                  {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: watchedCurrency }).format(form.watch('vatAmount'))}
                </span>
             </div>
          )}
        </div>

        {/* Status (only for existing invoices) */}
        {existingStatus && statuses.length > 0 && onStatusChange && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("finance.invoice.field.status")}</FormLabel>
                <Select value={field.value || existingStatus} onValueChange={(val) => {
                  field.onChange(val);
                  onStatusChange?.(val);
                }}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("finance.invoice.field.status")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  );
}

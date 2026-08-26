// frontend/src/modules/finance/components/PaymentFormContent.tsx
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { EntityCombobox } from "@/components/shared/EntityCombobox";
import type { ComboboxOption } from "@/components/shared/EntityCombobox";
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
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Link2 } from "lucide-react";
import type { PaymentFormValues } from "./paymentFormSchema";

interface CurrencyOpt { id: string; symbol?: string; name: string }

interface PaymentFormContentProps {
  form: UseFormReturn<PaymentFormValues>;
  currency: string;
  selectedProjectId?: number;
  currencies: CurrencyOpt[];
  contractorOptions: ComboboxOption[];
  projectOptions: ComboboxOption[];
  contractOptions?: ComboboxOption[];
  taskOptions: ComboboxOption[];
  categoryOptions: ComboboxOption[];
  campaignOptions: ComboboxOption[]; // Опции кампаний
  invoiceOptions: ComboboxOption[]; // Опции счетов
  onCreateContractor: (name: string) => Promise<number>;
  onCreateCategory: (name: string) => Promise<string>;
  onSubmit: (values: PaymentFormValues) => void;
  onUnlinkInvoice?: () => void;
  isEditing?: boolean;
}

export function PaymentFormContent({
  form,
  currency,
  selectedProjectId,
  currencies,
  contractorOptions,
  projectOptions,
  contractOptions = [],
  taskOptions,
  categoryOptions,
  campaignOptions,
  invoiceOptions,
  onCreateContractor,
  onCreateCategory,
  onSubmit,
  onUnlinkInvoice,
  isEditing = false,
}: PaymentFormContentProps) {
  const { t } = useTranslation();

  return (
    <Form {...form}>
      <form
        id="payment-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="p-6 space-y-5"
      >
        {/* Date + Currency */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("generated.data")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <FormLabel>{t("generated.valyuta")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.id} — {c.symbol || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("generated.summa")}</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onValueChange={field.onChange}
                  currency={currency}
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
              <FormLabel>{t("generated.proekt")}</FormLabel>
              <FormControl>
                <EntityCombobox
                  value={field.value ?? ""}
                  onChange={(val) => {
                    field.onChange(val);
                    form.setValue("taskId", undefined);
                  }}
                  options={projectOptions}
                  placeholder={t("generated.privyazat_k_proektu")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contract */}
        <FormField
          control={form.control}
          name="contractId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("finance.payment.field.contract")}</FormLabel>
              <FormControl>
                <EntityCombobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={contractOptions}
                  placeholder={t("finance.payment.placeholder.select_contract")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Task */}
        <FormField
          control={form.control}
          name="taskId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("generated.zadacha")}</FormLabel>
              <FormControl>
                <EntityCombobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={taskOptions}
                  placeholder={selectedProjectId ? "Выберите задачу..." : "Все задачи..."}
                />
              </FormControl>
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
              <FormLabel>{t("generated.kontragent")}</FormLabel>
              <FormControl>
                <EntityCombobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={contractorOptions}
                  placeholder={t("generated.vyberite_kontragenta")}
                  onCreate={onCreateContractor}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("finance.dds.category")}</FormLabel>
              <FormControl>
                <EntityCombobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={categoryOptions}
                  placeholder={t("finance.dds.select_category")}
                  onCreate={onCreateCategory}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campaign (Marketing) */}
        <FormField
          control={form.control}
          name="campaignId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("marketing.campaign.label")}</FormLabel>
              <FormControl>
                <EntityCombobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={campaignOptions}
                  placeholder="Привязать к кампании..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Invoice (Счет) */}
        <FormField
          control={form.control}
          name="invoiceId"
          render={({ field }) => {
            const isLinked = !!field.value;
            
            return (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t("finance.invoice.label")}</FormLabel>
                {isEditing && onUnlinkInvoice && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 transition-colors ${
                            isLinked 
                              ? "text-amber-600 hover:text-red-600 hover:bg-red-50" 
                              : "text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onUnlinkInvoice();
                          }}
                          disabled={!isLinked}
                        >
                          <Link2 className={`h-3.5 w-3.5 ${isLinked ? 'fill-current' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isLinked ? (
                          <p className="text-red-600">Нажмите чтобы отвязать платёж от счёта</p>
                        ) : (
                          <p>Платёж не привязан к счёту</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <FormControl>
                <EntityCombobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={invoiceOptions}
                  placeholder="Привязать к счету..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("generated.opisanie")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("generated.neobyazatel_nyy_kommentariy")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

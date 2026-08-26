import { useState, useEffect } from "react";
import { Trash2, Receipt, ArrowUpRight, ArrowDownLeft, FileText, CreditCard } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResizableSheet, SheetTabSettings, DiscardChangesDialog } from "@/components/shared";
import { useSheetTabs } from "@/hooks/useSheetTabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { InvoiceFormContent } from "./InvoiceFormContent";
import { 
  invoiceSchema, 
  defaultFormValues, 
  type InvoiceFormValues 
} from "./invoiceFormSchema";
import { 
  useCreateInvoice, 
  useUpdateInvoice,
  useUnlinkPaymentFromInvoice 
} from "../hooks/useFinance";
import { useContractorsList } from "@/modules/contractors";
import { useProjects } from "@/modules/projects";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useSettings } from "@/hooks/use-settings";
import { Invoice, InvoiceStatusType } from "../types/finance.types";
import { formatMoney, cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface CreateInvoiceSheetProps {
  invoice?: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch?: () => Promise<void>;
}

export function CreateInvoiceSheet({ 
  invoice, 
  open, 
  onOpenChange, 
  onRefetch 
}: CreateInvoiceSheetProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("general");
  
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice(invoice?.id || 0);
  const unlinkPaymentMutation = useUnlinkPaymentFromInvoice();
  
  const { contractors, createContractor } = useContractorsList();
  const { projects } = useProjects();
  const { data: currencies = [] } = useCurrencies();
  const { getStatusesByModule } = useSettings();

  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [pendingUnlinkId, setPendingUnlinkId] = useState<number | null>(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultFormValues((invoice as unknown as Record<string, unknown>) || undefined),
  });

  const watchedCurrency = form.watch("currency");

  useEffect(() => {
    if (open) {
      form.reset(defaultFormValues((invoice as unknown as Record<string, unknown>) || undefined));
      setActiveTab("general");
    }
  }, [open, invoice, form]);

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      if (invoice) {
        await updateInvoiceMutation.mutateAsync({
          ...data,
          status: data.status as InvoiceStatusType,
          title: data.identifier,
          amountTotal: data.amount,
        } as unknown as Parameters<typeof updateInvoiceMutation.mutateAsync>[0]);
        toast.success(t('finance.message.invoice_updated'));
      } else {
        await createInvoiceMutation.mutateAsync({
          ...data,
          status: data.status as InvoiceStatusType,
          title: data.identifier,
          amountTotal: data.amount,
        } as unknown as Parameters<typeof updateInvoiceMutation.mutateAsync>[0]);
        toast.success(t('finance.message.invoice_created'));
      }
      if (onRefetch) await onRefetch();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(t('common.error'), { description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const handleUnlinkPayment = async (paymentId: number) => {
    setUnlinkLoading(true);
    try {
      await unlinkPaymentMutation.mutateAsync(paymentId);
      toast.success(t('finance.message.payment_unlinked'));
      if (onRefetch) await onRefetch();
    } catch (error: unknown) {
      toast.error(t('finance.message.error_unlink'), { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setUnlinkLoading(false);
      setUnlinkConfirmOpen(false);
    }
  };

  const handleContractorCreate = async (name: string) => {
    try {
      const newContractor = await createContractor({ name, status: 'active', type: 'client', tags: [] });
      return newContractor.id;
    } catch (error) {
      toast.error(t('generated.oshibka_pri_sozdanii_kontragenta'));
      throw error;
    }
  };

  const { tabs, toggleTab, moveTab } = useSheetTabs([
    { id: "general", label: "common.basic_info", icon: FileText, visible: true },
    { id: "payments", label: "finance.tabs.payments", icon: CreditCard, visible: true }
  ]);

  return (
    <>
      <ResizableSheet
        open={open}
        onOpenChange={onOpenChange}
        moduleKey="finance_invoices"
        defaultWidth="md"
        title={invoice ? `${t('common.edit')} ${invoice.identifier}` : t('finance.invoice.create')}
        description={
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            {invoice ? t('finance.invoice.edit_description') : t('finance.invoice.create_description')}
          </div>
        }
        onSave={form.handleSubmit(onSubmit)}
        saveDisabled={!form.formState.isValid || createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
        hasUnsavedChanges={form.formState.isDirty}
        onShowDiscardDialog={() => setShowDiscardDialog(true)}
      >
        <form id="invoice-form" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex items-center gap-2 mb-6 flex-nowrap">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {tabs.map(tab => {
                    if (!tab.visible) return null;
                    if (!invoice && tab.id === "payments") return null;
                    const Icon = tab.icon;
                    return (
                        <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs">
                            <Icon className="w-3.5 h-3.5" />
                            {t(tab.label)}
                        </TabsTrigger>
                    );
                })}
              </TabsList>
            </Tabs>

            <SheetTabSettings
                tabs={tabs.filter(t => invoice || t.id !== "payments")}
                onToggle={toggleTab}
                onMove={moveTab}
            />
          </div>
          <div className="mt-6">
            {tabs.find(t => t.id === "general")?.visible && activeTab === "general" && (
              <div className="animate-in fade-in-50">
                <InvoiceFormContent
                  form={form}
                  watchedCurrency={watchedCurrency}
                  contractors={contractors.map(c => ({ id: c.id, name: c.name }))}
                  projects={projects.map(p => ({ id: p.id, name: p.name }))}
                  currencies={currencies}
                  statuses={getStatusesByModule('finance')}
                  existingStatus={invoice?.status}
                  onStatusChange={(s) => form.setValue('status', s)}
                  onContractorCreate={handleContractorCreate}
                />
              </div>
            )}

            {invoice && tabs.find(t => t.id === "payments")?.visible && activeTab === "payments" && (
              <div className="animate-in fade-in-50">
                <div className="space-y-4">
                  {(invoice as unknown as Record<string, unknown>).payments && ((invoice as unknown as Record<string, unknown>).payments as any[]).length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {((invoice as unknown as Record<string, unknown>).payments as any[]).map((payment: any) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl border bg-card/50">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              payment.kind === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                            )}>
                              {payment.kind === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{formatMoney(payment.amount)}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {format(new Date(payment.paymentDate), 'dd MMMM yyyy', { locale: ru })}
                              </p>
                            </div>
                          </div>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-destructive gap-2"
                            onClick={() => {
                              setPendingUnlinkId(payment.id);
                              setUnlinkConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs">{t('finance.invoice.action.unlink')}</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/20 text-muted-foreground">
                      <p className="text-sm">{t('finance.message.no_payments')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>
      </ResizableSheet>

      <ConfirmDialog
        open={unlinkConfirmOpen}
        onOpenChange={setUnlinkConfirmOpen}
        onConfirm={() => pendingUnlinkId && handleUnlinkPayment(pendingUnlinkId)}
        title={t('common.confirm_action')}
        description={t('finance.statement.unlink_invoice_confirm')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="destructive"
        loading={unlinkLoading}
      />

      <DiscardChangesDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        onContinue={() => setShowDiscardDialog(false)}
        onSave={() => setShowDiscardDialog(false)}
        onDiscard={() => {
          setShowDiscardDialog(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}

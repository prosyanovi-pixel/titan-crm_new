import { 
  Banknote, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import { Button } from "@/components/ui/button";
import { ResizableSheet } from "@/components/shared";
import { ContractorSheet } from "@/modules/contractors";
import { useUnlinkPaymentFromInvoice } from "../hooks/useFinance";
import { useCreatePaymentSheet } from "../hooks/useCreatePaymentSheet";
import { PaymentFormContent } from "./PaymentFormContent";
import { Payment } from "../types/finance.types";

interface CreatePaymentSheetProps {
  payment?: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch?: () => Promise<void>;
  prefillKind?: 'income' | 'expense';
  prefillContractorId?: number;
  prefillProjectId?: number;
}

export function CreatePaymentSheet(props: CreatePaymentSheetProps) {
  const { t } = useTranslation();
  
  const {
    form,
    isEditing,
    isIncome,
    isPending,
    currency,
    currencies,
    selectedProjectId,
    contractorOptions,
    projectOptions,
    taskOptions,
    categoryOptions,
    campaignOptions,
    invoiceOptions,
    contractorSheetOpen,
    pendingContractorName,
    handleCreateContractor,
    handleCreateCategory,
    handleContractorSheetClose,
    handleContractorSheetSave,
    onSubmit,
    handleClose,
  } = useCreatePaymentSheet(props);

  // Hook для отвязки платежа от счета
  const paymentId = props.payment?.id;
  const unlinkMutation = useUnlinkPaymentFromInvoice();

  return (
    <>
      <ResizableSheet
        open={props.open}
        onOpenChange={handleClose}
        onSave={() => document.getElementById('payment-form')?.dispatchEvent(new Event('submit', { bubbles: true }))}
        onDelete={undefined}
        title={isEditing ? t('finance.payment.edit') : t('finance.payment.create')}
        description={isIncome
          ? t('finance.payment_types.income')
          : t('finance.payment_types.expense')}
        moduleKey="payment-sheet"
        defaultWidth="md"
        showDeleteButton={false}
        saveButtonLabel={isPending
          ? t('finance.buttons.saving')
          : isEditing
            ? t('finance.buttons.save')
            : t('finance.buttons.create_payment')}
        cancelButtonLabel="generated.otmena"
      >
        <div className="space-y-6">
          {/* Icon & kind toggle */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div
              className={`p-2 rounded-lg ${
                isIncome
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-rose-100 text-rose-600"
              }`}
            >
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {isIncome
                  ? t('finance.payment_types.income')
                  : t('finance.payment_types.expense')}
              </div>
            </div>
          </div>

          {/* Kind toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={isIncome ? "default" : "outline"}
              className={
                isIncome
                  ? "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              }
              onClick={() => {
                form.setValue("kind", "income");
                form.setValue("categoryId", undefined);
              }}
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              {t("generated.dohod")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!isIncome ? "default" : "outline"}
              className={
                !isIncome
                  ? "flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                  : "flex-1 border-rose-200 text-rose-700 hover:bg-rose-50"
              }
              onClick={() => {
                form.setValue("kind", "expense");
                form.setValue("categoryId", undefined);
              }}
            >
              <TrendingDown className="h-3.5 w-3.5 mr-1.5" />
              {t("generated.rashod")}
            </Button>
          </div>

          {/* Form content */}
          <PaymentFormContent
            form={form}
            currency={currency}
            selectedProjectId={selectedProjectId}
            currencies={currencies}
            contractorOptions={contractorOptions}
            projectOptions={projectOptions}
            taskOptions={taskOptions}
            categoryOptions={categoryOptions}
            campaignOptions={campaignOptions}
            invoiceOptions={invoiceOptions}
            onCreateContractor={handleCreateContractor}
            onCreateCategory={handleCreateCategory}
            onSubmit={onSubmit}
            onUnlinkInvoice={() => {
              if (paymentId) unlinkMutation.mutate(paymentId);
            }}
            isEditing={isEditing}
          />
        </div>
      </ResizableSheet>

      <ContractorSheet
        contractor={null}
        initialName={pendingContractorName}
        open={contractorSheetOpen}
        onOpenChange={handleContractorSheetClose}
        onSave={handleContractorSheetSave}
      />
    </>
  );
}

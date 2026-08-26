// frontend/src/modules/finance/hooks/useCreateInvoiceSheet.ts
import { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { useContractorsList } from "@/modules/contractors";
import type { Contractor } from "@/modules/contractors/types/contractor.types";
import { useProjects } from "@/modules/projects";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useCreateInvoice, useUpdateInvoice } from "./useFinance";
import { financeApi } from "../api/finance.api";
import type { InvoiceType } from "../types/finance.types";
import {
  invoiceSchema,
  defaultFormValues,
  type InvoiceFormValues,
} from "../components/invoiceFormSchema";
import { api } from "@/lib/api";

interface UseCreateInvoiceSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  invoice?: Record<string, unknown> | null;
  onSave?: (invoice: Record<string, unknown>) => Promise<void>;
  onDelete?: (id: string | number) => Promise<void>;
  onRefetch?: () => Promise<void>;
  defaultInvoiceType?: InvoiceType;
}

export function useCreateInvoiceSheet({
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
  invoice: existingInvoice,
  onSave,
  onRefetch,
  defaultInvoiceType = "outgoing",
}: UseCreateInvoiceSheetProps) {
  const { t } = useTranslation();
  const { data: currencies = [] } = useCurrencies();
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(
    (existingInvoice?.invoiceType as InvoiceType) ?? defaultInvoiceType,
  );

  // State initialized on open

  // Invoice statuses
  const invoiceStatuses = [
    { id: "draft", name: t("finance.invoice.status.draft") },
    { id: "sent", name: t("finance.invoice.status.sent") },
    { id: "partial_paid", name: t("finance.invoice.status.partial_paid") },
    { id: "paid", name: t("finance.invoice.status.paid") },
    { id: "overdue", name: t("finance.invoice.status.overdue") },
  ];

  // Обновляем статус только через форму - не вызываем API отдельно
  const updateInvoiceStatus = async (id: string | number, status: string) => {
    // Статус будет обновлен при сохранении формы
    console.log('Status will be updated on save:', status);
  };

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen! : internalOpen;
  const setOpen = isControlled ? onControlledOpenChange! : setInternalOpen;

  const { contractors, createContractor } = useContractorsList();
  const { projects } = useProjects();

  const contractorResolverRef = useRef<{
    resolve: (id: number) => void;
    reject: () => void;
  } | null>(null);
  const [contractorSheetOpen, setContractorSheetOpen] = useState(false);
  const [pendingContractorName, setPendingContractorName] = useState("");

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultFormValues(existingInvoice),
  });

  const createInvoiceMutation = useCreateInvoice();
  const watchedCurrency = useWatch({
    control: form.control,
    name: "currency",
    defaultValue: "RUB",
  });

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInvoiceId, setPrevInvoiceId] = useState(existingInvoice?.id);

  // Derived state pattern for invoiceType
  if (open !== prevOpen || existingInvoice?.id !== prevInvoiceId) {
    setPrevOpen(open);
    setPrevInvoiceId(existingInvoice?.id);
    if (open) {
      setInvoiceType((existingInvoice?.invoiceType as InvoiceType) ?? defaultInvoiceType);
    }
  }

  useEffect(() => {
    if (open) {
      form.reset(defaultFormValues(existingInvoice));
    }
  }, [existingInvoice, open, form]);

  const onSubmit = async (data: InvoiceFormValues) => {
    console.log('onSubmit called with data:', data);
    console.log('data.status:', data.status);
    console.log('existingInvoice.status:', existingInvoice?.status);
    try {
      if (onSave && existingInvoice) {
        console.log('Saving with status:', data.status || existingInvoice.status);
        await onSave({
          id: existingInvoice.id,
          identifier: data.identifier.trim(),
          title: data.identifier.trim(),
          contractor_id: data.contractorId,
          project_id: data.projectId || null,
          lawyer_user_id: data.lawyerId || null,
          source_task_id: data.taskId || null,
          amount_total: data.amount,
          amount_paid: (existingInvoice.amountPaid as number) || 0,
          amount_due: data.amount - ((existingInvoice.amountPaid as number) || 0),
          description: data.description || "",
          currency: data.currency,
          issue_date: data.issueDate,
          due_date: data.dueDate,
          invoice_type: invoiceType,
          status: data.status || existingInvoice.status,
          vat_rate: data.vatRate,
          vat_amount: data.vatAmount,
          is_taxable: data.isTaxable,
        });
        if (onRefetch) await onRefetch();
        toast.success(t("finance.message.invoice_updated"));
      } else {
        await createInvoiceMutation.mutateAsync({
          title: data.identifier.trim(),
          contractorId: data.contractorId,
          projectId: data.projectId || null,
          lawyerUserId: data.lawyerId || null,
          sourceTaskId: data.taskId || null,
          amountTotal: data.amount,
          amountPaid: 0,
          amountDue: data.amount,
          description: data.description || "",
          currency: data.currency,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          invoiceType: invoiceType,
          // @ts-ignore - новые поля для НДС
          vatRate: data.vatRate,
          vatAmount: data.vatAmount,
          isTaxable: data.isTaxable,
        });
        toast.success(t("finance.message.invoice_created"));
      }
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(t("finance.message.error_creating_invoice"));
      console.error(error);
    }
  };

  const handleContractorCreate = (name: string) =>
    new Promise<number>((resolve, reject) => {
      contractorResolverRef.current = { resolve, reject };
      setPendingContractorName(name);
      setContractorSheetOpen(true);
    });

  const handleContractorSheetClose = (isOpen: boolean) => {
    if (!isOpen) {
      contractorResolverRef.current?.reject();
      contractorResolverRef.current = null;
      setContractorSheetOpen(false);
    }
  };

  const handleContractorSheetSave = async (contractor: Partial<Contractor>) => {
    const newContractor = await createContractor(contractor);
    if (newContractor && contractorResolverRef.current) {
      contractorResolverRef.current.resolve(newContractor.id);
    } else {
      contractorResolverRef.current?.reject();
    }
    contractorResolverRef.current = null;
    setContractorSheetOpen(false);
  };

  return {
    t,
    currencies,
    invoiceType,
    setInvoiceType,
    open,
    setOpen,
    contractors,
    projects,
    contractorSheetOpen,
    pendingContractorName,
    form,
    watchedCurrency,
    createInvoiceMutation,
    onSubmit,
    handleContractorCreate,
    handleContractorSheetClose,
    handleContractorSheetSave,
    invoiceStatuses,
    updateInvoiceStatus,
    unlinkPaymentFromInvoice: financeApi.unlinkPaymentFromInvoice,
  };
}

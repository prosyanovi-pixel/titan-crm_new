// frontend/src/modules/finance/hooks/useCreatePaymentSheet.ts
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreatePayment, useUpdatePayment, useCategories, useCreateCategory, useInvoices } from "./useFinance";
import type { Payment } from "../types/finance.types";
import { useContractorsList } from "@/modules/contractors";
import { useProjects } from "@/modules/projects";
import { useTasks } from "@/modules/tasks";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useMarketingCampaigns } from "@/modules/marketing";
import type { ComboboxOption } from "@/components/shared/EntityCombobox";
import { paymentSchema, type PaymentFormValues } from "../components/paymentFormSchema";

interface UseCreatePaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Partial<Payment> & { category?: string; description?: string } | null;
  onRefetch?: () => Promise<void>;
  prefillKind?: "income" | "expense" | null;
}

export function useCreatePaymentSheet({
  open,
  onOpenChange,
  payment,
  onRefetch,
  prefillKind,
}: UseCreatePaymentSheetProps) {
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment(payment?.id as number);
  const { contractors, createContractor } = useContractorsList();
  const { data: currencies = [] } = useCurrencies();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { data: categories = [] } = useCategories();
  const { data: invoices = [] } = useInvoices(); // Загружаем счета
  const { campaigns } = useMarketingCampaigns();
  const createCategory = useCreateCategory();

  const contractorResolverRef = useRef<{
    resolve: (id: number) => void;
    reject: () => void;
  } | null>(null);
  const [contractorSheetOpen, setContractorSheetOpen] = useState(false);
  const [pendingContractorName, setPendingContractorName] = useState("");

  const isEditing = Boolean(payment?.id);

  const getDefaultValues = (): PaymentFormValues => ({
    kind: (payment?.kind ?? prefillKind ?? "expense") as "income" | "expense",
    date: payment?.paymentDate
      ? String(payment.paymentDate).slice(0, 10)
      : new Date().toISOString().split("T")[0],
    amount: payment?.amount ? Number(payment.amount) : 0,
    currency: (payment?.currency ?? "RUB") as "RUB" | "USD" | "EUR" | "CNY",
    contractorId: payment?.contractorId ?? undefined,
    projectId: payment?.projectId ?? undefined,
    taskId: payment?.taskId ? String(payment.taskId) : undefined,
    categoryId: payment?.categoryId ? String(payment.categoryId) : undefined,
    campaignId: payment?.campaignId ? String(payment.campaignId) : undefined,
    // invoiceId: преобразуем в строку только если не null/undefined
    invoiceId: payment?.invoiceId !== null && payment?.invoiceId !== undefined
      ? String(payment.invoiceId)
      : undefined,
    description: payment?.comment ?? payment?.description ?? "",
  });

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment?.id]);

  const kind = form.watch("kind");
  const currency = form.watch("currency");
  const selectedProjectId = form.watch("projectId");

  const contractorOptions: ComboboxOption[] = contractors.map((c) => ({
    id: c.id,
    label: c.name,
  }));

  const projectOptions: ComboboxOption[] = projects.map((p) => ({
    id: p.id,
    label: p.name,
  }));

  const selectedProjectName = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)?.name
    : undefined;
  const filteredTasks = selectedProjectName
    ? tasks.filter((t) => t.project === selectedProjectName)
    : tasks;
  const taskOptions: ComboboxOption[] = filteredTasks.map((t) => ({
    id: t.id,
    label: t.title,
  }));

  const categoryOptions: ComboboxOption[] = categories
    .filter((c) => c.kind === kind)
    .map((c) => ({ id: c.id, label: c.name }));

  const campaignOptions: ComboboxOption[] = (campaigns || []).map((c: { id: string; name: string }) => ({
    id: c.id,
    label: c.name,
  }));

  // Получаем ИНН текущего контрагента (если выбран)
  const selectedContractorInn = form.watch('contractorId') 
    ? contractors.find(c => c.id === form.watch('contractorId'))?.inn 
    : undefined;

  // Опции счетов - фильтруем чтобы не показывать уже привязанные к другим контрагентам
  const invoiceOptions: ComboboxOption[] = invoices
    .filter((inv) => {
      // Всегда показываем счет если он уже привязан к этому платежу
      if (payment?.invoiceId && inv.id === payment.invoiceId) {
        return true;
      }
      
      // Показываем счета с остатком к оплате
      if (inv.amountDue <= 0) {
        return false;
      }
      
      // Если контрагент не выбран - показываем все счета с остатком
      if (!selectedContractorInn) {
        return true;
      }
      
      // Если контрагент выбран - показываем только его счета или счета без контрагента
      const invoiceContractorId = inv.contractorId;
      return !invoiceContractorId || invoiceContractorId === form.watch('contractorId');
    })
    .map((inv) => ({
      id: inv.id,
      label: `${inv.identifier} (${inv.contractorName || "—"}) — ${inv.amountDue} ${inv.currency}`,
    }));

  const handleCreateCategory = async (name: string): Promise<string> => {
    const newCat = await createCategory.mutateAsync({ name, kind });
    return newCat.id;
  };

  const handleCreateContractor = (name: string): Promise<number> =>
    new Promise((resolve, reject) => {
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

  const handleContractorSheetSave = async (contractor: Parameters<typeof createContractor>[0]) => {
    const newContractor = await createContractor(contractor);
    if (newContractor && contractorResolverRef.current) {
      contractorResolverRef.current.resolve(newContractor.id);
    } else {
      contractorResolverRef.current?.reject();
    }
    contractorResolverRef.current = null;
    setContractorSheetOpen(false);
  };

   
  const onSubmit = async (values: PaymentFormValues) => {
    // Преобразуем invoiceId - может быть строкой "123" или числом или UUID "inv-..."
    let invoiceId: string | number | null = null;
    if (values.invoiceId) {
      // Если это строка и выглядит как число - преобразуем
      if (typeof values.invoiceId === 'string' && /^\d+$/.test(values.invoiceId)) {
        invoiceId = parseInt(values.invoiceId, 10);
      } else {
        // Иначе оставляем как есть (UUID или число)
        invoiceId = values.invoiceId;
      }
    }
    
    console.log('Payment submit:', {
      values,
      invoiceId,
      isEditing,
      paymentId: payment?.id,
      rawInvoiceId: values.invoiceId,
      rawInvoiceIdType: typeof values.invoiceId,
    });
    
    const payload = {
      kind: values.kind,
      paymentDate: values.date,
      amount: values.amount,
      currency: values.currency,
      contractorId: values.contractorId || null,
      projectId: values.projectId || null,
      taskId: values.taskId || null,
      categoryId: values.categoryId || null,
      campaignId: values.campaignId || null,
      invoiceId: invoiceId, // Привязка к счету (строка, число или null)
      comment: values.description || null,
    };
    
    console.log('Payment payload:', payload);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (isEditing) await updatePayment.mutateAsync(payload as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    else await createPayment.mutateAsync(payload as any);
    await onRefetch?.();
    form.reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const isPending = createPayment.isPending || updatePayment.isPending;
  const isIncome = kind === "income";

  return {
    form,
    kind,
    currency,
    selectedProjectId,
    isEditing,
    isPending,
    isIncome,
    currencies,
    contractorOptions,
    projectOptions,
    taskOptions,
    categoryOptions,
    campaignOptions,
    invoiceOptions, // Добавляем опции счетов
    contractorSheetOpen,
    pendingContractorName,
    handleCreateCategory,
    handleCreateContractor,
    handleContractorSheetClose,
    handleContractorSheetSave,
    onSubmit,
    handleClose,
  };
}

// frontend/src/modules/finance/components/invoiceFormSchema.ts
import { z } from "zod";

export const invoiceSchema = z
  .object({
    identifier: z.string().min(1),
    contractorId: z.number().int().positive(),
    projectId: z.number().int().optional(),
    contractId: z.number().int().optional(),
    lawyerId: z.number().int().optional(),
    taskId: z.number().int().optional(),
    amount: z.number().positive(),
    currency: z.string().default("RUB"),
    description: z.string().optional(),
    issueDate: z.string().min(1),
    dueDate: z.string().min(1),
    status: z.string().optional(),
    vatRate: z.number().default(0),
    vatAmount: z.number().default(0),
    isTaxable: z.boolean().default(false),
  })
  .refine(
    (data) => new Date(data.dueDate) >= new Date(data.issueDate),
    {
      message: "Срок оплаты не может быть раньше даты выставления",
      path: ["dueDate"],
    },
  );

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const defaultFormValues = (invoice?: Record<string, unknown> | null): InvoiceFormValues => {
  // Helper to convert ISO date to yyyy-MM-dd format
  const formatDate = (dateValue: unknown): string => {
    if (!dateValue) return new Date().toISOString().split('T')[0];
    const dateStr = String(dateValue);
    // If already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Convert ISO format to yyyy-MM-dd
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  return {
    identifier: (invoice?.identifier as string) || '',
    contractorId: (invoice?.contractorId as number) || 0,
    projectId: (invoice?.projectId as number) || undefined,
    contractId: (invoice?.contractId as number) || undefined,
    lawyerId: ((invoice?.lawyerId ?? invoice?.lawyerUserId) as number) || undefined,
    taskId: ((invoice?.taskId ?? invoice?.sourceTaskId) as number) || undefined,
    amount: ((invoice?.amount ?? invoice?.amountTotal) as number) || 0,
    currency: (invoice?.currency as string) || 'RUB',
    description: (invoice?.description as string) || '',
    issueDate: formatDate(invoice?.issueDate),
    dueDate: formatDate(invoice?.dueDate),
    status: (invoice?.status as string) || 'draft',
    vatRate: (invoice?.vatRate as number) || 0,
    vatAmount: (invoice?.vatAmount as number) || 0,
    isTaxable: (invoice?.isTaxable as boolean) || false,
  };
};

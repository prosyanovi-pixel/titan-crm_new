// frontend/src/modules/finance/components/paymentFormSchema.ts
import { z } from "zod";

export const paymentSchema = z.object({
  kind: z.enum(["income", "expense"]),
  date: z.string().min(1, "Укажите дату"),
  amount: z.number().positive("Сумма должна быть больше 0"),
  currency: z.enum(["RUB", "USD", "EUR", "CNY"]),
  contractorId: z.number().optional(),
  projectId: z.number().optional(),
  contractId: z.number().optional(),
  taskId: z.string().optional(),
  categoryId: z.string().optional(),
  campaignId: z.string().optional(), // Привязка к маркетинговой кампании
  invoiceId: z.union([z.string(), z.number()]).optional(), // Привязка к счету (строка или число)
  description: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

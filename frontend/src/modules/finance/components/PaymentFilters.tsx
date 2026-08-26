// frontend/src/modules/finance/components/PaymentFilters.tsx
import { useTranslation } from "@/lib/i18n";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EntityCombobox } from "@/components/shared";
import type { ComboboxOption } from "@/components/shared";

interface Contractor {
  id: string | number;
  name: string;
}

interface PaymentFiltersProps {
  paymentKindFilter: string;
  onPaymentKindChange: (v: string) => void;
  paymentContractorFilter: string;
  onPaymentContractorChange: (v: string) => void;
  amountFrom: string;
  onAmountFromChange: (v: string) => void;
  amountTo: string;
  onAmountToChange: (v: string) => void;
  debtorOnly: boolean;
  onDebtorOnlyChange: (v: boolean) => void;
  contractors: Contractor[];
}

export function PaymentFilters({
  paymentKindFilter,
  onPaymentKindChange,
  paymentContractorFilter,
  onPaymentContractorChange,
  amountFrom,
  onAmountFromChange,
  amountTo,
  onAmountToChange,
  debtorOnly,
  onDebtorOnlyChange,
  contractors,
}: PaymentFiltersProps) {
  const { t } = useTranslation();
  const payerOptions: ComboboxOption[] = [
    { id: "all", label: t("generated.vse") },
    ...contractors.map((contractor) => ({
      id: contractor.name,
      label: contractor.name,
    })),
  ];

  return (
    <>
      <DropdownMenuLabel>{t("generated.tip_platezha")}</DropdownMenuLabel>
      <select
        value={paymentKindFilter}
        onChange={(e) => onPaymentKindChange(e.target.value)}
        className="h-8 mb-2 mx-2 w-[calc(100%-1rem)] rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="all">{t("generated.vse")}</option>
        <option value="income">{t("generated.dohody")}</option>
        <option value="expense">{t("generated.rashody")}</option>
      </select>

      <DropdownMenuSeparator />

      <DropdownMenuLabel>{t("finance.filter.payer")}</DropdownMenuLabel>
      <div className="mx-2 mb-2 w-[calc(100%-1rem)]">
        <EntityCombobox
          value={paymentContractorFilter}
          onChange={(value) => onPaymentContractorChange(String(value ?? "all"))}
          options={payerOptions}
          placeholder={t("generated.platel_schik")}
          className="h-8"
        />
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuLabel>{t("finance.filter.amount_from")}</DropdownMenuLabel>
      <Input
        type="number"
        placeholder="0"
        value={amountFrom}
        onChange={(e) => onAmountFromChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        className="h-8 mb-2 mx-2 w-auto"
      />

      <DropdownMenuLabel>{t("finance.filter.amount_to")}</DropdownMenuLabel>
      <Input
        type="number"
        placeholder="∞"
        value={amountTo}
        onChange={(e) => onAmountToChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        className="h-8 mb-2 mx-2 w-auto"
      />

      <DropdownMenuSeparator />

      <div className="flex items-center gap-2 px-2 py-1.5">
        <Checkbox
          id="debtor-only"
          checked={debtorOnly}
          onCheckedChange={(v) => onDebtorOnlyChange(Boolean(v))}
        />
        <Label htmlFor="debtor-only" className="text-sm cursor-pointer">
          {t("finance.filter.debtor_only")}
        </Label>
      </div>
    </>
  );
}

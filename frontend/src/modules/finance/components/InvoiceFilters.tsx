// frontend/src/modules/finance/components/InvoiceFilters.tsx
import { useTranslation } from "@/lib/i18n";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface InvoiceStatus {
  id: string;
  name: string;
}

interface Contractor {
  id: string | number;
  name: string;
}

interface InvoiceFiltersProps {
  statusFilter: string;
  onStatusChange: (v: string) => void;
  contractorFilter: string;
  onContractorChange: (v: string) => void;
  invoiceStatuses: InvoiceStatus[];
  contractors: Contractor[];
}

export function InvoiceFilters({
  statusFilter,
  onStatusChange,
  contractorFilter,
  onContractorChange,
  invoiceStatuses,
  contractors,
}: InvoiceFiltersProps) {
  const { t } = useTranslation();

  return (
    <>
      <DropdownMenuLabel>{t("common.status")}</DropdownMenuLabel>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue placeholder={t("generated.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("generated.vse")}</SelectItem>
          {invoiceStatuses.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DropdownMenuSeparator />

      <DropdownMenuLabel>{t("finance.table.contractor")}</DropdownMenuLabel>
      <Select value={contractorFilter} onValueChange={onContractorChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue placeholder={t("generated.kontragent")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("generated.vse")}</SelectItem>
          {contractors.map((c) => (
            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

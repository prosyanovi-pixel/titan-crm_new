import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckSquare2, ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/hooks/use-settings";
import { Quote } from "../types";

interface QuoteBulkStatusMenuProps {
  onSelectStatus: (statusId: string) => void;
}

/** Меню массовой смены статуса выбранных КП. */
export function QuoteBulkStatusMenu({ onSelectStatus }: QuoteBulkStatusMenuProps) {
  const { t } = useTranslation();
  const { getStatusesByModule } = useSettings();
  const statuses = getStatusesByModule('quotes') || [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <CheckSquare2 className="w-3.5 h-3.5" />
          {t('quotes.bulk.change_status')}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('quotes.bulk.status_title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {statuses.map(status => (
          <DropdownMenuItem key={status.id} onClick={() => onSelectStatus(status.id)}>
            {status.name?.includes('.') ? t(status.name) : status.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

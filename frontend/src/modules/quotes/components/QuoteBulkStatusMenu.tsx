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
import { Quote } from "../types";

const STATUSES: Quote['status'][] = ['draft', 'sent', 'accepted', 'rejected'];

interface QuoteBulkStatusMenuProps {
  onSelectStatus: (status: Quote['status']) => void;
}

/** Меню массовой смены статуса выбранных КП. */
export function QuoteBulkStatusMenu({ onSelectStatus }: QuoteBulkStatusMenuProps) {
  const { t } = useTranslation();

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
        {STATUSES.map(status => (
          <DropdownMenuItem key={status} onClick={() => onSelectStatus(status)}>
            {t(`quotes.statuses.${status}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

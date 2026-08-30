import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Settings2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface PriceListBulkMenuProps {
  onActivate: () => void;
  onDeactivate: () => void;
  onMakeDefault: () => void;
}

/** Меню массовых действий для выбранных прайс-листов. */
export function PriceListBulkMenu({ onActivate, onDeactivate, onMakeDefault }: PriceListBulkMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Settings2 className="w-3.5 h-3.5" />
          {t('common.actions')}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{t('price_lists.bulk.status_title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onActivate}>{t('price_lists.bulk.activate')}</DropdownMenuItem>
        <DropdownMenuItem onClick={onDeactivate}>{t('price_lists.bulk.deactivate')}</DropdownMenuItem>
        <DropdownMenuItem onClick={onMakeDefault}>{t('price_lists.bulk.make_default')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

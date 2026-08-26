import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface TableHeaderCheckboxProps {
  /** Выбраны ли все записи на текущей странице */
  isCurrentPageSelected: boolean;
  /** Выбраны ли все записи (все страницы) - необязательно */
  isAllSelected?: boolean;
  /** Выбраны ли некоторые записи - необязательно */
  isSomeSelected?: boolean;
  /** Переключить выбор текущей страницы */
  onToggleCurrentPage: () => void;
  /** Переключить выбор всех страниц - необязательно */
  onToggleAllPages?: () => void;
  /** Выбрать только текущую страницу - необязательно */
  onSelectCurrentPageOnly?: () => void;
  /** Очистить выбор - необязательно */
  onClearSelection?: () => void;
  /** Количество выбранных записей - необязательно */
  selectedCount?: number;
  /** Количество записей на текущей странице - необязательно */
  currentPageCount?: number;
  /** Общее количество записей - необязательно */
  totalCount?: number;
  /** Показывать ли выпадающее меню */
  showDropdown?: boolean;
  /** CSS-класс для контейнера */
  className?: string;
}

/**
 * Универсальный компонент чекбокса для заголовка таблицы
 * с поддержкой выбора всех страниц
 */
export function TableHeaderCheckbox({
  isCurrentPageSelected,
  isAllSelected = false,
  isSomeSelected = false,
  onToggleCurrentPage,
  onToggleAllPages,
  onSelectCurrentPageOnly,
  onClearSelection,
  selectedCount = 0,
  currentPageCount = 0,
  totalCount = 0,
  showDropdown = false,
  className,
}: TableHeaderCheckboxProps) {
  const { t } = useTranslation();

  const isChecked = isAllSelected || isCurrentPageSelected;

  // Стабильная высота и компактная ширина
  const content = (
    <div className={cn("flex items-center justify-center min-h-[32px] w-8", className)}>
      <Checkbox
        checked={isChecked}
        onCheckedChange={onToggleCurrentPage}
        aria-label={t('common.select_all.current_page')}
        className={cn(isSomeSelected && !isChecked && "data-[state=unchecked]:bg-primary/20 data-[state=unchecked]:text-primary")}
      />
    </div>
  );

  const canShowDropdown = showDropdown && 
                          selectedCount > 0 && 
                          onSelectCurrentPageOnly && 
                          onToggleAllPages && 
                          onClearSelection;

  if (!canShowDropdown) {
    return content;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer">
          {content}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onSelectCurrentPageOnly}>
          {t('common.select_all.current_page')} ({currentPageCount})
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleAllPages}>
          {isAllSelected
            ? t('common.select_all.clear')
            : `${t('common.select_all.all_pages').replace('{count}', totalCount.toString())}`}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onClearSelection}>
          {t('common.select_all.clear')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

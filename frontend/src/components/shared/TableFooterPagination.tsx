import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { parseRowsPerPage } from "@/lib/utils";
import { useState, useRef } from "react";

interface TableFooterPaginationProps {
  shownCount: number;
  totalCount: number;
  rowsPerPage: string;
  onRowsPerPageChange: (value: string) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function TableFooterPagination({
  shownCount,
  totalCount,
  rowsPerPage,
  onRowsPerPageChange,
  currentPage = 1,
  onPageChange,
  className,
}: TableFooterPaginationProps) {
  const { t } = useTranslation();
  const perPage = parseRowsPerPage(rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const [gotoValue, setGotoValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const getPages = (): (number | '…')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '…')[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '…', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages);
    }
    return pages;
  };

  const handlePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange?.(page);
  };

  const handleGoto = () => {
    const page = parseInt(gotoValue);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      handlePage(page);
    }
    setGotoValue('');
    inputRef.current?.blur();
  };

  return (
    <div className={className || "flex items-center justify-between p-4 border-t border-border"}>
      {/* Левая часть: "Показано X из Y" + "Страница N из M" */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {t('common.shown_of').replace('{0}', shownCount.toString()).replace('{1}', totalCount.toString())}
        </span>
        {totalPages > 1 && (
          <span className="hidden sm:inline border-l border-border pl-3">
            {t('common.page_of_pages').replace('{0}', currentPage.toString()).replace('{1}', totalPages.toString())}
          </span>
        )}
      </div>

      {/* Правая часть: строки на странице + навигация */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <span className="text-sm text-muted-foreground hidden sm:inline">{t('common.rows_per_page')}:</span>
        <Select value={rowsPerPage} onValueChange={(v) => { onRowsPerPageChange(v); onPageChange?.(1); }}>
          <SelectTrigger className="h-8 w-[70px]" aria-label={t('common.rows_per_page')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="all">{t('common.pagination.all')}</SelectItem>
          </SelectContent>
        </Select>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* Первая страница */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage <= 1}
              onClick={() => handlePage(1)}
              aria-label={t('common.pagination.first')}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Предыдущая страница */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage <= 1}
              onClick={() => handlePage(currentPage - 1)}
              aria-label={t('common.pagination.prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Номера страниц (скрыты на очень маленьких экранах) */}
            <div className="hidden sm:flex items-center gap-1">
              {getPages().map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm select-none">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === currentPage ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8 text-sm"
                    onClick={() => handlePage(p as number)}
                    aria-label={t('common.pagination.page', [p])}
                    aria-current={p === currentPage ? 'page' : undefined}
                  >
                    {p}
                  </Button>
                )
              )}
            </div>

            {/* Следующая страница */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= totalPages}
              onClick={() => handlePage(currentPage + 1)}
              aria-label={t('common.pagination.next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Последняя страница */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= totalPages}
              onClick={() => handlePage(totalPages)}
              aria-label={t('common.pagination.last')}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Быстрый переход к странице (только если страниц > 5) */}
        {totalPages > 5 && (
          <div className="hidden md:flex items-center gap-1 ml-1 border-l border-border pl-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">{t('common.pagination.goto')}</span>
            <Input
              ref={inputRef}
              type="number"
              min={1}
              max={totalPages}
              value={gotoValue}
              onChange={(e) => setGotoValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGoto(); }}
              onBlur={handleGoto}
              className="h-8 w-14 text-sm text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder={`${currentPage}`}
              aria-label={t('common.pagination.goto_placeholder')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
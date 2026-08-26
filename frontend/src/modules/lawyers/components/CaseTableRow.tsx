// frontend/src/modules/lawyers/components/CaseTableRow.tsx
import { useCallback } from "react";
import { LegalCase } from "../types";
import { useTranslation } from "@/lib/i18n";
import { QuickAction } from "@/lib/settings-data";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, OutcomeBadge } from "@/components/ui/status-system";
import { Checkbox } from "@/components/ui/checkbox";
import { QuickActionsMenu } from "@/components/ui/QuickActionsMenu";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = { 'RUB': '₽', 'USD': '$', 'EUR': '€', 'GBP': '£', 'CNY': '¥' };
  return symbols[currency] || currency;
};

const formatValue = (val: number) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

interface CaseTableRowProps {
  legalCase: LegalCase;
  isSelected: boolean;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onToggleSelection: (id: string) => void;
  onEdit: (legalCase: LegalCase) => void;
  quickActions: QuickAction[];
  onAction: (action: string, itemId: string | number) => void;
}

export function CaseTableRow({
  legalCase,
  isSelected,
  visibleColumns,
  columnOrder,
  onToggleSelection,
  onEdit,
  quickActions,
  onAction,
}: CaseTableRowProps) {
  const { t } = useTranslation();

  const handleRowClick = useCallback(() => {
    onEdit(legalCase);
  }, [legalCase, onEdit]);

  const handleStopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Отображаемый номер дела: firstInstanceNumber для суд.дел, caseNumber для претензий
  const displayCaseNumber = legalCase.type === 'court'
    ? (legalCase.firstInstanceNumber || legalCase.caseNumber)
    : legalCase.caseNumber;

  return (
    <TableRow
      className="cursor-pointer"
      onClick={handleRowClick}
      data-state={isSelected ? "selected" : undefined}
    >
      <TableCell onClick={handleStopPropagation} className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(legalCase.id)}
        />
      </TableCell>

      {columnOrder.filter(key => visibleColumns[key]).map(key => {
        switch (key) {
          case 'title': return (
            <TableCell key="title">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{legalCase.title}</span>
                  {legalCase.hasUnviewedUpdates && (
                    <Badge variant="destructive" className="h-4 px-1 flex items-center gap-0.5" style={{ fontSize: 'var(--table-font-meta)' }}>
                      <span>🔔</span>
                      <span>{legalCase.unviewedUpdates?.length || 1}</span>
                    </Badge>
                  )}
                </div>
                {displayCaseNumber && (
                  <span className="text-muted-foreground font-mono opacity-70" style={{ fontSize: 'var(--table-font-meta)' }}>
                    {displayCaseNumber}
                  </span>
                )}
              </div>
            </TableCell>
          );
          case 'lawyer': return (
            <TableCell key="lawyer">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarImage src={legalCase.lawyerAvatar || ''} alt={legalCase.lawyerName} />
                  <AvatarFallback className="bg-primary/10 text-primary uppercase" style={{ fontSize: 'var(--table-font-meta)' }}>
                    {(legalCase.lawyerName || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate" style={{ fontSize: 'var(--table-font-meta)' }}>{legalCase.lawyerName || t('common.no_data')}</span>
              </div>
            </TableCell>
          );
          case 'status': return (
            <TableCell key="status">
              <StatusBadge statusId={legalCase.status} />
            </TableCell>
          );
          case 'outcome': return (
            <TableCell key="outcome">
              {legalCase.outcome ? <OutcomeBadge outcomeId={legalCase.outcome} /> : <span className="text-muted-foreground opacity-50" style={{ fontSize: 'var(--table-font-meta)' }}>—</span>}
            </TableCell>
          );
          case 'claim_amount': return (
            <TableCell key="claim_amount" className="text-right font-mono whitespace-nowrap" style={{ fontSize: 'var(--table-font-meta)' }}>
              {formatValue(Number(legalCase.claimAmount?.amount || 0))} {getCurrencySymbol(legalCase.claimAmount?.currency || 'RUB')}
            </TableCell>
          );
          // Дата отправления претензии
          case 'sent_date': return (
            <TableCell key="sent_date">
              <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap opacity-80" style={{ fontSize: 'var(--table-font-meta)' }}>
                <Calendar className="w-3 h-3" />
                {legalCase.sentDate || t('common.no_data')}
              </div>
            </TableCell>
          );
          // Дата ответа на претензию
          case 'response_due_date': return (
            <TableCell key="response_due_date">
              <div className={cn(
                "flex items-center gap-1.5 whitespace-nowrap",
                legalCase.responseDueDate && new Date(legalCase.responseDueDate) < new Date()
                  ? "text-destructive font-medium"
                  : "text-muted-foreground opacity-80"
              )} style={{ fontSize: 'var(--table-font-meta)' }}>
                <Calendar className="w-3 h-3" />
                {legalCase.responseDueDate || t('common.no_data')}
              </div>
            </TableCell>
          );
          case 'expenses': return (
            <TableCell key="expenses" className="text-right font-mono text-destructive whitespace-nowrap" style={{ fontSize: 'var(--table-font-meta)' }}>
              {(() => {
                const total = (Number(legalCase.transportExpenses || 0) + Number(legalCase.translationExpenses || 0) + Number(legalCase.otherExpenses || 0)) +
                              (legalCase.expenses || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
                return formatValue(total);
              })()} {getCurrencySymbol(legalCase.claimAmount?.currency || 'RUB')}
            </TableCell>
          );
          case 'total': return (
            <TableCell key="total" className="text-right font-mono font-bold whitespace-nowrap" style={{ fontSize: 'var(--table-font-meta)' }}>
              {(() => {
                const totalExpenses = (Number(legalCase.transportExpenses || 0) + Number(legalCase.translationExpenses || 0) + Number(legalCase.otherExpenses || 0)) +
                                      (legalCase.expenses || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
                const result = Number(legalCase.claimAmount?.amount || 0) - totalExpenses;
                return formatValue(result);
              })()} {getCurrencySymbol(legalCase.claimAmount?.currency || 'RUB')}
            </TableCell>
          );
          case 'deadline': return (
            <TableCell key="deadline">
              <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap opacity-80" style={{ fontSize: 'var(--table-font-meta)' }}>
                <Calendar className="w-3 h-3" />
                {legalCase.deadline || t('common.no_data')}
              </div>
            </TableCell>
          );
          case 'price': return (
            <TableCell key="price" className="text-right font-semibold whitespace-nowrap" style={{ fontSize: 'var(--table-font-meta)' }}>
              {Number(legalCase.price || 0).toLocaleString('ru-RU')} ₽
            </TableCell>
          );
          case 'plaintiff': return <TableCell key="plaintiff" className="truncate" style={{ fontSize: 'var(--table-font-meta)' }}>{legalCase.plaintiff || t('common.no_data')}</TableCell>;
          case 'defendant': return <TableCell key="defendant" className="truncate" style={{ fontSize: 'var(--table-font-meta)' }}>{legalCase.defendant || t('common.no_data')}</TableCell>;
          case 'client': return <TableCell key="client" className="truncate" style={{ fontSize: 'var(--table-font-meta)' }}>{legalCase.client || t('common.no_data')}</TableCell>;
          default: return null;
        }
      })}

      <TableCell onClick={handleStopPropagation} className="w-10">
        <QuickActionsMenu
          itemId={legalCase.id}
          itemName={legalCase.title}
          options={quickActions}
          onAction={onAction}
        />
      </TableCell>
    </TableRow>
  );
}

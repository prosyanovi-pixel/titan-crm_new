import { useState, Fragment, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ChevronRight, ChevronDown, PenSquare, Phone, Mail, DoorOpen, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableTableHead, TableUtilityHead } from "@/components/shared";
import { useColumnDrag } from "@/hooks/useColumnDrag";

interface Court {
  id: string;
  name: string;
  address: string;
}

interface Judge {
  id: string;
  name: string;
  court_id: string;
  court_name?: string;
  secretary_phone?: string;
  assistant_phone?: string;
  email?: string;
  office?: string;
  composition?: string;
}

interface CourtWithJudges extends Court {
  judges: Judge[];
}

interface CourtsJudgesListProps {
  courts: CourtWithJudges[];
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  toggleAllSelection: () => void;
  visibleColumns: Record<string, boolean>;
  columnOrder?: string[];
  onReorderColumn?: (fromKey: string, toKey: string) => void;
  onEditCourt: (court: Court) => void;
  onEditJudge: (judge: Judge) => void;
  onDeleteCourt: (id: string) => void;
  onDeleteJudge: (id: string) => void;
  onSort: (key: keyof Court) => void;
  sortConfig: { key: keyof Court; direction: 'asc' | 'desc' } | null;
  columnWidths?: Record<string, number>;
  onColumnResize?: (columnKey: string, width: number) => void;
}

export function CourtsJudgesList({
  courts,
  selectedIds,
  toggleSelection,
  toggleAllSelection,
  visibleColumns,
  columnOrder,
  onReorderColumn,
  onEditCourt,
  onEditJudge,
  onDeleteCourt,
  onDeleteJudge,
  onSort,
  sortConfig,
  columnWidths,
  onColumnResize,
}: CourtsJudgesListProps) {
  const { t } = useTranslation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleReorder = useCallback((from: string, to: string) => {
    onReorderColumn?.(from, to);
  }, [onReorderColumn]);
  const { dragging, dragOver, onColumnMouseDown, onColumnMouseEnter } = useColumnDrag(handleReorder);

  const COURTS_COLUMN_ORDER = ['name', 'address', 'judges_count'];
  const effectiveColumnOrder = columnOrder ?? COURTS_COLUMN_ORDER;

  const courtsColumnLabels: Record<string, string> = {
    name: t('lawyers.case_sheet.courts_table.court_name'),
    address: t('lawyers.case_sheet.courts_table.address'),
    judges_count: t('lawyers.case_sheet.courts_table.judges_count'),
  };
  const courtsSortKeys: Record<string, keyof Court> = {
    name: 'name',
    address: 'address',
    judges_count: 'name', // Сортируем по имени суда
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
    });
  };

  const renderRow = (court: CourtWithJudges, level: number = 0) => {
    const hasJudges = court.judges && court.judges.length > 0;
    const isExpanded = expandedIds.has(court.id);

    return (
        <Fragment key={court.id}>
            <TableRow
              className={`hover:bg-muted/50 cursor-pointer ${selectedIds.has(court.id) ? "bg-muted" : ""}`}
              onClick={() => onEditCourt(court)}
            >
              <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Checkbox
                        checked={selectedIds.has(court.id)}
                        onCheckedChange={() => toggleSelection(court.id)}
                    />
                    {hasJudges && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(court.id);
                            }}
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    )}
                  </div>
              </TableCell>
              {effectiveColumnOrder.filter(key => visibleColumns[key]).map(key => {
                const style: React.CSSProperties = { 
                  width: columnWidths?.[key] ? `${columnWidths[key]}px` : undefined,
                };
                switch (key) {
                  case 'name': return (
                    <TableCell key="name" className="font-medium text-foreground" style={style}>
                      <div style={{ paddingLeft: `${level * 20}px` }} className="flex items-center gap-2">
                        {level > 0 && <div className="w-2 h-2 border-l border-b border-muted-foreground/30 rounded-bl-sm inline-block mr-1"></div>}
                        {court.name}
                      </div>
                    </TableCell>
                  );
                  case 'address': return (
                    <TableCell key="address" className="text-foreground" style={style}>{court.address || t('common.no_data')}</TableCell>
                  );
                  case 'judges_count': return (
                    <TableCell key="judges_count" style={style}>
                      <Badge variant="secondary" className="gap-1">
                        {t('lawyers.case_sheet.courts.judges_count_plural', { count: court.judges.length })}
                      </Badge>
                    </TableCell>
                  );
                  default: return null;
                }
              })}
              <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onEditCourt(court)}>
                                <PenSquare className="w-4 h-4 mr-2" />
                                {t('lawyers.case_sheet.courts.edit_title')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDeleteCourt(court.id)}>
                                <span className="text-destructive">{t('lawyers.case_sheet.courts.delete_court_btn')}</span>
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
              </TableCell>
            </TableRow>
            
            {/* Судьи (вложенные строки) */}
            {isExpanded && court.judges.map((judge, index) => (
                <TableRow
                    key={judge.id}
                    className="hover:bg-muted/30 cursor-pointer bg-muted/10"
                    onClick={() => onEditJudge(judge)}
                >
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                        <div className="flex items-center justify-center gap-2 pl-8">
                            <Checkbox
                                checked={selectedIds.has(judge.id)}
                                onCheckedChange={() => toggleSelection(judge.id)}
                            />
                        </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 border-l border-b border-muted-foreground/30 rounded-bl-sm inline-block mr-2"></div>
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {judge.name}
                        </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                        {judge.court_name || t('common.no_data')}
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                            {judge.secretary_phone && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    {t('lawyers.case_sheet.courts.secretary_label')}: {judge.secretary_phone}
                                </span>
                            )}
                            {judge.assistant_phone && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    {t('lawyers.case_sheet.courts.assistant_label')}: {judge.assistant_phone}
                                </span>
                            )}
                        </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onEditJudge(judge)}>
                                        <PenSquare className="w-4 h-4 mr-2" />
                                        {t('lawyers.case_sheet.courts.edit_judge_title')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteJudge(judge.id)}>
                                        <span className="text-destructive">{t('lawyers.case_sheet.courts.delete_judge_btn')}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </Fragment>
    );
  };

  return (
    <div className="titan-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableUtilityHead className="w-10 text-center">
              <div className="flex justify-center">
                <Checkbox
                    checked={selectedIds.size === courts.length && courts.length > 0}
                    onCheckedChange={toggleAllSelection}
                />
              </div>
            </TableUtilityHead>
            {effectiveColumnOrder.filter(key => visibleColumns[key]).map(key => (
              <SortableTableHead
                key={key}
                label={courtsColumnLabels[key] ?? key}
                onSort={() => onSort(courtsSortKeys[key] ?? key as any)}
                direction={sortConfig?.key === (courtsSortKeys[key] ?? key) ? sortConfig.direction : null}
                columnKey={key}
                isDragging={dragging === key}
                isDragOver={dragOver === key}
                onColumnMouseDown={onColumnMouseDown}
                onColumnMouseEnter={onColumnMouseEnter}
                width={columnWidths?.[key]}
                onResize={(width) => onColumnResize?.(key, width)}
              />
            ))}
            <TableUtilityHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {courts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                {t('common.no_data')}
              </TableCell>
            </TableRow>
          ) : (
            courts.map((court) => renderRow(court))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Выбор и упорядочивание колонок отчёта (Шаг 3 конструктора)
 */

import { GripVertical } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { ReportColumnDef } from '../../types/reports.types';

interface ReportColumnsSelectorProps {
  columns:        ReportColumnDef[];
  selectedCols:   string[];
  onChange:       (cols: string[]) => void;
}

/**
 * Список колонок с чекбоксами и drag-and-drop переупорядочиванием
 */
export function ReportColumnsSelector({ columns, selectedCols, onChange }: ReportColumnsSelectorProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx]       = useState<number | null>(null);

  // Колонки в порядке selectedCols, затем не выбранные
  const ordered = [
    ...selectedCols.filter(k => columns.find(c => c.key === k)),
    ...columns.map(c => c.key).filter(k => !selectedCols.includes(k)),
  ];

  const toggleCol = useCallback((key: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedCols, key]);
    } else {
      onChange(selectedCols.filter(k => k !== key));
    }
  }, [selectedCols, onChange]);

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver  = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;

    const newOrder = [...ordered];
    const [moved]  = newOrder.splice(draggedIdx, 1);
    newOrder.splice(idx, 0, moved);

    // Обновить только выбранные (сохранить порядок)
    onChange(newOrder.filter(k => selectedCols.includes(k)));
    setDraggedIdx(null);
    setOverIdx(null);
  };

  return (
    <div className="space-y-1">
      {ordered.map((key, idx) => {
        const col     = columns.find(c => c.key === key);
        if (!col) return null;
        const checked = selectedCols.includes(key);

        return (
          <div
            key={key}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => { setDraggedIdx(null); setOverIdx(null); }}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab transition-all ${
              overIdx === idx && draggedIdx !== idx ? 'bg-primary/10 border-l-2 border-primary translate-x-1' : 'hover:bg-muted/60'
            } ${draggedIdx === idx ? 'opacity-40 grayscale pointer-events-none' : ''}`}
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <Checkbox
              id={`col-${key}`}
              checked={checked}
              onCheckedChange={v => toggleCol(key, Boolean(v))}
            />
            <Label htmlFor={`col-${key}`} className="text-sm cursor-pointer flex-1">
              {col.label}
            </Label>
            <span className="text-xs text-muted-foreground">
              {col.type === 'currency' ? '₽' : col.type === 'date' ? '📅' : ''}
            </span>
          </div>
        );
      })}

      {selectedCols.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Выберите хотя бы одну колонку
        </p>
      )}
    </div>
  );
}

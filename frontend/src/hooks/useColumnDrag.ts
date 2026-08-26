import { useState, useEffect, useRef, useCallback } from 'react';

/** Задержка удержания кнопки мыши до активации перетаскивания (мс) */
const LONG_PRESS_MS = 400;

/**
 * Хук для перетаскивания столбцов таблицы удержанием мыши.
 *
 * Логика:
 * - Нажать и держать мышь 400 мс на заголовке → активируется drag-режим
 * - Навести курсор на другой столбец → показывается drop-индикатор
 * - Отпустить мышь → столбцы меняются местами и сохраняются в БД через onReorder
 * - Быстрый клик (< 400 мс) → срабатывает обычная сортировка (если передан onSort)
 */
export function useColumnDrag(onReorder: (fromKey: string, toKey: string) => void) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef = useRef<string | null>(null);
  const dragOverRef = useRef<string | null>(null);
  const sortCallbackRef = useRef<(() => void) | null>(null);

  /**
   * Вызывается в onMouseDown заголовка столбца.
   * @param key       ключ столбца
   * @param onSort    функция сортировки — вызывается при быстром клике
   */
  const onColumnMouseDown = useCallback((key: string, onSort?: () => void) => {
    sortCallbackRef.current = onSort ?? null;
    timerRef.current = setTimeout(() => {
      // Долгое нажатие — активируем drag, сортировка отменяется
      sortCallbackRef.current = null;
      setDragging(key);
      draggingRef.current = key;
    }, LONG_PRESS_MS);
  }, []);

  /** Вызывается в onMouseEnter заголовка столбца во время drag */
  const onColumnMouseEnter = useCallback((key: string) => {
    if (draggingRef.current && draggingRef.current !== key) {
      setDragOver(key);
      dragOverRef.current = key;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Быстрый клик — сортировка
    if (sortCallbackRef.current) {
      sortCallbackRef.current();
      sortCallbackRef.current = null;
    }
    // Завершение drag — меняем порядок
    if (draggingRef.current && dragOverRef.current && draggingRef.current !== dragOverRef.current) {
      onReorder(draggingRef.current, dragOverRef.current);
    }
    setDragging(null);
    setDragOver(null);
    draggingRef.current = null;
    dragOverRef.current = null;
  }, [onReorder]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  return {
    /** Ключ столбца, который сейчас перетаскивается */
    dragging,
    /** Ключ столбца, над которым сейчас находится перетаскиваемый */
    dragOver,
    onColumnMouseDown,
    onColumnMouseEnter,
  };
}

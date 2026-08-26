import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Хук для перетаскивания вкладок (tabs) через grip-иконку.
 *
 * Логика:
 * - Нажать мышь на иконке grip → сразу активируется drag-режим
 * - Навести курсор на другую вкладку → показывается drop-индикатор
 * - Отпустить мышь → вкладки меняются местами и сохраняются в БД через onReorder
 */
export function useTabDrag(onReorder: (fromId: string, toId: string) => void) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const draggingRef = useRef<string | null>(null);
  const dragOverRef = useRef<string | null>(null);

  /** Вызывается в onMouseDown на grip-иконке вкладки — drag активируется сразу */
  const onTabMouseDown = useCallback((id: string) => {
    setDragging(id);
    draggingRef.current = id;
  }, []);

  /** Вызывается в onMouseEnter вкладки во время drag */
  const onTabMouseEnter = useCallback((id: string) => {
    if (draggingRef.current && draggingRef.current !== id) {
      setDragOver(id);
      dragOverRef.current = id;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
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
    /** ID вкладки, которая сейчас перетаскивается */
    dragging,
    /** ID вкладки, над которой сейчас находится перетаскиваемая */
    dragOver,
    onTabMouseDown,
    onTabMouseEnter,
  };
}

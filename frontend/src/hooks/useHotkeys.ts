import { useEffect } from 'react';

type KeyCombo = string;

interface UseHotkeysOptions {
  preventDefault?: boolean;
  enabled?: boolean;
}

/**
 * Хук для привязки горячих клавиш.
 * 
 * @param keyCombo Строка с комбинацией клавиш (например, 'mod+s' или 'cmd+shift+k')
 * @param callback Функция, вызываемая при нажатии комбинации
 * @param options Настройки (по умолчанию preventDefault: true)
 */
export function useHotkeys(
  keyCombo: KeyCombo,
  callback: (e: KeyboardEvent) => void,
  options: UseHotkeysOptions = {}
) {
  const { preventDefault = true, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const keys = keyCombo.toLowerCase().split('+');
    const isCmdOrCtrl = keys.includes('cmd') || keys.includes('ctrl') || keys.includes('mod');
    const isShift = keys.includes('shift');
    const isAlt = keys.includes('alt');
    const key = keys[keys.length - 1]; // Например, 's'

    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорировать, если мы находимся внутри инпута и пытаемся использовать обычные символы без модификаторов
      // (однако, для Cmd/Ctrl комбинаций это нормально, например Cmd+S)
      if (!isCmdOrCtrl && !isAlt && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable)) {
        if (key !== 'escape' && key !== 'enter') {
            return;
        }
      }

      const cmdOrCtrlMatch = isCmdOrCtrl ? (e.metaKey || e.ctrlKey) : !(e.metaKey || e.ctrlKey);
      const shiftMatch = isShift ? e.shiftKey : !e.shiftKey;
      const altMatch = isAlt ? e.altKey : !e.altKey;
      const keyMatch = e.key.toLowerCase() === key;

      if (cmdOrCtrlMatch && shiftMatch && altMatch && keyMatch) {
        if (preventDefault) {
          e.preventDefault();
        }
        callback(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyCombo, callback, preventDefault, enabled]);
}

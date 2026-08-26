import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { useTranslation } from "@/lib/i18n";

export interface CommentInputProps {
  /** Placeholder для input */
  placeholder?: string;
  
  /** Текст комментария */
  value?: string;
  
  /** Изменение текста */
  onChange?: (value: string) => void;
  
  /** Отправка комментария */
  onSubmit: (text: string) => void;
  
  /** Отключить компонент */
  disabled?: boolean;
  
  /** Автоматическая очистка после отправки */
  clearOnSubmit?: boolean;
  
  /** Класс контейнера */
  className?: string;
}

/**
 * Компонент ввода комментария с кнопкой отправки
 * 
 * @example
 * ```tsx
 * <CommentInput
 *   placeholder="Написать комментарий..."
 *   onSubmit={(text) => handleAddComment(text)}
 * />
 * ```
 */
export function CommentInput({
  placeholder: customPlaceholder,
  value: controlledValue,
  onChange,
  onSubmit,
  disabled = false,
  clearOnSubmit = true,
  className,
}: CommentInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const { t } = useTranslation();
  
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  
  const setValue = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    
    onSubmit(value);
    
    if (clearOnSubmit) {
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className || ''}`}>
      <Input
        className="h-8 text-xs flex-1"
        placeholder={customPlaceholder || t('components.comment_input.placeholder')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
      <Button 
        type="submit"
        size="icon" 
        className="h-8 w-8 shrink-0"
        disabled={!value.trim() || disabled}
      >
        <Send className="w-3 h-3" />
      </Button>
    </form>
  );
}


import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, X } from 'lucide-react';
import { MoneyInput } from '@/components/ui/MoneyInput';

type InputType = 'text' | 'date' | 'select' | 'money';

interface InlineEditCellProps {
  value: string | number | null;
  onSave: (newValue: any) => void;
  inputType: InputType;
  options?: { label: string; value: string }[];
  placeholder?: string;
  align?: 'left' | 'center' | 'right';
}

export function InlineEditCell({
  value,
  onSave,
  inputType,
  options = [],
  placeholder = 'N/A',
  align = 'left',
}: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [prevValueProp, setPrevValueProp] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  if (value !== prevValueProp) {
    setPrevValueProp(value);
    setCurrentValue(value);
  }

  useEffect(() => {
    if (isEditing && (inputType === 'text' || inputType === 'money')) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, inputType]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (isEditing) {
          handleSave();
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef, isEditing]);

  const handleSave = () => {
    if (currentValue !== value) {
      onSave(currentValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const renderDisplayValue = () => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">{placeholder}</span>;
    }
    if (inputType === 'date') {
        try {
            return format(new Date(value as string), 'dd.MM.yyyy');
        } catch (e) {
            return <span className="text-destructive-foreground">{placeholder}</span>;
        }
    }
    if (inputType === 'select') {
      const option = options.find(o => String(o.value) === String(value));
      return option ? option.label : <span className="text-muted-foreground italic">{placeholder}</span>;
    }
    if (inputType === 'money') {
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(value));
    }
    return String(value);
  };

  const renderEditingControl = () => {
    switch (inputType) {
      case 'date':
        return (
          <Popover open={isEditing} onOpenChange={setIsEditing}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !currentValue && 'text-muted-foreground'
                    )}
                    onClick={() => setIsEditing(true)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentValue ? format(new Date(currentValue as string), 'dd.MM.yyyy') : <span>{placeholder}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" onBlur={handleSave}>
              <Calendar
                mode="single"
                selected={currentValue ? new Date(currentValue as string) : undefined}
                onSelect={(date) => {
                  setCurrentValue(date?.toISOString() ?? null);
                  handleSave();
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      case 'select':
        return (
          <Select
            value={currentValue !== null && currentValue !== undefined ? String(currentValue) : ''}
            onValueChange={(val) => {
                setCurrentValue(val);
                onSave(val);
                setIsEditing(false);
            }}
            
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'money':
        return (
          <div className="relative">
            <MoneyInput
              ref={inputRef}
              value={Number(currentValue) || 0}
              onValueChange={(val) => setCurrentValue(val)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
            />
          </div>
        );
      case 'text':
      default:
        return (
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={currentValue as string ?? ''}
              onChange={(e) => setCurrentValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className={cn('h-8 text-xs', `text-${align}`)}
            />
          </div>
        );
    }
  };
  
  return (
    <div 
        ref={wrapperRef} 
        className="h-full w-full cursor-text"
        onClick={(e) => { e.stopPropagation(); !isEditing && setIsEditing(true); }}
        onDoubleClick={(e) => { e.stopPropagation(); !isEditing && setIsEditing(true); }}
        >
      {isEditing ? renderEditingControl() : (
        <div className={cn("flex items-center h-full px-2 -mx-2", `justify-${align === 'right' ? 'end' : align === 'center' ? 'center' : 'start'}`)}>
            {renderDisplayValue()}
        </div>
      )}
    </div>
  );
}

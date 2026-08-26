/**
 * Компонент поиска организаций через DaData Suggestions
 * Используется для быстрого создания контрагентов по ИНН или названию
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, Check, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export interface DadataSuggestion {
  value: string;
  unrestricted_value: string;
  data: {
    inn: string;
    kpp?: string;
    ogrn: string;
    type: 'LEGAL' | 'INDIVIDUAL';
    name: {
      full_with_opf: string;
      short_with_opf: string;
      full?: string;
      short?: string;
    };
    fio?: {
      surname: string;
      name: string;
      patronymic?: string;
    };
    management?: {
      name: string;
      post: string;
    };
    address: {
      value: string;
      unrestricted_value: string;
    };
    state: {
      status: 'ACTIVE' | 'LIQUIDATING' | 'LIQUIDATED' | 'BANKRUPT' | 'REORGANIZING';
      actuality_date?: string;
    };
    okved?: string;
    okved_type?: string;
    branch_type?: 'MAIN' | 'BRANCH';
    branch_count?: number;
    hid?: string;
    ogrn_date?: string;
    opf?: {
      code: string;
      full?: string;
      short?: string;
    };
    okpo?: string;
    capital?: {
      value: number;
      currency?: string;
    };
    phones?: Array<{
      source?: string;
      value?: string;
    }>;
    emails?: string[];
  };
}

interface DadataSuggestionsInputProps {
  value?: string;
  onChange?: (value: string, suggestion?: DadataSuggestion) => void;
  onSelect?: (suggestion: DadataSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  filters?: {
    type?: 'LEGAL' | 'INDIVIDUAL';
    status?: Array<'ACTIVE' | 'LIQUIDATING' | 'LIQUIDATED'>;
    locations?: Array<{ kladr_id?: string; city?: string }>;
  };
}

export function DadataSuggestionsInput({
  value = '',
  onChange,
  onSelect,
  placeholder,
  className,
  disabled = false,
  filters,
}: DadataSuggestionsInputProps) {
  const { t } = useTranslation();
  const finalPlaceholder = placeholder || t('common.dadata.placeholder');
  const [suggestions, setSuggestions] = useState<DadataSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Поиск по кнопке
  const handleSearch = async () => {
    if (!value || value.length < 2) {
      setError(t('common.dadata.error_min_symbols'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/settings/external/dadata/suggest/party', {
        query: value,
        count: 10,
        filters: filters || {},
      });

      setSuggestions(response.suggestions || []);
      setIsOpen(true);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || t('common.dadata.error_search'));
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Выбор организации
  const handleSelect = (suggestion: DadataSuggestion) => {
    setIsOpen(false);
    setSuggestions([]);
    
    if (onSelect) {
      onSelect(suggestion);
    }
    
    if (onChange) {
      onChange(suggestion.value, suggestion);
    }
  };

  // Навигация клавиатурой
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // Форматирование типа организации
  const getOrganizationType = (type: string, branchType?: string) => {
    if (branchType === 'BRANCH') return t('common.dadata.organization_types.branch');
    if (type === 'INDIVIDUAL') return t('common.dadata.organization_types.individual');
    return t('common.dadata.organization_types.legal');
  };

  // Статус организации
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
      case 'LIQUIDATING': return 'bg-amber-100 text-amber-700';
      case 'LIQUIDATED':
      case 'BANKRUPT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={cn("relative space-y-2", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChange?.(e.target.value);
              setIsOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
              handleKeyDown(e);
            }}
            placeholder={finalPlaceholder}
            className="pl-9 pr-8"
            disabled={disabled}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={loading || !value || value.length < 2}
          type="button"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.find')}
        </Button>
      </div>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 text-xs text-destructive bg-destructive/10 rounded border border-destructive/20">
          <AlertCircle className="w-3 h-3 inline mr-1" />
          {error}
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-[400px] overflow-hidden"
        >
          <ScrollArea className="h-full">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.data.hid || index}
                className={cn(
                  "p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-b-0",
                  index === selectedIndex && "bg-muted"
                )}
                onClick={() => handleSelect(suggestion)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {suggestion.value}
                      </span>
                    </div>
                    
                    {suggestion.data.inn && (
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>
                          {t('common.inn')}: <span className="font-mono">{suggestion.data.inn}</span>
                          {suggestion.data.kpp && (
                            <span className="ml-2">{t('common.dadata.kpp')}: <span className="font-mono">{suggestion.data.kpp}</span></span>
                          )}
                        </div>
                        {suggestion.data.ogrn && (
                          <div>{t('common.dadata.ogrn')}: <span className="font-mono">{suggestion.data.ogrn}</span></div>
                        )}
                        {suggestion.data.address?.value && (
                          <div className="truncate">📍 {suggestion.data.address.value}</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium",
                      getStatusColor(suggestion.data.state?.status || 'ACTIVE')
                    )}>
                      {suggestion.data.state?.status === 'ACTIVE' ? t('common.dadata.statuses.active') :
                       suggestion.data.state?.status === 'LIQUIDATING' ? t('common.dadata.statuses.liquidating') :
                       suggestion.data.state?.status === 'LIQUIDATED' ? t('common.dadata.statuses.liquidated') :
                       suggestion.data.state?.status || t('common.no_data')}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {getOrganizationType(suggestion.data.type, suggestion.data.branch_type)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="p-2 text-xs text-muted-foreground text-center border-t bg-muted/30">
            {t('common.dadata.found_count', { count: suggestions.length })}
          </div>
        </div>
      )}

      {isOpen && value && value.length >= 2 && suggestions.length === 0 && !loading && !error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-4 text-center text-sm text-muted-foreground bg-background border rounded-lg shadow-lg">
          {t('common.dadata.no_results_query', { query: value })}
        </div>
      )}
    </div>
  );
}

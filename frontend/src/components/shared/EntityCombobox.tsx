import { useTranslation } from '@/lib/i18n';
import * as React from 'react';
import { Check, ChevronsUpDown, PlusCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface ComboboxOption {
  /** Unique identifier (will be coerced from / to string internally) */
  id: string | number;
  /** Display text shown in the list and trigger */
  label: string;
}

interface EntityComboboxProps {
  /** Currently selected id (string or number) */
  value: string | number | undefined | null;
  /** Called with the selected id when the user picks an item, or null/undefined to clear */
  onChange: (id: string | number | undefined) => void;
  /** Full list of options */
  options: ComboboxOption[];
  /** Options to show when query is empty (e.g., recent items) */
  recentOptions?: ComboboxOption[];
  /** If true, only show recentOptions when query is empty; otherwise show all options */
  showRecentOnly?: boolean;
  /** Placeholder shown when nothing is selected */
  placeholder?: string;
  /** Optional label shown above the create-row */
  createLabel?: string;
  /**
   * If provided, a "Добавить «query»" row appears when no options match.
   * The callback receives the raw search query.
   * It should create the entity and return the new id so the combobox can auto-select it.
   */
  onCreate?: (name: string) => Promise<string | number>;
  /** Extra class for the trigger button */
  className?: string;
  disabled?: boolean;
  /** Optional icon shown in the trigger button */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Generic entity combobox with search + optional "Add new" quick-create.
 *
 * Usage example:
 * ```tsx
 * <EntityCombobox
 *   value={contractorId}
 *   onChange={setContractorId}
 *   options={contractors.map(c => ({ id: c.id, label: c.name }))}
 *   placeholder={t('generated.vyberite_kontragenta')}
 *   onCreate={async (name) => {
 *     const res = await contractorsApi.create({ name });
 *     return res.data.id;
 *   }}
 * />
 * ```
 */
export function EntityCombobox({
  value,
  onChange,
  options,
  recentOptions,
  showRecentOnly = false,
  placeholder,
  createLabel,
  onCreate,
  className,
  disabled,
  icon: Icon,
}: EntityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const { t } = useTranslation();

  const selected = value != null
    ? options.find(o => String(o.id) === String(value))
    : undefined;

  const displayOptions = (query.trim() || !showRecentOnly || !recentOptions)
    ? options
    : recentOptions;

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : displayOptions;

  const hasExactMatch = options.some(
    o => o.label.toLowerCase() === query.trim().toLowerCase(),
  );

  const handleCreate = async () => {
    if (!onCreate || !query.trim()) return;
    setCreating(true);
    try {
      const newId = await onCreate(query.trim());
      onChange(newId);
      setOpen(false);
      setQuery('');
    } catch {
      // onCreate была отменена (пользователь закрыл дравер) — просто остановить спиннер
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal h-9',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {Icon && <Icon className="h-4 w-4 shrink-0 opacity-50" />}
            <span className="truncate">{selected ? selected.label : (placeholder || t('common.select_placeholder'))}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('generated.poisk')}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {filtered.length === 0 && !onCreate && (
              <CommandEmpty>{t('generated.nichego_ne_naydeno')}</CommandEmpty>
            )}

            {filtered.length === 0 && onCreate && !query.trim() && (
              <CommandEmpty>{t('generated.nachnite_vvodit_dlya_poiska')}</CommandEmpty>
            )}

            {filtered.length > 0 && (
              <CommandGroup>
                {filtered.map((option, index) => (
                  <CommandItem
                    key={`${String(option.id)}-${index}`}
                    value={String(option.id)}
                    onSelect={() => {
                      onChange(
                        String(option.id) === String(value) ? undefined : option.id,
                      );
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        String(value) === String(option.id) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Quick-create row */}
            {onCreate && query.trim() && !hasExactMatch && (
              <>
                {filtered.length > 0 && <CommandSeparator />}
                <CommandGroup heading={createLabel}>
                  <CommandItem
                    value="__create__"
                    onSelect={handleCreate}
                    disabled={creating}
                  >
                    {creating
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                    }
                    <span>
                      {t('generated.dobavit')} <strong>«{query.trim()}»</strong>
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

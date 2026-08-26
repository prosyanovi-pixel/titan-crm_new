import { useTranslation } from '@/lib/i18n';
import * as React from 'react';
import { ChevronsUpDown, PlusCircle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tag } from '@/components/ui/Tag';

export interface TagOption {
  /** Unique identifier (string or number) */
  id: string | number;
  /** Display text shown in the list and tag chip */
  name: string;
  /** Optional color for the tag chip */
  color?: string;
}

interface TagMultiSelectProps {
  /** Currently selected tag IDs (array of strings/numbers) */
  value: (string | number)[];
  /** Called when selection changes */
  onChange: (ids: (string | number)[]) => void;
  /** Full list of available tags */
  options: TagOption[];
  /** Placeholder shown when nothing is selected */
  placeholder?: string;
  /** Optional label shown above the create-row */
  createLabel?: string;
  /**
   * If provided, a "Добавить «query»" row appears when no options match.
   * The callback receives the raw search query.
   * It should create the tag and return the new id so the component can auto-select it.
   */
  onCreate?: (name: string) => Promise<string | number>;
  /** Extra class for the trigger button */
  className?: string;
  disabled?: boolean;
  /** Whether to show the selected tags as chips above the trigger */
  showTags?: boolean;
}

/**
 * Multi‑select tag component with chips display, search, and optional quick‑create.
 *
 * Usage example:
 * ```tsx
 * <TagMultiSelect
 *   value={selectedTagIds}
 *   onChange={setSelectedTagIds}
 *   options={tags.map(t => ({ id: t.id, name: t.name }))}
 *   placeholder="Добавить тег"
 *   onCreate={async (name) => {
 *     const res = await tagsApi.create({ name });
 *     return res.data.id;
 *   }}
 * />
 * ```
 */
export function TagMultiSelect({
  value,
  onChange,
  options,
  placeholder,
  createLabel,
  onCreate,
  className,
  disabled,
  showTags = true,
}: TagMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const { t } = useTranslation();

  const selectedTags = value
    .map(id => options.find(o => String(o.id) === String(id)))
    .filter((tag): tag is TagOption => tag !== undefined);

  const filtered = query.trim()
    ? options.filter(o =>
        !value.includes(o.id) &&
        o.name.toLowerCase().includes(query.toLowerCase())
      )
    : options.filter(o => !value.includes(o.id));

  const hasExactMatch = options.some(
    o => o.name.toLowerCase() === query.trim().toLowerCase(),
  );

  const handleSelect = (id: string | number) => {
    onChange([...value, id]);
    setQuery('');
    setOpen(false);
  };

  const handleRemove = (id: string | number) => {
    onChange(value.filter(v => String(v) !== String(id)));
  };

  const handleCreate = async () => {
    if (!onCreate || !query.trim()) return;
    setCreating(true);
    try {
      const newId = await onCreate(query.trim());
      onChange([...value, newId]);
      setOpen(false);
      setQuery('');
    } catch {
      // onCreate была отменена (пользователь закрыл дравер) — просто остановить спиннер
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected tags as chips */}
      {showTags && selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map(tag => (
            <Tag
              key={String(tag.id)}
              color={tag.color || '#3b82f6'}
              clickable={true}
              onClick={() => handleRemove(tag.id)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              {tag.name} <X className="ml-1 h-3 w-3 inline" />
            </Tag>
          ))}
        </div>
      )}

      {/* Popover trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal h-9 text-muted-foreground',
              className,
            )}
          >
            <span className="truncate">{placeholder || t('components.tag_multi_select.placeholder')}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('components.tag_multi_select.search_placeholder')}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {/* Available options */}
              {filtered.length > 0 && (
                <CommandGroup>
                  {filtered.map(option => (
                    <CommandItem
                      key={String(option.id)}
                      value={String(option.id)}
                      onSelect={() => handleSelect(option.id)}
                    >
                      {option.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Quick-create row */}
              {onCreate && query.trim() && !hasExactMatch && (
                <>
                  {filtered.length > 0 && <CommandSeparator />}
                  <CommandGroup heading={createLabel || t('components.tag_multi_select.create_label')}>
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
    </div>
  );
}
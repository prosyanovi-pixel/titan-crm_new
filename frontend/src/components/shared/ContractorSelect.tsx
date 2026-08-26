import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { useDebounce } from "../../hooks/use-debounce";

interface ContractorSelectProps {
  value?: string | number;
  onValueChange: (value: number | null, name: string) => void;
  placeholder?: string;
  isPrivateOnly?: boolean;
}

export function ContractorSelect({
  value,
  onValueChange,
  placeholder,
  isPrivateOnly = false,
}: ContractorSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [options, setOptions] = useState<{ id: number; name: string; inn?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (debouncedSearch) {
          queryParams.append("search", debouncedSearch);
        }
        if (isPrivateOnly) {
          queryParams.append("isPrivate", "true");
        }
        queryParams.append("limit", "10");

        const res = await api.get(`/contractors?${queryParams.toString()}`);
        if (isMounted) {
          setOptions(res.data || []);
          
          if (value && !selectedName) {
            const selected = (res.data || []).find((c: any) => c.id === Number(value));
            if (selected) {
              setSelectedName(selected.name);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch contractors for select", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOptions();
    
    return () => { isMounted = false; };
  }, [debouncedSearch, isPrivateOnly, value]);

  // If we have a value but no name, we might need a separate fetch just for that ID.
  // For simplicity, we just use the name if we found it in the list.

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-background"
        >
          {value ? selectedName || t("common.selected") : placeholder || t("contractor_sheet.placeholder.search_contractor")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder={t("common.search")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? t("common.loading") : t("common.no_results")}
            </CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.name}
                  onSelect={() => {
                    onValueChange(opt.id, opt.name);
                    setSelectedName(opt.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{opt.name}</span>
                    {opt.inn && (
                      <span className="text-[10px] text-muted-foreground">
                        {t("common.inn")}: {opt.inn}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

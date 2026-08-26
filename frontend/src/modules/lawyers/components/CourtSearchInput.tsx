import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Building2, Loader2, Search } from "lucide-react";

interface CourtSuggestion {
  name: string;
  dadataCode: string | null;
  courtType: string | null;
  courtTypeName: string | null;
  inn: string | null;
  address: string | null;
  legalAddress: string | null;
  website: string | null;
}

interface CourtSearchInputProps {
  value: string;
  onChange: (court: CourtSuggestion | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Поле поиска суда с автодополнением через DaData API.
 * При выборе — сохраняет суд в локальную БД через POST /api/courts/select.
 */
export function CourtSearchInput({
  value,
  onChange,
  placeholder = "Начните вводить название суда...",
  disabled = false,
  className,
}: CourtSearchInputProps) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<CourtSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [prevValue, setPrevValue] = useState(value);

  // Синхронизируем query с внешним value через derived state
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value || "");
  }

  // Закрываем дропдаун при клике вне компонента
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await api.post("/courts/suggest", { query: q, count: 8 });
      setSuggestions(results || []);
      setIsOpen((results || []).length > 0);
    } catch (err) {
      console.error("[CourtSearchInput] DaData suggest error:", err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);

    // Если поле очищено — сбрасываем выбор
    if (!q.trim()) {
      onChange(null);
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Дебаунс 300ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 300);
  };

  const handleSelect = async (court: CourtSuggestion) => {
    setQuery(court.name);
    setIsOpen(false);
    setSuggestions([]);

    // Сохраняем в локальную БД
    setIsSaving(true);
    try {
      await api.post("/courts/select", court);
    } catch (err) {
      console.error("[CourtSearchInput] Failed to save court:", err);
    } finally {
      setIsSaving(false);
    }

    onChange(court);
  };

  const courtTypeColors: Record<string, string> = {
    AS: "bg-blue-500/10 text-blue-600",
    AA: "bg-blue-500/10 text-blue-600",
    AO: "bg-blue-500/10 text-blue-600",
    AI: "bg-purple-500/10 text-purple-600",
    OS: "bg-green-500/10 text-green-600",
    AJ: "bg-green-500/10 text-green-600",
    KJ: "bg-orange-500/10 text-orange-600",
    KV: "bg-orange-500/10 text-orange-600",
    VS: "bg-red-500/10 text-red-600",
    RS: "bg-gray-500/10 text-gray-600",
    MS: "bg-gray-500/10 text-gray-600",
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        {(isLoading || isSaving) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin pointer-events-none" />
        )}
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-9"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border border-border rounded-md shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {suggestions.map((court, idx) => (
            <button
              key={court.dadataCode || idx}
              type="button"
              onClick={() => handleSelect(court)}
              className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-start gap-2.5 border-b border-border/50 last:border-0"
            >
              <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium truncate">{court.name}</span>
                  {court.courtType && (
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0",
                      courtTypeColors[court.courtType] || "bg-secondary text-secondary-foreground"
                    )}>
                      {court.courtType}
                    </span>
                  )}
                </div>
                {court.address && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{court.address}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

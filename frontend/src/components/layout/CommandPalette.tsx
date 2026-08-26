import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Briefcase, 
  CheckSquare, 
  FileText,
  Gavel,
  FileSignature,
  Package,
  Mail,
  Loader2,
  LayoutDashboard,
  Moon,
  Sun,
  PlusCircle,
  Settings
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/hooks/use-settings";

interface SearchResult {
  contractors: { id: number; name: string; type: string; entityType: 'contractor' }[];
  projects: { id: number; name: string; status: string; entityType: 'project' }[];
  tasks: { id: number; name: string; status: string; entityType: 'task' }[];
  documents?: { id: string; name: string; entityType: 'document' }[];
  legalCases?: { id: string; name: string; case_number: string; entityType: 'legal_case' }[];
  contracts?: { id: string; name: string; contract_number: string; entityType: 'contract' }[];
  products?: { id: string; name: string; sku: string; entityType: 'product' }[];
  mail?: { id: string; name: string; from_address: string; entityType: 'mail' }[];
}

export const OPEN_GLOBAL_SEARCH_EVENT = "open-global-search";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useSettings();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const handleCustomEvent = (e: Event) => {
      setOpen(true);
      if (e instanceof CustomEvent && e.detail?.query) {
        setQuery(e.detail.query);
      }
    };

    document.addEventListener("keydown", down);
    document.addEventListener(OPEN_GLOBAL_SEARCH_EVENT, handleCustomEvent);
    
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener(OPEN_GLOBAL_SEARCH_EVENT, handleCustomEvent);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery<SearchResult>({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return { contractors: [], projects: [], tasks: [] };
      const response = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
      return response;
    },
    enabled: debouncedQuery.trim().length > 0,
  });

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
    setQuery("");
  };

  const handleAction = (action: () => void) => {
    setOpen(false);
    action();
    setQuery("");
  };

  const hasResults = data && (
    data.contractors.length > 0 || 
    data.projects.length > 0 || 
    data.tasks.length > 0 ||
    (data.documents && data.documents.length > 0) ||
    (data.legalCases && data.legalCases.length > 0) ||
    (data.contracts && data.contracts.length > 0) ||
    (data.products && data.products.length > 0) ||
    (data.mail && data.mail.length > 0)
  );

  const isSearchMode = debouncedQuery.trim().length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} commandProps={{ shouldFilter: !isSearchMode }}>
      <CommandInput 
        placeholder={t("components.global_search.placeholder")} 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("components.global_search.searching")}
            </div>
          ) : isSearchMode ? (
            t("components.global_search.no_results")
          ) : (
            t("components.global_search.no_results")
          )}
        </CommandEmpty>

        {!isSearchMode && (
          <>
            <CommandGroup heading={t("common.actions")}>
              <CommandItem onSelect={() => handleAction(() => window.dispatchEvent(new CustomEvent('open-mail-compose')))} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-muted-foreground" />
                <span>{t("layout.command_palette.write_email")}</span>
              </CommandItem>
              <CommandItem onSelect={() => handleAction(() => navigate('/tasks?new=true'))} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-muted-foreground" />
                <span>{t("layout.command_palette.create_task")}</span>
              </CommandItem>
              <CommandItem onSelect={() => handleAction(() => navigate('/contractors?new=true'))} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-muted-foreground" />
                <span>{t("layout.command_palette.add_contractor")}</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading={t("common.navigation")}>
              <CommandItem onSelect={() => handleSelect('/')} className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                <span>{t("sidebar.dashboard")}</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/contractors')} className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{t("sidebar.contractors")}</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/projects')} className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{t("sidebar.projects")}</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/tasks')} className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span>{t("sidebar.tasks")}</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/mail')} className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{t("sidebar.mail")}</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading={t("common.settings")}>
              <CommandItem 
                onSelect={() => handleAction(() => setTheme(theme === 'dark' ? 'light' : 'dark'))} 
                className="flex items-center gap-2"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
                <span>{theme === 'dark' ? t("layout.command_palette.enable_light_theme") : t("layout.command_palette.enable_dark_theme")}</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/settings')} className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>{t("layout.command_palette.system_settings")}</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {isSearchMode && hasResults && (
          <>
            {data.contractors.length > 0 && (
              <CommandGroup heading={t("components.global_search.contractors")}>
                {data.contractors.map((item) => (
                  <CommandItem
                    key={`contractor-${item.id}`}
                    onSelect={() => handleSelect(`/contractors/${item.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data.projects.length > 0 && (
              <CommandGroup heading={t("components.global_search.projects")}>
                {data.projects.map((item) => (
                  <CommandItem
                    key={`project-${item.id}`}
                    onSelect={() => handleSelect(`/projects/${item.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data.tasks.length > 0 && (
              <CommandGroup heading={t("components.global_search.tasks")}>
                {data.tasks.map((item) => (
                  <CommandItem
                    key={`task-${item.id}`}
                    onSelect={() => handleSelect(`/tasks/${item.id}`)}
                    className="flex items-center gap-2"
                  >
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data.documents && data.documents.length > 0 && (
              <CommandGroup heading={t("modules.documents.title")}>
                {data.documents.map((item) => (
                  <CommandItem
                    key={`doc-${item.id}`}
                    onSelect={() => handleSelect(`/documents`)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data.legalCases && data.legalCases.length > 0 && (
              <CommandGroup heading={t("modules.legal_cases.title")}>
                {data.legalCases.map((item) => (
                  <CommandItem
                    key={`legal-${item.id}`}
                    onSelect={() => handleSelect(`/cases/${item.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Gavel className="h-4 w-4 text-muted-foreground" />
                    <span>{item.case_number ? `${item.case_number} - ` : ''}{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data.contracts && data.contracts.length > 0 && (
              <CommandGroup heading={t("modules.contracts.title")}>
                {data.contracts.map((item) => (
                  <CommandItem
                    key={`contract-${item.id}`}
                    onSelect={() => handleSelect(`/contracts/${item.id}`)}
                    className="flex items-center gap-2"
                  >
                    <FileSignature className="h-4 w-4 text-muted-foreground" />
                    <span>{item.contract_number ? `${item.contract_number} - ` : ''}{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data.products && data.products.length > 0 && (
              <CommandGroup heading={t("modules.products.title")}>
                {data.products.map((item) => (
                  <CommandItem
                    key={`product-${item.id}`}
                    onSelect={() => handleSelect(`/products/${item.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{item.sku ? `[${item.sku}] ` : ''}{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data.mail && data.mail.length > 0 && (
              <CommandGroup heading={t("modules.mail.title")}>
                {data.mail.map((item) => (
                  <CommandItem
                    key={`mail-${item.id}`}
                    onSelect={() => handleSelect(`/mail?threadId=${item.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground">{item.from_address}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

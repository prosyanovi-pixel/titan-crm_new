
import { useState, useEffect, useRef } from "react";
import { LucideIcon } from "lucide-react";
import { api } from "@/lib/api";

export interface SheetTabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  visible: boolean;
}

interface SavedSheetTabConfig {
  id: string;
  visible: boolean;
}

export function useSheetTabs(initialTabs: SheetTabConfig[], storageKey?: string) {
  const initialTabsRef = useRef<SheetTabConfig[]>();
  
  // Update ref when props change
  useEffect(() => {
    initialTabsRef.current = initialTabs;
  }, [initialTabs]);

  const [tabs, setTabs] = useState<SheetTabConfig[]>(initialTabs);
  // Initialize as "loaded" if no storageKey (no async loading needed)
  const [isLoaded, setIsLoaded] = useState(!storageKey);
  const lastSavedRef = useRef<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    if (storageKey) {
        const loadSettings = async () => {
            try {
                const saved = await api.get(`/user-settings/sheet-tabs-${storageKey}`);
                if (saved) {
                    const savedConfig = saved as SavedSheetTabConfig[]; // API returns parsed JSON
                    // Merge to restore icons (which aren't stored in DB)
                    const merged = savedConfig.map((s) => {
                      const original = initialTabsRef.current.find(t => t.id === s.id);
                        return original ? { ...original, visible: s.visible } : null;
                    }).filter(Boolean);
                    
                    if (merged.length === initialTabsRef.current.length) {
                        setTabs(merged);
                      lastSavedRef.current = JSON.stringify(merged.map(({ id, visible }) => ({ id, visible })));
                    } else {
                      lastSavedRef.current = JSON.stringify(initialTabsRef.current.map(({ id, visible }) => ({ id, visible })));
                    }
                  } else {
                    lastSavedRef.current = JSON.stringify(initialTabsRef.current.map(({ id, visible }) => ({ id, visible })));
                }
            } catch (e) {
                console.error("Error loading sheet tabs settings", e);
                  lastSavedRef.current = JSON.stringify(initialTabsRef.current.map(({ id, visible }) => ({ id, visible })));
            } finally {
                // Defer state update to avoid immediate setState in finally block
                setTimeout(() => setIsLoaded(true), 0);
            }
        };
        loadSettings();
    }
  }, [storageKey]); // Dependency only on storageKey to avoid repeated reload loops

  // Save settings on change
  useEffect(() => {
    if (storageKey && isLoaded) {
        const toSave = tabs.map(({ id, visible }) => ({ id, visible }));
        const serialized = JSON.stringify(toSave);

        if (serialized === lastSavedRef.current) {
            return;
        }

        // Use a timeout/debounce could be better, but for now direct save
        api.post('/user-settings', {
            key: `sheet-tabs-${storageKey}`,
            value: toSave
        })
          .then(() => {
            lastSavedRef.current = serialized;
          })
          .catch(e => console.error("Error saving tabs", e));
    }
  }, [tabs, storageKey, isLoaded]);

  const toggleTab = (id: string, checked: boolean) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, visible: checked } : t));
  };

  const moveTab = (index: number, direction: 'up' | 'down') => {
    const newTabs = [...tabs];
    if (direction === 'up' && index > 0) {
      [newTabs[index], newTabs[index - 1]] = [newTabs[index - 1], newTabs[index]];
    } else if (direction === 'down' && index < newTabs.length - 1) {
      [newTabs[index], newTabs[index + 1]] = [newTabs[index + 1], newTabs[index]];
    }
    setTabs(newTabs);
  };

  return {
    tabs,
    setTabs,
    toggleTab,
    moveTab
  };
}

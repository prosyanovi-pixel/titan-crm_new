import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { templatesApi } from '../api';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Copy } from 'lucide-react';

interface Variable {
  key: string;
  name?: string;
  description?: string;
  type?: string;
}

interface Props {
  moduleId: string;
  onSelect?: (variable: string) => void;
}

export const TemplateVariablesList = ({ moduleId, onSelect }: Props) => {
  const { t } = useTranslation();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadVariables = async () => {
      if (!moduleId) {
        setVariables(prev => prev.length ? [] : prev);
        return;
      }

      setLoading(true);
      try {
        const fields = await templatesApi.getModuleFields(moduleId);
        if (isMounted) {
          setVariables(fields);
        }
      } catch (err) {
        console.error('Failed to fetch template fields:', err);
        if (isMounted) setVariables([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadVariables();

    return () => {
      isMounted = false;
    };
  }, [moduleId]);

  const handleCopy = (variable: Variable) => {
    let text = `{${variable.key}}`;
    
    // docxtemplater logic for arrays and conditionals
    if (variable.type === 'array' || variable.type === 'boolean') {
      text = `{#${variable.key}}\n\n{/${variable.key}}`;
    }

    navigator.clipboard.writeText(text);
    setCopiedId(variable.key);
    
    if (onSelect) {
      onSelect(text);
    }

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground p-4">Загрузка переменных...</div>;
  }

  if (variables.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-md bg-muted/20">
      <div className="p-3 border-b bg-muted/40">
        <h4 className="text-sm font-medium">{t('templates.variables')}</h4>
        <p className="text-xs text-muted-foreground mt-1">
          {t('templates.variablesHelp')}
        </p>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="p-3 space-y-2">
          {variables.map((v, i) => (
            <div 
              key={`${v.key}-${i}`} 
              className="flex flex-col gap-1 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors group"
              onClick={() => handleCopy(v)}
            >
              <div className="flex items-center justify-between">
                <Badge variant={v.type === 'array' || v.type === 'boolean' ? 'secondary' : 'outline'} className="font-mono text-xs group-hover:border-primary group-hover:text-primary transition-colors">
                  {v.type === 'array' || v.type === 'boolean' ? `{#${v.key}}` : `{${v.key}}`}
                </Badge>
                {copiedId === v.key ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              {(v.name || v.description) && (
                <span className="text-xs text-muted-foreground leading-tight mt-1">
                  {v.name && <span className="font-semibold">{v.name}</span>}
                  {v.name && v.description && " - "}
                  {v.description}
                </span>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useTemplates } from '../hooks/useTemplates';
import { templatesApi } from '../api';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DocumentWizardDialog } from './DocumentWizardDialog';
import { Template } from '../types';

interface Props {
  moduleId: string;
  entityId: string | number;
  autoAttach?: boolean;
  clientEmail?: string;
}

import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';

export const TemplateGeneratorButton = ({ moduleId, entityId, autoAttach = true, clientEmail = '' }: Props) => {
  const { t } = useTranslation();
  const { data: templates } = useTemplates();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { hasPermission } = usePermission();
  const canRead = hasPermission(PERMISSIONS.templates.read);

  // Filter templates by module
  const moduleTemplates = templates?.filter(t => t.moduleId === moduleId) || [];

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  if (!canRead || moduleTemplates.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          {t('templates.generate')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {moduleTemplates.map(template => (
          <DropdownMenuItem key={template.id} onClick={() => setSelectedTemplate(template)}>
            {template.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>

    <DocumentWizardDialog 
      open={!!selectedTemplate} 
      onOpenChange={(open) => !open && setSelectedTemplate(null)} 
      template={selectedTemplate} 
      moduleId={moduleId} 
      entityId={entityId} 
    />
    </>
  );
};

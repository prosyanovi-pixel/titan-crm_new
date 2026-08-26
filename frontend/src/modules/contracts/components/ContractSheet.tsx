/**
 * ContractSheet — side drawer for creating/editing a contract.
 * Uses ResizableSheet for consistent look & feel across the app.
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { FileText, MessageSquare, Info } from 'lucide-react';
import { ResizableSheet } from '@/components/shared';
import { ContractForm } from './ContractForm';
import { CommentsSection } from '@/components/shared/CommentsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Contract } from '../types/contract.types';

interface ContractSheetProps {
  contract?: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultProjectId?: number;
  defaultContractorId?: number;
}

/**
 * Side-drawer sheet for creating or editing a contract.
 * Wraps ContractForm inside ResizableSheet to match the rest of the app.
 */
export function ContractSheet({ contract, open, onOpenChange, onSuccess, defaultProjectId, defaultContractorId }: ContractSheetProps) {
  const { t } = useTranslation();
  const isEditing = !!contract;

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const title = isEditing
    ? (contract?.name || t('contracts.sheet.title_edit'))
    : t('contracts.sheet.title_new');

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-semibold truncate">{title}</span>
        </div>
      }
      description={isEditing ? t('contracts.sheet.description_edit') : t('contracts.sheet.description_new')}
      moduleKey="contract-sheet"
      defaultWidth="lg"
      hideFooter={true}
    >
      <div className="flex-1 overflow-y-auto">
        {isEditing ? (
          <Tabs defaultValue="general" className="w-full h-full flex flex-col">
            <div className="px-6 pt-2">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="general" className="gap-2">
                  <Info className="w-3.5 h-3.5" />
                  {t('sheet.tabs.overview')}
                </TabsTrigger>
                <TabsTrigger value="comments" className="gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {t('components.comments.title')}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="general" className="flex-1 m-0 p-0 border-0 outline-none h-full">
              <ContractForm 
                contract={contract || undefined} 
                onSuccess={handleSuccess} 
                onCancel={() => onOpenChange(false)} 
                defaultProjectId={defaultProjectId}
                defaultContractorId={defaultContractorId}
              />
            </TabsContent>
            
            <TabsContent value="comments" className="flex-1 m-0 p-6 border-0 outline-none h-full">
              <CommentsSection entityType="contract" entityId={String(contract.id)} />
            </TabsContent>
          </Tabs>
        ) : (
          <ContractForm 
            contract={undefined} 
            onSuccess={handleSuccess} 
            onCancel={() => onOpenChange(false)} 
            defaultProjectId={defaultProjectId}
            defaultContractorId={defaultContractorId}
          />
        )}
      </div>
    </ResizableSheet>
  );
}

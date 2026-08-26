import React from 'react';
import { usePageSettings } from "@/context/LayoutContext";
import { useTranslation } from "@/lib/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { useTrash } from "../hooks/useTrash";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function TrashPage() {
  const { t } = useTranslation();
  const { trashItems, isLoading, restoreItem, deleteItem, emptyTrash, isEmptying } = useTrash();

  usePageSettings({
    title: t('common.trash'),
    actions: (
      <Button 
        variant="destructive" 
        onClick={() => {
          if (confirm(t('common.messages.confirm_empty_trash'))) {
            emptyTrash();
          }
        }}
        disabled={isEmptying || trashItems.length === 0}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {t('common.empty_trash')}
      </Button>
    )
  });

  const moduleNames: Record<string, string> = {
    projects: t('common.modules.projects'),
    tasks: t('common.modules.tasks'),
    contractors: t('common.modules.contractors'),
    contracts: t('common.modules.contracts'),
    products: t('common.modules.products'),
    marketing_campaigns: t('common.modules.marketing'),
    documents: t('common.modules.documents'),
  };

  return (
    <div className="p-6">
      {isLoading ? (
        <div>Loading...</div>
      ) : trashItems.length === 0 ? (
        <EmptyState 
          title={t('common.messages.trash_empty_title')}
          description={t('common.messages.trash_empty_desc')}
          icon={Trash2}
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.module')}</TableHead>
                <TableHead>{t('common.deleted_at')}</TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trashItems.map((item) => (
                <TableRow key={`${item.module}-${item.id}`}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{moduleNames[item.module] || item.module}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.deleted_at ? format(new Date(item.deleted_at), 'dd.MM.yyyy HH:mm') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => restoreItem({ module: item.module, id: item.id })}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t('common.restore')}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (confirm(t('common.messages.confirm_delete'))) {
                            deleteItem({ module: item.module, id: item.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

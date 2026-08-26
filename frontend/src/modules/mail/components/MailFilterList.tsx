import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Filter,
  Edit2,
  Trash2,
  Play,
  Folder,
  Star,
  CheckCircle,
  Forward,
  Trash,
} from 'lucide-react';
import {
  MailFilter,
  CONDITION_TYPES,
  OPERATORS,
} from './MailFilterTypes';
import { ApiMailFolder } from '../types';

interface MailFilterListProps {
  filters: MailFilter[];
  folders: ApiMailFolder[];
  loading: boolean;
  applyingFilter: string | null;
  onEdit: (filter: MailFilter) => void;
  onDelete: (filterId: string) => void;
  onToggleActive: (filter: MailFilter) => void;
  onApplyFilter: (filterId: string) => void;
  onAddNew: () => void;
}

const conditionTypes = CONDITION_TYPES;
const operators = OPERATORS;

function getActionDescription(
  filter: MailFilter,
  folders: ApiMailFolder[],
  t: (key: string, options?: Record<string, string | number>) => string
): string {
  const actions: string[] = [];

  if (filter.targetFolderId) {
    const folder = folders.find((f) => f.id === filter.targetFolderId);
    actions.push(`${t('mail.filters.move_to_folder')} ${folder?.folderName || t('mail.filters.folder')}`);
  }

  if (filter.applyRead) actions.push(t('mail.filters.mark_as_read'));
  if (filter.applyStar) actions.push(t('mail.filters.apply_star'));
  if (filter.deleteMail) actions.push(t('mail.filters.delete_mail'));
  if (filter.forwardTo) actions.push(`${t('mail.filters.forward_to')} ${filter.forwardTo}`);

  return actions.join(', ') || t('common.no_actions');
}

function getActionIcon(filter: MailFilter): React.ReactNode {
  if (filter.deleteMail) return <Trash className="h-4 w-4 text-destructive" />;
  if (filter.forwardTo) return <Forward className="h-4 w-4" />;
  if (filter.targetFolderId) return <Folder className="h-4 w-4" />;
  if (filter.applyStar) return <Star className="h-4 w-4" />;
  if (filter.applyRead) return <CheckCircle className="h-4 w-4" />;
  return <Filter className="h-4 w-4" />;
}

export function MailFilterList({
  filters,
  folders,
  loading,
  applyingFilter,
  onEdit,
  onDelete,
  onToggleActive,
  onApplyFilter,
  onAddNew,
}: MailFilterListProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFilters = useMemo(() => {
    return filters.filter((filter) =>
      filter.filterName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filters, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">{t('mail.filters.loading')}</div>
      </div>
    );
  }

  if (filters.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{t('mail.filters.empty')}</p>
        <p className="text-sm">{t('mail.filters.empty_desc')}</p>
        <Button onClick={onAddNew} className="mt-4" size="sm">
          {t('mail.filters.create_new')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder={t('mail.search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button onClick={onAddNew} size="sm" className="gap-2">
          {t('mail.filters.create_new')}
        </Button>
      </div>

      {filteredFilters.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          {t('mail.filters.empty')}
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {filteredFilters.map((filter) => (
            <AccordionItem key={filter.id} value={filter.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  {getActionIcon(filter)}
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{filter.filterName}</span>
                      <Badge variant={filter.isActive ? 'default' : 'secondary'}>
                        {filter.isActive ? t('mail.filters.activate') : t('mail.filters.deactivate')}
                      </Badge>
                      <Badge variant="outline">
                        {filter.matchType === 'all' ? t('mail.filters.match_all') : t('mail.filters.match_any')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {filter.description || getActionDescription(filter, folders, t)}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  {/* Условия */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t('mail.filters.conditions')}</h4>
                    <div className="space-y-2">
                      {filter.conditions?.map((condition, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">
                            {t(`mail.filters.${condition.conditionType}`)}
                          </Badge>
                          <span className="text-muted-foreground">
                            {t(operators.find((o) => o.value === condition.operator)?.labelKey || '')}
                          </span>
                          <span className="font-mono bg-muted px-2 py-0.5 rounded">
                            {condition.conditionValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Действия */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t('mail.filters.actions')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {getActionDescription(filter, folders, t)
                        .split(', ')
                        .map((action, i) => (
                          <Badge key={i} variant="secondary">
                            {action}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  {/* Кнопки управления */}
                  <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(filter)}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleActive(filter)}
                    >
                      {filter.isActive ? t('mail.filters.deactivate') : t('mail.filters.activate')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApplyFilter(filter.id)}
                      disabled={applyingFilter === filter.id || !filter.isActive}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      {applyingFilter === filter.id ? t('mail.filters.applying') : t('mail.filters.apply_filter')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(filter.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}


import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Folder,
  Star,
  CheckCircle,
  Trash,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  FilterCondition,
  MailFolder,
  MailFilter,
  CONDITION_TYPES,
  OPERATORS,
} from './MailFilterTypes';

interface MailFilterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFilter: MailFilter | null;
  folders: MailFolder[];
  filterName: string;
  onFilterNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  matchType: 'all' | 'any';
  onMatchTypeChange: (value: 'all' | 'any') => void;
  conditions: FilterCondition[];
  onAddCondition: () => void;
  onRemoveCondition: (index: number) => void;
  onUpdateCondition: (index: number, field: keyof FilterCondition, value: string | boolean) => void;
  targetFolderId: string;
  onTargetFolderChange: (value: string) => void;
  applyStar: boolean;
  onApplyStarChange: (value: boolean) => void;
  applyRead: boolean;
  onApplyReadChange: (value: boolean) => void;
  deleteMail: boolean;
  onDeleteMailChange: (value: boolean) => void;
  forwardTo: string;
  onForwardToChange: (value: string) => void;
  onSave: () => void;
}

const conditionTypes = CONDITION_TYPES;
const operators = OPERATORS;

export function MailFilterForm({
  open,
  onOpenChange,
  editingFilter,
  folders,
  filterName,
  onFilterNameChange,
  description,
  onDescriptionChange,
  matchType,
  onMatchTypeChange,
  conditions,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
  targetFolderId,
  onTargetFolderChange,
  applyStar,
  onApplyStarChange,
  applyRead,
  onApplyReadChange,
  deleteMail,
  onDeleteMailChange,
  forwardTo,
  onForwardToChange,
  onSave,
}: MailFilterFormProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingFilter ? t('mail.filters.edit') : t('mail.filters.create_new')}
          </DialogTitle>
          <DialogDescription>
            {t('mail.filters.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Название и описание */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filterName">{t('mail.filters.name')} *</Label>
              <Input
                id="filterName"
                value={filterName}
                onChange={(e) => onFilterNameChange(e.target.value)}
                placeholder={t('mail.filters.name_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('mail.filters.description')}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder={t('mail.filters.description_placeholder')}
              />
            </div>
          </div>

          {/* Тип соответствия */}
          <div className="space-y-2">
            <Label>{t('mail.filters.match_type')}</Label>
            <Select value={matchType} onValueChange={onMatchTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('mail.filters.match_any')}</SelectItem>
                <SelectItem value="all">{t('mail.filters.match_all')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Условия */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('mail.filters.conditions')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddCondition}
              >
                <Plus className="w-3.5 h-3.5" />
                {t('mail.filters.add_condition')}
              </Button>
            </div>
            <div className="space-y-2">
              {conditions.map((condition, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 border rounded-md">
                  <Select
                    value={condition.conditionType}
                    onValueChange={(v) => onUpdateCondition(idx, 'conditionType', v)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(type.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(v) => onUpdateCondition(idx, 'operator', v)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {t(op.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {condition.conditionType !== 'has_attachment' && (
                    <Input
                      value={condition.conditionValue}
                      onChange={(e) => onUpdateCondition(idx, 'conditionValue', e.target.value)}
                      placeholder={t('mail.filters.condition_value')}
                      className="flex-1"
                    />
                  )}

                  {conditions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveCondition(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Действия */}
          <div className="space-y-3">
            <Label>{t('mail.filters.actions')}</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  <Label htmlFor="targetFolder" className="cursor-pointer">
                    {t('mail.filters.move_to_folder')}
                  </Label>
                </div>
                <Select value={targetFolderId || ''} onValueChange={onTargetFolderChange}>
                  <SelectTrigger className="w-[150px]" id="targetFolder">
                    <SelectValue placeholder={t('mail.select_account')} />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.folderName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <Label htmlFor="applyStar" className="cursor-pointer">
                    {t('mail.filters.apply_star')}
                  </Label>
                </div>
                <Switch id="applyStar" checked={applyStar} onCheckedChange={onApplyStarChange} />
              </div>

              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <Label htmlFor="applyRead" className="cursor-pointer">
                    {t('mail.filters.mark_as_read')}
                  </Label>
                </div>
                <Switch id="applyRead" checked={applyRead} onCheckedChange={onApplyReadChange} />
              </div>

              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Trash className="w-4 h-4 text-destructive" />
                  <Label htmlFor="deleteMail" className="cursor-pointer">
                    {t('mail.filters.delete_mail')}
                  </Label>
                </div>
                <Switch id="deleteMail" checked={deleteMail} onCheckedChange={onDeleteMailChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forwardTo">{t('mail.filters.forward_to')}</Label>
              <Input
                id="forwardTo"
                type="email"
                value={forwardTo}
                onChange={(e) => onForwardToChange(e.target.value)}
                placeholder={t('mail.filters.forward_email_placeholder')}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave}>
            {editingFilter ? t('common.save') : t('mail.filters.create_new')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


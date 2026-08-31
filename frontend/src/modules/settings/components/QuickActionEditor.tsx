import React, { useState } from 'react';
import {
  Plus, Trash2, Edit2, Check, X, Zap,
  Mail, StickyNote, FileSignature, Calendar, Download,
  Send, Phone, MessageSquare, FileText, Folder, Bookmark, RotateCcw,
  ArrowUp, ArrowDown, PenSquare, FileWarning, DollarSign,
  UserPlus, FolderPlus, CheckSquare, User, RefreshCw, Gavel,
  ArrowRight, Paperclip, UserCog, Flag, List, FilePlus,
  UserCheck, Upload, PlusCircle, Video, Bell, Search, Briefcase, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { QuickAction, ModuleItem } from "../types";
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface QuickActionEditorProps {
  quickActions: QuickAction[];
  onSave: (actions: QuickAction[]) => void;
  selectedModule: string;
  modules: ModuleItem[];
}

// Icon mapping for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Plus, Mail, StickyNote, FileSignature, Calendar, Download,
  Send, Phone, MessageSquare, FileText, Folder, Bookmark, Trash2, RotateCcw,
  PenSquare, FileWarning, DollarSign, UserPlus, FolderPlus, CheckSquare,
  User, RefreshCw, Gavel, ArrowRight, Paperclip, UserCog, Flag, List,
  FilePlus, UserCheck, Upload, PlusCircle, Video, Bell, Search, Briefcase, ArrowLeft
};

export function QuickActionEditor({ quickActions, onSave, selectedModule, modules }: QuickActionEditorProps) {
  const { t } = useTranslation();

  const iconOptions = [
    { value: 'Plus', label: t('settings.icons.plus') },
    { value: 'Mail', label: t('settings.icons.mail') },
    { value: 'StickyNote', label: t('settings.icons.sticky_note') },
    { value: 'FileSignature', label: t('settings.icons.file_signature') },
    { value: 'Calendar', label: t('settings.icons.calendar') },
    { value: 'Download', label: t('settings.icons.download') },
    { value: 'Send', label: t('settings.icons.send') },
    { value: 'Phone', label: t('settings.icons.phone') },
    { value: 'MessageSquare', label: t('settings.icons.message_square') },
    { value: 'FileText', label: t('settings.icons.file_text') },
    { value: 'Folder', label: t('settings.icons.folder') },
    { value: 'Bookmark', label: t('settings.icons.bookmark') },
    { value: 'DollarSign', label: t('settings.icons.dollar_sign') },
    { value: 'UserPlus', label: t('settings.icons.user_plus') },
    { value: 'FolderPlus', label: t('settings.icons.folder_plus') },
    { value: 'CheckSquare', label: t('settings.icons.check_square') },
    { value: 'User', label: t('settings.icons.user') },
    { value: 'RefreshCw', label: t('settings.icons.refresh_cw') },
    { value: 'Gavel', label: t('settings.icons.gavel') },
    { value: 'ArrowRight', label: t('settings.icons.arrow_right') },
    { value: 'Paperclip', label: t('settings.icons.paperclip') },
    { value: 'UserCog', label: t('settings.icons.user_cog') },
    { value: 'Flag', label: t('settings.icons.flag') },
    { value: 'List', label: t('settings.icons.list') },
    { value: 'FilePlus', label: t('settings.icons.file_plus') },
    { value: 'UserCheck', label: t('settings.icons.user_check') },
    { value: 'Upload', label: t('settings.icons.upload') },
    { value: 'PlusCircle', label: t('settings.icons.plus_circle') },
    { value: 'Video', label: t('settings.icons.video') },
    { value: 'Bell', label: t('settings.icons.bell') },
    { value: 'Search', label: t('settings.icons.search') },
    { value: 'Briefcase', label: t('settings.icons.briefcase') },
    { value: 'ArrowLeft', label: t('settings.icons.arrow_left') },
    { value: 'Trash2', label: t('settings.icons.trash2') },
    { value: 'RotateCcw', label: t('settings.icons.rotate_ccw') },
    { value: 'PenSquare', label: t('settings.icons.pen_square') },
    { value: 'FileWarning', label: t('settings.icons.file_warning') },
  ];

  const actionTypes = [
    { value: 'create_task', label: t('settings.action_types.create_task') },
    { value: 'create_project', label: t('settings.action_types.create_project') },
    { value: 'create_invoice', label: t('settings.action_types.create_invoice') },
    { value: 'record_payment', label: t('settings.action_types.record_payment') },
    { value: 'create_case', label: t('settings.action_types.create_case') },
    { value: 'add_contractor', label: t('settings.action_types.add_contractor') },
    { value: 'send_email', label: t('settings.action_types.send_email') },
    { value: 'send_invoice', label: t('settings.action_types.send_invoice') },
    { value: 'add_note', label: t('settings.action_types.add_note') },
    { value: 'create_contract', label: t('settings.action_types.create_contract') },
    { value: 'schedule_meeting', label: t('settings.action_types.schedule_meeting') },
    { value: 'export_report', label: t('settings.action_types.export_report') },
    { value: 'make_call', label: t('settings.action_types.make_call') },
    { value: 'call', label: t('settings.action_types.call') },
    { value: 'create_document', label: t('settings.action_types.create_document') },
    { value: 'generate_document', label: t('settings.action_types.generate_document') },
    { value: 'mark_paid', label: t('settings.action_types.mark_paid') },
    { value: 'recalculate_status', label: t('settings.action_types.recalculate_status') },
    { value: 'assign_manager', label: t('settings.action_types.assign_manager') },
    { value: 'assign_task', label: t('settings.action_types.assign_task') },
    { value: 'assign_lawyer', label: t('settings.action_types.assign_lawyer') },
    { value: 'change_status', label: t('settings.action_types.change_status') },
    { value: 'view_tasks', label: t('settings.action_types.view_tasks') },
    { value: 'add_comment', label: t('settings.action_types.add_comment') },
    { value: 'attach_file', label: t('settings.action_types.attach_file') },
    { value: 'upload_document', label: t('settings.action_types.upload_document') },
    { value: 'create_event', label: t('settings.action_types.create_event') },
    { value: 'create_reminder', label: "Создать напоминание" },
    { value: 'set_reminder', label: t('settings.action_types.set_reminder') },
    { value: 'day_view', label: t('settings.action_types.day_view') },
    { value: 'add_event', label: t('settings.action_types.add_event') },
    { value: 'financial_details', label: t('settings.action_types.financial_details') },
    { value: 'send_to_court', label: t('settings.action_types.send_to_court') },
    { value: 'return_to_claim', label: t('settings.action_types.return_to_claim') },
    { value: 'create_claim', label: t('settings.action_types.create_claim') },
    { value: 'edit', label: t('settings.action_types.edit') },
    { value: 'add_document', label: t('settings.action_types.add_document') },
    { value: 'create_folder', label: t('settings.action_types.create_folder') },
    { value: 'search_documents', label: t('settings.action_types.search_documents') },
    { value: 'export_documents', label: t('settings.action_types.export_documents') },
    { value: 'delete', label: t('settings.action_types.delete') },
    { value: 'archive', label: t('settings.action_types.archive') },
    { value: 'create_report', label: t('settings.action_types.create_report') },
    { value: 'create_campaign', label: t('settings.action_types.create_campaign') },
    { value: 'transfer', label: t('settings.action_types.transfer') },
    { value: 'create_service', label: t('settings.action_types.create_service') },
    { value: 'create_price_list', label: t('settings.action_types.create_price_list') },
    { value: 'create_group', label: t('settings.action_types.create_group') },
    { value: 'create_product', label: t('settings.action_types.create_product') },
    { value: 'receive', label: t('settings.action_types.receive') },
    { value: 'send_for_approval', label: t('settings.action_types.send_for_approval') },
  ];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('Plus');
  const [editAction, setEditAction] = useState('create_task');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('Plus');
  const [newAction, setNewAction] = useState('create_task');

  const filteredActions = quickActions.filter(a => a.module === selectedModule);

  const handleEdit = (action: QuickAction) => {
    setEditingId(action.id);
    setEditName(action.name);
    setEditIcon(action.icon);
    setEditAction(action.action);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingId) return;
    
    // Проверка на дубликаты
    const isDuplicate = filteredActions.some(
      a => a.id !== editingId && a.action === editAction
    );
    if (isDuplicate) {
      toast.error(t('settings.errors.duplicate_action', { defaultValue: 'Такое действие уже существует' }));
      return;
    }

    try {
      const actionToUpdate = quickActions.find(a => a.id === editingId);
      if (!actionToUpdate) return;
      
      const updatedAction = {
        ...actionToUpdate,
        name: editName.trim(),
        icon: editIcon,
        action: editAction
      };
      
      // Update via API
      await api.put(`/quick-actions/${editingId}`, {
        name: updatedAction.name,
        icon: updatedAction.icon,
        action: updatedAction.action,
        module: updatedAction.module,
      });
      
      const updated = quickActions.map(a =>
        a.id === editingId ? updatedAction : a
      );
      onSave(updated);
      setEditingId(null);
      toast.success(t('toast.success.quick_action_updated'));
    } catch (error) {
      console.error('Error updating quick action:', error);
      toast.error(t('toast.error.quick_action_save'));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditIcon('Plus');
    setEditAction('create_task');
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;

    // Проверка на дубликаты
    const isDuplicate = filteredActions.some(
      a => a.action === newAction
    );
    if (isDuplicate) {
      toast.error(t('settings.errors.duplicate_action', { defaultValue: 'Такое действие уже существует' }));
      return;
    }

    try {
      const newQuickActionData = {
        name: newName.trim(),
        icon: newIcon,
        action: newAction,
        module: selectedModule,
      };
      
      // Create via API
      const response = await api.post('/quick-actions', newQuickActionData);
      
      // Convert API response to QuickAction interface
      const newQuickAction: QuickAction = {
        id: response.id,
        name: response.name,
        icon: response.icon,
        action: response.action,
        module: response.module
      };
      
      onSave([...quickActions, newQuickAction]);
      setNewName('');
      setNewIcon('Plus');
      setNewAction('create_task');
      setIsAdding(false);
      toast.success(t('toast.success.quick_action_created'));
    } catch (error) {
      console.error('Error creating quick action:', error);
      toast.error(t('toast.error.quick_action_create'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete via API
      await api.delete(`/quick-actions/${id}`);
      
      onSave(quickActions.filter(a => a.id !== id));
      toast.success(t('toast.success.quick_action_deleted'));
    } catch (error) {
      console.error('Error deleting quick action:', error);
      toast.error(t('toast.error.quick_action_delete'));
      // Still update local state even if API fails
      onSave(quickActions.filter(a => a.id !== id));
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newFilteredList = [...filteredActions];
    if (direction === 'up' && index > 0) {
      [newFilteredList[index], newFilteredList[index - 1]] = [newFilteredList[index - 1], newFilteredList[index]];
    } else if (direction === 'down' && index < newFilteredList.length - 1) {
      [newFilteredList[index], newFilteredList[index + 1]] = [newFilteredList[index + 1], newFilteredList[index]];
    }

    // Reconstruct the global list preserving items from other modules
    const otherActions = quickActions.filter(a => a.module !== selectedModule);
    // Combine items from other modules with the reordered items for current module
    const newGlobalList = [...otherActions, ...newFilteredList];
    
    // Save to trigger backend update via hook
    onSave(newGlobalList);
  };

  const IconSelectContent = (value: string, onChange: (val: string) => void) => (
    <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40 h-8">
            <SelectValue />
        </SelectTrigger>
            <SelectContent>
              {iconOptions
                .filter(opt => opt.value !== undefined && opt.value !== null && String(opt.value) !== '')
                .map(option => {
                const IconComponent = iconMap[option.value] || Plus;
                return (
                  <SelectItem key={String(option.value)} value={String(option.value)}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {t('settings.actions.for_module').replace('{module}', modules.find(m => m.id === selectedModule)?.name || '')}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('common.add')}
        </Button>
      </div>

      <div className="space-y-2">
        {filteredActions.map((action, index) => {
          const DisplayIcon = iconMap[action.icon] || Plus;
          return (
            <div
                key={action.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card group"
            >
                {editingId === action.id ? (
                <>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-8"
                        placeholder={t('settings.actions.name_placeholder')}
                    />
                    {IconSelectContent(editIcon, setEditIcon)}
                    <Select value={editAction} onValueChange={setEditAction}>
                        <SelectTrigger className="w-48 h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {actionTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveEdit}>
                        <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 text-destructive" />
                    </Button>
                </>
                ) : (
                <>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary">
                        <DisplayIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{action.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {actionTypes.find(t => t.value === action.action)?.label || action.action}
                    </span>
                    <div className="flex-1" />
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                      >
                          <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === filteredActions.length - 1}
                      >
                          <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={action.isActive !== false}
                        onCheckedChange={async (checked) => {
                          try {
                            const updatedAction = { ...action, isActive: checked };
                            await api.put(`/quick-actions/${action.id}`, updatedAction);
                            const updated = quickActions.map(a => a.id === action.id ? updatedAction : a);
                            onSave(updated);
                            toast.success(t('toast.success.quick_action_updated'));
                          } catch (error) {
                            console.error('Error toggling quick action:', error);
                            toast.error(t('toast.error.quick_action_save'));
                          }
                        }}
                      />
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(action)}>
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(action.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                </>
                )}
            </div>
          );
        })}

        {isAdding && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-primary/5">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 h-8"
              placeholder={t('settings.actions.name_placeholder')}
              autoFocus
            />
            {IconSelectContent(newIcon, setNewIcon)}
            <Select value={newAction} onValueChange={setNewAction}>
              <SelectTrigger className="w-48 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAdd}>
              <Check className="w-4 h-4 text-green-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsAdding(false)}>
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        )}

        {filteredActions.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('settings.actions.no_actions')}
          </p>
        )}
      </div>
    </div>
  );
}
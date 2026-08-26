import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Plus, Edit2 } from 'lucide-react';

interface EventType {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

const DEFAULT_EVENT_TYPES: EventType[] = [
  { id: 'meeting', name: 'Встреча', color: '#3b82f6', isDefault: true },
  { id: 'task', name: 'Задача', color: '#10b981', isDefault: true },
  { id: 'call', name: 'Звонок', color: '#f59e0b', isDefault: true },
  { id: 'court', name: 'Суд', color: '#ef4444', isDefault: true },
  { id: 'project', name: 'Проект', color: '#8b5cf6', isDefault: true },
  { id: 'reminder', name: 'Напоминание', color: '#ec4899', isDefault: true },
  { id: 'personal', name: 'Личное', color: '#6366f1', isDefault: true },
];

const COLOR_OPTIONS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#6366f1', '#14b8a6', '#f97316', '#a855f7', '#0ea5e9',
];

export function EventTypesPanel() {
  const { t } = useTranslation();
  const [eventTypes, setEventTypes] = useState<EventType[]>(() => {
    const stored = localStorage.getItem('calendar-event-types');
    return stored ? JSON.parse(stored) : DEFAULT_EVENT_TYPES;
  });
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#3b82f6' });

  const saveEventTypes = (types: EventType[]) => {
    setEventTypes(types);
    localStorage.setItem('calendar-event-types', JSON.stringify(types));
  };

  const handleAdd = () => {
    if (!formData.name.trim()) return;
    const newType: EventType = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      color: formData.color,
    };
    saveEventTypes([...eventTypes, newType]);
    setFormData({ name: '', color: '#3b82f6' });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (id: string) => {
    const type = eventTypes.find(t => t.id === id);
    if (type) {
      setEditingId(id);
      setFormData({ name: type.name, color: type.color });
      setIsAddDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (!formData.name.trim()) return;
    setEventTypes(prev => prev.map(t =>
      t.id === editingId ? { ...t, name: formData.name, color: formData.color } : t
    ));
    saveEventTypes(eventTypes.map(t =>
      t.id === editingId ? { ...t, name: formData.name, color: formData.color } : t
    ));
    setEditingId(null);
    setFormData({ name: '', color: '#3b82f6' });
    setIsAddDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const type = eventTypes.find(t => t.id === id);
    if (type?.isDefault) {
      alert(t('calendar.event_types.cannot_delete_default') ?? 'Невозможно удалить типы по умолчанию');
      return;
    }
    saveEventTypes(eventTypes.filter(t => t.id !== id));
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingId(null);
    setFormData({ name: '', color: '#3b82f6' });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('calendar.event_types.title') ?? 'Типы событий'}</CardTitle>
            <CardDescription>
              {t('calendar.event_types.description') ?? 'Управление типами событий календаря и их цветами'}
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('common.add') ?? 'Добавить'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {eventTypes.map((eventType) => (
            <div
              key={eventType.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: eventType.color }}
                />
                <div>
                  <p className="font-medium">{eventType.isDefault ? t(`calendar.event_types.${eventType.id}`) : eventType.name}</p>
                  {eventType.isDefault && (
                    <p className="text-xs text-muted-foreground">{t('calendar.event_types.panel.default_badge')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(eventType.id)}
                  className="gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                {!eventType.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(eventType.id)}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Dialog for Add/Edit */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('calendar.event_types.panel.edit_title') : t('calendar.event_types.panel.add_title')}
            </DialogTitle>
            <DialogDescription>
              {t('calendar.event_types.panel.dialog_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('calendar.event_types.panel.name_label')}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder={t('calendar.event_types.panel.name_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('calendar.event_types.panel.color_label')}</Label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      formData.color === color
                        ? 'border-black shadow-lg scale-110'
                        : 'border-transparent hover:shadow-md'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(p => ({ ...p, color }))}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              {t('common.cancel')}
            </Button>
            <Button onClick={editingId ? handleSaveEdit : handleAdd}>
              {editingId ? t('common.save') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

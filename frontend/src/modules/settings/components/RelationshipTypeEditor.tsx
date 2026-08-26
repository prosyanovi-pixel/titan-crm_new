import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, LayoutDashboard, CircleSlash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RelationshipTypeItem, ModuleItem } from "../types";
import { Tag } from '@/components/ui/status-system/Tag';
import { useTranslation } from '@/lib/i18n';
import { COLOR_PALETTE } from '@/lib/color';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface RelationshipTypeEditorProps {
  relationshipTypes: RelationshipTypeItem[];
  onAdd: (item: RelationshipTypeItem) => void;
  onUpdate: (item: RelationshipTypeItem) => void;
  onDelete: (id: string, module: string) => void;
  selectedModule: string;
  modules: ModuleItem[];
}

export function RelationshipTypeEditor({ relationshipTypes, onAdd, onUpdate, onDelete, selectedModule, modules }: RelationshipTypeEditorProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#3B82F6');
  const [editShowAsTab, setEditShowAsTab] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');
  const [newShowAsTab, setNewShowAsTab] = useState(false);
  const [newIsActive, setNewIsActive] = useState(true);

  const filteredRelationshipTypes = relationshipTypes.filter(t => t.module === selectedModule);

  const handleEdit = (relationshipType: RelationshipTypeItem) => {
    setEditingId(relationshipType.id);
    setEditName(relationshipType.name);
    setEditColor(relationshipType.color);
    setEditShowAsTab(relationshipType.showAsTab ?? false);
    setEditIsActive(relationshipType.isActive !== false);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    onUpdate({
        id: editingId,
        name: editName.trim(),
        color: editColor,
        module: selectedModule,
        showAsTab: editShowAsTab,
        isActive: editIsActive,
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('#3B82F6');
    setEditShowAsTab(false);
    setEditIsActive(true);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({
        id: `relationship-${Date.now()}`,
        name: newName.trim(),
        color: newColor,
        module: selectedModule,
        showAsTab: newShowAsTab,
        isActive: newIsActive,
    });
    setNewName('');
    setNewColor('#3B82F6');
    setNewShowAsTab(false);
    setNewIsActive(true);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (await confirm({
      title: t('common.confirm_deletion'),
      description: t('common.confirm_deletion_text'),
      variant: 'destructive'
    })) {
        onDelete(id, selectedModule);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
          {t('settings.relationshipTypes.for_module').replace('{module}', modules?.find(m => m.id === selectedModule)?.name || selectedModule)}
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
        {filteredRelationshipTypes.map(relationshipType => (
          <div
            key={relationshipType.id}
            className={cn(
              "flex flex-col gap-3 p-3 rounded-lg border transition-all",
              relationshipType.isActive === false ? "bg-muted/30 border-muted opacity-80" : "bg-card border-border hover:border-primary/50"
            )}
          >
            {editingId === relationshipType.id ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 h-9"
                    placeholder={t('settings.relationshipTypes.name_placeholder')}
                    autoFocus
                  />
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleCancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border/50">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('common.color')}</Label>
                    <div className="flex gap-1.5">
                      {COLOR_PALETTE.map(color => (
                        <button
                          key={color}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all shadow-sm",
                            editColor === color ? 'border-foreground scale-110' : 'border-transparent'
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('common.settings')}</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editShowAsTab}
                          onCheckedChange={setEditShowAsTab}
                          id={`edit-tab-${relationshipType.id}`}
                        />
                        <Label htmlFor={`edit-tab-${relationshipType.id}`} className="text-xs cursor-pointer">
                          {t('settings.relationships.tab_label')}
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editIsActive}
                          onCheckedChange={setEditIsActive}
                          id={`edit-active-${relationshipType.id}`}
                        />
                        <Label htmlFor={`edit-active-${relationshipType.id}`} className="text-xs cursor-pointer">
                          {t('common.active')}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Tag name={relationshipType.name} color={relationshipType.color} variant="solid" rounded="sm" />
                
                <div className="flex items-center gap-2">
                  {relationshipType.showAsTab && (
                    <Badge variant="outline" className="h-5 text-[9px] gap-1 border-primary/30 text-primary bg-primary/5 uppercase font-bold">
                      <LayoutDashboard className="w-2.5 h-2.5" />
                      {t('settings.legal_forms.tab_badge')}
                    </Badge>
                  )}
                  
                  {relationshipType.isActive === false && (
                    <Badge variant="outline" className="h-5 text-[9px] gap-1 border-destructive/30 text-destructive bg-destructive/5 uppercase font-bold">
                      <CircleSlash className="w-2.5 h-2.5" />
                      {t('common.inactive')}
                    </Badge>
                  )}
                </div>

                <div className="flex-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(relationshipType)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(relationshipType.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="flex flex-col gap-4 p-4 rounded-lg border border-primary bg-primary/5 shadow-sm">
            <div className="flex items-center gap-3">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 h-9"
                placeholder={t('settings.relationshipTypes.new_name_placeholder')}
                autoFocus
              />
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={handleAdd}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setIsAdding(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-primary/10">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('common.color')}</Label>
                <div className="flex gap-1.5">
                  {COLOR_PALETTE.map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all shadow-sm",
                        newColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('common.settings')}</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newShowAsTab}
                      onCheckedChange={setNewShowAsTab}
                      id="new-tab-switch"
                    />
                    <Label htmlFor="new-tab-switch" className="text-xs cursor-pointer">
                      {t('settings.relationships.tab_label')}
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newIsActive}
                      onCheckedChange={setNewIsActive}
                      id="new-active-switch"
                    />
                    <Label htmlFor="new-active-switch" className="text-xs cursor-pointer">
                      {t('common.active')}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {filteredRelationshipTypes.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
            {t('settings.relationshipTypes.no_relationshipTypes')}
          </p>
        )}
      </div>
    </div>
  );
}

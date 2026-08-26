import React, { useState } from 'react';
import { useModuleSettings, useUpdateModuleSettings } from '@/modules/settings/hooks/useModuleSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash, Globe, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';

export interface ContentLanguage {
  code: string;
  name: string;
  isDefault: boolean;
}

export function LanguagesTab() {
  const { t } = useTranslation();
  const { settings, isLoading } = useModuleSettings('system');
  const updateSettingsMutation = useUpdateModuleSettings();
  const { confirm } = useConfirm();

  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  const languages: ContentLanguage[] = settings?.contentLanguages || [
    { code: 'ru', name: 'Русский', isDefault: true },
    { code: 'en', name: 'English', isDefault: false }
  ];

  const handleAdd = () => {
    if (!newCode.trim() || !newName.trim()) return;
    
    // Check if exists
    if (languages.find(l => l.code.toLowerCase() === newCode.toLowerCase().trim())) {
      return;
    }

    const nextLangs = [...languages, { code: newCode.trim().toLowerCase(), name: newName.trim(), isDefault: false }];
    updateSettingsMutation.mutate({ moduleId: 'system', settings: { ...settings, contentLanguages: nextLangs } });
    setNewCode('');
    setNewName('');
  };

  const handleRemove = async (code: string) => {
    const lang = languages.find(l => l.code === code);
    if (lang?.isDefault) {
      alert("Нельзя удалить язык по умолчанию");
      return;
    }

    const yes = await confirm({
      title: "Удалить язык?",
      description: "Вы уверены? Это может скрыть переводы на этом языке в интерфейсе."
    });

    if (yes) {
      updateSettingsMutation.mutate({
        moduleId: 'system',
        settings: {
          ...settings,
          contentLanguages: languages.filter(l => l.code !== code)
        }
      });
    }
  };

  const handleSetDefault = (code: string) => {
    const nextLangs = languages.map(l => ({
      ...l,
      isDefault: l.code === code
    }));
    updateSettingsMutation.mutate({ moduleId: 'system', settings: { ...settings, contentLanguages: nextLangs } });
  };

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Языки контента
        </CardTitle>
        <CardDescription>
          Настройте языки, доступные для переводов товаров, услуг и категорий.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 items-end">
          <div className="space-y-1">
            <label className="text-sm font-medium">Код языка (например, uz)</label>
            <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="uz" className="w-32" />
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-sm font-medium">Название (например, O'zbek)</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="O'zbek" />
          </div>
          <Button onClick={handleAdd} disabled={!newCode || !newName}>
            <Plus className="w-4 h-4 mr-2" /> Добавить
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Код</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {languages.map(lang => (
              <TableRow key={lang.code}>
                <TableCell className="font-mono">{lang.code}</TableCell>
                <TableCell>{lang.name}</TableCell>
                <TableCell>
                  {lang.isDefault && <Badge variant="default">По умолчанию</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  {!lang.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(lang.code)}>
                      <Check className="w-4 h-4 mr-2" /> Сделать основным
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemove(lang.code)}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

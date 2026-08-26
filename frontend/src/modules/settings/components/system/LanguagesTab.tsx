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
import { Label } from '@/components/ui/label';

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

  const DEFAULT_CONTENT_LANGUAGES: ContentLanguage[] = [
    { code: 'ru', name: t('settings.languages_tab.russian'), isDefault: true },
    { code: 'en', name: t('settings.languages_tab.english'), isDefault: false }
  ];

  const languages: ContentLanguage[] = settings?.contentLanguages || DEFAULT_CONTENT_LANGUAGES;

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
      alert(t('settings.languages_tab.cannot_delete_default'));
      return;
    }

    const yes = await confirm({
      title: t('settings.languages_tab.delete_title'),
      description: t('settings.languages_tab.delete_desc')
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

  if (isLoading) return <div>{t('common.loading')}...</div>;

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
            <label className="text-sm font-medium">{t('settings.languages_tab.code_label')}</label>
            <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="uz" className="w-32" />
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-sm font-medium">{t('settings.languages_tab.name_label')}</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="O'zbek" />
          </div>
          <Button onClick={handleAdd} disabled={!newCode || !newName}>
            <Plus className="w-4 h-4 mr-2" /> Добавить
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t('settings.languages_tab.code')}</TableHead>
              <TableHead>{t('common.name')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {languages.map(lang => (
              <TableRow key={lang.code}>
                <TableCell className="font-mono">{lang.code}</TableCell>
                <TableCell>{lang.name}</TableCell>
                <TableCell>
                  {lang.isDefault && <Badge variant="default">{t('settings.languages_tab.default_badge')}</Badge>}
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

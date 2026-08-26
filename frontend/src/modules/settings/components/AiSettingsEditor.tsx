import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AiSettings {
  provider: string;
  apiKey: string;
  model: string;
}

export function AiSettingsEditor() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AiSettings>({
    provider: 'mock',
    apiKey: '',
    model: 'gpt-4o-mini',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Assuming a generic system settings endpoint exists, or we fetch from a specific AI settings endpoint.
      // We will need to implement GET/POST /api/settings/system (or /api/system/settings) 
      // if it doesn't exist. Let's assume we can fetch via module settings for 'system' or use a generic endpoint.
      const res = await api.get('/system-settings?keys=ai.provider,ai.api_key,ai.model');
      if (res && res.settings) {
        setSettings({
          provider: res.settings['ai.provider']?.value || 'mock',
          apiKey: res.settings['ai.api_key']?.value || '',
          model: res.settings['ai.model']?.value || 'gpt-4o-mini',
        });
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.post('/system-settings/bulk', {
        settings: [
          { key: 'ai.provider', value: { value: settings.provider } },
          { key: 'ai.api_key', value: { value: settings.apiKey } },
          { key: 'ai.model', value: { value: settings.model } },
        ]
      });
      toast.success(t('settings.ai.saved'));
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      toast.error(t('settings.ai.save_error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('settings.ai.provider')}</label>
            <Select 
              value={settings.provider} 
              onValueChange={(val) => setSettings(s => ({ ...s, provider: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mock">Mock (Testing)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.provider !== 'mock' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.ai.api_key')}</label>
                <Input 
                  type="password"
                  placeholder="sk-..."
                  value={settings.apiKey}
                  onChange={(e) => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.ai.model')}</label>
                <Input 
                  placeholder="gpt-4o-mini"
                  value={settings.model}
                  onChange={(e) => setSettings(s => ({ ...s, model: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.ai.model_help')}
                </p>
              </div>
            </>
          )}

          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t('common.save')}
          </Button>
        </div>
    </div>
  );
}

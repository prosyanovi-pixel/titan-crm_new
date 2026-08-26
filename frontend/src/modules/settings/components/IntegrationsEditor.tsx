
import { useState, useEffect, useCallback } from 'react';
import { Mail, Send, Save, CheckCircle2, AlertCircle, RefreshCw, MessageSquare, Database, Key, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function IntegrationsEditor() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  
  // Email State
  const [emailConfig, setEmailConfig] = useState({
    host: 'smtp.example.com',
    port: '587',
    user: '',
    password: '',
    secure: false,
    from: 'TITAN CRM <no-reply@titan.com>'
  });
  const [testingEmail, setTestingEmail] = useState(false);

  // Telegram State
  const [telegramConfig, setTelegramConfig] = useState({
    botToken: '',
    enabled: false
  });
  const [testChatId, setTestChatId] = useState('');
  const [testingTelegram, setTestingTelegram] = useState(false);

  // WhatsApp State
  const [whatsappConfig, setWhatsappConfig] = useState({
    apiToken: '',
    phoneNumberId: '',
    enabled: false
  });


    const loadSettings = useCallback(async () => {
    try {
        setLoading(true);
        const settings = await api.get('/system-settings');
        if (settings.email_config) setEmailConfig(settings.email_config);
        if (settings.telegram_config) setTelegramConfig(settings.telegram_config);
        if (settings.whatsapp_config) setWhatsappConfig(settings.whatsapp_config);
    } catch (e) {
        console.error(e);
        toast.error(t('generated.oshibka_zagruzki_nastroek'));
    } finally {
        setLoading(false);
    }
    }, [t]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSettings();
    }, [loadSettings]);

  const saveEmailSettings = async () => {
      try {
          await api.post('/system-settings', { key: 'email_config', value: emailConfig });
          toast.success(t('settings.integrations.save_settings'));
      } catch (e) {
          toast.error(t('generated.oshibka_sohraneniya'));
      }
  };

  const saveTelegramSettings = async () => {
      try {
          await api.post('/system-settings', { key: 'telegram_config', value: telegramConfig });
          toast.success(t('settings.integrations.save_settings'));
      } catch (e) {
          toast.error(t('generated.oshibka_sohraneniya'));
      }
  };

  const saveWhatsappSettings = async () => {
      try {
          await api.post('/system-settings', { key: 'whatsapp_config', value: whatsappConfig });
          toast.success(t('settings.integrations.save_settings'));
      } catch (e) {
          toast.error(t('generated.oshibka_sohraneniya'));
      }
  };


  const testEmail = async () => {
      setTestingEmail(true);
      try {
          const res = await api.post('/system-settings/test/email', emailConfig);
          if (res.success) {
              toast.success(res.message);
          } else {
              toast.error(res.error);
          }
      } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : t('generated.oshibka_podklyucheniya'));
      } finally {
          setTestingEmail(false);
      }
  };

  const testTelegram = async () => {
      if (!telegramConfig.botToken) {
          toast.error(t('generated.vvedite_token_bota'));
          return;
      }
      setTestingTelegram(true);
      try {
          const res = await api.post('/system-settings/test/telegram', { 
              botToken: telegramConfig.botToken,
              chatId: testChatId // Send Chat ID if user entered one
          });
          
          if (res.success) {
              toast.success(res.message);
          } else {
              toast.error(res.error);
          }
      } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : t('generated.oshibka_proverki'));
      } finally {
          setTestingTelegram(false);
      }
  };

  if (loading) {
      return <div className="flex justify-center p-8"><RefreshCw className="animate-spin w-6 h-6 text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Email / SMTP Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Mail className="w-5 h-5" />
            </div>
            <div>
                <CardTitle>{t('settings.integrations.email_title')}</CardTitle>
                <CardDescription>{t('settings.integrations.email_desc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{t('settings.integrations.host')}</Label>
                    <Input 
                        value={emailConfig.host} 
                        onChange={(e) => setEmailConfig({...emailConfig, host: e.target.value})} 
                        placeholder="smtp.gmail.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label>{t('settings.integrations.port')}</Label>
                    <Input 
                        value={emailConfig.port} 
                        onChange={(e) => setEmailConfig({...emailConfig, port: e.target.value})} 
                        placeholder="587"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{t('settings.integrations.user')}</Label>
                    <Input 
                        value={emailConfig.user} 
                        onChange={(e) => setEmailConfig({...emailConfig, user: e.target.value})} 
                        placeholder="user@example.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label>{t('settings.integrations.password')}</Label>
                    <Input 
                        type="password"
                        value={emailConfig.password} 
                        onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})} 
                        placeholder="••••••••"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>{t('settings.integrations.from')}</Label>
                <Input 
                    value={emailConfig.from} 
                    onChange={(e) => setEmailConfig({...emailConfig, from: e.target.value})} 
                    placeholder="TITAN CRM <no-reply@titan.com>"
                />
            </div>
            <div className="flex items-center space-x-2">
                <Switch 
                    id="secure" 
                    checked={emailConfig.secure}
                    onCheckedChange={(c) => setEmailConfig({...emailConfig, secure: c})}
                />
                <Label htmlFor="secure">{t('settings.integrations.secure')}</Label>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4 bg-muted/10">
            <Button variant="outline" onClick={testEmail} disabled={testingEmail}>
                {testingEmail ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {t('settings.integrations.test_connection')}
            </Button>
            <Button onClick={saveEmailSettings}>
                <Save className="w-4 h-4 mr-2" />
                {t('settings.integrations.save_settings')}
            </Button>
        </CardFooter>
      </Card>

      {/* Telegram Bot Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 rounded-lg text-sky-600">
                <Send className="w-5 h-5" />
            </div>
            <div>
                <CardTitle>{t('settings.integrations.telegram_title')}</CardTitle>
                <CardDescription>{t('settings.integrations.telegram_desc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label>{t('settings.integrations.bot_token')}</Label>
                <Input 
                    type="password"
                    value={telegramConfig.botToken} 
                    onChange={(e) => setTelegramConfig({...telegramConfig, botToken: e.target.value})} 
                    placeholder="123456789:AAH..."
                />
                <p className="text-xs text-muted-foreground">{t('generated.poluchite_token_u_botfather')}</p>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg space-y-3 border">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {t('generated.proverka_dostavki_soobscheniy')}
                </h4>
                <div className="flex gap-2">
                    <Input 
                        value={testChatId}
                        onChange={(e) => setTestChatId(e.target.value)}
                        placeholder={t('generated.vash_chat_id_naprimer_12345678')}
                        className="bg-background"
                    />
                    <Button variant="secondary" onClick={testTelegram} disabled={testingTelegram}>
                        {testingTelegram ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('settings.integrations.send_test')}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    {t('generated.pered_testom_obyazatel_no_nazhmite')} <b>Start</b> {t('generated.v_vashem_bote_v_telegram_inache_soobsche')}
                </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg space-y-3 border">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    {t('settings.integrations.webhook_setup')}
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                    {t('settings.integrations.telegram_webhook_desc')} <br/>
                    <b>{t('settings.integrations.your_webhook_url')}</b> 
                </p>
                <code className="text-xs bg-muted p-2 rounded block break-all">
                    {window.location.origin}/api/chats/webhooks/telegram
                </code>
            </div>

            <div className="flex items-center space-x-2">
                <Switch 
                    id="tg-enabled" 
                    checked={telegramConfig.enabled}
                    onCheckedChange={(c) => setTelegramConfig({...telegramConfig, enabled: c})}
                />
                <Label htmlFor="tg-enabled">{t('settings.integrations.bot_enabled')}</Label>
            </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t p-4 bg-muted/10">
            <Button onClick={saveTelegramSettings}>
                <Save className="w-4 h-4 mr-2" />
                {t('settings.integrations.save_settings')}
            </Button>
        </CardFooter>
      </Card>

      {/* WhatsApp Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <MessageSquare className="w-5 h-5" />
            </div>
            <div>
                <CardTitle>WhatsApp Business API</CardTitle>
                <CardDescription>{t('settings.integrations.whatsapp_desc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label>API Token</Label>
                <Input 
                    type="password"
                    value={whatsappConfig.apiToken} 
                    onChange={(e) => setWhatsappConfig({...whatsappConfig, apiToken: e.target.value})} 
                    placeholder="EAA..."
                />
            </div>
            <div className="space-y-2">
                <Label>Phone Number ID</Label>
                <Input 
                    value={whatsappConfig.phoneNumberId} 
                    onChange={(e) => setWhatsappConfig({...whatsappConfig, phoneNumberId: e.target.value})} 
                    placeholder="103..."
                />
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg space-y-3 border">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    {t('settings.integrations.webhook_setup')}
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                    {t('settings.integrations.whatsapp_webhook_desc')}
                </p>
                <code className="text-xs bg-muted p-2 rounded block break-all">
                    {window.location.origin}/api/chats/webhooks/whatsapp
                </code>
            </div>

            <div className="flex items-center space-x-2">
                <Switch 
                    id="wa-enabled" 
                    checked={whatsappConfig.enabled}
                    onCheckedChange={(c) => setWhatsappConfig({...whatsappConfig, enabled: c})}
                />
                <Label htmlFor="wa-enabled">{t('settings.integrations.enable_integration')}</Label>
            </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t p-4 bg-muted/10">
            <Button onClick={saveWhatsappSettings}>
                <Save className="w-4 h-4 mr-2" />
                {t('settings.integrations.save_settings')}
            </Button>
        </CardFooter>
      </Card>


    </div>
  );
}
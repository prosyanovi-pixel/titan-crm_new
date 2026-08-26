import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import {
  CheckCircle,
  Loader,
  Eye,
  EyeOff,
  RefreshCw,
  Settings2,
  Globe,
  ShieldCheck,
} from "lucide-react";

interface FormData {
  email: string;
  display_name: string;
  account_type: "gmail" | "outlook" | "mailru" | "imap";
  imap_host?: string;
  imap_port?: number;
  smtp_host?: string;
  smtp_port?: number;
  login: string;
  password: string;
  use_tls: boolean;
  sync_mode: "light" | "heavy";
  sync_enabled: boolean;
  sync_interval_minutes: number;
  include_subfolders: boolean;
}

interface MailAccountFormProps {
  isEditing: boolean;
  hasExistingPassword: boolean;
  formData: FormData;
  onFormDataChange: (updates: Partial<FormData>) => void;
  onTest: () => Promise<void>;
  testingId: string | null;
}

const presets: Record<string, Partial<FormData>> = {
  gmail: { imap_host: "imap.gmail.com", imap_port: 993, smtp_host: "smtp.gmail.com", smtp_port: 587, use_tls: true },
  outlook: { imap_host: "outlook.office365.com", imap_port: 993, smtp_host: "smtp.office365.com", smtp_port: 587, use_tls: true },
  mailru: { imap_host: "imap.mail.ru", imap_port: 993, smtp_host: "smtp.mail.ru", smtp_port: 465, use_tls: true },
};

export function MailAccountForm({
  isEditing, hasExistingPassword, formData, onFormDataChange, onTest, testingId,
}: MailAccountFormProps) {
  const { t } = useTranslation();
  const [userModifiedFields] = useState<Set<string>>(new Set());

  const updateField = (field: keyof FormData, value: any) => {
    onFormDataChange({ [field]: value });
  };

  const handleAccountTypeChange = (type: string) => {
    const preset = presets[type as keyof typeof presets];
    const updates: any = { account_type: type as FormData["account_type"] };
    if (preset && !isEditing) {
      const presetFields = ['imap_host', 'imap_port', 'smtp_host', 'smtp_port', 'use_tls'];
      presetFields.forEach(field => {
        const presetKey = field as keyof typeof preset;
        if (!userModifiedFields.has(field) && preset[presetKey] !== undefined) {
          updates[field] = preset[presetKey];
        }
      });
    }
    onFormDataChange(updates);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
      <div className="space-y-6">
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Settings2 className="w-5 h-5" />
              {t('mail.settings.form.general_info')}
            </CardTitle>
            <CardDescription>{t('mail.settings.form.general_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="display_name">{t('mail.settings.form.account_name')}</Label>
              <Input id="display_name" value={formData.display_name} onChange={(e) => updateField("display_name", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('mail.settings.form.email')} <span className="text-red-500">*</span></Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account_type">{t('mail.settings.form.provider')}</Label>
              <Select value={formData.account_type} onValueChange={handleAccountTypeChange}>
                <SelectTrigger id="account_type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Google Mail</SelectItem>
                  <SelectItem value="mailru">Mail.ru</SelectItem>
                  <SelectItem value="outlook">Outlook / Microsoft</SelectItem>
                  <SelectItem value="imap">IMAP/SMTP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <RefreshCw className="w-5 h-5" />
              {t('mail.settings.form.auto_sync')}
            </CardTitle>
            <CardDescription>{t('mail.settings.form.auto_sync_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <span className="text-sm font-medium">{t('mail.settings.form.enable_auto_check')}</span>
              <Switch checked={formData.sync_enabled} onCheckedChange={(checked) => updateField("sync_enabled", checked)} />
            </div>
            {formData.sync_enabled && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>{t('mail.settings.form.interval')}</Label>
                  <Select value={String(formData.sync_interval_minutes)} onValueChange={(v) => updateField("sync_interval_minutes", parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">{t('mail.settings.form.interval_min', { count: 5 })}</SelectItem>
                      <SelectItem value="10">{t('mail.settings.form.interval_min', { count: 10 })}</SelectItem>
                      <SelectItem value="30">{t('mail.settings.form.interval_min', { count: 30 })}</SelectItem>
                      <SelectItem value="60">{t('mail.settings.form.interval_hour')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.include_subfolders} onCheckedChange={(c) => updateField("include_subfolders", c)} />
                  <Label className="text-sm">{t('mail.settings.form.include_subfolders')}</Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="pb-3"><CardTitle className="text-base font-bold flex items-center gap-2 text-primary"><ShieldCheck className="w-5 h-5" /> {t('mail.settings.form.attachments_loading')}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 p-3 rounded-lg border bg-muted/30">
              <Switch checked={formData.sync_mode === 'heavy'} onCheckedChange={(c) => updateField("sync_mode", c ? 'heavy' : 'light')} />
              <div className="grid gap-1">
                <span className="text-sm font-medium">{t('mail.settings.form.standard_mode')}</span>
                <p className="text-xs text-muted-foreground">{t('mail.settings.form.standard_mode_desc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function MailAccountConnection({
  hasExistingPassword, formData, onFormDataChange, onTest, testingId,
}: Omit<MailAccountFormProps, "isEditing">) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: keyof FormData, value: any) => {
    onFormDataChange({ [field]: value });
  };

  return (
    <div className="space-y-6 pt-2">
      <Card className="shadow-sm border-primary/10">
        <CardHeader className="pb-3"><CardTitle className="text-base font-bold flex items-center gap-2 text-primary"><Globe className="w-5 h-5" /> {t('mail.settings.form.servers_auth')}</CardTitle></CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-muted-foreground">{t('mail.settings.form.incoming_imap')}</h4>
              <div className="grid gap-2"><Label className="text-xs">{t('mail.settings.form.host')}</Label><Input value={formData.imap_host} onChange={(e) => updateField("imap_host", e.target.value)} /></div>
              <div className="grid gap-2"><Label className="text-xs">{t('mail.settings.form.port')}</Label><Input type="number" value={formData.imap_port} onChange={(e) => updateField("imap_port", parseInt(e.target.value))} /></div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-muted-foreground">{t('mail.settings.form.outgoing_smtp')}</h4>
              <div className="grid gap-2"><Label className="text-xs">{t('mail.settings.form.host')}</Label><Input value={formData.smtp_host} onChange={(e) => updateField("smtp_host", e.target.value)} /></div>
              <div className="grid gap-2"><Label className="text-xs">{t('mail.settings.form.port')}</Label><Input type="number" value={formData.smtp_port} onChange={(e) => updateField("smtp_port", parseInt(e.target.value))} /></div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="grid gap-2"><Label>{t('mail.settings.form.login')}</Label><Input value={formData.login} onChange={(e) => updateField("login", e.target.value)} /></div>
            <div className="grid gap-2">
              <Label>{t('mail.settings.form.password')}</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => updateField("password", e.target.value)} placeholder={hasExistingPassword ? "••••••••" : ""} className="pr-10" />
                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={formData.use_tls} onCheckedChange={(c) => updateField("use_tls", c)} /><Label>{t('mail.settings.form.use_tls')}</Label></div>
        </CardContent>
      </Card>
      <div className="flex justify-center">
        <Button variant="outline" className="w-full md:w-1/3" onClick={onTest} disabled={!!testingId}>
          {testingId ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} 
          {t('mail.settings.form.test_connection')}
        </Button>
      </div>
    </div>
  );
}


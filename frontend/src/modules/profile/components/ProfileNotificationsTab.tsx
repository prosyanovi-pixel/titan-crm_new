import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, Monitor, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { NotificationsData } from "../hooks/useProfilePage";

interface ProfileNotificationsTabProps {
  notifications: NotificationsData;
  onUpdate: (key: string, value: boolean) => Promise<void>;
}

export function ProfileNotificationsTab({ 
  notifications, 
  onUpdate 
}: ProfileNotificationsTabProps) {
  const { t } = useTranslation();

  const settings = [
    {
      key: 'email_notifications',
      title: t('profile.notifications.email.title'),
      description: t('profile.notifications.email.description'),
      icon: Mail
    },
    {
      key: 'browser_notifications',
      title: t('profile.notifications.browser.title'),
      description: t('profile.notifications.browser.description'),
      icon: Monitor
    },
    {
      key: 'workflow_alerts',
      title: t('profile.notifications.workflow.title'),
      description: t('profile.notifications.workflow.description'),
      icon: AlertTriangle
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('profile.notifications.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('profile.notifications.description')}
        </p>
      </div>

      <div className="space-y-4">
        {settings.map((setting) => {
          const Icon = setting.icon;
          const key = setting.key as keyof NotificationsData;
          return (
            <div key={setting.key} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <Label htmlFor={setting.key} className="text-sm font-medium cursor-pointer">
                    {setting.title}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
              </div>
              <Switch
                id={setting.key}
                checked={notifications[key]}
                onCheckedChange={(checked) => onUpdate(setting.key, checked)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

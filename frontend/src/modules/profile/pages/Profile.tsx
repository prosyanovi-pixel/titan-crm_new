import React from "react";
import { usePageSettings } from "@/context/LayoutContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Palette, Lock, Bell, Mail, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useProfilePage } from "../hooks/useProfilePage";
import { ProfilePersonalTab }      from "../components/ProfilePersonalTab";
import { ProfileAppearanceTab }    from "../components/ProfileAppearanceTab";
import { ProfileSecurityTab }      from "../components/ProfileSecurityTab";
import { ProfileNotificationsTab } from "../components/ProfileNotificationsTab";
import { ProfileMailTab }          from "../components/ProfileMailTab";
import { MailAccountSettings } from "@/modules/mail/components/MailAccountSettings";
import { MailProvider } from "@/modules/mail/context/MailContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { MailAccount } from "../components/ProfileMailTab";

export default function Profile() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("profile");
  
  // State lifted from ProfileMailTab
  const [editingMailAccountId, setEditingMailAccountId] = React.useState<string | undefined>(undefined);
  const [isEditingMail, setIsEditingMail] = React.useState(false);
  const [mailAccounts, setMailAccounts] = React.useState<MailAccount[]>([]);
  const [mailAccountsLoading, setMailAccountsLoading] = React.useState(true);

  const {
    loading: profileLoading,
    name, setName,
    phone, setPhone,
    role, email, avatar,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    notificationSettings,
    handleSaveProfile,
    handleChangePassword,
    handleUpdateNotificationSettings,
    handleAvatarUpload,
    handleAvatarPreset
  } = useProfilePage();

  const fetchMailAccounts = React.useCallback(async () => {
    try {
      setMailAccountsLoading(true);
      const response = await api.get("/mail/accounts");
      setMailAccounts(response);
    } catch (error) {
      console.error("Error fetching mail accounts:", error);
      toast.error(t("profile.mail.toast.accounts_load_error"));
    } finally {
      setMailAccountsLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    if (activeTab === 'mail') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMailAccounts();
    }
  }, [activeTab, fetchMailAccounts]);
  
  const handleEditMailAccount = (accountId?: string) => {
    setEditingMailAccountId(accountId);
    setIsEditingMail(true);
  };

  const handleCloseMailSettings = () => {
    setIsEditingMail(false);
    setEditingMailAccountId(undefined);
    fetchMailAccounts(); // Refetch after saving/cancelling
  };
  
  usePageSettings({
    title: t("common.profile"),
    breadcrumbs: [{ label: t("common.profile") }]
  });

  if (profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (isEditingMail) {
    return (
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        <MailProvider minimal>
          <MailAccountSettings
            accountId={editingMailAccountId}
            variant="page"
            onCancel={handleCloseMailSettings}
            onSave={handleCloseMailSettings}
          />
        </MailProvider>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="profile" className="gap-2">
          <User className="w-4 h-4" />
          {t("components.tabs.trigger.personal_data")}
        </TabsTrigger>
        <TabsTrigger value="mail" className="gap-2">
          <Mail className="w-4 h-4" />
          {t("components.tabs.trigger.mail")}
        </TabsTrigger>
        <TabsTrigger value="appearance" className="gap-2">
          <Palette className="w-4 h-4" />
          {t("components.tabs.trigger.appearance")}
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Lock className="w-4 h-4" />
          {t("components.tabs.trigger.security")}
        </TabsTrigger>
        <TabsTrigger value="notifications" className="gap-2">
          <Bell className="w-4 h-4" />
          {t("components.tabs.trigger.notifications")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="m-0 focus-visible:outline-none">
        <ProfilePersonalTab 
          profile={{ name, phone, role, email, avatar }} 
          setProfile={(data) => {
            if (data.name !== undefined) setName(data.name);
            if (data.phone !== undefined) setPhone(data.phone);
            // role is not mutable by the user
          }}
          onSave={handleSaveProfile} 
          onAvatarUpload={handleAvatarUpload}
          onAvatarPreset={handleAvatarPreset}
        />
      </TabsContent>

      <TabsContent value="mail">
        {activeTab === 'mail' && (
          <ProfileMailTab 
            onEditAccount={handleEditMailAccount}
            accounts={mailAccounts}
            loading={mailAccountsLoading}
            fetchAccounts={fetchMailAccounts}
          />
        )}
      </TabsContent>

      <TabsContent value="appearance">
        {activeTab === 'appearance' && <ProfileAppearanceTab />}
      </TabsContent>

      <TabsContent value="security">
        {activeTab === 'security' && (
          <ProfileSecurityTab
            passwords={{ current: currentPassword, new: newPassword, confirm: confirmPassword }}
            setPasswords={(p) => {
              if (p.current !== undefined) setCurrentPassword(p.current);
              if (p.new !== undefined) setNewPassword(p.new);
              if (p.confirm !== undefined) setConfirmPassword(p.confirm);
            }}
            onChangePassword={handleChangePassword}
          />
        )}
      </TabsContent>

      <TabsContent value="notifications">
        {activeTab === 'notifications' && (
          <ProfileNotificationsTab
            notifications={notificationSettings}
            onUpdate={handleUpdateNotificationSettings}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}

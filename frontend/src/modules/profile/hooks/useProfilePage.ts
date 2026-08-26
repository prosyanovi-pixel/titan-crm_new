import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { authService } from "@/modules/auth/api/authService";
import { useQueryClient } from "@tanstack/react-query";

export interface ProfileData {
  name: string;
  phone: string;
  role: string;
  email: string;
  avatar: string | null;
}

export interface PasswordData {
  current: string;
  new: string;
  confirm: string;
}

export interface NotificationsData {
  email_notifications: boolean;
  browser_notifications: boolean;
  workflow_alerts: boolean;
}

export function useProfilePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationsData>({
    email_notifications: true,
    browser_notifications: true,
    workflow_alerts: true
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.get('/profile');
        setName(data.name || "");
        setPhone(data.phone || "");
        setRole(data.role || "");
        setEmail(data.email || "");
        setAvatar(data.avatar || null);
        if (data.notification_settings) {
          setNotificationSettings(data.notification_settings);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleAvatarUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // api handles standard responses and might return the data directly
      // let's check standard api response, assuming res is the payload or res.data
      const url = res.avatarUrl || res.data?.avatarUrl;
      if (url) {
        setAvatar(url);
        authService.updateUserField('avatar', url);
        queryClient.invalidateQueries();
        toast.success(t('profile.personal.avatar_updated'));
      }
    } catch (error: unknown) {
      console.error('Failed to upload avatar:', error);
      toast.error(t('profile.personal.avatar_error'));
    }
  };

  const handleAvatarPreset = async (url: string) => {
    try {
      await api.patch('/profile', { avatar: url });
      setAvatar(url);
      authService.updateUserField('avatar', url);
      queryClient.invalidateQueries();
      toast.success(t('profile.personal.avatar_updated'));
    } catch (error: unknown) {
      console.error('Failed to save avatar:', error);
      toast.error(t('profile.personal.avatar_error'));
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/profile', { name, phone });
      toast.success(t('profile.toast.success_update'));
    } catch (error: unknown) {
      toast.error(t('profile.toast.error_update'), { description: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.toast.passwords_not_match'));
      return;
    }
    
    setChangingPassword(true);
    try {
      await api.post('/profile/change-password', { currentPassword, newPassword });
      toast.success(t('profile.toast.success_password_change'));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast.error(t('profile.toast.error_password_change'), { description: (error as Error).message });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpdateNotificationSettings = async (key: string, value: boolean) => {
    try {
      await api.patch('/profile/notifications', { [key]: value });
      setNotificationSettings(prev => ({ ...prev, [key as keyof NotificationsData]: value }));
      toast.success(t('profile.toast.success_settings_update'));
    } catch (error: unknown) {
      toast.error(t('profile.toast.error_settings_update'), { description: (error as Error).message });
    }
  };

  return {
    name, setName,
    phone, setPhone,
    role, email, avatar,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    loading, saving, changingPassword,
    notificationSettings,
    handleSaveProfile,
    handleChangePassword,
    handleUpdateNotificationSettings,
    handleAvatarUpload,
    handleAvatarPreset
  };
}

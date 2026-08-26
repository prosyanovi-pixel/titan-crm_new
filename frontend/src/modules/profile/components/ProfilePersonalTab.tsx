import React from "react";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Mail, Shield, Camera, Upload, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProfileData } from "../hooks/useProfilePage";

const AVATAR_PRESETS = [
  "/img/avatars/avatar-1.jpg",
  "/img/avatars/avatar-2.jpg",
  "/img/avatars/avatar-3.jpg",
  "/img/avatars/avatar-4.jpg",
  "/img/avatars/avatar-5.jpg",
  "/img/avatars/avatar-6.jpg",
  "/img/avatars/avatar-7.jpg",
  "/img/avatars/avatar-8.jpg",
  "/img/avatars/avatar-9.jpg",
  "/img/avatars/avatar-10.jpg",
];

interface ProfilePersonalTabProps {
  profile: ProfileData;
  setProfile: (data: Partial<ProfileData>) => void;
  onSave: () => Promise<void>;
  onAvatarUpload?: (file: File) => Promise<void>;
  onAvatarPreset?: (url: string) => Promise<void>;
}

export function ProfilePersonalTab({ 
  profile, 
  setProfile, 
  onSave,
  onAvatarUpload,
  onAvatarPreset
}: ProfilePersonalTabProps) {
  const { t } = useTranslation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);
  const [confirmAvatar, setConfirmAvatar] = React.useState<{type: 'file', data: File} | {type: 'url', data: string} | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      setConfirmAvatar({ type: 'file', data: file });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePresetSelect = (url: string) => {
    if (onAvatarPreset) {
      setConfirmAvatar({ type: 'url', data: url });
    }
  };

  const handleConfirmAvatar = async () => {
    if (!confirmAvatar) return;
    if (confirmAvatar.type === 'file' && onAvatarUpload) {
      await onAvatarUpload(confirmAvatar.data as File);
    } else if (confirmAvatar.type === 'url' && onAvatarPreset) {
      await onAvatarPreset(confirmAvatar.data as string);
    }
    setConfirmAvatar(null);
    setIsAvatarModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
        <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
          <DialogTrigger asChild>
            <div className="relative group cursor-pointer">
              <Avatar className="w-24 h-24 border-2 border-primary/20">
                <AvatarImage src={profile.avatar || ""} />
                <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                  {profile.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('profile.personal.avatar_change')}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="upload" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" /> {t('profile.personal.avatar_upload')}
                </TabsTrigger>
                <TabsTrigger value="gallery" className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> {t('profile.personal.avatar_gallery')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="p-4 border rounded-md mt-4 text-center space-y-4">
                <p className="text-sm text-muted-foreground">{t('profile.personal.avatar_upload_desc')}</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect}
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  {t('profile.personal.avatar_choose_file')}
                </Button>
              </TabsContent>
              <TabsContent value="gallery" className="mt-4">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 overflow-y-auto max-h-[300px] p-2">
                  {AVATAR_PRESETS.map((url, i) => (
                    <div 
                      key={i} 
                      className="cursor-pointer hover:scale-110 transition-transform rounded-full overflow-hidden border-2 border-transparent hover:border-primary"
                      onClick={() => handlePresetSelect(url)}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-auto bg-muted rounded-full" />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!confirmAvatar} onOpenChange={(open) => !open && setConfirmAvatar(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('profile.personal.avatar_confirm_title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('profile.personal.avatar_confirm_desc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('profile.personal.avatar_confirm_cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmAvatar}>{t('profile.personal.avatar_confirm_ok')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <div className="space-y-1">
          <h3 className="text-xl font-bold">{profile.name}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            {profile.role}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="profile-name">{t('profile.personal.full_name')}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              id="profile-name"
              value={profile.name} 
              onChange={(e) => setProfile({ name: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="profile-email">{t('profile.personal.email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="profile-email"
                value={profile.email} 
                disabled
                className="pl-9 bg-muted/50"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-phone">{t('profile.personal.phone')}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="profile-phone"
                value={profile.phone} 
                onChange={(e) => setProfile({ phone: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button onClick={onSave} className="min-w-[120px]">
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}

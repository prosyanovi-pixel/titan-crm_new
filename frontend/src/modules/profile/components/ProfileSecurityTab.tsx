import React from "react";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck, Key } from "lucide-react";
import type { PasswordData } from "../hooks/useProfilePage";

interface ProfileSecurityTabProps {
  passwords: PasswordData;
  setPasswords: (data: Partial<PasswordData>) => void;
  onChangePassword: () => Promise<void>;
}

export function ProfileSecurityTab({ 
  passwords, 
  setPasswords, 
  onChangePassword 
}: ProfileSecurityTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          {t('profile.security.title')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('profile.security.description')}
        </p>
      </div>

      <div className="grid gap-6 p-6 border rounded-xl bg-card/50">
        <div className="grid gap-2">
          <Label htmlFor="current-password">{t('profile.security.current_password')}</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              id="current-password"
              type="password"
              value={passwords.current} 
              onChange={(e) => setPasswords({ current: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="new-password">{t('profile.security.new_password')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              id="new-password"
              type="password"
              value={passwords.new} 
              onChange={(e) => setPasswords({ new: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirm-password">{t('profile.security.confirm_password')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              id="confirm-password"
              type="password"
              value={passwords.confirm} 
              onChange={(e) => setPasswords({ confirm: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button onClick={onChangePassword} className="min-w-[180px]">
          {t('profile.security.action.update_password')}
        </Button>
      </div>
    </div>
  );
}

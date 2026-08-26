import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { authService } from '../api';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
        toast.error(t('generated.nevernaya_ssylka_dlya_sbrosa_parolya'));
        return;
    }

    if (newPassword !== confirmPassword) {
        toast.error(t('generated.paroli_ne_sovpadayut'));
        return;
    }

    if (newPassword.length < 4) {
        toast.error(t('generated.parol_slishkom_korotkiy'));
        return;
    }

    setLoading(true);
    try {
        const response = await authService.resetPassword({ token, newPassword });
        if (response.success) {
            toast.success(t('generated.parol_uspeshno_izmenen'));
            navigate('/login');
        } else {
            toast.error(response.error || t('auth.recovery.error_reset'));
        }
    } catch (error: any) {
        toast.error(t('generated.oshibka_servera_ili_srok_deystviya_ssylk'));
    } finally {
        setLoading(false);
    }
  };

  if (!token) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 text-white">
                <CardHeader>
                    <CardTitle className="text-red-500">{t('generated.oshibka')}</CardTitle>
                    <CardDescription>{t('generated.ssylka_dlya_sbrosa_parolya_otsutstvuet_i')}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={() => navigate('/login')} variant="outline">{t('generated.vernut_sya_na_vhod')}</Button>
                </CardFooter>
            </Card>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
      
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl font-bold text-white">{t('generated.novyy_parol')}</CardTitle>
          <CardDescription className="text-slate-400">{t('generated.pridumayte_novyy_parol_dlya_vashey_uchet')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="newPass" className="text-slate-300">{t('generated.novyy_parol')}</Label>
              <Input
                id="newPass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="bg-slate-950/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confPass" className="text-slate-300">{t('generated.podtverdite_parol')}</Label>
              <Input
                id="confPass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-slate-950/50 border-slate-700 text-white"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col pt-4 gap-3">
            <Button 
                className="w-full bg-blue-600 hover:bg-blue-500" 
                type="submit" 
                disabled={loading}
            >
              {loading ? "Сохранение..." : "Сохранить пароль"}
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate('/login')} className="text-slate-400">
                {t('generated.otmena')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
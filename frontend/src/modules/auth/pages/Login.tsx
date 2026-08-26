import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '../api';
import { Mail, Send } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [methodSelection, setMethodSelection] = useState<{ email?: string; telegram?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier || !password) {
        toast.error(t('generated.pozhaluysta_zapolnite_vse_polya'));
        return;
    }

    setLoading(true);

    try {
      const response = await authService.login({ identifier, password });

      console.log('Login response:', response);

      if (response.success && response.token && response.user) {
          // Сохраняем информацию о пользователе и JWT токен
          authService.saveUserInfo(response.user, response.token);

          console.log('User saved:', response.user);
          console.log('Token saved:', response.token);

          toast.success(t('auth.welcome', { name: response.user.name }));
          navigate('/');
      } else {
          console.error('Login failed:', response);
          toast.error(t('generated.oshibka_vhoda') + ': ' + (response.error || 'Нет токена'));
      }
    } catch (error: any) {
        console.error("Login error:", error);
        toast.error(error.message || t('auth.login.invalid_credentials'));
    } finally {
        setLoading(false);
    }
  };

  const initiateForgotPassword = async (method?: 'email' | 'telegram') => {
      if (!resetIdentifier) {
          toast.error(t('generated.vvedite_email_ili_nikneym'));
          return;
      }
      setResetLoading(true);
      try {
          const res = await authService.forgotPassword({ 
              identifier: resetIdentifier,
              method
          });

          if (res.requireSelection) {
              setMethodSelection(res.options || {});
          } else if (res.success) {
              toast.success(res.message || t('auth.recovery.instructions_sent'));
              setIsForgotOpen(false);
              setResetIdentifier("");
              setMethodSelection(null);
          } else {
              toast.error(res.error || t('auth.recovery.error_recovery'));
          }
      } catch (e: any) {
          toast.error(e.message || t('auth.recovery.error_server'));
      } finally {
          setResetLoading(false);
      }
  };

  const handleCloseDialog = () => {
      setIsForgotOpen(false);
      setMethodSelection(null);
      setResetIdentifier("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>

      <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 relative animate-fade-in">
               <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="neonGlowLogin" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur"></feGaussianBlur>
                      <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                    </filter>
                  </defs>
                  <circle cx="50" cy="50" r="45" stroke="#3b82f6" strokeWidth="2.5" filter="url(#neonGlowLogin)" style={{filter: "drop-shadow(#3b82f6 0px 0px 5px)"}}></circle>
                  <path d="M25 35 H65 M45 35 V75" stroke="#3b82f6" strokeWidth="8" strokeLinecap="square" style={{filter: "drop-shadow(#3b82f6 0px 0px 3px)"}}></path>
                  <circle cx="75" cy="32" r="4.5" fill="#3b82f6" style={{filter: "drop-shadow(#3b82f6 0px 0px 4px)"}}></circle>
                  <path d="M75 45 V75" stroke="#3b82f6" strokeWidth="8" strokeLinecap="square" style={{filter: "drop-shadow(#3b82f6 0px 0px 3px)"}}></path>
                </svg>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white tracking-tight">TITAN CRM</CardTitle>
          <CardDescription className="text-slate-400 text-base mt-2">{t('auth.login.description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-slate-300">{t('auth.login.email')}</Label>
              <Input
                id="identifier"
                type="text" 
                placeholder={t('auth.login.email_placeholder')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-slate-300">{t('auth.login.password')}</Label>
                <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
                    <DialogTrigger asChild>
                        <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                            {t('auth.login.forgot_password')}
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('generated.sbros_parolya')}</DialogTitle>
                            <DialogDescription>
                                {methodSelection
                                    ? t('auth.recovery.email_description')
                                    : t('auth.recovery.account_description')}
                            </DialogDescription>
                        </DialogHeader>
                        
                        {!methodSelection ? (
                            <div className="space-y-2 py-2">
                                <Label>{t('generated.email_ili_nikneym')}</Label>
                                <Input 
                                    placeholder={t('generated.admin_example_com_ili_admin')} 
                                    value={resetIdentifier} 
                                    onChange={(e) => setResetIdentifier(e.target.value)} 
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 py-2">
                                <Button 
                                    variant="outline" 
                                    className="flex flex-col h-auto py-4 gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-500/10"
                                    onClick={() => initiateForgotPassword('email')}
                                    disabled={resetLoading}
                                >
                                    <Mail className="w-6 h-6 text-blue-400" />
                                    <span>{t('generated.na_pochtu')}</span>
                                    <span className="text-xs text-slate-500">{methodSelection.email}</span>
                                </Button>
                                <Button 
                                    variant="outline"
                                    className="flex flex-col h-auto py-4 gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-500/10"
                                    onClick={() => initiateForgotPassword('telegram')}
                                    disabled={resetLoading}
                                >
                                    <Send className="w-6 h-6 text-blue-400" />
                                    <span>{t('generated.v_telegram')}</span>
                                    <span className="text-xs text-slate-500">{t('generated.cherez_bota')}</span>
                                </Button>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={handleCloseDialog}>{t('generated.otmena')}</Button>
                            {!methodSelection && (
                                <Button onClick={() => initiateForgotPassword()} disabled={resetLoading}>
                                    {resetLoading ? "Поиск..." : "Далее"}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
              </div>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.login.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-11"
              />
            </div>
            
            <div className="text-xs text-slate-500 text-center">
              <p>Demo accounts:</p>
              <p>Email: admin@example.com / password123</p>
              <p>Name: "admin" / password123</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col pt-4">
            <Button 
                className="w-full h-11 text-base bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]" 
                type="submit" 
                disabled={loading}
            >
              {loading ? (
                  <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t('auth.login.signing_in')}
                  </div>
              ) : t('auth.login.sign_in')}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="absolute bottom-4 text-center w-full text-slate-600 text-xs">
        &copy; 2024 TITAN CRM System. All rights reserved.
      </div>
    </div>
  );
}

localStorage.getItem('titan_token')
localStorage.getItem('titan_user_id')
localStorage.getItem('titan_user_name')
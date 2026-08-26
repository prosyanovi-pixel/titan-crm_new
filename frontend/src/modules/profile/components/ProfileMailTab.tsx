import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { Mail, Plus, Edit2, Trash2, Loader, Power, PowerOff, RefreshCw, ChevronLeft, CheckCircle2, AlertCircle, Globe, Database } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { MailAccountSettings } from "@/modules/mail/components/MailAccountSettings";
import { MailProvider } from "@/modules/mail/context/MailContext";
import { cn } from "@/lib/utils";

const ProviderIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case 'gmail':
      return (
        <svg viewBox="0 0 48 48" className={cn("w-6 h-6", className)}>
          <path fill="#ea4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285f4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#fbbc05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34a853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
      );
    case 'outlook':
      return (
        <svg viewBox="0 0 24 24" className={cn("w-6 h-6", className)} fill="#0072C6">
          <path d="M0 0v24h24V0H0zm21.3 16.9l-5.6-3.8v4.9H2.7V6h13v4.9l5.6-3.8v9.8z"/>
        </svg>
      );
    case 'mailru':
      return (
        <span className={cn("font-black text-2xl text-[#168de2] font-sans leading-none pb-1", className)}>@</span>
      );
    default:
      return <Globe className={cn("w-6 h-6", className)} />;
  }
};


export interface MailAccount {
  id: string;
  email: string;
  displayName?: string;
  accountType: string;
  isActive: boolean;
  lastSync?: string;
  syncEnabled?: boolean;
  syncIntervalMinutes?: number;
}

interface ProfileMailTabProps {
  onEditAccount: (accountId?: string) => void;
  // This prop is for refreshing the account list after a save in the parent
  fetchAccounts: () => Promise<void>; 
  accounts: MailAccount[];
  loading: boolean;
}

export function ProfileMailTab({ onEditAccount, fetchAccounts, accounts, loading }: ProfileMailTabProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [clearingId, setClearingId] = useState<string | null>(null);

  const handleSyncNow = async (accountId: string) => {
    try {
      setSyncingId(accountId);
      await api.post(`/mail/accounts/${accountId}/sync`, { background: false });
      toast.success(t("profile.mail.toast.sync_started"));
      await fetchAccounts();
    } catch (error) {
      console.error("Error syncing account:", error);
      toast.error(t("profile.mail.toast.sync_error"));
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm(t("profile.mail.confirm.delete_account"));
    if (!isConfirmed) return;
    try {
      await api.delete(`/mail/accounts/${id}`);
      toast.success(t("profile.mail.toast.account_deleted"));
      await fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t("profile.mail.toast.delete_error"));
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      setTogglingId(id);
      const newStatus = !currentActive;
      await api.put(`/mail/accounts/${id}`, { isActive: newStatus });
      toast.success(currentActive ? t("profile.mail.toast.deactivated") : t("profile.mail.toast.activated"));
      await fetchAccounts();
    } catch (error: any) {
      console.error("Error toggling account:", error);
      toast.error(t("profile.mail.toast.status_change_error"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleClearDatabase = async (accountId: string) => {
    const isConfirmed = await confirm(t("profile.mail.confirm.clear_db"));
    if (!isConfirmed) return;

    try {
      setClearingId(accountId);
      await api.delete(`/mail/accounts/${accountId}/mails`);
      toast.success(t("profile.mail.toast.db_cleared"));
      await fetchAccounts();
    } catch (error: any) {
      console.error("Error clearing database:", error);
      toast.error(t("profile.mail.toast.clear_error"));
    } finally {
      setClearingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b bg-muted/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Mail className="w-6 h-6 text-primary" />
              {t("profile.mail.title")}
            </CardTitle>
            <CardDescription>
              {t("profile.mail.description")}
            </CardDescription>
          </div>
          <Button 
            size="sm" 
            className="gap-2"
            onClick={() => onEditAccount()}
          >
            <Plus className="w-4 h-4" />
            {t("profile.mail.add_account")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
            <Mail className="w-16 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">{t("profile.mail.empty_accounts")}</p>
            <Button variant="link" onClick={() => onEditAccount()} className="mt-2">{t("profile.mail.click_to_add")}</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className="overflow-hidden border-l-4 border-l-primary/40 hover:border-l-primary transition-all shadow-sm">
                <div className="p-4 flex items-center justify-between bg-card">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner",
                      account.isActive ? (account.accountType === 'gmail' ? 'bg-red-50' : account.accountType === 'outlook' ? 'bg-blue-50' : account.accountType === 'mailru' ? 'bg-[#168de2]/10' : 'bg-slate-100') : "bg-muted text-muted-foreground grayscale opacity-50"
                    )}>
                      <ProviderIcon type={account.accountType} className={!account.isActive ? 'text-muted-foreground' : ''} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-base truncate">
                          {account.displayName || account.email}
                        </h4>
                        {account.isActive ? (
                          <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 py-0 h-5">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> {t("profile.mail.active")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted border-muted-foreground/20 py-0 h-5">
                            <AlertCircle className="w-3 h-3 mr-1" /> {t("profile.mail.inactive")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm text-muted-foreground truncate">{account.email}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider bg-muted/50 px-1.5 rounded">
                            {account.accountType}
                          </span>
                          {account.syncEnabled && (
                            <span className="flex items-center text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                              <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin-slow" />
                              {t("profile.mail.auto_sync", { interval: account.syncIntervalMinutes })}
                            </span>
                          )}
                          {account.lastSync && (
                            <span className="text-[10px] text-muted-foreground italic">
                              {t("profile.mail.updated_at", { time: new Date(account.lastSync).toLocaleString("ru-RU", { hour: '2-digit', minute: '2-digit' }) })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSyncNow(account.id)}
                      disabled={syncingId === account.id || !account.isActive}
                      className="text-blue-600 hover:bg-blue-50 h-9 w-9"
                      title={t("profile.mail.action.sync")}
                    >
                      <RefreshCw className={cn("w-4 h-4", syncingId === account.id && "animate-spin")} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(account.id, account.isActive)}
                      disabled={togglingId === account.id}
                      className={cn(
                        "h-9 w-9",
                        account.isActive ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"
                      )}
                      title={account.isActive ? t("profile.mail.action.deactivate") : t("profile.mail.action.activate")}
                    >
                      {togglingId === account.id ? <Loader className="w-4 h-4 animate-spin" /> : (account.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />)}
                    </Button>

                    <div className="mx-2 w-px h-6 bg-border" />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditAccount(account.id)}
                      className="text-slate-600 hover:bg-slate-50 h-9 w-9"
                      title={t("profile.mail.action.settings")}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleClearDatabase(account.id)}
                      disabled={clearingId === account.id}
                      className="text-amber-600 hover:bg-amber-50 h-9 w-9"
                      title={t("profile.mail.action.clear_db")}
                    >
                      {clearingId === account.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(account.id)}
                      className="text-red-600 hover:bg-red-50 h-9 w-9"
                      title={t("profile.mail.action.delete")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

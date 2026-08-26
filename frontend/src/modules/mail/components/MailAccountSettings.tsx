import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import { useMailContext } from "../context/useMailContext";
import { MailAccountForm, MailAccountConnection } from "./MailAccountForm";
import { MailAccountFolders } from "./MailAccountFolders";
import { MailAccountCategories } from "./MailAccountCategories";
import { Send, Loader } from "lucide-react";
import { useMailAccountSettingsLogic } from "../hooks/logic/useMailAccountSettingsLogic";

interface MailAccountSettingsProps {
  accountId?: string;
  onSave?: () => void;
  onCancel?: () => void;
  variant?: 'dialog' | 'page';
  defaultTab?: string;
}

export function MailAccountSettings({
  accountId,
  onSave,
  onCancel,
  defaultTab,
}: MailAccountSettingsProps) {
  const { t } = useTranslation();
  const { categories, updateCategories } = useMailContext();
  
  const logic = useMailAccountSettingsLogic(accountId, onSave);
  const {
    activeTab, setActiveTab, saving, testingId, hasExistingPassword, formData,
    imapFolders, loadingFolders, clearingFolder, isEditing,
    handleFormDataChange, handleUpdateFolderType, handleToggleFolderSetting,
    handleClearFolder, handleSyncFolders, handleTest, handleSave
  } = logic;

  const titleText = isEditing ? t('mail.settings.title_edit') : t('mail.settings.title_add');
  const descriptionText = isEditing ? t('mail.settings.subtitle_edit') : t('mail.settings.subtitle_add');

  return (
    <div className="flex flex-col h-full bg-background/50">
      <div className="flex items-center justify-between px-8 py-6 border-b bg-background shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight">{titleText}</h1>
          <p className="text-sm text-muted-foreground">{descriptionText}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel} disabled={saving} className="px-6">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px] px-8 shadow-lg shadow-primary/20">
            {saving ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} 
            {t('common.save')}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-8 border-b bg-background">
            <TabsList className="h-14 bg-transparent gap-8 p-0">
              <TabsTrigger value="form" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 h-full shadow-none font-bold text-sm uppercase tracking-wider opacity-60 data-[state=active]:opacity-100 transition-all">
                {t('mail.settings.tabs.general')}
              </TabsTrigger>
              <TabsTrigger value="folders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 h-full shadow-none font-bold text-sm uppercase tracking-wider opacity-60 data-[state=active]:opacity-100 transition-all">
                {t('mail.settings.tabs.folders')}
              </TabsTrigger>
              <TabsTrigger value="categories" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 h-full shadow-none font-bold text-sm uppercase tracking-wider opacity-60 data-[state=active]:opacity-100 transition-all">
                {t('mail.settings.tabs.categories')}
              </TabsTrigger>
              <TabsTrigger value="connection" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 h-full shadow-none font-bold text-sm uppercase tracking-wider opacity-60 data-[state=active]:opacity-100 transition-all">
                {t('mail.settings.tabs.connection')}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="max-w-screen-xl mx-auto p-8 pb-32">
              <TabsContent value="form" className="m-0 outline-none">
                <MailAccountForm
                  isEditing={isEditing} hasExistingPassword={hasExistingPassword}
                  formData={formData} onFormDataChange={handleFormDataChange}
                  onTest={handleTest} testingId={testingId}
                />
              </TabsContent>
              <TabsContent value="folders" className="m-0 outline-none">
                <MailAccountFolders
                  imapFolders={imapFolders} onUpdateFolderType={handleUpdateFolderType}
                  onToggleFolderSetting={handleToggleFolderSetting} onSyncFolders={handleSyncFolders}
                  onClearFolder={handleClearFolder} loadingFolders={loadingFolders} clearingFolder={clearingFolder}
                />
              </TabsContent>
              <TabsContent value="categories" className="m-0 outline-none">
                <MailAccountCategories categories={categories} onUpdateCategories={updateCategories} />
              </TabsContent>
              <TabsContent value="connection" className="m-0 outline-none">
                <MailAccountConnection
                  hasExistingPassword={hasExistingPassword} formData={formData}
                  onFormDataChange={handleFormDataChange} onTest={handleTest}
                  testingId={testingId}
                />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}


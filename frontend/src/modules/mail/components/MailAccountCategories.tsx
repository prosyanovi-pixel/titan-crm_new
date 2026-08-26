import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import * as LucideIcons from 'lucide-react';
import {
  LayoutGrid,
  Trash2,
  Info,
  Plus,
  RotateCcw,
} from "lucide-react";
import { defaultCategories, MailCategory } from "../context/mailCategories";

interface MailAccountCategoriesProps {
  categories: MailCategory[];
  onUpdateCategories: (categories: MailCategory[]) => void;
}

export function MailAccountCategories({
  categories,
  onUpdateCategories,
}: MailAccountCategoriesProps) {
  const { t } = useTranslation();

  const handleResetCategories = () => {
    onUpdateCategories(defaultCategories);
    toast.success(t('common.reset_success') || 'Настройки сброшены');
  };

  const handleAddCategory = () => {
    const id = `custom-${Date.now()}`;
    onUpdateCategories([...categories, { id, name: t('common.new_category') || 'Новая категория', keywords: '', icon: 'Tag' }]);
  };

  const handleUpdateCategory = (id: string, updates: any) => {
    onUpdateCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteCategory = (id: string) => {
    onUpdateCategories(categories.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6 pt-2">
      <Card className="shadow-sm border-primary/10">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <LayoutGrid className="w-5 h-5" /> {t('mail.settings.categories.title')}
            </CardTitle>
            <CardDescription>{t('mail.settings.categories.desc')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetCategories} className="h-8 text-xs gap-1">
              <RotateCcw className="w-3 h-3" /> {t('common.reset')}
            </Button>
            <Button size="sm" onClick={handleAddCategory} className="h-8 text-xs gap-1">
              <Plus className="w-3 h-3" /> {t('common.add')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex gap-3">
            <Info className="w-5 h-5 shrink-0" />
            <p>{t('mail.settings.categories.info_desc') || 'Эти настройки применяются локально. Письма будут автоматически фильтроваться на основе ключевых слов.'}</p>
          </div>

          <div className="grid gap-6">
            {categories.map((cat) => {
              // @ts-ignore
              const Icon = LucideIcons[cat.icon] || LucideIcons.Tag;
              return (
                <div key={cat.id} className="space-y-3 p-4 rounded-xl border bg-muted/20 relative group/cat">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-background border flex items-center justify-center text-primary shrink-0"><Icon className="w-5 h-5" /></div>
                      <div className="grid gap-0.5 flex-1">
                        {cat.isSystem ? (
                          <span className="text-sm font-bold">{cat.name}</span>
                        ) : (
                          <Input value={cat.name} onChange={(e) => handleUpdateCategory(cat.id, { name: e.target.value })} className="h-8 text-sm font-bold bg-transparent border-dashed px-1 -ml-1 hover:border-primary focus:bg-background" />
                        )}
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                          {cat.isSystem ? t('common.system_category') : t('common.user_category')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!cat.isSystem && (
                        <Select value={cat.icon} onValueChange={(icon) => handleUpdateCategory(cat.id, { icon })}>
                          <SelectTrigger className="w-10 h-8 p-0 flex items-center justify-center"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tag"><LucideIcons.Tag className="w-4 h-4" /></SelectItem>
                            <SelectItem value="Star"><LucideIcons.Star className="w-4 h-4" /></SelectItem>
                            <SelectItem value="Heart"><LucideIcons.Heart className="w-4 h-4" /></SelectItem>
                            <SelectItem value="Flag"><LucideIcons.Flag className="w-4 h-4" /></SelectItem>
                            <SelectItem value="Bookmark"><LucideIcons.Bookmark className="w-4 h-4" /></SelectItem>
                            <SelectItem value="Coffee"><LucideIcons.Coffee className="w-4 h-4" /></SelectItem>
                            <SelectItem value="Briefcase"><LucideIcons.Briefcase className="w-4 h-4" /></SelectItem>
                            <SelectItem value="Smile"><LucideIcons.Smile className="w-4 h-4" /></SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {!cat.isSystem && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('common.keywords')}</Label>
                    <Input value={cat.keywords} onChange={(e) => handleUpdateCategory(cat.id, { keywords: e.target.value })} placeholder={t('common.keywords_placeholder')} className="bg-background shadow-none border-muted-foreground/20 focus-visible:ring-primary" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

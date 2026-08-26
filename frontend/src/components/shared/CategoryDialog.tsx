import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useContentLanguages } from '@/modules/settings/hooks';
import { useTranslation } from '@/lib/i18n';

// We reuse FileUploader for images if needed. Assuming it exists.
// import { FileUploader } from '@/components/ui/FileUploader';

interface CategoryNode {
  id: number;
  name: string;
  parent_id: number | null;
  description: string;
  images: any;
  translations: any;
  [key: string]: any;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryNode | null;
  parentId: number | null; // Used when creating a new child
  onSave: (data: Partial<CategoryNode>) => Promise<void>;
}

export function CategoryDialog({ open, onOpenChange, category, parentId, onSave }: CategoryDialogProps) {
  const { languages, defaultLanguage } = useContentLanguages();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    parent_id: null as number | null,
    description: '',
    translations: {} as Record<string, {name: string, description: string}>,
    images: []
  });

  useEffect(() => {
    if (open) {
      if (category) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          name: category.name || '',
          parent_id: category.parent_id,
          description: category.description || '',
          translations: category.translations || {},
          images: category.images || []
        });
      } else {
        setFormData({
          name: '',
          parent_id: parentId,
          description: '',
          translations: {},
          images: []
        });
      }
    }
  }, [open, category, parentId]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTranslationChange = (lang: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...(prev.translations[lang] || { name: '', description: '' }),
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave({
        name: formData.name,
        parentId: formData.parent_id,
        description: formData.description,
        translations: formData.translations,
        images: formData.images
      } as any);
      onOpenChange(false);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{category ? t('components.category_dialog.edit_title') : t('components.category_dialog.new_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="flex overflow-x-auto w-full">
              <TabsTrigger value="basic">{t('components.category_dialog.basic_tab')} ({defaultLanguage.code.toUpperCase()})</TabsTrigger>
              <TabsTrigger value="cms">{t('components.category_dialog.cms_tab')}</TabsTrigger>
              {languages.filter(l => !l.isDefault).map(lang => (
                <TabsTrigger key={lang.code} value={`lang_${lang.code}`}>
                  {lang.code.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('components.category_dialog.name_label')} ({defaultLanguage.code.toUpperCase()}) <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => handleChange('name', e.target.value)} 
                  required 
                  placeholder={t('components.category_dialog.name_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('components.category_dialog.parent_label')}</Label>
                <Input 
                  type="number"
                  value={formData.parent_id || ''} 
                  onChange={e => handleChange('parent_id', e.target.value ? parseInt(e.target.value) : null)} 
                  placeholder={t('components.category_dialog.parent_placeholder')}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="cms" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">{t('components.category_dialog.desc_label')}</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={e => handleChange('description', e.target.value)} 
                  placeholder={t('components.category_dialog.desc_placeholder')}
                  rows={4}
                />
              </div>
            </TabsContent>

            {languages.filter(l => !l.isDefault).map(lang => (
              <TabsContent key={lang.code} value={`lang_${lang.code}`} className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('components.category_dialog.name_translated')} ({lang.code.toUpperCase()})</Label>
                    <Input 
                      value={formData.translations[lang.code]?.name || ''} 
                      onChange={e => handleTranslationChange(lang.code, 'name', e.target.value)} 
                      placeholder={`Name in ${lang.name}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('components.category_dialog.desc_translated')} ({lang.code.toUpperCase()})</Label>
                    <Textarea 
                      value={formData.translations[lang.code]?.description || ''} 
                      onChange={e => handleTranslationChange(lang.code, 'description', e.target.value)} 
                      placeholder={`Description in ${lang.name}`}
                      rows={2}
                    />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
          
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('components.category_dialog.cancel')}</Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('components.category_dialog.saving') : t('components.category_dialog.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

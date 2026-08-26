/**
 * ContractTemplateSheet — side drawer for creating/editing a contract template.
 * Uses ResizableSheet to match the rest of the app's UI.
 */

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { FileCode2, Loader2 } from 'lucide-react';
import { ResizableSheet } from '@/components/shared';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const templateFormSchema = z.object({
  name: z.string().min(1, { message: 'general.name_required' }),
  description: z.string().optional().default(''),
  content: z.string().min(1, { message: 'contracts.template_sheet.validation.content_required' }),
  category: z.string().optional().default(''),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface ContractTemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TemplateFormValues) => void;
  isPending: boolean;
}

export function ContractTemplateSheet({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: ContractTemplateSheetProps) {
  const { t } = useTranslation();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      content: '',
      category: '',
    },
  });

  // Reset form when sheet opens
  React.useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = (values: TemplateFormValues) => {
    onSubmit(values);
  };

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-primary" />
          <span className="font-semibold truncate">{t('contracts.templates.create')}</span>
        </div>
      }
      description={t('contracts.templates.create_desc')}
      moduleKey="template-sheet"
      defaultWidth="lg"
      hideFooter={true} // We will render submit buttons inside the form
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('general.name')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('general.name')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contracts.templates.category')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('contracts.templates.category')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('contracts.form.fields.description')}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} placeholder={t('contracts.form.fields.description')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('contracts.templates.content')}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={12} className="font-mono text-sm" placeholder={t('contracts.templates.content')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('general.create')}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Form>
    </ResizableSheet>
  );
}

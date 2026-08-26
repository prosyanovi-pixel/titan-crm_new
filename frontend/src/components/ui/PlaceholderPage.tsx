import { usePageSettings } from "@/context/LayoutContext";
import { useTranslation } from "@/lib/i18n";

interface PlaceholderPageProps {
  title: string;
  breadcrumb: string;
}

export default function PlaceholderPage({ title, breadcrumb }: PlaceholderPageProps) {
  const { t } = useTranslation();
  
  usePageSettings({
    title,
    subtitle: t('components.placeholder_page.under_development'),
    breadcrumbs: [{ label: breadcrumb }]
  });

  return (
    <div className="titan-card p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">🚧</span>
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">{t('components.placeholder_page.coming_soon')}</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        {t('components.placeholder_page.development_message').replace('{0}', title)}
      </p>
    </div>
  );
}

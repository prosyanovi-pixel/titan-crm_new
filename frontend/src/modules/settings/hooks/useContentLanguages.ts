import { useModuleSettings } from './useModuleSettings';
import { ContentLanguage } from '../components/system/LanguagesTab';

export function useContentLanguages() {
  const { settings, isLoading } = useModuleSettings('system');

  const languages: ContentLanguage[] = settings?.contentLanguages || [
    { code: 'ru', name: 'Русский', isDefault: true },
    { code: 'en', name: 'English', isDefault: false }
  ];

  const defaultLanguage = languages.find(l => l.isDefault) || languages[0];

  return {
    languages,
    defaultLanguage,
    isLoading,
  };
}

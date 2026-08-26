import React, { createContext, useContext, useState } from 'react';
import * as locales from './locales/ru/index';

// Список модулей, которые содержат внутри себя другие неймспейсы и не должны использоваться как префикс
// Например, business.ts содержит contractors: {...}, поэтому ключ будет contractors.title, а не business.contractors.title
// contracts - специальный случай: ключи уже имеют префикс contracts.*
const CONTAINER_MODULES = ['business', 'legal', 'office', 'layout'];

type TranslationTree = Record<string, unknown>;

// Рекурсивная функция для сплющивания объекта
const flattenObject = (obj: TranslationTree, prefix = ''): Record<string, string> => {
  return Object.keys(obj).reduce<Record<string, string>>((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k] as TranslationTree, pre + k));
    } else {
      acc[pre + k] = String(obj[k]);
    }
    return acc;
  }, {});
};

// Сборка всех переводов в один плоский объект
const translations = Object.entries(locales).reduce((acc, [key, module]) => {
  // key - это имя экспорта (например, "common", "business")
  const isContainer = CONTAINER_MODULES.includes(key);
  
  if (isContainer) {
    // Для контейнеров (business, legal...) мы берем ключи внутри как корневые
    // { business: { contractors: ... } } -> contractors.title
    return { ...acc, ...flattenObject(module) };
  } else {
    // Для обычных модулей (common, auth...) используем имя файла как префикс
    // { common: { search: ... } } -> common.search
    return { ...acc, ...flattenObject(module, key) };
  }
}, {} as Record<string, string>);

// Создаём алиасы `generated.<key>` для ключей из `lost` и `general.generated`
// (используется старый префикс в коде)
if (translations) {
  // Сначала алиасы из lost.* (приоритет выше)
  Object.keys(translations).forEach(k => {
    if (k.startsWith('lost.')) {
      const short = k.replace(/^lost\./, '');
      const genKey = `generated.${short}`;
      if (!translations[genKey]) {
        translations[genKey] = translations[k];
      }
    }
  });
  // Затем алиасы из general.generated.* (заполняет пробелы)
  Object.keys(translations).forEach(k => {
    if (k.startsWith('general.generated.')) {
      const short = k.replace(/^general\.generated\./, '');
      const genKey = `generated.${short}`;
      if (!translations[genKey]) {
        translations[genKey] = translations[k];
      }
    }
  });
  // Алиасы для general.<key> из general.generated.<key>
  Object.keys(translations).forEach(k => {
    if (k.startsWith('general.generated.')) {
      const short = k.replace(/^general\.generated\./, '');
      const genKey = `general.${short}`;
      if (!translations[genKey]) {
        translations[genKey] = translations[k];
      }
    }
  });
  // Алиасы для general.<key> из common.<key> (например, general.back)
  Object.keys(translations).forEach(k => {
    if (k.startsWith('common.')) {
      const short = k.replace(/^common\./, '');
      const genKey = `general.${short}`;
      if (!translations[genKey]) {
        translations[genKey] = translations[k];
      }
    }
  });
}

type InterpolationParams = Record<string, string | number> | Array<string | number>;

const I18nContext = createContext<{
  t: (key: string, params?: InterpolationParams) => string;
  locale: string;
  setLocale: (locale: string) => void;
} | null>(null);

export const t = (key: string, params?: InterpolationParams): string => {
  let str = translations[key] ?? key;
  if (params) {
    if (Array.isArray(params)) {
      params.forEach((value, index) => {
        str = str.replace(new RegExp(`\\{${index}\\}`, 'g'), String(value));
      });
    } else {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
  }
  return str;
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState('ru');

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
